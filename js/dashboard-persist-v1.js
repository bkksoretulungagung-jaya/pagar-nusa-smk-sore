(()=>{
'use strict';

/*
 * Dashboard Persist v1
 * - Dashboard publik membaca snapshot terakhir dari Konten Website (CFG-DASHBOARD).
 * - Saat database admin dimuat/diubah, ringkasan terbaru disimpan ke snapshot yang sama.
 * - Jika database tidak sedang terbuka/keluar, snapshot terakhir TIDAK dihapus atau diubah.
 */
const PN_DASH_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const PN_DASH_TOKEN_KEY='pnReviewAdminToken';
const PN_DASH_ID='CFG-DASHBOARD';
const PN_DASH_LOCAL_KEY='pnPublicDashboardSnapshotV1';
const PN_DASH_HASH_KEY='pnPublicDashboardSnapshotHashV1';
let pnDashSaveTimer=0;
let pnDashSaveBusy=false;
let pnDashSaveQueued=false;
let pnDashLastPublicLoad=0;

function pnDashToken(){
  try{return localStorage.getItem(PN_DASH_TOKEN_KEY)||sessionStorage.getItem(PN_DASH_TOKEN_KEY)||''}
  catch(_){try{return sessionStorage.getItem(PN_DASH_TOKEN_KEY)||''}catch(__){return''}}
}
function pnDashNumber(v,fallback=0){const n=Number(v);return Number.isFinite(n)&&n>=0?Math.round(n):fallback}
function pnDashEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pnDashToday(){try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date())}catch(_){return new Date().toISOString().slice(0,10)}}
function pnDashNow(){return new Date().toISOString()}

function pnDashJsonp(action,payload={},timeoutMs=18000){
  return new Promise((resolve,reject)=>{
    const cb='pnDashCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();resolve(data||{})};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    script.src=PN_DASH_ENDPOINT+'?'+q.toString();
    script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Koneksi snapshot dashboard gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Snapshot dashboard terlalu lama merespons.'))},timeoutMs);
    document.head.appendChild(script);
  });
}

function pnDashPost(action,payload={},timeoutMs=30000){
  return new Promise((resolve,reject)=>{
    const rid='pndash-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnDashFrame_'+rid.replace(/[^A-Za-z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=PN_DASH_ENDPOINT;form.target=frame.name;form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([name,value])=>{const i=document.createElement('input');i.type='hidden';i.name=name;i.value=String(value??'');form.appendChild(i)});
    let done=false,pollTimer=0;
    const cleanup=()=>{clearTimeout(timer);if(pollTimer)clearTimeout(pollTimer);window.removeEventListener('message',onMessage);form.remove();setTimeout(()=>frame.remove(),120)};
    const finish=(ok,data)=>{if(done)return;done=true;cleanup();if(ok)resolve(data||{ok:true});else reject(new Error(data?.message||'Snapshot dashboard gagal disimpan.'))};
    const onMessage=e=>{const d=e&&e.data;if(!d||d.source!=='pn-content'||String(d.rid||'')!==rid)return;finish(!!d.ok,d)};
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish(false,{message:'Server snapshot dashboard tidak merespons tepat waktu.'}),timeoutMs);
    const poll=async()=>{
      if(done)return;
      try{
        const r=await pnDashJsonp('contentResult',{rid},6500);
        if(done)return;
        if(r&&r.pending){pollTimer=setTimeout(poll,650);return}
        finish(!!(r&&r.ok),r);
      }catch(_){if(!done)pollTimer=setTimeout(poll,850)}
    };
    document.body.append(frame,form);form.submit();form.remove();pollTimer=setTimeout(poll,900);
  });
}

