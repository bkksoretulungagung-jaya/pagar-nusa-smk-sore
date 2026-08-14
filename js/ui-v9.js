document.write('<script src="js/ui-v9-core.js?v=14"><\/script>');

document.addEventListener('DOMContentLoaded',()=>{
  const adminUser=document.getElementById('adminUser');
  if(adminUser){adminUser.value='';adminUser.removeAttribute('value');adminUser.setAttribute('autocomplete','off')}
  const adminPass=document.getElementById('adminPass');
  if(adminPass)adminPass.value='';
});
