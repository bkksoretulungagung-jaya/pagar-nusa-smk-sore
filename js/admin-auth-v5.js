(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const MODE_KEY='pnAdminAuthModeV5';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function randomToken(){
  try{
    const a=new Uint8Array(32);crypto.getRandomValues(a);
    return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
  }catch(_){
    return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(48,'x');
  }
}

function jsonp(action,payload={},timeout=10000){
  return new Promise((resolve,reject)=>{
    const cb='pnAuthV5_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const s=document.createElement('script');
    let done=false;
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

async function postReliable(action,payload={},timeout=35000){
  const rid='authv5-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');
  frame.name='pnAuthV5Frame_'+rid.replace(/\W/g,'');
  frame.style.display='none';frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');
  form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{
    const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i);
  });
  document.body.append(frame,form);form.submit();form.remove();

  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(600);
      try{
        const r=await jsonp('contentResult',{rid},6000);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Permintaan admin ditolak server.');
      }catch(err){lastErr=err}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server admin tidak merespons tepat waktu.');
}

async function capability(){
  const r=await jsonp('contentPublicList',{},10000);
  return {
    online:!!(r&&r.ok),
    v4:!!(r&&r.ok&&String(r.adminPasswordVersion||'')==='4'),
    configured:r?.adminPasswordConfigured===true,
    recoveryAvailable:r?.adminPasswordRecoveryAvailable!==false
  };
}

async function legacyMatches(username,password){
  try{
    if(username!=='admin')return false;
    const fn=typeof sha256Hex==='function'?sha256Hex:(typeof window.sha256Hex==='function'?window.sha256Hex:null);
    if(!fn||typeof PN_ADMIN_PASS_HASH==='undefined')return false;
    return (await fn(password))===PN_ADMIN_PASS_HASH;
  }catch(_){return false}
}

async function serverLogin(username,password){
  const requested=randomToken();
  const r=await postReliable('contentAdminLogin',{username,password,token:requested},30000);
  const token=String(r?.token||requested||'');
  if(!token)throw new Error('Token admin tidak diterima server.');
  sessionStorage.setItem(TOKEN_KEY,token);
  return token;
}

function enterAdmin(mode){
  sessionStorage.setItem(AUTH_KEY,'1');
  sessionStorage.setItem(MODE_KEY,mode||'server');
  if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
  if(typeof window.enterAdmin==='function')window.enterAdmin(true);
}

window.pnAdminServerLoginV5=async function(username,password){
  const u=String(username||'').trim();
  const p=String(password||'');
  if(!u||!p)throw new Error('Username dan password admin wajib diisi.');
  const cap=await capability();
  if(cap.v4&&cap.configured){
    await serverLogin(u,p);
    return {ok:true,mode:'server'};
  }
  if(cap.v4&&!cap.configured){
    if(await legacyMatches(u,p))return {ok:true,mode:'legacy'};
    throw new Error('Username atau password admin salah.');
  }
  if(await legacyMatches(u,p))return {ok:true,mode:'legacy-pre-v4'};
  throw new Error('Username atau password admin salah.');
};
window.pnAdminServerLoginV5.__serverAuthV5=true;

window.submitAdminLogin=async function(ev){
  if(ev)ev.preventDefault();
  const u=$('adminUser')?.value.trim()||'';
  const p=$('adminPass')?.value||'';
  const err=$('loginError');
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(err)err.textContent='Memeriksa login admin...';

  try{
    const cap=await capability();
    if(cap.v4&&cap.configured){
      await serverLogin(u,p);
      if(err)err.textContent='';
      enterAdmin('server');
      return false;
    }
    if(cap.v4&&!cap.configured){
      if(await legacyMatches(u,p)){
        if(err)err.textContent='';
        enterAdmin('legacy');
        return false;
      }
      if(err)err.textContent='Username atau password admin salah.';
      return false;
    }
    if(await legacyMatches(u,p)){
      if(err)err.textContent='';
      enterAdmin('legacy-pre-v4');
      return false;
    }
    if(err)err.textContent='Username atau password admin salah.';
  }catch(e){
    if(err)err.textContent='Login server gagal: '+String(e?.message||e||'Tidak diketahui');
  }
  return false;
};
window.submitAdminLogin.__serverAuthV5=true;

function ensureStyles(){
  if($('pnAuthV5Styles'))return;
  const s=document.createElement('style');s.id='pnAuthV5Styles';
  s.textContent=`
  .pnAuthV5Btn{border:0;border-radius:8px;padding:8px 11px;background:#f59e0b;color:#fff;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}
  .pnAuthV5Modal{position:fixed;inset:0;z-index:100600;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.68)}
  .pnAuthV5Modal.hidden{display:none!important}.pnAuthV5Card{width:min(470px,100%);background:#fff;border-radius:15px;box-shadow:0 24px 70px rgba(0,0,0,.28);overflow:hidden}
  .pnAuthV5Head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 17px;background:#14532d;color:#fff}.pnAuthV5Head h3{margin:0;font-size:14px}
  .pnAuthV5Close{border:0;width:31px;height:31px;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:18px;cursor:pointer}
  .pnAuthV5Body{padding:17px}.pnAuthV5Field{margin-bottom:11px}.pnAuthV5Field label{display:block;margin-bottom:5px;color:#334155;font-size:10px;font-weight:900}
  .pnAuthV5Field input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;font:inherit;font-size:12px}
  .pnAuthV5State,.pnAuthV5Msg{margin:0 0 12px;padding:9px 10px;border-radius:8px;font-size:10px;font-weight:800;line-height:1.5}
  .pnAuthV5State.ok,.pnAuthV5Msg.ok{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}.pnAuthV5State.warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
  .pnAuthV5Msg.err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}.pnAuthV5Msg{display:none}.pnAuthV5Msg.show{display:block}
  .pnAuthV5Note{margin:0 0 12px;color:#64748b;font-size:10px;line-height:1.55}.pnAuthV5Save{width:100%;border:0;border-radius:9px;padding:11px 13px;background:#166534;color:#fff;font:inherit;font-size:11px;font-weight:1000;cursor:pointer}.pnAuthV5Save:disabled{opacity:.55;cursor:not-allowed}
  `;document.head.appendChild(s);
}

function modalHtml(){return `<div id="pnAuthV5Modal" class="pnAuthV5Modal hidden" aria-hidden="true"><div class="pnAuthV5Card" role="dialog" aria-modal="true"><div class="pnAuthV5Head"><h3>🔑 GANTI PASSWORD ADMIN</h3><button id="pnAuthV5Close" class="pnAuthV5Close" type="button">×</button></div><form id="pnAuthV5Form" class="pnAuthV5Body"><div id="pnAuthV5State" class="pnAuthV5State warn">Memeriksa server...</div><p class="pnAuthV5Note">Password baru minimal 8 karakter. Setelah berhasil, login berikutnya hanya menggunakan password baru.</p><div id="pnAuthV5Msg" class="pnAuthV5Msg"></div><div class="pnAuthV5Field"><label>Password saat ini</label><input id="pnAuthV5Current" type="password" autocomplete="current-password" required></div><div class="pnAuthV5Field"><label>Password baru</label><input id="pnAuthV5New" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><div class="pnAuthV5Field"><label>Ulangi password baru</label><input id="pnAuthV5Confirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><button id="pnAuthV5Save" class="pnAuthV5Save" type="submit">SIMPAN PASSWORD BARU</button></form></div></div>`}

function setMsg(type,text){const el=$('pnAuthV5Msg');if(!el)return;el.className='pnAuthV5Msg show '+(type||'');el.textContent=text||''}
function clearMsg(){const el=$('pnAuthV5Msg');if(el){el.className='pnAuthV5Msg';el.textContent=''}}

async function refreshState(){
  const state=$('pnAuthV5State'),save=$('pnAuthV5Save');if(!state)return;
  state.className='pnAuthV5State warn';state.textContent='Memeriksa server...';if(save)save.disabled=true;
  try{
    const cap=await capability();
    if(!cap.v4){state.textContent='Backend password v4 belum aktif.';return}
    state.className='pnAuthV5State ok';
    if(cap.recoveryAvailable)state.textContent='✓ Mode pemulihan tersedia. Password lama akan diverifikasi langsung oleh server.';
    else if(cap.configured)state.textContent='✓ Password server aktif. Password saat ini akan diverifikasi ulang sebelum diganti.';
    else state.textContent='✓ Server siap. Password lama masih aktif sampai password baru tersimpan.';
    if(save)save.disabled=false;
  }catch(e){state.textContent='Server admin tidak dapat dihubungi: '+String(e?.message||e)}
}

function closeModal(){const m=$('pnAuthV5Modal');if(!m)return;m.classList.add('hidden');m.setAttribute('aria-hidden','true');$('pnAuthV5Form')?.reset();clearMsg()}
async function openModal(){const m=$('pnAuthV5Modal');if(!m)return;m.classList.remove('hidden');m.setAttribute('aria-hidden','false');clearMsg();await refreshState();setTimeout(()=>$('pnAuthV5Current')?.focus(),30)}

async function changePassword(ev){
  ev.preventDefault();
  const cur=$('pnAuthV5Current')?.value||'';
  const next=$('pnAuthV5New')?.value||'';
  const conf=$('pnAuthV5Confirm')?.value||'';
  const btn=$('pnAuthV5Save');
  if(next.length<8){setMsg('err','Password baru minimal 8 karakter.');return}
  if(next!==conf){setMsg('err','Ulangi password baru belum sama.');return}
  if(cur===next){setMsg('err','Password baru harus berbeda dari password saat ini.');return}
  if(btn){btn.disabled=true;btn.textContent='MENYIMPAN...'};clearMsg();
  try{
    const cap=await capability();
    if(!cap.v4)throw new Error('Backend password v4 belum aktif.');
    let result;
    if(cap.recoveryAvailable){
      setMsg('','Memverifikasi password lama langsung di server...');
      result=await postReliable('adminPasswordRecover',{username:'admin',currentPassword:cur,newPassword:next},35000);
    }else{
      setMsg('','Memverifikasi password saat ini ke server...');
      const token=await serverLogin('admin',cur);
      setMsg('','Verifikasi berhasil. Menyimpan password baru...');
      result=await postReliable('adminChangePassword',{token,currentPassword:cur,newPassword:next},35000);
    }
    if(!result?.ok)throw new Error(result?.message||'Password belum berhasil diubah.');
    sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(MODE_KEY);
    setMsg('ok','✓ Password admin berhasil diubah. Silakan login kembali menggunakan password baru.');
    if(btn){btn.disabled=true;btn.textContent='BERHASIL ✓'}
    setTimeout(()=>{closeModal();if(typeof window.showPublicDashboard==='function')window.showPublicDashboard();if(typeof window.openAdminLogin==='function')window.openAdminLogin()},1400);
  }catch(e){setMsg('err',String(e?.message||e||'Gagal mengganti password admin.'));if(btn){btn.disabled=false;btn.textContent='SIMPAN PASSWORD BARU'}}
}

function install(){
  ensureStyles();
  const old=$('pnAuthV4Btn');if(old)old.remove();
  const oldModal=$('pnAuthV4Modal');if(oldModal)oldModal.remove();
  const actions=document.querySelector('#adminApp .adminTopActions');
  if(actions&&!$('pnAuthV5Btn')){
    const b=document.createElement('button');b.id='pnAuthV5Btn';b.className='pnAuthV5Btn';b.type='button';b.textContent='🔑 GANTI PASSWORD';b.onclick=openModal;
    const logout=actions.querySelector('.logout');actions.insertBefore(b,logout||null);
  }
  if(!$('pnAuthV5Modal'))document.body.insertAdjacentHTML('beforeend',modalHtml());
  const m=$('pnAuthV5Modal');if(m&&!m.dataset.bound){m.dataset.bound='1';$('pnAuthV5Close').onclick=closeModal;m.addEventListener('click',e=>{if(e.target===m)closeModal()});$('pnAuthV5Form').onsubmit=changePassword}
}

document.addEventListener('DOMContentLoaded',()=>{install();setInterval(install,1800)});
})();
