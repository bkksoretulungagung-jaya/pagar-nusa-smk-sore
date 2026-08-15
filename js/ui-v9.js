(()=>{
  const old=document.getElementById('pnMobileCss');
  if(old)old.remove();
  const link=document.createElement('link');
  link.id='pnMobileCss';
  link.rel='stylesheet';
  link.href='mobile-v23.css?v=23';
  document.head.appendChild(link);
})();

document.write('<script src="js/ui-v9-core.js?v=25"><\/script>');
document.write('<script src="js/registration-v2.js?v=4"><\/script>');
document.write('<script src="js/registration-transport-v1.js?v=5"><\/script>');

document.addEventListener('DOMContentLoaded',()=>{
  const adminUser=document.getElementById('adminUser');
  if(adminUser){
    adminUser.value='';
    adminUser.removeAttribute('value');
    adminUser.setAttribute('autocomplete','off');
  }
  const adminPass=document.getElementById('adminPass');
  if(adminPass)adminPass.value='';

  if(navigator.storage?.persist){
    navigator.storage.persist().then(granted=>{
      document.documentElement.dataset.pnPersistentStorage=granted?'true':'false';
    }).catch(()=>{});
  }

  const galleryThumbs=[
    'assets/galeri-6.svg.jpeg?v=21',
    'assets/galeri-3.svg.jpeg?v=21',
    'assets/galeri-4.svg.jpeg?v=21',
    'assets/galeri-1.svg.jpeg?v=21',
    'assets/galeri-2.svg.jpeg?v=21'
  ];
  document.querySelectorAll('#gallerySection .galleryItem img').forEach((img,i)=>{
    if(galleryThumbs[i]){
      img.src=galleryThumbs[i];
      img.decoding='async';
    }
  });

  document.querySelectorAll('#pnWelcomeWrap,.pnWelcomeWrap,#pnEkskulInfo,.pnEkskulInfo').forEach(el=>el.remove());

  const loginArea=document.getElementById('bottomAdminLogin');
  if(loginArea){
    if(!document.getElementById('pnStudentPortalStyles')){
      const style=document.createElement('style');
      style.id='pnStudentPortalStyles';
      style.textContent='.bottomAdminLogin{gap:10px;flex-wrap:wrap}.studentCbtLoginBtn,.studentBioLoginBtn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border:0;border-radius:10px;padding:12px 24px;color:#fff;font-weight:900;box-shadow:0 4px 14px rgba(22,101,52,.18)}.studentCbtLoginBtn{background:#166534}.studentBioLoginBtn{background:#0f766e}.studentCbtLoginBtn:hover,.studentBioLoginBtn:hover{filter:brightness(1.05)}';
      document.head.appendChild(style);
    }
    if(!document.getElementById('studentBioLoginBtn')){
      const bio=document.createElement('a');
      bio.id='studentBioLoginBtn';
      bio.className='studentBioLoginBtn';
      bio.href='biodata.html?v=2';
      bio.textContent='👤 PORTAL BIODATA SISWA';
      loginArea.insertBefore(bio,loginArea.firstChild);
    }
    if(!document.getElementById('studentCbtLoginBtn')){
      const cbt=document.createElement('a');
      cbt.id='studentCbtLoginBtn';
      cbt.className='studentCbtLoginBtn';
      cbt.href='siswa.html?v=3';
      cbt.textContent='📝 PORTAL CBT ONLINE';
      loginArea.insertBefore(cbt,document.getElementById('studentBioLoginBtn')?.nextSibling||loginArea.firstChild);
    }else{
      const cbt=document.getElementById('studentCbtLoginBtn');
      cbt.href='siswa.html?v=3';
      cbt.textContent='📝 PORTAL CBT ONLINE';
    }
  }

  const adminBtn=document.getElementById('topLoginBtn');
  ['studentBioLoginBtn','studentCbtLoginBtn'].forEach(id=>{
    const btn=document.getElementById(id);
    if(btn && adminBtn){
      const adminStyle=getComputedStyle(adminBtn);
      btn.style.fontSize=adminStyle.fontSize;
      btn.style.fontFamily=adminStyle.fontFamily;
      btn.style.lineHeight=adminStyle.lineHeight;
      btn.style.letterSpacing=adminStyle.letterSpacing;
    }
  });
});

// Build marker v40: separate Biodata and CBT portals.
