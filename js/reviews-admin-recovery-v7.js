(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const SOURCE='pn-reviews';
const TOKEN_KEY='pnReviewAdminToken';

function setStatus(kind,text){
  const badge=document.getElementById('pnReviewConnection');
  const badgeText=document.getElementById('pnReviewConnectionText');
  const msg=document.getElementById('pnReviewAdminMessage');
  if(badge) badge.className='pnReviewConn '+(kind==='online'?'online':'offline');
  if(badgeText) badgeText.textContent=kind==='online'?'DATABASE ONLINE':'MENGHUBUNGKAN...';
  if(msg){
    msg.className='pnReviewAdminMessage '+(kind==='online'?'ok':'');
    msg.textContent=text;
  }
}

function loginOnce(username,password,timeoutMs){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-recover-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewRecover_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';
    form.action=ENDPOINT;
    form.target=frame.name;
    form.style.display='none';
    const fields={action:'reviewAdminLogin',rid,username,password};
    Object.entries(fields).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';
      input.name=name;
      input.value=String(value??'');
      form.appendChild(input);
    });
    let done=false;
    const cleanup=()=>{
      window.removeEventListener('message',onMessage);
      clearTimeout(timer);
      form.remove();
      setTimeout(()=>frame.remove(),250);
    };
    const onMessage=e=>{
      const d=e.data;
      if(done||!d||d.source!==SOURCE||d.rid!==rid)return;
      done=true;
      cleanup();
      d.ok?resolve(d):reject(new Error(d.message||'Login moderasi ditolak server.'));
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>{
      if(done)return;
      done=true;
      cleanup();
      reject(new Error('Apps Script belum memberi respons tepat waktu.'));
    },timeoutMs);
    document.body.appendChild(frame);
    document.body.appendChild(form);
    form.submit();
  });
}

async function recoverLogin(username,password){
  let lastError;
  for(const timeout of [18000,30000]){
    try{return await loginOnce(username,password,timeout)}
    catch(err){lastError=err;await new Promise(r=>setTimeout(r,700));}
  }
  throw lastError||new Error('Gagal membuat sesi moderasi.');
}

function install(){
  const old=window.submitAdminLogin;
  if(typeof old!=='function'||old.__reviewRecoveryV7)return;
  const wrapped=async function(ev){
    if(ev)ev.preventDefault();
    const username=document.getElementById('adminUser')?.value.trim()||'';
    const password=document.getElementById('adminPass')?.value||'';
    const result=await old.call(this,ev);
    if(sessionStorage.getItem('pnAdminAuth')==='1'&&!sessionStorage.getItem(TOKEN_KEY)){
      setStatus('connecting','Login dashboard berhasil. Menyambungkan sesi moderasi ke database pusat...');
      try{
        const r=await recoverLogin(username,password);
        if(!r.token)throw new Error('Token moderasi tidak diterima dari server.');
        sessionStorage.setItem(TOKEN_KEY,r.token);
        setStatus('online','✓ Sesi moderasi online aktif. Memuat antrean ulasan...');
        setTimeout(()=>document.getElementById('pnReviewRefresh')?.click(),100);
      }catch(err){
        sessionStorage.removeItem(TOKEN_KEY);
        const badge=document.getElementById('pnReviewConnection');
        const badgeText=document.getElementById('pnReviewConnectionText');
        const msg=document.getElementById('pnReviewAdminMessage');
        if(badge)badge.className='pnReviewConn offline';
        if(badgeText)badgeText.textContent='KONEKSI TERGANGGU';
        if(msg){msg.className='pnReviewAdminMessage error';msg.textContent='Dashboard admin berhasil masuk, tetapi sesi moderasi belum tersambung: '+err.message+' Silakan keluar admin lalu login kembali.';}
      }
    }
    return result;
  };
  wrapped.__reviewRecoveryV7=true;
  window.submitAdminLogin=wrapped;
}

document.addEventListener('DOMContentLoaded',()=>{
  install();
  if(sessionStorage.getItem('pnAdminAuth')==='1'&&!sessionStorage.getItem(TOKEN_KEY)){
    setTimeout(()=>{
      const msg=document.getElementById('pnReviewAdminMessage');
      if(msg&&/backend|sesi moderasi|database ulasan/i.test(msg.textContent||'')){
        msg.className='pnReviewAdminMessage';
        msg.textContent='Backend database sudah aktif. Untuk membuat sesi moderasi aman, klik KELUAR ADMIN lalu login kembali satu kali.';
      }
    },500);
  }
});
})();
