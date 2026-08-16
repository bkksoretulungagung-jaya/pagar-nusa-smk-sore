(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const MODE_KEY='pnAdminAuthModeV5';
const $=id=>document.getElementById(id);

function randomToken(){
  try{
    const a=new Uint8Array(32);crypto.getRandomValues(a);
    return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
  }catch(_){
    return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(64,'0').slice(0,64);
  }
}

function jsonp(action,payload={},timeout=9000){
  return new Promise((resolve,reject)=>{
    const cb='pnAuthFastV6_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const s=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};s.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();resolve(data||{})};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    s.src=ENDPOINT+'?'+q.toString();s.async=true;
    s.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Server admin tidak dapat dihubungi.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Server admin terlalu lama merespons.'))},timeout);
    document.head.appendChild(s);
  });
}

function postMessageLogin(action,source,username,password,timeout=15000){
  return new Promise((resolve,reject)=>{
    const rid='authfast-'+randomToken();
    const requestedToken=randomToken();
    const frame=document.createElement('iframe');
    frame.name='pnAuthFastFrame_'+rid.replace(/\W/g,'');
    frame.style.display='none';frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    Object.entries({action,rid,username,password,token:requestedToken}).forEach(([k,v])=>{
      const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i);
    });
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),250)};
    const finish=(ok,data)=>{if(done)return;done=true;cleanup();ok?resolve({...(data||{}),requestedToken}):reject(new Error(data?.message||'Login admin ditolak server.'))};
    const onMessage=e=>{
      const d=e.data;
      if(!d||d.source!==source||String(d.rid||'')!==rid)return;
      finish(!!d.ok,d);
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish(false,{message:'Server admin tidak menyelesaikan login.'}),timeout);
    document.body.append(frame,form);
    try{form.submit()}catch(e){finish(false,{message:e?.message||'Form login gagal dikirim.'})}
  });
}

async function tokenValid(token){
  token=String(token||'').trim();
  if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))return false;
  for(const action of ['contentAdminList','reviewAdminList']){
    try{
      const r=await jsonp(action,{token},7000);
      if(r&&r.ok)return true;
    }catch(_){}
  }
  return false;
}

async function loginVia(action,source,username,password){
  const r=await postMessageLogin(action,source,username,password);
  const candidates=[r?.token,r?.requestedToken].map(v=>String(v||'').trim()).filter(Boolean);
  for(const token of [...new Set(candidates)]){
    if(await tokenValid(token))return token;
  }
  throw new Error(r?.message||'Token sesi admin belum dapat diverifikasi.');
}

async function serverLogin(username,password){
  const u=String(username||'').trim();
  const p=String(password||'');
  if(!u||!p)throw new Error('Username dan password admin wajib diisi.');

  let firstError=null;
  try{
    const token=await loginVia('contentAdminLogin','pn-content',u,p);
    sessionStorage.setItem(TOKEN_KEY,token);
    return token;
  }catch(e){firstError=e}

  try{
    const token=await loginVia('reviewAdminLogin','pn-reviews',u,p);
    sessionStorage.setItem(TOKEN_KEY,token);
    return token;
  }catch(e){
    throw new Error(e?.message||firstError?.message||'Username atau password admin salah.');
  }
}

function clearSession(){
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(MODE_KEY);
}

function enter(){
  sessionStorage.setItem(AUTH_KEY,'1');
  sessionStorage.setItem(MODE_KEY,'server-fast-v6');
  if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
  if(typeof window.enterAdmin==='function')window.enterAdmin(true);
}

window.pnAdminServerLoginV5=async function(username,password){
  await serverLogin(username,password);
  return {ok:true,mode:'server-fast-v6'};
};
window.pnAdminServerLoginV5.__serverAuthV5=true;
window.pnAdminServerLoginV5.__fastV6=true;

window.submitAdminLogin=async function(ev){
  if(ev)ev.preventDefault();
  const u=$('adminUser')?.value.trim()||'';
  const p=$('adminPass')?.value||'';
  const err=$('loginError');
  const submit=document.querySelector('#loginModal .loginSubmit');
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(submit){submit.disabled=true;submit.textContent='MEMERIKSA...'}
  if(err)err.textContent='Menghubungkan login admin ke server...';
  try{
    await serverLogin(u,p);
    if(err)err.textContent='';
    enter();
  }catch(e){
    clearSession();
    if(err)err.textContent='Login gagal: '+String(e?.message||e||'Server admin bermasalah.');
  }finally{
    if(submit){submit.disabled=false;submit.textContent='MASUK'}
  }
  return false;
};
window.submitAdminLogin.__serverAuthV5=true;
window.submitAdminLogin.__fastV6=true;

window.pnAdminResumeV5=async function(){
  if(sessionStorage.getItem(AUTH_KEY)!=='1')return false;
  const token=sessionStorage.getItem(TOKEN_KEY)||'';
  if(await tokenValid(token)){
    sessionStorage.setItem(MODE_KEY,'server-fast-v6');
    if(typeof window.enterAdmin==='function')window.enterAdmin(false);
    return true;
  }
  clearSession();
  if(typeof window.showPublicDashboard==='function')window.showPublicDashboard();
  return false;
};
window.pnAdminResumeV5.__fastV6=true;
})();