function pnDashNormalize(raw){
  if(!raw||typeof raw!=='object')return null;
  const s={
    total:pnDashNumber(raw.total),
    active:pnDashNumber(raw.active),
    alumni:pnDashNumber(raw.alumni),
    prestasi:pnDashNumber(raw.prestasi),
    male:pnDashNumber(raw.male),
    female:pnDashNumber(raw.female),
    attendance:pnDashNumber(raw.attendance),
    pengurus:pnDashNumber(raw.pengurus),
    keluar:pnDashNumber(raw.keluar),
    updatedAt:String(raw.updatedAt||'')
  };
  // Hindari snapshot kosong akibat workbook belum selesai dimuat.
  if(s.total===0&&s.active===0&&s.alumni===0&&s.pengurus===0)return null;
  return s;
}
function pnDashParse(value){
  if(value&&typeof value==='object')return pnDashNormalize(value);
  const text=String(value||'').trim();if(!text)return null;
  try{return pnDashNormalize(JSON.parse(text))}catch(_){return null}
}
function pnDashStoreLocal(snapshot){try{localStorage.setItem(PN_DASH_LOCAL_KEY,JSON.stringify(snapshot))}catch(_){}}
function pnDashReadLocal(){try{return pnDashParse(localStorage.getItem(PN_DASH_LOCAL_KEY)||'')}catch(_){return null}}
function pnDashHash(s){return [s.total,s.active,s.alumni,s.prestasi,s.male,s.female,s.attendance,s.pengurus,s.keluar].join('|')}

function pnDashRender(snapshot,source='snapshot'){
  const s=pnDashNormalize(snapshot);if(!s)return false;
  const map={mSiswa:s.total,mAktif:s.active,mAlumni:s.alumni,mPrestasi:s.prestasi,mMale:s.male,mFemale:s.female,mAttendance:s.attendance,mPengurus:s.pengurus,mKeluar:s.keluar};
  Object.entries(map).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=String(val)});
  const src=document.getElementById('dashSource');
  if(src){
    if(source==='live')src.textContent='Data database terbaru • tersimpan otomatis';
    else if(s.updatedAt){
      try{const d=new Date(s.updatedAt);src.textContent='Data database terakhir • '+new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(d).replace(/\./g,':')+' WIB'}
      catch(_){src.textContent='Data database terakhir'}
    }else src.textContent='Data database terakhir';
  }
  pnDashStoreLocal(s);
  return true;
}

function pnDashAttendanceTotal(){
  try{
    if(typeof docs==='undefined'||!docs||!docs['Kehadiran']||typeof attendanceMonths==='undefined'||!Array.isArray(attendanceMonths))return 0;
    let total=0;
    for(let r=4;r<=193;r++){
      const name=String(cellText(docs['Kehadiran'],cellMaps['Kehadiran'],'C'+r)||'').trim();
      if(!name)continue;
      for(const mo of attendanceMonths){
        const v=Number(cellText(docs['Kehadiran'],cellMaps['Kehadiran'],ref(mo.start,r))||0);
        if(Number.isFinite(v)&&v>0)total+=v;
      }
    }
    return total;
  }catch(_){return 0}
}

function pnDashBuildLive(){
  try{
    if(typeof zipEntries==='undefined'||!zipEntries||typeof docs==='undefined'||!docs||!docs['Data Siswa'])return null;
    if(typeof students==='undefined'||!Array.isArray(students)||typeof pengurusPeople==='undefined'||!Array.isArray(pengurusPeople))return null;
    const genders=v=>String(v||'').trim().toUpperCase();
    const male=students.filter(s=>['L','LAKI-LAKI','LAKI LAKI'].includes(genders(s.gender))).length;
    const female=students.filter(s=>['P','PEREMPUAN'].includes(genders(s.gender))).length;
    const count=(sheet,start,end,col)=>{
      if(typeof countRows==='function')return countRows(sheet,start,end,col);
      let n=0;for(let r=start;r<=end;r++)if(String(cellText(docs[sheet],cellMaps[sheet],col+r)||'').trim())n++;return n;
    };
    return pnDashNormalize({
      total:students.length,
      active:students.filter(s=>String(s.memberStatus||'').trim().toLowerCase()==='anggota aktif').length,
      alumni:count('Data Alumni',6,505,'C'),
      prestasi:count('Prestasi',5,504,'C'),
      male,female,
      attendance:pnDashAttendanceTotal(),
      pengurus:pengurusPeople.length,
      keluar:count('Data Keluar',6,300,'E'),
      updatedAt:pnDashNow()
    });
  }catch(err){console.warn('Snapshot dashboard belum dapat dihitung:',err);return null}
}

