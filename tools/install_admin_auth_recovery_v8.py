from pathlib import Path

js = r'''(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const MODE_KEY='pnAdminAuthModeV5';
const $=id=>document.getElementById(id);

function randomToken(){
  try{const a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('')}
  catch(_){return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(64,'0').slice(0,64)}
}

function clearSession(){
  sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(MODE_KEY);
}

function jsonp(action,payload={},timeout=9000){
  return new Promise((resolve,reject)=>{
    const cb='pnAuthV8_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();resolve(data||{})};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+q.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Server admin tidak dapat dihubungi.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Server admin terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

async function capability(){
  try{
    const r=await jsonp('contentPublicList',{},9000);
    return {
      online:!!r?.ok,
      configured:r?.adminPasswordConfigured===true,
      recovery:r?.adminPasswordRecoveryAvailable===true,
      version:String(r?.adminPasswordVersion||'')
    };
  }catch(_){return {online:false,configured:null,recovery:null,version:''}}
}

function postResult(action,source,payload={},timeout=14000){
  return new Promise((resolve,reject)=>{
    const rid='authv8-'+randomToken();
    const frame=document.createElement('iframe');frame.name='pnAuthV8_'+rid.replace(/\W/g,'');frame.style.display='none';frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([name,value])=>{const i=document.createElement('input');i.type='hidden';i.name=name;i.value=String(value??'');form.appendChild(i)});
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),200)};
    const finish=(ok,data)=>{if(done)return;done=true;cleanup();ok?resolve(data||{}):reject(new Error(data?.message||'Permintaan admin ditolak server.'))};
    const onMessage=e=>{
      if(e.source!==frame.contentWindow)return;
      const d=e.data;
      if(!d||d.source!==source||String(d.rid||'')!==rid)return;
      finish(d.ok===true,d);
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish(false,{message:'Server admin belum memberi respons. Coba lagi.'}),timeout);
    document.body.append(frame,form);
    try{form.submit()}catch(e){finish(false,{message:e?.message||'Permintaan gagal dikirim.'})}
  });
}

async function directLogin(username,password){
  const requestedToken=randomToken();
  const r=await postResult('reviewAdminLogin','pn-reviews',{username,password,token:requestedToken},14000);
  const token=String(r?.token||requestedToken||'').trim();
  if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))throw new Error('Token sesi admin tidak valid.');
  sessionStorage.setItem(TOKEN_KEY,token);
  return token;
}

async function recoverPassword(username,currentPassword,newPassword){
  return postResult('adminPasswordRecover','pn-content',{username,currentPassword,newPassword,password:currentPassword},16000);
}

function enterAdminNow(){
  sessionStorage.setItem(AUTH_KEY,'1');sessionStorage.setItem(MODE_KEY,'server-recovery-v8');
  if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
  if(typeof window.enterAdmin==='function')window.enterAdmin(true);
}

function removeRecoveryFields(){
  $('pnAdminRecoveryFields')?.remove();
  const form=document.querySelector('#loginModal .loginCard');
  if(form)delete form.dataset.pnRecoveryV8;
}

function ensureRecoveryFields(){
  let box=$('pnAdminRecoveryFields');if(box)return box;
  const buttons=document.querySelector('#loginModal .loginButtons');
  if(!buttons)return null;
  box=document.createElement('div');box.id='pnAdminRecoveryFields';
  box.innerHTML=`
    <div style="margin-top:12px;padding:12px;border:1px solid #f59e0b;border-radius:10px;background:#fffbeb;color:#78350f;font-size:11px;line-height:1.5">
      <strong>AKTIFKAN PASSWORD ADMIN</strong><br>Backend belum memiliki password server. Buat password baru minimal 12 karakter. Password pada kolom di atas dipakai sekali untuk verifikasi password admin lama.
    </div>
    <label for="pnAdminNewPass" style="margin-top:10px">Password admin baru</label>
    <input id="pnAdminNewPass" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>
    <label for="pnAdminNewPass2">Ulangi password admin baru</label>
    <input id="pnAdminNewPass2" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>`;
  buttons.parentNode.insertBefore(box,buttons);
  const form=document.querySelector('#loginModal .loginCard');if(form)form.dataset.pnRecoveryV8='1';
  const submit=document.querySelector('#loginModal .loginSubmit');if(submit)submit.textContent='AKTIFKAN & MASUK';
  setTimeout(()=>$('pnAdminNewPass')?.focus(),50);
  return box;
}

async function submit(ev){
  if(ev)ev.preventDefault();
  const form=document.querySelector('#loginModal .loginCard');
  const username=$('adminUser')?.value.trim()||'';
  const password=$('adminPass')?.value||'';
  const err=$('loginError');
  const button=document.querySelector('#loginModal .loginSubmit');
  if(!username||!password){if(err)err.textContent='Username dan password admin wajib diisi.';return false}

  if(form?.dataset.pnRecoveryV8==='1'){
    const next=$('pnAdminNewPass')?.value||'';
    const confirm=$('pnAdminNewPass2')?.value||'';
    if(next.length<12){if(err)err.textContent='Password baru minimal 12 karakter.';return false}
    if(next!==confirm){if(err)err.textContent='Ulangi password baru belum sama.';return false}
    if(next===password){if(err)err.textContent='Password baru harus berbeda dari password admin lama.';return false}
    if(button){button.disabled=true;button.textContent='MENGAKTIFKAN...'}
    if(err)err.textContent='Mengaktifkan password server admin...';
    try{
      await recoverPassword(username,password,next);
      if(err)err.textContent='Password server aktif. Memasukkan admin...';
      await directLogin(username,next);
      removeRecoveryFields();
      if(err)err.textContent='';
      enterAdminNow();
    }catch(e){clearSession();if(err)err.textContent='Aktivasi gagal: '+String(e?.message||e||'Tidak diketahui')}
    finally{if(button){button.disabled=false;button.textContent=form?.dataset.pnRecoveryV8==='1'?'AKTIFKAN & MASUK':'MASUK'}}
    return false;
  }

  if(button){button.disabled=true;button.textContent='MEMERIKSA...'}
  if(err)err.textContent='Memeriksa status server admin...';
  try{
    const cap=await capability();
    if(cap.online&&cap.configured===false&&cap.recovery===true){
      ensureRecoveryFields();
      if(err)err.textContent='Password server belum aktif. Isi password admin baru lalu klik AKTIFKAN & MASUK.';
      return false;
    }
    if(err)err.textContent='Memverifikasi login admin...';
    await directLogin(username,password);
    if(err)err.textContent='';
    enterAdminNow();
  }catch(e){clearSession();if(err)err.textContent='Login gagal: '+String(e?.message||e||'Tidak diketahui')}
  finally{if(button&&!form?.dataset.pnRecoveryV8){button.disabled=false;button.textContent='MASUK'}else if(button){button.disabled=false}}
  return false;
}

window.submitAdminLogin=submit;
window.submitAdminLogin.__serverAuthV5=true;
window.submitAdminLogin.__recoveryV8=true;
window.pnAdminServerLoginV5=async function(username,password){await directLogin(username,password);return {ok:true,mode:'server-recovery-v8'}};
window.pnAdminServerLoginV5.__serverAuthV5=true;
window.pnAdminServerLoginV5.__recoveryV8=true;

const oldOpen=window.openAdminLogin;
if(typeof oldOpen==='function')window.openAdminLogin=function(){removeRecoveryFields();const r=oldOpen.apply(this,arguments);const b=document.querySelector('#loginModal .loginSubmit');if(b)b.textContent='MASUK';return r};
})();
'''

Path('js/admin-auth-recovery-v8.js').write_text(js, encoding='utf-8')

p=Path('index.html')
s=p.read_text(encoding='utf-8')
tag='<script src="js/admin-auth-recovery-v8.js?v=1"></script>'
if tag not in s:
    anchor='<script src="js/admin-auth-direct-v7.js?v=1"></script>'
    if anchor not in s:
        raise SystemExit('anchor admin-auth-direct-v7 tidak ditemukan')
    s=s.replace(anchor, anchor+'\n'+tag, 1)
p.write_text(s, encoding='utf-8')
print('admin auth recovery v8 installed')
