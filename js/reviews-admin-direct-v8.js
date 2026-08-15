(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const SOURCE='pn-reviews';
const TOKEN_KEY='pnReviewAdminToken';

function el(id){return document.getElementById(id)}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

function request(action,payload={},timeoutMs=45000){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-v8-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewV8_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);
    });
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),250)};
    const onMessage=e=>{
      const d=e.data;
      if(done||!d||d.source!==SOURCE||d.rid!==rid)return;
      done=true;cleanup();
      d.ok?resolve(d):reject(new Error(d.message||'Permintaan ditolak server.'));
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Server Apps Script tidak memberi respons dalam 45 detik.'))},timeoutMs);
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

function setPanelState(kind,text){
  const badge=el('pnReviewConnection');
  const badgeText=el('pnReviewConnectionText');
  const msg=el('pnReviewAdminMessage');
  if(badge)badge.className='pnReviewConn '+(kind==='online'?'online':'offline');
  if(badgeText)badgeText.textContent=kind==='online'?'DATABASE ONLINE':kind==='loading'?'MENGHUBUNGKAN...':'BELUM TERHUBUNG';
  if(msg){msg.className='pnReviewAdminMessage '+(kind==='online'?'ok':kind==='error'?'error':'');msg.textContent=text;}
}

async function connectModerator(username,password){
  setPanelState('loading','Mengaktifkan sesi moderasi langsung ke database pusat...');
  let lastErr;
  for(let i=0;i<2;i++){
    try{
      const r=await request('reviewAdminLogin',{username,password},i===0?20000:45000);
      if(!r.token)throw new Error('Server tidak mengirim token moderasi.');
      sessionStorage.setItem(TOKEN_KEY,r.token);
      setPanelState('online','✓ Sesi moderasi aktif. Memuat antrean ulasan...');
      await sleep(150);
      el('pnReviewRefresh')?.click();
      return r;
    }catch(err){lastErr=err;if(i===0)await sleep(800)}
  }
  sessionStorage.removeItem(TOKEN_KEY);
  throw lastErr||new Error('Gagal mengaktifkan moderasi.');
}

function installConnectButton(){
  const tools=document.querySelector('#pnReviewAdminPanel .pnReviewTools');
  if(!tools||el('pnReviewDirectConnect'))return;
  const btn=document.createElement('button');
  btn.id='pnReviewDirectConnect';btn.type='button';btn.className='pnReviewRefresh';
  btn.textContent='🔐 HUBUNGKAN MODERASI';
  btn.style.whiteSpace='nowrap';
  btn.addEventListener('click',async()=>{
    const password=window.prompt('Masukkan password admin untuk menghubungkan moderasi online:','');
    if(password===null)return;
    const username=(typeof PN_ADMIN_USER!=='undefined'&&PN_ADMIN_USER)||'admin';
    btn.disabled=true;btn.textContent='MENGHUBUNGKAN...';
    try{await connectModerator(username,password);btn.textContent='✓ TERHUBUNG';}
    catch(err){setPanelState('error','Database pusat aktif, tetapi sesi moderasi gagal: '+err.message);btn.textContent='🔐 COBA LAGI';}
    finally{btn.disabled=false;}
  });
  tools.appendChild(btn);
  tools.style.gridTemplateColumns='minmax(180px,1fr) 160px auto auto';
}

function installCleanLogin(){
  window.submitAdminLogin=async function(ev){
    if(ev)ev.preventDefault();
    const username=el('adminUser')?.value.trim()||'';
    const password=el('adminPass')?.value||'';
    const err=el('loginError');
    const submit=document.querySelector('#loginModal .loginSubmit');
    if(err)err.textContent='';
    if(submit){submit.disabled=true;submit.textContent='MEMERIKSA...';}
    try{
      const hash=await sha256Hex(password);
      if(username!==PN_ADMIN_USER||hash!==PN_ADMIN_PASS_HASH){
        if(err)err.textContent='Username atau password admin salah.';
        return false;
      }
      if(submit)submit.textContent='MENGHUBUNGKAN DATABASE...';
      let moderationError='';
      try{await connectModerator(username,password)}catch(e){moderationError=e.message||String(e)}
      sessionStorage.setItem('pnAdminAuth','1');
      closeAdminLogin();
      enterAdmin(true);
      setTimeout(()=>{
        installConnectButton();
        if(sessionStorage.getItem(TOKEN_KEY)){
          setPanelState('online','✓ Database pusat terhubung. Memuat antrean ulasan...');
          el('pnReviewRefresh')?.click();
        }else{
          setPanelState('error','Login admin berhasil, tetapi sesi moderasi belum tersambung: '+moderationError+' Klik HUBUNGKAN MODERASI untuk mencoba langsung.');
        }
      },180);
      return false;
    }finally{
      if(submit){submit.disabled=false;submit.textContent='MASUK';}
    }
  };
  window.submitAdminLogin.__reviewDirectV8=true;
}

function boot(){
  installCleanLogin();
  installConnectButton();
  if(sessionStorage.getItem('pnAdminAuth')==='1'){
    setTimeout(()=>{
      installConnectButton();
      if(sessionStorage.getItem(TOKEN_KEY))el('pnReviewRefresh')?.click();
      else setPanelState('error','Database pusat sudah menerima ulasan. Sesi moderasi belum tersambung. Klik HUBUNGKAN MODERASI dan masukkan password admin satu kali.');
    },350);
  }
}

document.addEventListener('DOMContentLoaded',boot);
})();