async function pnDashLoadPublic(force=false){
  const now=Date.now();if(!force&&now-pnDashLastPublicLoad<10000)return false;pnDashLastPublicLoad=now;
  try{
    const r=await pnDashJsonp('contentPublicList',{},16000);
    const items=Array.isArray(r&&r.content)?r.content:[];
    const item=items.find(x=>String(x&&x.id||'')===PN_DASH_ID);
    const snap=pnDashParse(item&&(item.body||item.summary));
    if(snap){pnDashRender(snap,'snapshot');return true}
  }catch(err){console.warn('Snapshot dashboard publik belum dapat dimuat:',err)}
  const local=pnDashReadLocal();if(local)pnDashRender(local,'snapshot');
  return false;
}

async function pnDashSaveNow(){
  if(pnDashSaveBusy){pnDashSaveQueued=true;return false}
  const token=pnDashToken();if(!token)return false;
  const snap=pnDashBuildLive();if(!snap)return false;
  const hash=pnDashHash(snap);
  try{if(localStorage.getItem(PN_DASH_HASH_KEY)===hash){pnDashRender(snap,'live');return true}}catch(_){}
  pnDashSaveBusy=true;pnDashSaveQueued=false;
  try{
    const json=JSON.stringify(snap);
    const item={id:PN_DASH_ID,type:'PENGATURAN',title:'SNAPSHOT DASHBOARD DATABASE',summary:json,body:json,date:pnDashToday(),badge:'FITUR',link:'',status:'PUBLIK',order:997};
    await pnDashPost('contentAdminSave',{token,section:'content',itemJson:JSON.stringify(item)},35000);
    try{localStorage.setItem(PN_DASH_HASH_KEY,hash)}catch(_){}
    pnDashRender(snap,'live');
    return true;
  }catch(err){console.warn('Snapshot dashboard belum tersinkron:',err);pnDashRender(snap,'live');return false}
  finally{
    pnDashSaveBusy=false;
    if(pnDashSaveQueued){pnDashSaveQueued=false;pnDashQueueSave(700)}
  }
}
function pnDashQueueSave(delay=900){
  if(!pnDashToken())return;
  clearTimeout(pnDashSaveTimer);
  pnDashSaveTimer=setTimeout(()=>{pnDashSaveTimer=0;void pnDashSaveNow()},delay);
}

// Tampilkan snapshot server secepat mungkin. Angka hard-coded hanya menjadi fallback awal.
const localFirst=pnDashReadLocal();if(localFirst)pnDashRender(localFirst,'snapshot');
setTimeout(()=>void pnDashLoadPublic(true),80);

// Saat workbook selesai dimuat, tampilkan data hidup dan simpan sebagai snapshot server.
if(typeof window.prepareWorkbook==='function'){
  const originalPrepare=window.prepareWorkbook;
  window.prepareWorkbook=async function(...args){
    const result=await originalPrepare.apply(this,args);
    const snap=pnDashBuildLive();if(snap)pnDashRender(snap,'live');
    pnDashQueueSave(600);
    return result;
  };
}

// refreshDashboard dipanggil setelah data siswa/pengurus/alumni/prestasi berubah.
if(typeof window.refreshDashboard==='function'){
  const originalRefresh=window.refreshDashboard;
  window.refreshDashboard=function(...args){
    const result=originalRefresh.apply(this,args);
    const snap=pnDashBuildLive();if(snap)pnDashRender(snap,'live');
    pnDashQueueSave(700);
    return result;
  };
}

// Kehadiran dan beberapa mutasi lain tidak selalu memanggil refreshDashboard.
if(typeof window.afterMutation==='function'){
  const originalAfter=window.afterMutation;
  window.afterMutation=async function(...args){
    const result=await originalAfter.apply(this,args);
    setTimeout(()=>{const snap=pnDashBuildLive();if(snap)pnDashRender(snap,'live');pnDashQueueSave(350)},450);
    return result;
  };
}

// Jika halaman publik dibiarkan terbuka, ambil snapshot baru tanpa perlu refresh manual.
setInterval(()=>{if(typeof zipEntries==='undefined'||!zipEntries)void pnDashLoadPublic(false)},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&((typeof zipEntries==='undefined')||!zipEntries))void pnDashLoadPublic(true)});
window.addEventListener('online',()=>{void pnDashLoadPublic(true);pnDashQueueSave(900)});

// API kecil untuk pengecekan manual dari console/admin bila diperlukan.
window.pnDashboardSnapshot={load:()=>pnDashLoadPublic(true),save:()=>pnDashSaveNow(),build:()=>pnDashBuildLive()};
})();
