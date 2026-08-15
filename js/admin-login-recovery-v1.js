(()=>{
'use strict';
// Dinonaktifkan: autentikasi admin wajib diverifikasi server.
function hideLegacyRecovery(){
  const b=document.getElementById('pnAdminPasswordBtn');
  if(b)b.style.display='none';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideLegacyRecovery);else hideLegacyRecovery();
})();
