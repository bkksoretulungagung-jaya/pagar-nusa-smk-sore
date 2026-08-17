(()=>{
'use strict';

const PN_DB_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const PN_DB_TOKEN_KEY='pnReviewAdminToken';
const PN_DB_SOURCE='pn-database';
const PN_DB_PENDING_KEY='pnExcelCloudPendingV2';
const PN_DB_LAST_SYNC_KEY='pnExcelCloudLastSyncV1';
const PN_DB_SYNC_DELAY=900;
const PN_DB_DOWNLOAD_CONCURRENCY=3;

let pnCloudBusy=false;
let pnCloudLoaded=false;
let pnCloudCheckedToken='';
let pnCloudLoadedToken='';
let pnInitialUploadPromise=null;
let pnCloudSaveBusy=false;
let pnCloudSaveTimer=0;
let pnCloudSaveQueued=false;
let pnCloudGeneration=0;

function pnDbToken(){
  try{return localStorage.getItem(PN_DB_TOKEN_KEY)||sessionStorage.getItem(PN_DB_TOKEN_KEY)||''}
  catch(_){try{return sessionStorage.getItem(PN_DB_TOKEN_KEY)||''}catch(__){return''}}
}
function pnPending(){
  try{return localStorage.getItem(PN_DB_PENDING_KEY)||''}catch(_){return''}
}
function pnSetPending(value){
  try{
    if(value)localStorage.setItem(PN_DB_PENDING_KEY,String(value));
    else localStorage.removeItem(PN_DB_PENDING_KEY);
  }catch(_){}
}
function pnLastSyncStored(){
  try{return localStorage.getItem(PN_DB_LAST_SYNC_KEY)||''}catch(_){return''}
}
function pnParseWibTime(value){
  const raw=String(value||'').trim();
  if(!raw)return null;
  const normalized=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw)?raw+'+07:00':raw;
  const d=new Date(normalized);
  return Number.isNaN(d.getTime())?null:d;
}
function pnFormatWibTime(value){
  const d=pnParseWibTime(value);
  if(!d)return '';
  const date=new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(d);
  const time=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(d).replace(/\./g,':');
  return date+' • '+time+' WIB';
}
function pnEnsureLastSyncElement(){
  let el=document.getElementById('pnLastSync');
  if(el)return el;
  const name=document.getElementById('dbName');
  const picker=name&&name.closest('.picker');
  if(!picker)return null;
  el=document.createElement('div');
  el.id='pnLastSync';
  el.style.cssText='margin:10px 0 0;padding:9px 11px;border:1px solid #dbe7df;border-radius:9px;background:#f8fafc;color:#475569;font-size:11px;line-height:1.5';
  el.innerHTML='<b>🕒 Sinkronisasi terakhir:</b> belum ada';
  picker.insertAdjacentElement('afterend',el);
  return el;
}
function pnRenderLastSync(state='idle',value=''){
  const el=pnEnsureLastSyncElement();
  if(!el)return;
  if(value){try{localStorage.setItem(PN_DB_LAST_SYNC_KEY,String(value))}catch(_){}}
  const saved=value||pnLastSyncStored();
  const when=pnFormatWibTime(saved);
  let suffix='',color='#475569',background='#f8fafc',border='#dbe7df';
  if(state==='pending'){suffix=' • menyinkronkan perubahan terbaru…';color='#92400e';background='#fff7ed';border='#fed7aa'}
  else if(state==='error'){suffix=' • perubahan terbaru belum tersinkron';color='#991b1b';background='#fef2f2';border='#fecaca'}
  else if(when){color='#166534';background='#ecfdf3';border='#bbf7d0'}
  el.style.color=color;el.style.background=background;el.style.borderColor=border;
  el.innerHTML='<b>🕒 Sinkronisasi terakhir:</b> '+(when||'belum ada')+suffix;
}
function pnSetLastSync(value){pnRenderLastSync('ok',value||new Date().toISOString())}
function pnBytesToBase64(data){
  const bytes=new Uint8Array(exactArrayBuffer(data));
  const chunk=0x8000;
  let binary='';
  for(let i=0;i<bytes.length;i+=chunk){
    binary+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  }
  return btoa(binary);
}
function pnBase64ToArrayBuffer(value){
  const binary=atob(String(value||''));
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}
function pnDatabaseJsonp(action,payload={},timeoutMs=20000){
  return new Promise((resolve,reject)=>{
    const cb='pnDbJsonp_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();if(data&&data.ok)resolve(data);else{const err=new Error(data?.message||'Database pusat menolak permintaan.');err.data=data||{};reject(err)}};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    script.src=PN_DB_ENDPOINT+'?'+q.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Koneksi database pusat gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Database pusat terlalu lama merespons.'))},timeoutMs);
    document.head.appendChild(script);
  });
}

