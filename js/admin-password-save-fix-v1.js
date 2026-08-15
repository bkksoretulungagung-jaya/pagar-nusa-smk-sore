(()=>{
'use strict';
const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const CONFIG_KEY='pnAdminPasswordConfiguredV3';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);

function jsonp(action,payload={},timeout=7000){
  return new Promise((resolve,reject)=>{
    const cb='pnPassSaveFix_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
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

async function postReliable(action,payload={},timeout=30000){
  const rid='passfix-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnPassFixFrame_'+rid.replace(/\W/g,'');frame.style.display='none';frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  document.body.append(frame,form);form.submit();form.remove();
  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(550);
      try{
        const r=await jsonp('contentResult',{rid},5000);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Permintaan admin ditolak server.');
      }catch(e){lastErr=e}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server admin tidak merespons.');
}

function randomToken(){
  try{const a=new Uint8Array(32);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('')}
  catch(_){return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(48,'x')}
}

async function freshLogin(password){
  const requested=randomToken();
  const r=await postReliable('contentAdminLogin',{username:'admin',password,token:requested},26000);
  const token=String(r?.token||requested||'');
  if(!token)throw new Error('Token admin tidak diterima server.');
  sessionStorage.setItem(TOKEN_KEY,token);
  return token;
}

function status(type,text){
  const el=$('pnAdminPassSafeStatus');if(!el)return;
  el.className='pnAdminPassSafeStatus show '+(type||'');el.textContent=text||'';
}
function sessionError(err){
  const m=String(err?.message||err||'').toLowerCase();
  return m.includes('sesi verifikasi')||m.includes('sesi admin')||m.includes('sudah berakhir')||m.includes('dinonaktifkan');
}

async function handleSubmit(e){
  const form=e.target;
  if(!form||form.id!=='pnAdminPassSafeForm')return;
  e.preventDefault();e.stopImmediatePropagation();

  const cur=$('pnAdminPassSafeCurrent')?.value||'';
  const next=$('pnAdminPassSafeNew')?.value||'';
  const conf=$('pnAdminPassSafeConfirm')?.value||'';
  const btn=$('pnAdminPassSafeSave');
  if(next.length<8){status('err','Password baru minimal 8 karakter.');return}
  if(next!==conf){status('err','Ulangi password baru belum sama.');return}
  if(cur===next){status('err','Password baru harus berbeda dari password saat ini.');return}

  if(btn){btn.disabled=true;btn.textContent='MENYIMPAN...'}
  try{
    let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim();
    let result=null;
    if(token){
      status('','Menyimpan password baru menggunakan sesi admin aktif...');
      try{
        result=await postReliable('adminChangePassword',{token,currentPassword:cur,newPassword:next},26000);
      }catch(err){
        if(!sessionError(err))throw err;
        token='';
      }
    }
    if(!token&&!result){
      status('','Sesi admin perlu diperbarui. Memverifikasi password saat ini...');
      token=await freshLogin(cur);
      status('','Verifikasi berhasil. Menyimpan password baru...');
      result=await postReliable('adminChangePassword',{token,currentPassword:cur,newPassword:next},26000);
    }
    if(!result?.ok)throw new Error(result?.message||'Password belum berhasil diubah.');
    localStorage.setItem(CONFIG_KEY,'1');
    sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(AUTH_KEY);
    status('ok','✓ Password admin berhasil diubah. Silakan login kembali menggunakan password baru.');
    if(btn){btn.disabled=true;btn.textContent='BERHASIL ✓'}
    setTimeout(()=>{
      const modal=$('pnAdminPassSafeModal');if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true')}
      if(typeof window.showPublicDashboard==='function')window.showPublicDashboard();
      if(typeof window.openAdminLogin==='function')window.openAdminLogin();
    },1600);
  }catch(err){
    status('err',err?.message||'Gagal mengganti password admin. Password sebelumnya tetap berlaku.');
    if(btn){btn.disabled=false;btn.textContent='SIMPAN PASSWORD BARU'}
  }
}

document.addEventListener('submit',handleSubmit,true);
})();
