(()=>{
'use strict';
const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const CONFIG_KEY='pnAdminPasswordConfiguredV3';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function jsonp(action,payload={},timeout=9000){
  return new Promise((resolve,reject)=>{
    const cb='pnDualV2_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const s=document.createElement('script');let done=false;
    const clean=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};s.remove()};
    window[cb]=data=>{if(done)return;done=true;clean();resolve(data)};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    s.src=ENDPOINT+'?'+q.toString();s.async=true;
    s.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Server admin tidak dapat dihubungi.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Server admin terlalu lama merespons.'))},timeout);
    document.head.appendChild(s);
  });
}

function randomToken(){
  try{const a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('')}
  catch(_){return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(48,'x')}
}

async function serverLogin(username,password,timeout=20000){
  const rid='dualv2-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const requestedToken=randomToken();
  const frame=document.createElement('iframe');frame.name='pnDualV2Frame_'+rid.replace(/\W/g,'');frame.style.display='none';frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action:'contentAdminLogin',rid,username,password,token:requestedToken}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  document.body.append(frame,form);form.submit();form.remove();
  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(650);
      try{
        const r=await jsonp('contentResult',{rid},5500);
        if(r&&r.pending)continue;
        if(r&&r.ok)return String(r.token||requestedToken);
        if(r&&!r.pending)throw new Error(r.message||'Password server ditolak.');
      }catch(e){lastErr=e}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server admin tidak merespons.');
}

async function capability(){
  try{
    const r=await jsonp('contentPublicList',{},9000);
    const ready=!!(r&&r.ok&&String(r.adminPasswordVersion||'')==='3');
    const configured=!!(ready&&r.adminPasswordConfigured===true);
    if(ready){
      if(configured)localStorage.setItem(CONFIG_KEY,'1');
      else localStorage.removeItem(CONFIG_KEY);
    }
    return {ready,configured};
  }catch(_){return {ready:false,configured:localStorage.getItem(CONFIG_KEY)==='1'}}
}

async function legacyMatches(username,password){
  try{
    if(username!=='admin')return false;
    const fn=typeof window.sha256Hex==='function'?window.sha256Hex:(typeof sha256Hex==='function'?sha256Hex:null);
    if(!fn)return false;
    const hash=await fn(password);
    const expected=typeof PN_ADMIN_PASS_HASH!=='undefined'?PN_ADMIN_PASS_HASH:'';
    return !!expected&&hash===expected;
  }catch(_){return false}
}

window.submitAdminLogin=async function(ev){
  if(ev)ev.preventDefault();
  const u=$('adminUser')?.value.trim()||'';
  const p=$('adminPass')?.value||'';
  const err=$('loginError');
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(err)err.textContent='Memeriksa password admin...';

  const cap=await capability();
  if(cap.configured){
    try{
      const token=await serverLogin(u,p);
      sessionStorage.setItem(TOKEN_KEY,token);sessionStorage.setItem(AUTH_KEY,'1');
      if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
      if(typeof window.enterAdmin==='function')window.enterAdmin(true);
    }catch(e){if(err)err.textContent=cap.ready?'Username atau password admin salah.':'Server password admin sedang tidak dapat dihubungi.'}
    return false;
  }

  if(await legacyMatches(u,p)){
    sessionStorage.setItem(AUTH_KEY,'1');
    if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
    if(typeof window.enterAdmin==='function')window.enterAdmin(true);
    return false;
  }

  try{
    const token=await serverLogin(u,p);
    sessionStorage.setItem(TOKEN_KEY,token);sessionStorage.setItem(AUTH_KEY,'1');
    if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
    if(typeof window.enterAdmin==='function')window.enterAdmin(true);
  }catch(_){if(err)err.textContent='Username atau password admin salah.'}
  return false;
};
})();
