(()=>{
'use strict';

const PN_DB_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const PN_DB_TOKEN_KEY='pnReviewAdminToken';
const PN_DB_SOURCE='pn-database';
const PN_DB_PENDING_KEY='pnExcelCloudPendingV2';
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
    const cleanup=()=>{
      clearTimeout(timer);
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
    document.body.appendChild(frame);
    document.body.appendChild(form);
    form.submit();
  });
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
      const r=await pnDatabasePost('databaseChunk',{token,index},45000);
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

  pnSetPending('initial');
  pnCloudStatus('UPLOAD CLOUD...');

  pnInitialUploadPromise=(async()=>{
    try{
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

setTimeout(pnMaybeLoadCloud,700);
setInterval(pnMaybeLoadCloud,2500);
window.addEventListener('online',()=>{
  pnCloudCheckedToken='';
  pnMaybeLoadCloud();
});
})();
