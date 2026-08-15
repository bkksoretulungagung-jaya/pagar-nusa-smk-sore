const PN_ADMIN_USER='admin';
const PN_ADMIN_PASS_HASH='3b396371ec891e73db1ecb5f70d341c4fe6cc6f52fdea96d55dc3fe786d3a639';
const DASH_SNAPSHOT={
  total:123,aktif:23,alumni:38,prestasi:10,male:112,female:11,hadir:0,pengurus:23,keluar:0,
  status:[['Calon Anggota',50],['Anggota Aktif',23],['Nonaktif',12],['Alumni',38]],
  belt:[['Polos',34],['Putih',7],['Kuning',20],['Merah',0],['Biru',0],['Coklat/Aspel',62]],
  kelas:[['X',32],['XI',25],['XII',66]],
  pengurusStatus:[['Aktif',22],['Nonaktif',1],['Demisioner',0]],
  alumniActivity:[['Bekerja',38],['Kuliah',0],['Wirausaha',0],['Bekerja sambil Kuliah',0],['Belum Bekerja',0],['Lainnya',0],['Belum Diperbarui',0]],
  alumniProgram:[['TKJ',11],['TKR',9],['TSM',5],['TITL',2],['TEI',4],['TPM',3],['TP',4],['DPIB',0],['Lainnya',0]],
  alumniContact:[['Aktif',38],['Tidak Aktif',0],['Belum Diperbarui',0]]
};

function dashEsc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}
function setDashKpi(id,val){const el=document.getElementById(id);if(el)el.textContent=Number.isFinite(Number(val))?Number(val):0}
function renderDashRows(id,rows,theme='green'){
  const box=document.getElementById(id);if(!box)return;
  const max=Math.max(1,...rows.map(r=>Number(r[1])||0));
  box.innerHTML=rows.map(([name,val])=>{
    const n=Number(val)||0,w=Math.round((n/max)*100);
    return `<div class="dashRow"><div class="dashRowName" title="${dashEsc(name)}">${dashEsc(name)}</div><div class="dashBarTrack"><div class="dashBar ${theme}" style="width:${w}%"></div></div><div class="dashRowVal">${n}</div></div>`
  }).join('');
}
function renderDashboardData(d,live=false){
  setDashKpi('mSiswa',d.total);setDashKpi('mAktif',d.aktif);setDashKpi('mAlumni',d.alumni);setDashKpi('mPrestasi',d.prestasi);
  setDashKpi('mMale',d.male);setDashKpi('mFemale',d.female);setDashKpi('mAttendance',d.hadir);setDashKpi('mPengurus',d.pengurus);
  const hiddenKeluar=document.getElementById('mKeluar');if(hiddenKeluar)hiddenKeluar.textContent=d.keluar||0;
  renderDashRows('dashStatusMember',d.status);
  renderDashRows('dashBelt',d.belt);
  renderDashRows('dashClass',d.kelas);
  renderDashRows('dashPengurus',d.pengurusStatus);
  renderDashRows('dashAlumniActivity',d.alumniActivity,'blue');
  renderDashRows('dashAlumniProgram',d.alumniProgram);
  renderDashRows('dashAlumniContact',d.alumniContact,'orange');
  const src=document.getElementById('dashSource');if(src)src.textContent=live?'Database lokal terhubung • data diperbarui otomatis':'Ringkasan dashboard database terakhir';
}
function valCount(arr,field,name){return arr.filter(x=>String(x?.[field]??'').trim().toLowerCase()===String(name).trim().toLowerCase()).length}
function sheetCount(sheet,col,start,end,name){
  if(typeof docs==='undefined'||!docs?.[sheet])return 0;let n=0;
  for(let r=start;r<=end;r++){const v=String(cellText(docs[sheet],cellMaps[sheet],col+r)||'').trim();if(v.toLowerCase()===String(name).toLowerCase())n++}return n
}
function sheetNonBlank(sheet,col,start,end){
  if(typeof docs==='undefined'||!docs?.[sheet])return 0;let n=0;
  for(let r=start;r<=end;r++)if(String(cellText(docs[sheet],cellMaps[sheet],col+r)||'').trim())n++;return n
}
function attendanceTotal(){
  if(typeof docs==='undefined'||!docs?.['Kehadiran'])return 0;let total=0;
  for(let r=4;r<=56;r++){const raw=String(cellText(docs['Kehadiran'],cellMaps['Kehadiran'],'HM'+r)||'').replace(/[^0-9.-]/g,'');const n=Number(raw);if(Number.isFinite(n))total+=n}
  return total
}
function liveDashboardData(){
  if(typeof docs==='undefined'||!docs?.['Data Siswa']||typeof students==='undefined')return null;
  const statusNames=['Calon Anggota','Anggota Aktif','Nonaktif','Alumni'];
  const beltNames=['Polos','Putih','Kuning','Merah','Biru','Coklat/Aspel'];
  const classNames=['X','XI','XII'];
  const pengurusNames=['Aktif','Nonaktif','Demisioner'];
  const activityNames=['Bekerja','Kuliah','Wirausaha','Bekerja sambil Kuliah','Belum Bekerja','Lainnya','Belum Diperbarui'];
  const programNames=['TKJ','TKR','TSM','TITL','TEI','TPM','TP','DPIB','Lainnya'];
  const contactNames=['Aktif','Tidak Aktif','Belum Diperbarui'];
  return {
    total:students.length,
    aktif:valCount(students,'memberStatus','Anggota Aktif'),
    alumni:sheetNonBlank('Data Alumni','B',6,255),
    prestasi:sheetNonBlank('Prestasi','E',5,204),
    male:valCount(students,'gender','L'),
    female:valCount(students,'gender','P'),
    hadir:attendanceTotal(),
    pengurus:typeof pengurusPeople!=='undefined'?pengurusPeople.length:0,
    keluar:sheetNonBlank('Data Keluar','E',6,300),
    status:statusNames.map(n=>[n,valCount(students,'memberStatus',n)]),
    belt:beltNames.map(n=>[n,valCount(students,'belt',n)]),
    kelas:classNames.map(n=>[n,valCount(students,'kelas',n)]),
    pengurusStatus:pengurusNames.map(n=>[n,typeof pengurusPeople!=='undefined'?valCount(pengurusPeople,'status',n):0]),
    alumniActivity:activityNames.map(n=>[n,sheetCount('Data Alumni','K',6,255,n)]),
    alumniProgram:programNames.map(n=>[n,sheetCount('Data Alumni','E',6,255,n)]),
    alumniContact:contactNames.map(n=>[n,sheetCount('Data Alumni','N',6,255,n)])
  }
}
function refreshPublicDashboardV9(){const live=liveDashboardData();renderDashboardData(live||DASH_SNAPSHOT,!!live)}

