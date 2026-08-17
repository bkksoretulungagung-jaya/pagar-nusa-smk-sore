(()=>{
'use strict';

if(window.__pnAdminSessionKeepaliveV1)return;
window.__pnAdminSessionKeepaliveV1=true;

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const KEEPALIVE_MS=20*60*1000;
const FIRST_PING_MS=45*1000;
let busy=false;
let timer=0;

function persistentGet(key){
  try{return localStorage.getItem(key)||sessionStorage.getItem(key)||''}
  catch(_){try{return sessionStorage.getItem(key)||''}catch(__){return''}}
}

function persistentSet(key,value){
  try{localStorage.setItem(key,String(value))}catch(_){}
  try{sessionStorage.setItem(key,String(value))}catch(_){}
}

function currentToken(){return String(persistentGet(TOKEN_KEY)||'').trim()}

function shouldKeepAlive(){
  const token=currentToken();
  if(!token)return false;
  const auth=persistentGet(AUTH_KEY)==='1';
  const admin=document.getElementById('adminApp');
  const adminOpen=!!(admin&&admin.offsetParent!==null);
  return auth||adminOpen;
}

function jsonp(action,payload={},timeoutMs=15000){
  return new Promise((resolve,reject)=>{
    const cb='pnKeepaliveCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timerId);try{delete window[cb]}catch(_){window[cb]=undefined}script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();resolve(data||{})};
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>qs.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+qs.toString();
    script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('keepalive-network'))};
    const timerId=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('keepalive-timeout'))},timeoutMs);
    document.head.appendChild(script);
  });
}

async function keepAlive(){
  if(busy||!shouldKeepAlive()||navigator.onLine===false)return false;
  const token=currentToken();
  if(!token)return false;
  busy=true;
  try{
    const result=await jsonp('contentAdminList',{token},15000);
    if(result&&result.ok){
      persistentSet(TOKEN_KEY,token);
      persistentSet(AUTH_KEY,'1');
      try{sessionStorage.removeItem('pnAdminSessionNeedsReconnect')}catch(_){}
      window.dispatchEvent(new CustomEvent('pn:admin-session-keepalive',{detail:{ok:true}}));
      return true;
    }
    const msg=String(result&&result.message||'');
    if(/sesi admin sudah dinonaktifkan|sesi verifikasi admin tidak valid|sesi admin perangkat tidak ditemukan/i.test(msg)){
      try{sessionStorage.setItem('pnAdminSessionNeedsReconnect','1')}catch(_){}
    }
    return false;
  }catch(_){
    return false;
  }finally{
    busy=false;
  }
}

function start(){
  if(timer)clearInterval(timer);
  timer=setInterval(keepAlive,KEEPALIVE_MS);
}

window.addEventListener('online',()=>setTimeout(keepAlive,1200));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(keepAlive,800)});
window.addEventListener('pn:admin-login-success',()=>setTimeout(keepAlive,1500));

setTimeout(keepAlive,FIRST_PING_MS);
start();
})();
