from pathlib import Path

js = r'''(()=>{
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

function clearSession(){
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(MODE_KEY);
}

function loginDirect(username,password,timeout=12000){
  return new Promise((resolve,reject)=>{
    const u=String(username||'').trim();
    const p=String(password||'');
    if(!u||!p){reject(new Error('Username dan password admin wajib diisi.'));return}

    const rid='directv7-'+randomToken();
    const requestedToken=randomToken();
    const frame=document.createElement('iframe');
    frame.name='pnAdminDirectV7_'+rid.replace(/\W/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');

    const form=document.createElement('form');
    form.method='POST';
    form.action=ENDPOINT;
    form.target=frame.name;
    form.style.display='none';

    const payload={action:'reviewAdminLogin',rid,username:u,password:p,token:requestedToken};
    Object.entries(payload).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';input.name=name;input.value=String(value??'');
      form.appendChild(input);
    });

    let done=false;
    const cleanup=()=>{
      window.removeEventListener('message',onMessage);
      clearTimeout(timer);
      form.remove();
      setTimeout(()=>frame.remove(),200);
    };
    const finish=(ok,data)=>{
      if(done)return;done=true;cleanup();
      if(!ok){reject(new Error(data?.message||'Username atau password admin salah.'));return}
      const token=String(data?.token||requestedToken||'').trim();
      if(!/^[A-Za-z0-9_-]{32,128}$/.test(token)){
        reject(new Error('Server berhasil login tetapi token sesi tidak valid.'));
        return;
      }
      resolve(token);
    };
    const onMessage=e=>{
      if(e.source!==frame.contentWindow)return;
      const data=e.data;
      if(!data||data.source!=='pn-reviews'||String(data.rid||'')!==rid)return;
      finish(data.ok===true,data);
    };

    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish(false,{message:'Server admin belum memberi respons. Coba sekali lagi.'}),timeout);
    document.body.append(frame,form);
    try{form.submit()}catch(err){finish(false,{message:err?.message||'Permintaan login gagal dikirim.'})}
  });
}

async function serverLogin(username,password){
  const token=await loginDirect(username,password);
  sessionStorage.setItem(TOKEN_KEY,token);
  return token;
}

function enterAdminNow(){
  sessionStorage.setItem(AUTH_KEY,'1');
  sessionStorage.setItem(MODE_KEY,'server-direct-v7');
  if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
  if(typeof window.enterAdmin==='function')window.enterAdmin(true);
}

window.pnAdminServerLoginV5=async function(username,password){
  await serverLogin(username,password);
  return {ok:true,mode:'server-direct-v7'};
};
window.pnAdminServerLoginV5.__serverAuthV5=true;
window.pnAdminServerLoginV5.__directV7=true;

window.submitAdminLogin=async function(ev){
  if(ev)ev.preventDefault();
  const username=$('adminUser')?.value.trim()||'';
  const password=$('adminPass')?.value||'';
  const err=$('loginError');
  const submit=document.querySelector('#loginModal .loginSubmit');

  if(!username||!password){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(submit){submit.disabled=true;submit.textContent='MEMERIKSA...'}
  if(err)err.textContent='Memverifikasi langsung ke server admin...';

  try{
    await serverLogin(username,password);
    if(err)err.textContent='';
    enterAdminNow();
  }catch(e){
    clearSession();
    if(err)err.textContent='Login gagal: '+String(e?.message||e||'Tidak diketahui');
  }finally{
    if(submit){submit.disabled=false;submit.textContent='MASUK'}
  }
  return false;
};
window.submitAdminLogin.__serverAuthV5=true;
window.submitAdminLogin.__directV7=true;
})();
'''

Path('js/admin-auth-direct-v7.js').write_text(js, encoding='utf-8')

p=Path('index.html')
s=p.read_text(encoding='utf-8')
tag='<script src="js/admin-auth-direct-v7.js?v=1"></script>'
if tag not in s:
    anchor='<script src="js/admin-auth-fast-v6.js?v=1"></script>'
    if anchor not in s:
        raise SystemExit('anchor admin-auth-fast-v6 tidak ditemukan')
    s=s.replace(anchor, anchor+'\n'+tag, 1)
p.write_text(s, encoding='utf-8')
print('admin direct v7 installed')
