(()=>{
'use strict';
const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function jsonp(action,payload={},timeout=9000){
  return new Promise((resolve,reject)=>{
    const cb='pnRecoveryForce_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
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

async function postReliable(action,payload={},timeout=35000){
  const rid='recoverforce-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnRecoveryForceFrame_'+rid.replace(/\W/g,'');frame.style.display='none';frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  document.body.append(frame,form);form.submit();form.remove();
  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(600);
      try{
        const r=await jsonp('contentResult',{rid},5500);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Permintaan ditolak server.');
      }catch(e){lastErr=e}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server admin tidak merespons.');
}

async function recoveryAvailable(){
  try{
    const r=await jsonp('contentPublicList',{},9000);
    return !!(r&&r.ok&&String(r.adminPasswordVersion||'')==='4'&&r.adminPasswordRecoveryAvailable===true);
  }catch(_){return false}
}

function setMsg(type,text){
  const el=$('pnAuthV4Msg');if(!el)return;
  el.className='pnAuthV4Msg show '+(type||'');el.textContent=text||'';
}

function install(){
  const form=$('pnAuthV4Form');
  if(!form||form.dataset.recoveryForce==='1')return;
  form.dataset.recoveryForce='1';
  const original=form.onsubmit;
  form.onsubmit=async function(ev){
    const useRecovery=await recoveryAvailable();
    if(!useRecovery){
      if(typeof original==='function')return original.call(form,ev);
      return true;
    }

    ev.preventDefault();
    const cur=$('pnAuthV4Current')?.value||'';
    const next=$('pnAuthV4New')?.value||'';
    const conf=$('pnAuthV4Confirm')?.value||'';
    const btn=$('pnAuthV4Save');
    if(next.length<8){setMsg('err','Password baru minimal 8 karakter.');return false}
    if(next!==conf){setMsg('err','Ulangi password baru belum sama.');return false}
    if(cur===next){setMsg('err','Password baru harus berbeda dari password saat ini.');return false}

    if(btn){btn.disabled=true;btn.textContent='MENYIMPAN...'}
    setMsg('','Memverifikasi password lama di server dan menyimpan password baru...');
    try{
      const r=await postReliable('adminPasswordRecover',{username:'admin',currentPassword:cur,newPassword:next});
      if(!r?.ok)throw new Error(r?.message||'Password belum berhasil diubah.');
      sessionStorage.removeItem('pnReviewAdminToken');
      sessionStorage.removeItem('pnAdminAuth');
      sessionStorage.removeItem('pnAdminAuthModeV4');
      localStorage.setItem('pnAdminServerLockedV4','1');
      setMsg('ok','✓ Password admin berhasil diubah. Login kembali menggunakan password baru.');
      if(btn){btn.disabled=true;btn.textContent='BERHASIL ✓'}
      setTimeout(()=>{
        const modal=$('pnAuthV4Modal');if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true')}
        if(typeof window.showPublicDashboard==='function')window.showPublicDashboard();
        if(typeof window.openAdminLogin==='function')window.openAdminLogin();
      },1400);
    }catch(err){
      setMsg('err',err?.message||'Gagal mengganti password admin. Password lama tetap berlaku.');
      if(btn){btn.disabled=false;btn.textContent='SIMPAN PASSWORD BARU'}
    }
    return false;
  };
}

document.addEventListener('DOMContentLoaded',()=>{setTimeout(install,0);setInterval(install,1500)});
})();
