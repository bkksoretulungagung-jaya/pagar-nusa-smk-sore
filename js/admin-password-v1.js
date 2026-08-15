(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tokenValue=()=>sessionStorage.getItem(TOKEN_KEY)||'';

function randomToken(){
  try{
    const a=new Uint8Array(32);crypto.getRandomValues(a);
    return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
  }catch(_){return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(40,'x')}
}

function jsonp(action,payload={},timeout=15000){
  return new Promise((resolve,reject)=>{
    const cb='pnAdminSecCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
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
  const rid='adminsec-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnAdminSecFrame_'+rid.replace(/\W/g,'');frame.style.display='none';frame.setAttribute('aria-hidden','true');
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

window.pnSecureAdminLogin=async function(username,password){
  const requestedToken=randomToken();
  const r=await postReliable('contentAdminLogin',{username,password,token:requestedToken});
  const t=String(r?.token||requestedToken||'');
  if(!r?.ok||!t)throw new Error(r?.message||'Login admin gagal.');
  sessionStorage.setItem(TOKEN_KEY,t);
  return {ok:true,token:t};
};

function ensureStyles(){
  if($('pnAdminPasswordStyles'))return;
  const s=document.createElement('style');s.id='pnAdminPasswordStyles';s.textContent=`
    .pnAdminPassBtn{border:0;border-radius:8px;padding:8px 11px;background:#f59e0b;color:#fff;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnAdminPassBtn:hover{filter:brightness(.97)}
    .pnAdminPassModal{position:fixed;inset:0;z-index:100500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.68)}.pnAdminPassModal.hidden{display:none!important}
    .pnAdminPassCard{width:min(460px,100%);background:#fff;border-radius:15px;box-shadow:0 24px 70px rgba(0,0,0,.28);overflow:hidden}.pnAdminPassHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px;background:#14532d;color:#fff}.pnAdminPassHead h3{margin:0;font-size:14px}.pnAdminPassClose{border:0;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:18px;cursor:pointer}
    .pnAdminPassBody{padding:17px}.pnAdminPassField{margin-bottom:11px}.pnAdminPassField label{display:block;margin-bottom:5px;color:#334155;font-size:10px;font-weight:900}.pnAdminPassField input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;font:inherit;font-size:12px}.pnAdminPassNote{margin:0 0 12px;color:#64748b;font-size:10px;line-height:1.55}.pnAdminPassStatus{display:none;margin:0 0 11px;padding:9px 10px;border-radius:8px;font-size:10px;font-weight:800;line-height:1.5}.pnAdminPassStatus.show{display:block}.pnAdminPassStatus.err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}.pnAdminPassStatus.ok{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}.pnAdminPassSave{width:100%;border:0;border-radius:9px;padding:11px 13px;background:#166534;color:#fff;font:inherit;font-size:11px;font-weight:1000;cursor:pointer}.pnAdminPassSave:disabled{opacity:.55;cursor:not-allowed}
  `;document.head.appendChild(s);
}

function modalHtml(){return `<div id="pnAdminPasswordModal" class="pnAdminPassModal hidden" aria-hidden="true"><div class="pnAdminPassCard" role="dialog" aria-modal="true" aria-labelledby="pnAdminPassTitle"><div class="pnAdminPassHead"><h3 id="pnAdminPassTitle">🔑 GANTI PASSWORD ADMIN</h3><button id="pnAdminPassClose" class="pnAdminPassClose" type="button" aria-label="Tutup">×</button></div><form id="pnAdminPassForm" class="pnAdminPassBody"><p class="pnAdminPassNote">Masukkan password saat ini, lalu password baru minimal 8 karakter. Setelah berhasil, semua sesi admin lama akan dinonaktifkan dan Anda harus login kembali.</p><div id="pnAdminPassStatus" class="pnAdminPassStatus"></div><div class="pnAdminPassField"><label for="pnAdminCurrentPass">Password saat ini</label><input id="pnAdminCurrentPass" type="password" autocomplete="current-password" required></div><div class="pnAdminPassField"><label for="pnAdminNewPass">Password baru</label><input id="pnAdminNewPass" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><div class="pnAdminPassField"><label for="pnAdminConfirmPass">Ulangi password baru</label><input id="pnAdminConfirmPass" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><button id="pnAdminPassSave" class="pnAdminPassSave" type="submit">SIMPAN PASSWORD BARU</button></form></div></div>`}

function setStatus(type,text){const s=$('pnAdminPassStatus');if(!s)return;s.className='pnAdminPassStatus show '+(type||'');s.textContent=text||''}
function closeModal(){const m=$('pnAdminPasswordModal');if(!m)return;m.classList.add('hidden');m.setAttribute('aria-hidden','true');$('pnAdminPassForm')?.reset();const s=$('pnAdminPassStatus');if(s){s.className='pnAdminPassStatus';s.textContent=''}}
function openModal(){const m=$('pnAdminPasswordModal');if(!m)return;m.classList.remove('hidden');m.setAttribute('aria-hidden','false');setTimeout(()=>$('pnAdminCurrentPass')?.focus(),60)}

function installUi(){
  ensureStyles();
  const actions=document.querySelector('#adminApp .adminTopActions');
  if(actions&&!$('pnAdminPasswordBtn')){
    const b=document.createElement('button');b.id='pnAdminPasswordBtn';b.className='pnAdminPassBtn';b.type='button';b.textContent='🔑 GANTI PASSWORD';b.onclick=openModal;
    const logout=actions.querySelector('.logout');actions.insertBefore(b,logout||null);
  }
  if(!$('pnAdminPasswordModal'))document.body.insertAdjacentHTML('beforeend',modalHtml());
  if(!$('pnAdminPasswordModal')?.dataset.bound){
    const m=$('pnAdminPasswordModal');m.dataset.bound='1';
    $('pnAdminPassClose').onclick=closeModal;m.addEventListener('click',e=>{if(e.target===m)closeModal()});
    $('pnAdminPassForm').addEventListener('submit',async e=>{
      e.preventDefault();const cur=$('pnAdminCurrentPass').value,newp=$('pnAdminNewPass').value,conf=$('pnAdminConfirmPass').value,btn=$('pnAdminPassSave');
      if(newp.length<8){setStatus('err','Password baru minimal 8 karakter.');return}
      if(newp!==conf){setStatus('err','Ulangi password baru belum sama.');return}
      if(cur===newp){setStatus('err','Password baru harus berbeda dari password saat ini.');return}
      const t=tokenValue();if(!t){setStatus('err','Sesi admin tidak tersedia. Silakan login ulang.');return}
      btn.disabled=true;btn.textContent='MENYIMPAN...';setStatus('','Memperbarui password admin...');
      try{
        await postReliable('adminChangePassword',{token:t,currentPassword:cur,newPassword:newp});
        setStatus('ok','✓ Password berhasil diubah. Anda akan diminta login kembali.');
        sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(AUTH_KEY);
        setTimeout(()=>{closeModal();if(typeof window.showPublicDashboard==='function')window.showPublicDashboard();if(typeof window.openAdminLogin==='function')window.openAdminLogin()},1000);
      }catch(err){setStatus('err',err.message||'Gagal mengganti password admin.')}finally{btn.disabled=false;btn.textContent='SIMPAN PASSWORD BARU'}
    });
  }
}

async function verifyExistingSession(){
  if(sessionStorage.getItem(AUTH_KEY)!=='1')return;
  const t=tokenValue();
  if(!t){sessionStorage.removeItem(AUTH_KEY);if(typeof window.showPublicDashboard==='function')window.showPublicDashboard();return}
  try{const r=await jsonp('contentAdminList',{token:t},12000);if(!r?.ok)throw new Error('Sesi tidak valid.')}catch(_){sessionStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(TOKEN_KEY);if(typeof window.showPublicDashboard==='function')window.showPublicDashboard()}
}

document.addEventListener('DOMContentLoaded',()=>{installUi();setTimeout(verifyExistingSession,250);setInterval(installUi,1800)});
})();
