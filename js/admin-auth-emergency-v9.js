(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const MODE_KEY='pnAdminAuthModeV5';
const $=id=>document.getElementById(id);
let busy=false;

function randomToken(){
  try{
    const a=new Uint8Array(32);crypto.getRandomValues(a);
    return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
  }catch(_){
    return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(64,'0').slice(0,64);
  }
}

function setStatus(text,isError=false){
  const el=$('loginError');
  if(!el)return;
  el.textContent=String(text||'');
  el.style.display='block';
  el.style.minHeight='18px';
  el.style.marginTop='10px';
  el.style.fontWeight='800';
  el.style.color=isError?'#b91c1c':'#14532d';
}

function setButton(text,disabled){
  const btn=document.querySelector('#loginModal .loginSubmit');
  if(!btn)return;
  btn.textContent=text||'MASUK';
  btn.disabled=!!disabled;
}

function clearSession(){
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(MODE_KEY);
}

function postResult(action,source,payload={},timeout=20000){
  return new Promise((resolve,reject)=>{
    const rid='pn-emergency-v9-'+randomToken();
    const frame=document.createElement('iframe');
    frame.name='pnEmergencyV9_'+rid.replace(/[^A-Za-z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');

    const form=document.createElement('form');
    form.method='POST';
    form.action=ENDPOINT;
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
      window.removeEventListener('message',onMessage);
      clearTimeout(timer);
      form.remove();
      setTimeout(()=>frame.remove(),250);
    };
    const finish=(ok,data)=>{
      if(done)return;
      done=true;
      cleanup();
      if(ok)resolve(data||{});
      else reject(new Error(data?.message||'Permintaan admin ditolak server.'));
    };
    const onMessage=e=>{
      const data=e.data;
      if(!data||data.source!==source||String(data.rid||'')!==rid)return;
      finish(data.ok===true,data);
    };

    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>finish(false,{message:'Server admin tidak memberi respons. Silakan coba lagi.'}),timeout);
    document.body.append(frame,form);
    try{form.submit()}catch(err){finish(false,{message:err?.message||'Permintaan login gagal dikirim.'})}
  });
}

async function loginServer(username,password){
  const requestedToken=randomToken();
  const result=await postResult('reviewAdminLogin','pn-reviews',{
    username:String(username||'').trim(),
    password:String(password||''),
    token:requestedToken
  },20000);
  const token=String(result?.token||requestedToken||'').trim();
  if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))throw new Error('Token sesi admin dari server tidak valid.');
  sessionStorage.setItem(TOKEN_KEY,token);
  return token;
}

async function recoverServerPassword(username,currentPassword,newPassword){
  return postResult('adminPasswordRecover','pn-content',{
    username:String(username||'').trim(),
    currentPassword:String(currentPassword||''),
    password:String(currentPassword||''),
    newPassword:String(newPassword||'')
  },22000);
}

function enterAdminNow(){
  sessionStorage.setItem(AUTH_KEY,'1');
  sessionStorage.setItem(MODE_KEY,'server-emergency-v9');
  if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
  else $('loginModal')?.classList.add('hidden');

  if(typeof window.enterAdmin==='function')window.enterAdmin(true);
  else{
    $('publicHome')?.classList.add('hidden');
    $('adminApp')?.classList.remove('hidden');
  }
}

function ensureRecoveryFields(){
  let box=$('pnEmergencyRecoveryV9');
  if(box)return box;
  const body=document.querySelector('#loginModal .loginCardBody');
  const buttons=document.querySelector('#loginModal .loginButtons');
  if(!body||!buttons)return null;

  box=document.createElement('div');
  box.id='pnEmergencyRecoveryV9';
  box.innerHTML=`
    <div style="margin:12px 0;padding:12px;border:1px solid #f59e0b;border-radius:10px;background:#fffbeb;color:#78350f;font-size:12px;line-height:1.5">
      <strong>AKTIFKAN PASSWORD SERVER ADMIN</strong><br>
      Password server belum dapat dipakai. Masukkan password admin baru minimal 12 karakter. Password lama di atas dipakai untuk verifikasi satu kali.
    </div>
    <label for="pnEmergencyNewPassV9">Password admin baru</label>
    <input id="pnEmergencyNewPassV9" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>
    <label for="pnEmergencyNewPass2V9">Ulangi password admin baru</label>
    <input id="pnEmergencyNewPass2V9" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>`;
  body.insertBefore(box,buttons);
  setButton('AKTIFKAN & MASUK',false);
  setTimeout(()=>$('pnEmergencyNewPassV9')?.focus(),80);
  return box;
}

async function handleLogin(){
  if(busy)return false;
  const username=$('adminUser')?.value.trim()||'';
  const password=$('adminPass')?.value||'';
  if(!username||!password){setStatus('Username dan password admin wajib diisi.',true);return false}

  const recovery=$('pnEmergencyRecoveryV9');
  if(recovery){
    const next=$('pnEmergencyNewPassV9')?.value||'';
    const confirm=$('pnEmergencyNewPass2V9')?.value||'';
    if(next.length<12){setStatus('Password baru minimal 12 karakter.',true);return false}
    if(next!==confirm){setStatus('Ulangi password baru belum sama.',true);return false}
    if(next===password){setStatus('Password baru harus berbeda dari password lama.',true);return false}

    busy=true;
    setButton('MENGAKTIFKAN...',true);
    setStatus('Mengaktifkan password server admin...');
    try{
      await recoverServerPassword(username,password,next);
      setStatus('Password server aktif. Memasukkan admin...');
      await loginServer(username,next);
      setStatus('Login berhasil. Membuka area admin...');
      enterAdminNow();
    }catch(err){
      clearSession();
      setStatus('Aktivasi gagal: '+String(err?.message||err||'Tidak diketahui'),true);
      setButton('AKTIFKAN & MASUK',false);
    }finally{busy=false}
    return false;
  }

  busy=true;
  setButton('MEMERIKSA...',true);
  setStatus('Menghubungkan ke server admin...');
  try{
    await loginServer(username,password);
    setStatus('Login berhasil. Membuka area admin...');
    enterAdminNow();
  }catch(err){
    clearSession();
    ensureRecoveryFields();
    setStatus('Login server belum aktif. Isi PASSWORD ADMIN BARU di bawah, lalu klik AKTIFKAN & MASUK.',true);
  }finally{
    busy=false;
    if(!$('pnEmergencyRecoveryV9'))setButton('MASUK',false);
  }
  return false;
}

// Tangkap submit pada fase capture SEBELUM handler lama/inline dijalankan.
document.addEventListener('submit',e=>{
  const form=e.target;
  if(!form?.matches?.('#loginModal .loginCard'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  handleLogin();
},true);

// Pastikan klik tombol juga memberi umpan balik langsung.
document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#loginModal .loginSubmit');
  if(!btn)return;
  setStatus('Tombol MASUK diterima. Memproses...');
},true);

window.pnAdminEmergencyV9={handleLogin,version:'9'};
})();
