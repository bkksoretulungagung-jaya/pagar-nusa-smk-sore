(()=>{
  const old=document.getElementById('pnMobileCss');
  if(old)old.remove();
  const link=document.createElement('link');
  link.id='pnMobileCss';
  link.rel='stylesheet';
  link.href='mobile-v24.css?v=25';
  document.head.appendChild(link);
})();

document.write('<script src="js/ui-v9-core.js?v=34"><\/script>');
document.write('<script src="js/registration-v2.js?v=4"><\/script>');
document.write('<script src="js/registration-transport-v1.js?v=5"><\/script>');

const PN_FOOTER_FALLBACK='Copyright © 2026 Pagar Nusa Rayon SMK SORE Tulungagung';
function pnApplyFooter(items){
  const footer=document.querySelector('.footer');
  if(!footer)return;
  const list=Array.isArray(items)?items:[];
  const setting=list.find(item=>String(item?.id||'')==='CFG-FOOTER');
  const value=String(setting?.body||setting?.summary||PN_FOOTER_FALLBACK).trim();
  footer.textContent=value||PN_FOOTER_FALLBACK;
}
window.addEventListener('pn:cms-public-data',event=>pnApplyFooter(event?.detail?.content));

document.addEventListener('DOMContentLoaded',()=>{
  const adminUser=document.getElementById('adminUser');
  if(adminUser){
    adminUser.value='';
    adminUser.removeAttribute('value');
    adminUser.setAttribute('autocomplete','off');
  }
  const adminPass=document.getElementById('adminPass');
  if(adminPass)adminPass.value='';

  // Footer memakai CFG-FOOTER dari database Konten Website.
  // Jika data belum selesai dimuat, tampilkan teks lengkap sebagai fallback.
  pnApplyFooter(window.__pnCmsPublicData?.content);

  // Jangan tampilkan username admin secara otomatis saat modal login dibuka.
  window.openAdminLogin=function(){
    const modal=document.getElementById('loginModal');
    modal?.classList.remove('hidden');
    modal?.setAttribute('aria-hidden','false');
    const u=document.getElementById('adminUser');
    const p=document.getElementById('adminPass');
    const e=document.getElementById('loginError');
    if(e)e.textContent='';
    if(u){
      u.value='';
      u.removeAttribute('value');
      u.setAttribute('autocomplete','off');
    }
    if(p)p.value='';
    setTimeout(()=>u?.focus(),60);
  };

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
    document.getElementById('studentBioLoginBtn')?.remove();

    if(!document.getElementById('pnStudentPortalStyles')){
      const style=document.createElement('style');
      style.id='pnStudentPortalStyles';
      style.textContent=`
        .bottomAdminLogin{gap:10px;flex-wrap:wrap}
        .studentCbtLoginBtn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#166534;border:0;border-radius:10px;padding:12px 24px;color:#fff;font-weight:900;box-shadow:0 4px 14px rgba(22,101,52,.18)}
        .studentCbtLoginBtn:hover{filter:brightness(1.05)}
        #bottomAdminLogin #topLoginBtn{display:none!important}
        @media(max-width:680px){
          .bottomAdminLogin{display:grid!important;grid-template-columns:1fr!important;gap:9px!important;width:100%!important}
          .bottomAdminLogin #pnRegistrationBtn,.bottomAdminLogin #studentCbtLoginBtn{grid-column:1/-1!important;width:100%!important}
        }
      `;
      document.head.appendChild(style);
    }

    if(!document.getElementById('studentCbtLoginBtn')){
      const cbt=document.createElement('a');
      cbt.id='studentCbtLoginBtn';
      cbt.className='studentCbtLoginBtn';
      cbt.href='siswa.html?v=3';
      cbt.textContent='📝 PORTAL CBT ONLINE';
      loginArea.insertBefore(cbt,loginArea.firstChild);
    }else{
      const cbt=document.getElementById('studentCbtLoginBtn');
      cbt.href='siswa.html?v=3';
      cbt.textContent='📝 PORTAL CBT ONLINE';
    }
  }

  const adminBtn=document.getElementById('topLoginBtn');
  const cbtBtn=document.getElementById('studentCbtLoginBtn');
  if(cbtBtn&&adminBtn){
    const adminStyle=getComputedStyle(adminBtn);
    cbtBtn.style.fontFamily=adminStyle.fontFamily;
    cbtBtn.style.letterSpacing=adminStyle.letterSpacing;
    if(window.innerWidth>680){
      cbtBtn.style.fontSize=adminStyle.fontSize;
      cbtBtn.style.lineHeight=adminStyle.lineHeight;
    }
  }
});

// Build marker v46: Footer reads CFG-FOOTER from database.
