(()=>{
'use strict';

const PN_DB_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const PN_DB_TOKEN_KEY='pnReviewAdminToken';
const PN_DB_SOURCE='pn-database';
let pnCloudBusy=false;
let pnCloudLoaded=false;
let pnCloudCheckedToken='';
let pnCloudLoadedToken='';

function pnDbToken(){
  try{return localStorage.getItem(PN_DB_TOKEN_KEY)||sessionStorage.getItem(PN_DB_TOKEN_KEY)||''}
  catch(_){try{return sessionStorage.getItem(PN_DB_TOKEN_KEY)||''}catch(__){return''}}
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
  if(badge){badge.textContent=label;badge.className='badge ok'}
}

async function pnRestoreCloudDatabase(options={}){
  const quiet=!!options.quiet;
  const token=pnDbToken();
  if(!token||pnCloudBusy)return false;
  pnCloudBusy=true;
  pnCloudCheckedToken=token;
  try{
    if(!quiet)setStatus('Menghubungkan database Excel utama dari server...');
    const result=await pnDatabasePost('databaseGet',{token},90000);
    if(!result.exists){
      pnCloudLoaded=false;
      if(!quiet)setStatus('Database Excel pusat belum tersedia. Upload database sekali dari perangkat utama.');
      return false;
    }
    if(!result.base64)throw new Error('Isi database pusat tidak tersedia.');
    const bytes=pnBase64ToArrayBuffer(result.base64);
    fileHandle=null;
    autosaveMode=false;
    await prepareWorkbook(bytes,result.name||'Database_Pagar_Nusa_BROWSER.xlsm');
    await cacheDatabase(bytes,result.name||originalName,null,false);
    pnCloudLoaded=true;
    pnCloudLoadedToken=token;
    dirty=false;
    dirtySheets.clear();
    pnCloudStatus();
    setStatus('Database utama dimuat dari <b>SERVER CLOUD</b>. Data yang sama dapat digunakan dari perangkat lain setelah login admin.','ok');
    return true;
  }catch(err){
    console.warn('Database cloud belum dapat dimuat:',err);
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

async function pnInitializeCloudFromCurrent(){
  if(!zipEntries)return false;
  const token=pnDbToken();
  if(!token){
    setStatus('Database tersimpan di browser. Untuk menyimpan sebagai <b>DATABASE UTAMA LINTAS PERANGKAT</b>, login admin dan hubungkan database pusat.','err');
    return false;
  }
  try{
    setStatus('Mengunggah database utama ke server untuk pertama kali...');
    const out=buildCurrentWorkbook();
    await pnSaveCloudWorkbook(out,originalName,true);
    dirty=false;
    dirtySheets.clear();
    await cacheDatabase(out,originalName,null,false);
    setStatus('✓ Database utama berhasil diunggah <b>SEKALI</b> ke server. Mulai sekarang perangkat lain cukup login admin; tidak perlu upload ulang.','ok');
    return true;
  }catch(err){
    if(err.data&&err.data.code==='MASTER_EXISTS'){
      setStatus('Database utama sudah ada di server. File dari perangkat ini <b>TIDAK MENIMPA</b> database pusat. Memuat database pusat...','ok');
      await pnRestoreCloudDatabase({quiet:false});
      return true;
    }
    console.error(err);
    setStatus('Upload database pusat gagal: <b>'+esc(err.message)+'</b>. Salinan browser tetap aman.','err');
    return false;
  }
}

const pnOriginalChooseDatabase=window.chooseDatabase;
if(typeof pnOriginalChooseDatabase==='function'){
  window.chooseDatabase=async function(){
    const beforeEntries=zipEntries;
    const beforeName=originalName;
    await pnOriginalChooseDatabase();
    if(!zipEntries||(zipEntries===beforeEntries&&originalName===beforeName))return;
    await pnInitializeCloudFromCurrent();
  };
}

const pnOriginalLoadSelectedFile=window.loadSelectedFile;
if(typeof pnOriginalLoadSelectedFile==='function'){
  window.loadSelectedFile=async function(file){
    if(!file)return;
    const beforeEntries=zipEntries;
    await pnOriginalLoadSelectedFile(file);
    if(zipEntries&&zipEntries!==beforeEntries)await pnInitializeCloudFromCurrent();
  };
}

const pnOriginalPersistWorkingCopy=window.persistWorkingCopy;
if(typeof pnOriginalPersistWorkingCopy==='function'){
  window.persistWorkingCopy=async function(){
    const localResult=await pnOriginalPersistWorkingCopy();
    if(!zipEntries)return localResult;
    const token=pnDbToken();
    if(!token)return Object.assign({},localResult,{cloud:false,cloudWarning:'Sesi database pusat belum aktif.'});
    try{
      const out=buildCurrentWorkbook();
      await pnSaveCloudWorkbook(out,originalName,false);
      dirty=false;
      dirtySheets.clear();
      await cacheDatabase(out,originalName,null,false);
      return Object.assign({},localResult,{cloud:true});
    }catch(err){
      console.error('Sinkronisasi database cloud gagal:',err);
      return Object.assign({},localResult,{cloud:false,cloudWarning:err.message});
    }
  };
}

window.afterMutation=async function(msg){
  const p=await window.persistWorkingCopy();
  if(p&&p.cloud){
    setStatus('<b>'+esc(msg)+'</b>. Tersimpan ke <b>DATABASE PUSAT</b> dan cadangan browser. Perangkat lain akan membaca data terbaru setelah login admin.','ok');
    return;
  }
  if(p&&p.direct){
    setStatus('<b>'+esc(msg)+'</b>. Tersimpan ke file lokal. Sinkronisasi cloud belum aktif'+(p.cloudWarning?': '+esc(p.cloudWarning):'.'),'err');
    return;
  }
  setStatus('<b>'+esc(msg)+'</b>. Tersimpan di browser, tetapi belum tersinkron ke server'+(p&&p.cloudWarning?': '+esc(p.cloudWarning):'.'),'err');
};

function pnMaybeLoadCloud(){
  const token=pnDbToken();
  if(!token||pnCloudBusy)return;
  if(token===pnCloudLoadedToken&&pnCloudLoaded)return;
  if(token===pnCloudCheckedToken&&!pnCloudLoaded)return;
  pnRestoreCloudDatabase({quiet:true});
}

setTimeout(pnMaybeLoadCloud,500);
setInterval(pnMaybeLoadCloud,1500);
window.addEventListener('online',()=>{pnCloudCheckedToken='';pnMaybeLoadCloud()});
})();