try{
  const oldRefresh=refreshDashboard;
  refreshDashboard=function(){oldRefresh();refreshPublicDashboardV9()}
}catch(_){}

async function sha256Hex(text){
  const data=new TextEncoder().encode(text);
  const buf=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function openAdminLogin(){
  document.getElementById('loginModal')?.classList.remove('hidden');
  const u=document.getElementById('adminUser');const p=document.getElementById('adminPass');const e=document.getElementById('loginError');
  if(e)e.textContent='';
  if(u){u.value='';u.setAttribute('autocomplete','off')}
  if(p){p.value='';p.setAttribute('autocomplete','current-password')}
  setTimeout(()=>u?.focus(),60)
}
function closeAdminLogin(){document.getElementById('loginModal')?.classList.add('hidden')}
async function submitAdminLogin(ev){
  if(ev)ev.preventDefault();
  const u=document.getElementById('adminUser')?.value.trim()||'';
  const p=document.getElementById('adminPass')?.value||'';
  const err=document.getElementById('loginError');
  const submit=document.querySelector('#loginModal .loginSubmit');
  if(err)err.textContent='';
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(submit){submit.disabled=true;submit.textContent='MEMERIKSA...'}
  try{
    if(typeof window.pnAdminServerLoginV5==='function'){
      const r=await window.pnAdminServerLoginV5(u,p);
      if(!r||!r.ok)throw new Error('Login admin gagal.');
      sessionStorage.setItem('pnAdminAuth','1');
      closeAdminLogin();
      enterAdmin(true);
      return false;
    }
    // Fallback hanya untuk keadaan file v5 belum termuat; tidak mengambil alih bila v5 tersedia.
    const hash=await sha256Hex(p);
    if(u===PN_ADMIN_USER&&hash===PN_ADMIN_PASS_HASH){
      sessionStorage.setItem('pnAdminAuth','1');closeAdminLogin();enterAdmin(true);return false;
    }
    if(err)err.textContent='Username atau password admin salah.';
  }catch(e){
    if(err)err.textContent='Login server gagal: '+String(e?.message||e||'Tidak diketahui');
  }finally{
    if(submit){submit.disabled=false;submit.textContent='MASUK'}
  }
  return false
}
function setAdminControls(show){
  ['dbToggle','dbBackdrop','dbDrawer'].forEach(id=>document.getElementById(id)?.classList.toggle('hidden',!show));
}
function enterAdmin(openDb=false){
  document.getElementById('publicHome')?.classList.add('hidden');
  document.getElementById('adminApp')?.classList.remove('hidden');
  document.getElementById('topLoginBtn')?.classList.add('hidden');
  setAdminControls(true);
  window.scrollTo({top:0,behavior:'smooth'});
  const dbReady=typeof zipEntries!=='undefined'&&!!zipEntries;
  if(openDb&&!dbReady)setTimeout(()=>toggleDatabasePanel(true),180)
}
function showPublicDashboard(){
  document.getElementById('adminApp')?.classList.add('hidden');
  document.getElementById('publicHome')?.classList.remove('hidden');
  document.getElementById('topLoginBtn')?.classList.remove('hidden');
  toggleDatabasePanel(false);setAdminControls(false);refreshPublicDashboardV9();window.scrollTo({top:0,behavior:'smooth'})
}
function logoutAdmin(){sessionStorage.removeItem('pnAdminAuth');showPublicDashboard()}
document.addEventListener('DOMContentLoaded',()=>{
  renderDashboardData(DASH_SNAPSHOT,false);
  setAdminControls(false);
  const u=document.getElementById('adminUser');if(u){u.value='';u.setAttribute('autocomplete','off')}
  const p=document.getElementById('adminPass');if(p)p.value='';
  if(sessionStorage.getItem('pnAdminAuth')==='1')enterAdmin(false);
  document.getElementById('loginModal')?.addEventListener('click',e=>{if(e.target?.id==='loginModal')closeAdminLogin()});
});
