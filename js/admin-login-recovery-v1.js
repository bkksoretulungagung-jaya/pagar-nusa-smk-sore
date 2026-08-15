(()=>{
'use strict';
const LEGACY_ADMIN_USER='admin';
const LEGACY_ADMIN_PASS_HASH='3b396371ec891e73db1ecb5f70d341c4fe6cc6f52fdea96d55dc3fe786d3a639';

async function legacySha256(text){
  const data=new TextEncoder().encode(String(text||''));
  const buf=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

window.submitAdminLogin=async function(ev){
  if(ev)ev.preventDefault();
  const u=document.getElementById('adminUser')?.value.trim()||'';
  const p=document.getElementById('adminPass')?.value||'';
  const err=document.getElementById('loginError');
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false;}
  if(err)err.textContent='Memeriksa login admin...';
  try{
    const hash=await legacySha256(p);
    if(u===LEGACY_ADMIN_USER&&hash===LEGACY_ADMIN_PASS_HASH){
      sessionStorage.setItem('pnAdminAuth','1');
      if(typeof window.closeAdminLogin==='function')window.closeAdminLogin();
      if(typeof window.enterAdmin==='function')window.enterAdmin(true);
      return false;
    }
    if(err)err.textContent='Username atau password admin salah.';
  }catch(_){
    if(err)err.textContent='Login admin gagal diproses. Muat ulang halaman lalu coba lagi.';
  }
  return false;
};

function recoveryUi(){
  if(!document.getElementById('pnAdminRecoveryStyle')){
    const s=document.createElement('style');
    s.id='pnAdminRecoveryStyle';
    s.textContent='#pnAdminPasswordBtn{display:none!important}';
    document.head.appendChild(s);
  }
}
document.addEventListener('DOMContentLoaded',recoveryUi);
recoveryUi();
// Recovery publish marker 2026-08-15
})();
