(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const BACKEND_MODE_KEY='pnAdminPasswordBackendMode';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

let backendReady=false;
let capabilityResolved=false;
let capabilityPromise=null;
const legacySubmit=typeof window.submitAdminLogin==='function'?window.submitAdminLogin:null;

function randomToken(){
  try{
    const a=new Uint8Array(32);crypto.getRandomValues(a);
    return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
  }catch(_){return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(40,'x')}
}

function jsonp(action,payload={},timeout=12000){
  return new Promise((resolve,reject)=>{
    const cb='pnAdminPassV2_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');let done=false;
    const clean=()=>{clearTimeout(timer);delete window[cb];script.remove()};
    window[cb]=data=>{if(done)return;done=true;clean();resolve(data)};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+q.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Tidak dapat terhubung ke server admin.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Server admin terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

async function postReliable(action,payload={},timeout=45000){
  const rid='adminpass2-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnAdminPassFrame_'+rid.replace(/\W/g,'');frame.style.display='none';frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  document.body.append(frame,form);form.submit();form.remove();
  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(650);
      try{
        const r=await jsonp('contentResult',{rid},6500);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Permintaan admin ditolak server.');
      }catch(err){lastErr=err}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server admin tidak merespons tepat waktu.');
}

async function probeBackend(){
  try{
    const r=await jsonp('contentPublicList',{},12000);
    backendReady=!!(r&&r.ok&&(r.adminPassword===true||String(r.adminPasswordVersion||'')==='2'));
    capabilityResolved=true;
    if(backendReady)localStorage.setItem(BACKEND_MODE_KEY,'2');
    updateUiState();
    return backendReady;
  }catch(_){
    capabilityResolved=true;
    backendReady=false;
    updateUiState();
    return false;
  }
}

function getCapability(){
  if(!capabilityPromise)capabilityPromise=probeBackend();
  return capabilityPromise;
}

async function secureLogin(username,password){
  const requestedToken=randomToken();
  const r=await postReliable('contentAdminLogin',{username,password,token:requestedToken});
  const t=String(r?.token||requestedToken||'');
  if(!r?.ok||!t)throw new Error(r?.message||'Login admin gagal.');
  sessionStorage.setItem(TOKEN_KEY,t);
  return {ok:true,token:t};
}

window.submitAdminLogin=async function(ev){
  if(ev)ev.preventDefault();
  const u=$('adminUser')?.value.trim()||'';
  const p=$('adminPass')?.value||'';
  const err=$('loginError');
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(err)err.textContent='Memeriksa login admin...';

  let cap=false;
  try{cap=await Promise.race([getCapability(),sleep(5000).then(()=>false)])}catch(_){cap=false}

  if(cap||localStorage.getItem(BACKEND_MODE_KEY)==='2'){
    if(!cap){if(err)err.textContent='Server login admin sedang tidak dapat dihubungi. Coba beberapa saat lagi.';return false}
    try{
      await secureLogin(u,p);
      sessionStorage.setItem(AUTH_KEY,'1');
      if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
      if(typeof window.enterAdmin==='function')window.enterAdmin(true);
    }catch(e){if(err)err.textContent=e?.message||'Username atau password admin salah.'}
    return false;
  }

  if(legacySubmit)return legacySubmit(ev);
  if(err)err.textContent='Layanan login admin belum siap.';
  return false;
};

function ensureStyles(){
  if($('pnAdminPassSafeStyles'))return;
  const s=document.createElement('style');s.id='pnAdminPassSafeStyles';s.textContent=`
    .pnAdminPassSafeBtn{border:0;border-radius:8px;padding:8px 11px;background:#f59e0b;color:#fff;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnAdminPassSafeBtn:hover{filter:brightness(.97)}
    .pnAdminPassSafeModal{position:fixed;inset:0;z-index:100500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.68)}.pnAdminPassSafeModal.hidden{display:none!important}
    .pnAdminPassSafeCard{width:min(460px,100%);background:#fff;border-radius:15px;box-shadow:0 24px 70px rgba(0,0,0,.28);overflow:hidden}.pnAdminPassSafeHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px;background:#14532d;color:#fff}.pnAdminPassSafeHead h3{margin:0;font-size:14px}.pnAdminPassSafeClose{border:0;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:18px;cursor:pointer}
    .pnAdminPassSafeBody{padding:17px}.pnAdminPassSafeField{margin-bottom:11px}.pnAdminPassSafeField label{display:block;margin-bottom:5px;color:#334155;font-size:10px;font-weight:900}.pnAdminPassSafeField input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;font:inherit;font-size:12px}.pnAdminPassSafeNote{margin:0 0 12px;color:#64748b;font-size:10px;line-height:1.55}.pnAdminPassSafeState{margin:0 0 12px;padding:9px 10px;border-radius:8px;font-size:10px;font-weight:800;line-height:1.5}.pnAdminPassSafeState.ready{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}.pnAdminPassSafeState.wait{background:#fffbeb;border:1px solid #fde68a;color:#92400e}.pnAdminPassSafeStatus{display:none;margin:0 0 11px;padding:9px 10px;border-radius:8px;font-size:10px;font-weight:800;line-height:1.5}.pnAdminPassSafeStatus.show{display:block}.pnAdminPassSafeStatus.err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}.pnAdminPassSafeStatus.ok{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}.pnAdminPassSafeSave{width:100%;border:0;border-radius:9px;padding:11px 13px;background:#166534;color:#fff;font:inherit;font-size:11px;font-weight:1000;cursor:pointer}.pnAdminPassSafeSave:disabled{opacity:.55;cursor:not-allowed}
  `;document.head.appendChild(s);
}

function modalHtml(){return `<div id="pnAdminPassSafeModal" class="pnAdminPassSafeModal hidden" aria-hidden="true"><div class="pnAdminPassSafeCard" role="dialog" aria-modal="true"><div class="pnAdminPassSafeHead"><h3>🔑 GANTI PASSWORD ADMIN</h3><button id="pnAdminPassSafeClose" class="pnAdminPassSafeClose" type="button" aria-label="Tutup">×</button></div><form id="pnAdminPassSafeForm" class="pnAdminPassSafeBody"><div id="pnAdminPassSafeBackend" class="pnAdminPassSafeState wait">Memeriksa kesiapan server...</div><p class="pnAdminPassSafeNote">Password baru minimal 8 karakter. Setelah berhasil, sesi admin lama akan dinonaktifkan dan Anda login kembali menggunakan password baru.</p><div id="pnAdminPassSafeStatus" class="pnAdminPassSafeStatus"></div><div class="pnAdminPassSafeField"><label for="pnAdminPassSafeCurrent">Password saat ini</label><input id="pnAdminPassSafeCurrent" type="password" autocomplete="current-password" required></div><div class="pnAdminPassSafeField"><label for="pnAdminPassSafeNew">Password baru</label><input id="pnAdminPassSafeNew" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><div class="pnAdminPassSafeField"><label for="pnAdminPassSafeConfirm">Ulangi password baru</label><input id="pnAdminPassSafeConfirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><button id="pnAdminPassSafeSave" class="pnAdminPassSafeSave" type="submit">SIMPAN PASSWORD BARU</button></form></div></div>`}

function setStatus(type,text){const s=$('pnAdminPassSafeStatus');if(!s)return;s.className='pnAdminPassSafeStatus show '+(type||'');s.textContent=text||''}
function clearStatus(){const s=$('pnAdminPassSafeStatus');if(s){s.className='pnAdminPassSafeStatus';s.textContent=''}}
function updateUiState(){
  const st=$('pnAdminPassSafeBackend'),btn=$('pnAdminPassSafeSave');
  if(!st)return;
  if(backendReady){st.className='pnAdminPassSafeState ready';st.textContent='✓ Server ganti password aktif dan siap digunakan.';if(btn)btn.disabled=false}
  else if(capabilityResolved){st.className='pnAdminPassSafeState wait';st.textContent='Fitur server belum diaktifkan. Login lama tetap aman dan tetap dapat digunakan.';if(btn)btn.disabled=true}
  else{st.className='pnAdminPassSafeState wait';st.textContent='Memeriksa kesiapan server...';if(btn)btn.disabled=true}
}
function closeModal(){const m=$('pnAdminPassSafeModal');if(!m)return;m.classList.add('hidden');m.setAttribute('aria-hidden','true');$('pnAdminPassSafeForm')?.reset();clearStatus()}
async function openModal(){const m=$('pnAdminPassSafeModal');if(!m)return;m.classList.remove('hidden');m.setAttribute('aria-hidden','false');capabilityResolved=false;backendReady=false;capabilityPromise=probeBackend();updateUiState();await capabilityPromise;setTimeout(()=>$('pnAdminPassSafeCurrent')?.focus(),30)}

function installUi(){
  ensureStyles();
  const actions=document.querySelector('#adminApp .adminTopActions');
  if(actions&&!$('pnAdminPassSafeBtn')){
    const b=document.createElement('button');b.id='pnAdminPassSafeBtn';b.className='pnAdminPassSafeBtn';b.type='button';b.textContent='🔑 GANTI PASSWORD';b.onclick=openModal;
    const logout=actions.querySelector('.logout');actions.insertBefore(b,logout||null);
  }
  if(!$('pnAdminPassSafeModal'))document.body.insertAdjacentHTML('beforeend',modalHtml());
  const m=$('pnAdminPassSafeModal');
  if(m&&!m.dataset.bound){
    m.dataset.bound='1';
    $('pnAdminPassSafeClose').onclick=closeModal;m.addEventListener('click',e=>{if(e.target===m)closeModal()});
    $('pnAdminPassSafeForm').addEventListener('submit',async e=>{
      e.preventDefault();
      if(!backendReady){setStatus('err','Server ganti password belum aktif. Password lama tidak diubah.');return}
      const cur=$('pnAdminPassSafeCurrent').value,newp=$('pnAdminPassSafeNew').value,conf=$('pnAdminPassSafeConfirm').value,btn=$('pnAdminPassSafeSave');
      if(newp.length<8){setStatus('err','Password baru minimal 8 karakter.');return}
      if(newp!==conf){setStatus('err','Ulangi password baru belum sama.');return}
      if(cur===newp){setStatus('err','Password baru harus berbeda dari password saat ini.');return}
      btn.disabled=true;btn.textContent='MENYIMPAN...';setStatus('','Memverifikasi password saat ini...');
      try{
        const login=await secureLogin('admin',cur);
        await postReliable('adminChangePassword',{token:login.token,currentPassword:cur,newPassword:newp});
        localStorage.setItem(BACKEND_MODE_KEY,'2');
        setStatus('ok','✓ Password berhasil diubah. Silakan login kembali menggunakan password baru.');
        sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(AUTH_KEY);
        setTimeout(()=>{closeModal();if(typeof window.showPublicDashboard==='function')window.showPublicDashboard();if(typeof window.openAdminLogin==='function')window.openAdminLogin()},1200);
      }catch(err){setStatus('err',err?.message||'Gagal mengganti password admin. Password lama tetap berlaku.')}finally{btn.disabled=!backendReady;btn.textContent='SIMPAN PASSWORD BARU'}
    });
  }
  updateUiState();
}

document.addEventListener('DOMContentLoaded',()=>{installUi();getCapability();setInterval(installUi,1800)});
})();