function pnDatabasePost(action,payload={},timeoutMs=90000){
  return new Promise((resolve,reject)=>{
    const rid='pndb-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnDbFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');

    const form=document.createElement('form');
    form.method='POST';
    form.action=PN_DB_ENDPOINT;
    form.target=frame.name;
    form.style.display='none';

    Object.entries({action,rid,...payload}).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';
      input.name=name;
      input.value=String(value??'');
      form.appendChild(input);
    });

    let done=false;
    let pollTimer=0;
    const cleanup=()=>{
      clearTimeout(timer);
      if(pollTimer)clearTimeout(pollTimer);
      window.removeEventListener('message',onMessage);
      form.remove();
      setTimeout(()=>frame.remove(),150);
    };
    const finish=(ok,data)=>{
      if(done)return;
      done=true;
      cleanup();
      if(ok){resolve(data||{ok:true});return}
      const err=new Error(data?.message||'Sinkronisasi database pusat gagal.');
      err.data=data||{};
      reject(err);
    };
    const onMessage=e=>{
      const d=e&&e.data;
      if(!d||d.source!==PN_DB_SOURCE||String(d.rid||'')!==rid)return;
      finish(!!d.ok,d);
    };

    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish(false,{message:'Database pusat terlalu lama merespons.'}),timeoutMs);
    const poll=async()=>{
      if(done)return;
      try{
        const r=await pnDatabaseJsonp('contentResult',{rid},7000);
        if(done)return;
        if(r&&r.pending){pollTimer=setTimeout(poll,700);return}
        finish(!!(r&&r.ok),r);
      }catch(_){if(!done)pollTimer=setTimeout(poll,900)}
    };
    document.body.appendChild(frame);
    document.body.appendChild(form);
    form.submit();
    if(action==='databaseManifest'||action==='databaseSave'||action==='databaseHistoryAdd')pollTimer=setTimeout(poll,900);
  });
}
function pnHistoryEsc(value){
  return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function pnHistoryFormatTime(value){
  const d=pnParseWibTime(value);
  if(!d)return String(value||'-');
  const date=new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(d);
  const time=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(d).replace(/\./g,':');
  return date+' • '+time+' WIB';
}
function pnEnsureHistoryUi(){
  if(document.getElementById('pnHistoryBtn'))return;
  const sync=pnEnsureLastSyncElement();
  if(!sync)return;
  const btn=document.createElement('button');
  btn.id='pnHistoryBtn';btn.type='button';btn.textContent='🕘 RIWAYAT PERUBAHAN';
  btn.style.cssText='width:100%;margin:8px 0 0;padding:10px 12px;border:0;border-radius:9px;background:#0f3d24;color:#fff;font-weight:900;cursor:pointer';
  btn.onclick=()=>window.pnOpenDatabaseHistory();
  sync.insertAdjacentElement('afterend',btn);

  const modal=document.createElement('div');
  modal.id='pnHistoryModal';
  modal.style.cssText='display:none;position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,.58);padding:18px;overflow:auto';
  modal.innerHTML='<div style="max-width:900px;margin:4vh auto;background:#fff;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.25);overflow:hidden">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:#0f172a;color:#fff"><div><b>RIWAYAT PERUBAHAN DATA</b><div style="font-size:11px;opacity:.8;margin-top:3px">100 perubahan terbaru • tersimpan di server</div></div><button id="pnHistoryClose" type="button" style="border:0;border-radius:8px;background:#334155;color:#fff;font-size:20px;width:36px;height:36px;cursor:pointer">×</button></div>'
    +'<div style="padding:12px 14px"><div style="display:flex;justify-content:flex-end;margin-bottom:9px"><button id="pnHistoryReload" type="button" style="border:0;border-radius:8px;background:#166534;color:#fff;padding:8px 12px;font-weight:800;cursor:pointer">↻ MUAT ULANG</button></div><div id="pnHistoryBody" style="min-height:110px"><div style="padding:18px;text-align:center;color:#64748b">Memuat riwayat…</div></div></div></div>';
  modal.addEventListener('click',e=>{if(e.target===modal)window.pnCloseDatabaseHistory()});
  document.body.appendChild(modal);
  document.getElementById('pnHistoryClose').onclick=()=>window.pnCloseDatabaseHistory();
  document.getElementById('pnHistoryReload').onclick=()=>pnLoadDatabaseHistory();
}
async function pnLoadDatabaseHistory(){
  pnEnsureHistoryUi();
  const body=document.getElementById('pnHistoryBody');
  const token=pnDbToken();
  if(!body)return;
  if(!token){body.innerHTML='<div style="padding:18px;text-align:center;color:#991b1b">HUBUNGKAN AKSES admin terlebih dahulu.</div>';return}
  body.innerHTML='<div style="padding:18px;text-align:center;color:#64748b">Memuat riwayat dari server…</div>';
  try{
    const r=await pnDatabaseJsonp('databaseHistoryList',{token,limit:100},20000);
    const rows=Array.isArray(r.history)?r.history:[];
    if(!rows.length){body.innerHTML='<div style="padding:22px;text-align:center;color:#64748b">Belum ada riwayat perubahan. Perubahan berikutnya akan dicatat otomatis.</div>';return}
    body.innerHTML='<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f1f5f9;color:#334155"><th style="padding:9px;text-align:left">Waktu</th><th style="padding:9px;text-align:left">Aksi</th><th style="padding:9px;text-align:left">Modul / Subjek</th><th style="padding:9px;text-align:left">Detail</th><th style="padding:9px;text-align:left">Admin</th></tr></thead><tbody>'
      +rows.map(x=>{const action=String(x.action||'').toUpperCase();const badge=action==='HAPUS'?'#b91c1c':action==='UBAH'?'#b45309':'#166534';const subject=[x.module,x.subject,x.row?('Baris '+x.row):''].filter(Boolean).join(' • ');return '<tr style="border-top:1px solid #e2e8f0"><td style="padding:9px;white-space:nowrap">'+pnHistoryEsc(pnHistoryFormatTime(x.at))+'</td><td style="padding:9px"><span style="display:inline-block;padding:3px 7px;border-radius:999px;background:'+badge+';color:#fff;font-weight:900">'+pnHistoryEsc(action)+'</span></td><td style="padding:9px">'+pnHistoryEsc(subject||'-')+'</td><td style="padding:9px;min-width:220px">'+pnHistoryEsc(x.detail||'-')+'</td><td style="padding:9px">'+pnHistoryEsc(x.admin||'-')+'</td></tr>'}).join('')
      +'</tbody></table></div>';
  }catch(err){body.innerHTML='<div style="padding:18px;text-align:center;color:#991b1b">Gagal memuat riwayat: '+pnHistoryEsc(err.message)+'</div>'}
}
window.pnOpenDatabaseHistory=function(){pnEnsureHistoryUi();const m=document.getElementById('pnHistoryModal');if(m){m.style.display='block';void pnLoadDatabaseHistory()}};
window.pnCloseDatabaseHistory=function(){const m=document.getElementById('pnHistoryModal');if(m)m.style.display='none'};
async function pnLogDatabaseHistory(message){
  const token=pnDbToken();
  if(!token)return false;
  const text=String(message||'').trim();
  const match=text.match(/^\s*(SIMPAN|UBAH|HAPUS)\b/i);
  if(!match)return false;
  const changeAction=match[1].toUpperCase();
  let moduleName='',subject='',row='';
  try{moduleName=(typeof modules!=='undefined'&&modules[activeModule])?String(modules[activeModule].title||activeModule):String(activeModule||'')}catch(_){}
  try{subject=(typeof selectedPerson!=='undefined'&&selectedPerson)?String(selectedPerson.name||selectedPerson.id||''):''}catch(_){}
  try{row=(typeof selectedRow!=='undefined'&&selectedRow)?String(selectedRow):''}catch(_){}
  try{
    await pnDatabasePost('databaseHistoryAdd',{token,changeAction,module:moduleName,subject,row,detail:text},30000);
    const modal=document.getElementById('pnHistoryModal');
    if(modal&&modal.style.display!=='none')void pnLoadDatabaseHistory();
    return true;
  }catch(err){console.warn('Riwayat perubahan belum dapat dicatat:',err);return false}
}

function pnCloudStatus(label='DATABASE CLOUD'){
  const badge=document.getElementById('saveMode');
  if(badge){
    badge.textContent=label;
    badge.className='badge ok';
  }
}

async function pnDownloadCloudWorkbook(token,quiet){
  let manifest;
  try{
    manifest=await pnDatabasePost('databaseManifest',{token},30000);
  }catch(err){
    const msg=String(err?.message||'');
    if(!/Action tidak dikenal|tidak dikenal/i.test(msg))throw err;
    const legacy=await pnDatabasePost('databaseGet',{token},90000);
    if(!legacy.exists)return {exists:false};
    if(!legacy.base64)throw new Error('Isi database pusat tidak tersedia.');
    return {exists:true,name:legacy.name,size:legacy.size,updatedAt:legacy.updatedAt,bytes:pnBase64ToArrayBuffer(legacy.base64)};
  }

  if(!manifest.exists)return {exists:false};
  if(!/^[A-Fa-f0-9]{64}$/.test(String(manifest.ticket||'')))throw new Error('Ticket database cloud tidak tersedia.');
  const count=Number(manifest.chunkCount||0);
  const size=Number(manifest.size||0);
  if(!Number.isInteger(count)||count<1||count>64||!Number.isFinite(size)||size<1)throw new Error('Metadata database cloud tidak valid.');

  const chunks=new Array(count);
  let next=0,done=0;
  const updateProgress=()=>{
    pnCloudStatus('MUAT CLOUD '+done+'/'+count);
    if(!quiet)setStatus('Mengunduh database cloud bertahap: <b>'+done+' / '+count+'</b> bagian...');
  };
  updateProgress();

  async function worker(){
    while(true){
      const index=next++;
      if(index>=count)return;
      const r=await pnDatabaseJsonp('databaseChunk',{ticket:manifest.ticket,index},45000);
      if(!r.exists||Number(r.index)!==index||!r.base64)throw new Error('Potongan database cloud '+(index+1)+' tidak valid.');
      chunks[index]=new Uint8Array(pnBase64ToArrayBuffer(r.base64));
      done++;
      updateProgress();
    }
  }

  const workers=[];
  const concurrency=Math.min(PN_DB_DOWNLOAD_CONCURRENCY,count);
  for(let i=0;i<concurrency;i++)workers.push(worker());
  await Promise.all(workers);

  const out=new Uint8Array(size);
  let offset=0;
  for(const part of chunks){
    if(!part)throw new Error('Database cloud belum lengkap.');
    if(offset+part.length>out.length)throw new Error('Ukuran database cloud tidak sesuai metadata.');
    out.set(part,offset);
    offset+=part.length;
  }
  if(offset!==size)throw new Error('Database cloud tidak lengkap ('+offset+' dari '+size+' byte).');

  return {exists:true,name:manifest.name,size,updatedAt:manifest.updatedAt,bytes:out.buffer};
}

async function pnRestoreCloudDatabase(options={}){
  const quiet=!!options.quiet;
  const token=pnDbToken();
  if(!token||pnCloudBusy||pnCloudSaveBusy)return false;

  pnCloudBusy=true;
  pnCloudCheckedToken=token;
  try{
    if(!quiet)setStatus('Menghubungkan database Excel utama dari server...');
    const result=await pnDownloadCloudWorkbook(token,quiet);
    if(!result.exists){
      pnCloudLoaded=false;
      if(!quiet)setStatus('Database Excel pusat belum tersedia. Upload database sekali dari perangkat utama.');
      return false;
    }

    const bytes=result.bytes;
    fileHandle=null;
    autosaveMode=false;
    await prepareWorkbook(bytes,result.name||'Database_Pagar_Nusa_BROWSER.xlsm');
    await cacheDatabase(bytes,result.name||originalName,null,false);

    pnCloudLoaded=true;
    pnCloudLoadedToken=token;
    dirty=false;
    dirtySheets.clear();
    pnSetPending('');
    pnCloudStatus();
    pnSetLastSync(result.updatedAt);
    setStatus('✓ Database utama dimuat dari <b>SERVER CLOUD</b>. Data yang sama siap digunakan dari perangkat ini.','ok');
    return true;
  }catch(err){
    console.warn('Database cloud belum dapat dimuat:',err);
    pnCloudStatus('CLOUD GAGAL');
    if(!quiet)setStatus('Database cloud belum dapat dimuat: <b>'+esc(err.message)+'</b>. Salinan browser tetap dapat digunakan.','err');
    return false;
  }finally{
    pnCloudBusy=false;
  }
}
window.restoreCloudDatabase=pnRestoreCloudDatabase;

async function pnSaveCloudWorkbook(out,name,initialOnly){
  const token=pnDbToken();
  if(!token)throw new Error('Sesi database pusat belum aktif. Login admin terlebih dahulu.');

  const result=await pnDatabasePost('databaseSave',{
    token,
    name:name||originalName||'Database_Pagar_Nusa_BROWSER.xlsm',
    base64:pnBytesToBase64(out),
    initialOnly:initialOnly?'1':'0'
  },120000);

  pnCloudLoaded=true;
  pnCloudCheckedToken=token;
  pnCloudLoadedToken=token;
  pnCloudStatus();
  pnSetLastSync(result.updatedAt);
  return result;
}

function pnInitialUploadBytes(rawBytes){
  if(rawBytes)return exactArrayBuffer(rawBytes);
  return buildCurrentWorkbook();
}

function pnInitializeCloudFromCurrent(rawBytes=null,rawName=''){
  if(!zipEntries)return Promise.resolve(false);
  if(pnCloudLoaded)return Promise.resolve(true);
  if(pnInitialUploadPromise)return pnInitialUploadPromise;

  const token=pnDbToken();
  if(!token){
    setStatus('Database tersimpan di browser. Untuk menyimpan sebagai <b>DATABASE UTAMA LINTAS PERANGKAT</b>, klik HUBUNGKAN AKSES terlebih dahulu.','err');
    return Promise.resolve(false);
  }

  pnInitialUploadPromise=(async()=>{
    try{
      // Selalu cek master cloud terlebih dahulu. Ini membersihkan status upload lama
      // dan mencegah workbook besar dikirim ulang jika master sudah ada di Drive.
      try{
        const existing=await pnDatabasePost('databaseManifest',{token},15000);
        if(existing&&existing.exists){
          pnSetPending('');
          setStatus('Database utama sudah tersedia di <b>SERVER CLOUD</b>. Memuat master cloud tanpa upload ulang...','ok');
          const loaded=await pnRestoreCloudDatabase({quiet:false});
          if(loaded)return true;
          throw new Error('Master cloud ditemukan tetapi belum berhasil dimuat.');
        }
      }catch(checkErr){
        if(String(checkErr?.message||'').includes('Master cloud ditemukan'))throw checkErr;
        console.warn('Pemeriksaan master cloud belum selesai:',checkErr);
      }

      pnSetPending('initial');
      pnCloudStatus('UPLOAD CLOUD...');
      setStatus('Mengunggah database utama ke server untuk pertama kali. <b>Aplikasi tetap dapat digunakan selama proses berjalan.</b>');
      const out=pnInitialUploadBytes(rawBytes);
      const name=rawName||originalName;
      await pnSaveCloudWorkbook(out,name,true);
      dirty=false;
      dirtySheets.clear();
      await cacheDatabase(out,name||originalName,null,false);
      pnSetPending('');
      pnCloudStatus();
      setStatus('✓ Database utama berhasil diunggah <b>SEKALI</b> ke server. Perangkat lain sekarang cukup login admin; tidak perlu upload ulang.','ok');
      return true;
    }catch(err){
      if(err.data&&err.data.code==='MASTER_EXISTS'){
        pnSetPending('');
        setStatus('Database utama sudah ada di server. File dari perangkat ini <b>TIDAK MENIMPA</b> database pusat. Memuat database pusat...','ok');
        await pnRestoreCloudDatabase({quiet:false});
        return true;
      }
      try{
        const check=await pnDatabasePost('databaseManifest',{token},30000);
        if(check&&check.exists){
          pnCloudLoaded=true;
          pnCloudLoadedToken=token;
          pnSetPending('');
          pnCloudStatus();
          setStatus('✓ Database utama sudah tersimpan di <b>SERVER CLOUD</b>. Konfirmasi upload diterima setelah pemeriksaan server.','ok');
          return true;
        }
      }catch(_){}
      console.error(err);
      pnCloudStatus('CLOUD TERTUNDA');
      setStatus('Upload database pusat belum selesai: <b>'+esc(err.message)+'</b>. Data lokal tetap aman dan akan dicoba lagi otomatis.','err');
      return false;
    }finally{
      pnInitialUploadPromise=null;
    }
  })();

  return pnInitialUploadPromise;
}

async function pnRunQueuedCloudSync(){
  pnCloudSaveTimer=0;
  if(pnCloudSaveBusy){
    pnCloudSaveQueued=true;
    return;
  }
  if(!zipEntries||!pnDbToken())return;

  pnCloudSaveBusy=true;
  pnCloudSaveQueued=false;
  const generation=pnCloudGeneration;
  pnCloudStatus('SINKRON CLOUD...');
  pnRenderLastSync('pending');

  try{
    const out=buildCurrentWorkbook();
    await pnSaveCloudWorkbook(out,originalName,false);
    if(pnCloudGeneration===generation&&!pnCloudSaveQueued){
      pnSetPending('');
      pnCloudStatus();
      setStatus('✓ Sinkronisasi cloud selesai. Data terbaru siap dibuka dari perangkat lain.','ok');
    }
  }catch(err){
    console.error('Sinkronisasi database cloud gagal:',err);
    pnSetPending('update');
    pnCloudStatus('CLOUD TERTUNDA');
    pnRenderLastSync('error');
    setStatus('Data sudah aman di perangkat ini. Sinkronisasi cloud akan dicoba lagi otomatis: <b>'+esc(err.message)+'</b>','err');
  }finally{
    pnCloudSaveBusy=false;
    if(pnCloudSaveQueued||pnCloudGeneration>generation){
      pnScheduleCloudSync(false);
    }
  }
}

function pnScheduleCloudSync(markChange=true){
  if(!zipEntries||!pnDbToken())return false;
  if(markChange)pnCloudGeneration++;
  if(pnPending()!=='initial')pnSetPending('update');
  if(markChange)pnRenderLastSync('pending');

  if(pnCloudSaveBusy){
    pnCloudSaveQueued=true;
    return true;
  }
  if(pnCloudSaveTimer)return true;

  pnCloudSaveTimer=setTimeout(pnRunQueuedCloudSync,PN_DB_SYNC_DELAY);
  return true;
}

const pnOriginalChooseDatabase=window.chooseDatabase;
if(typeof pnOriginalChooseDatabase==='function'){
  window.chooseDatabase=async function(){
    const beforeEntries=zipEntries;
    const beforeName=originalName;
    await pnOriginalChooseDatabase();
    if(!zipEntries||(zipEntries===beforeEntries&&originalName===beforeName))return;
    void pnInitializeCloudFromCurrent();
  };
}

const pnOriginalLoadSelectedFile=window.loadSelectedFile;
if(typeof pnOriginalLoadSelectedFile==='function'){
  window.loadSelectedFile=async function(file){
    if(!file)return;
    const beforeEntries=zipEntries;
    const rawPromise=(typeof file.arrayBuffer==='function')
      ? file.arrayBuffer().catch(()=>null)
      : Promise.resolve(null);

    await pnOriginalLoadSelectedFile(file);
    if(!zipEntries||zipEntries===beforeEntries)return;

    const raw=await rawPromise;
    void pnInitializeCloudFromCurrent(raw,file.name||originalName);
  };
}

const pnOriginalPersistWorkingCopy=window.persistWorkingCopy;
if(typeof pnOriginalPersistWorkingCopy==='function'){
  window.persistWorkingCopy=async function(){
    const localResult=await pnOriginalPersistWorkingCopy();
    if(!zipEntries)return localResult;

    // Local/browser save is the fast path. Cloud sync is queued in the background.
    dirty=false;
    dirtySheets.clear();

    const token=pnDbToken();
    if(!token){
      return Object.assign({},localResult,{
        cloud:false,
        cloudQueued:false,
        cloudWarning:'Sesi database pusat belum aktif.'
      });
    }

    const queued=pnScheduleCloudSync(true);
    return Object.assign({},localResult,{
      cloud:false,
      cloudQueued:queued
    });
  };
}

window.afterMutation=async function(msg){
  const p=await window.persistWorkingCopy();

  void pnLogDatabaseHistory(msg);

  if(p&&p.cloudQueued){
    setStatus('<b>'+esc(msg)+'</b>. Tersimpan langsung di perangkat/browser. <b>Sinkronisasi cloud berjalan otomatis di belakang</b>; Anda dapat lanjut bekerja.','ok');
    return;
  }
  if(p&&p.direct){
    setStatus('<b>'+esc(msg)+'</b>. Tersimpan ke file lokal. Sinkronisasi cloud belum aktif'+(p.cloudWarning?': '+esc(p.cloudWarning):'.'),'err');
    return;
  }
  setStatus('<b>'+esc(msg)+'</b>. Tersimpan di browser'+(p&&p.cloudWarning?', tetapi cloud belum aktif: '+esc(p.cloudWarning):'.'),'ok');
};

function pnMaybeLoadCloud(){
  const token=pnDbToken();
  if(!token||pnCloudBusy||pnCloudSaveBusy)return;

  const pending=pnPending();
  if(pending==='initial'){
    if(zipEntries&&!pnInitialUploadPromise)void pnInitializeCloudFromCurrent();
    return;
  }
  if(pending==='update'){
    if(zipEntries)pnScheduleCloudSync(false);
    return;
  }

  if(token===pnCloudLoadedToken&&pnCloudLoaded)return;
  if(token===pnCloudCheckedToken&&!pnCloudLoaded)return;
  void pnRestoreCloudDatabase({quiet:true});
}

setTimeout(()=>pnRenderLastSync('idle'),120);
setTimeout(()=>pnEnsureHistoryUi(),180);
setTimeout(pnMaybeLoadCloud,700);
setInterval(pnMaybeLoadCloud,2500);
window.addEventListener('online',()=>{
  pnCloudCheckedToken='';
  pnMaybeLoadCloud();
});
})();
