(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const SOURCE='pn-reviews';
const TOKEN_KEY='pnReviewAdminToken';
let backgroundConnecting=false;

function el(id){return document.getElementById(id)}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

function request(action,payload={},timeoutMs=30000){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-v9-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewV9_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
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
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Server Apps Script tidak merespons tepat waktu.'))},timeoutMs);
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

function setPanelState(kind,text){
  const badge=el('pnReviewConnection');
  const badgeText=el('pnReviewConnectionText');
  const msg=el('pnReviewAdminMessage');
  if(badge)badge.className='pnReviewConn '+(kind==='online'?'online':kind==='loading'?'':'offline');
  if(badgeText)badgeText.textContent=kind==='online'?'DATABASE ONLINE':kind==='loading'?'MENYINKRONKAN...':'BELUM TERHUBUNG';
  if(msg){msg.className='pnReviewAdminMessage '+(kind==='online'?'ok':kind==='error'?'error':'');msg.textContent=text;}
}

async function connectModerator(username,password,{silent=false}={}){
  if(backgroundConnecting)return false;
  backgroundConnecting=true;
  if(!silent)setPanelState('loading','Admin sudah masuk. Menyambungkan moderasi ke database pusat di latar belakang...');
  let lastErr;
  try{
    for(const timeout of [12000,22000]){
      try{
        const r=await request('reviewAdminLogin',{username,password},timeout);
        if(!r.token)throw new Error('Server tidak mengirim token moderasi.');
        sessionStorage.setItem(TOKEN_KEY,r.token);
        setPanelState('online','✓ Database pusat terhubung. Antrean ulasan sedang dimuat.');
        await sleep(100);
        el('pnReviewRefresh')?.click();
        return true;
      }catch(err){lastErr=err;await sleep(500)}
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setPanelState('error','Admin tetap dapat digunakan. Moderasi ulasan belum tersambung: '+(lastErr?.message||'koneksi gagal')+'. Klik HUBUNGKAN MODERASI untuk mencoba lagi.');
    return false;
  }finally{
    backgroundConnecting=false;
  }
}

function installConnectButton(){
  const tools=document.querySelector('#pnReviewAdminPanel .pnReviewTools');
  if(!tools)return;
  let btn=el('pnReviewDirectConnect');
  if(!btn){
    btn=document.createElement('button');
    btn.id='pnReviewDirectConnect';btn.type='button';btn.className='pnReviewRefresh';
    btn.style.whiteSpace='nowrap';
    tools.appendChild(btn);
    tools.style.gridTemplateColumns='minmax(180px,1fr) 160px auto auto';
  }
  btn.textContent=sessionStorage.getItem(TOKEN_KEY)?'✓ MODERASI ONLINE':'🔐 HUBUNGKAN MODERASI';
  btn.onclick=async()=>{
    if(sessionStorage.getItem(TOKEN_KEY)){
      el('pnReviewRefresh')?.click();
      return;
    }
    const password=window.prompt('Masukkan password admin untuk menghubungkan moderasi online:','');
    if(password===null)return;
    const username=(typeof PN_ADMIN_USER!=='undefined'&&PN_ADMIN_USER)||'admin';
    btn.disabled=true;btn.textContent='MENGHUBUNGKAN...';
    try{
      const ok=await connectModerator(username,password);
      btn.textContent=ok?'✓ MODERASI ONLINE':'🔐 COBA LAGI';
    }finally{btn.disabled=false;}
  };
}

function connectInBackground(username,password){
  setTimeout(()=>{
    installConnectButton();
    if(sessionStorage.getItem(TOKEN_KEY)){
      setPanelState('online','✓ Database pusat terhubung.');
      el('pnReviewRefresh')?.click();
      return;
    }
    connectModerator(username,password).then(()=>installConnectButton());
  },120);
}

function installFastLogin(){
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

      // Login dashboard selesai di sini. Tidak menunggu Apps Script.
      sessionStorage.setItem('pnAdminAuth','1');
      closeAdminLogin();
      enterAdmin(true);

      // Moderasi online disambungkan setelah admin sudah terbuka.
      connectInBackground(username,password);
      return false;
    }finally{
      if(submit){submit.disabled=false;submit.textContent='MASUK';}
    }
  };
  window.submitAdminLogin.__reviewFastV9=true;
}

function boot(){
  installFastLogin();
  setTimeout(installConnectButton,100);
  if(sessionStorage.getItem('pnAdminAuth')==='1'){
    setTimeout(()=>{
      installConnectButton();
      if(sessionStorage.getItem(TOKEN_KEY)){
        setPanelState('online','✓ Database pusat terhubung.');
        el('pnReviewRefresh')?.click();
      }else{
        setPanelState('','Admin aktif. Moderasi online dapat dihubungkan tanpa menghambat login.');
      }
    },250);
  }
}

document.addEventListener('DOMContentLoaded',boot);
})();
