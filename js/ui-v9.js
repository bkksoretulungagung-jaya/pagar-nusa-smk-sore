document.write('<script src="js/ui-v9-core.js?v=17"><\/script>');

document.addEventListener('DOMContentLoaded',()=>{
  const adminUser=document.getElementById('adminUser');
  if(adminUser){
    adminUser.value='';
    adminUser.removeAttribute('value');
    adminUser.setAttribute('autocomplete','off');
  }
  const adminPass=document.getElementById('adminPass');
  if(adminPass)adminPass.value='';

  // Bersihkan elemen duplikat dari versi lama yang pernah dibuat lewat JavaScript.
  document.querySelectorAll('#pnWelcomeWrap,.pnWelcomeWrap,#pnEkskulInfo,.pnEkskulInfo').forEach(el=>el.remove());
});

// Build marker v17: only the canonical ticker and extracurricular card in index.html remain.
