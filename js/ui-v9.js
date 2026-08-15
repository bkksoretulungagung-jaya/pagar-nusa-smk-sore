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

document.addEventListener('DOMContentLoaded',()=>{
  const adminUser=document.getElementById('adminUser');
  if(adminUser){
    adminUser.value='';
    adminUser.removeAttribute('value');
    adminUser.setAttribute('autocomplete','off');
  }
  const adminPass=document.getElementById('adminPass');
  if(adminPass)adminPass.value='';

  // Minta penyimpanan persisten agar database Excel yang sudah dipilih
  // tetap tersimpan di browser dan tidak perlu di-upload setiap membuka web.
  if(navigator.storage?.persist){
    navigator.storage.persist().then(granted=>{
      document.documentElement.dataset.pnPersistentStorage=granted?'true':'false';
    }).catch(()=>{});
  }

  // Pakai foto JPEG terbaru yang diunggah pengguna, bukan SVG galeri lama.
  // Nomor versi mencegah browser terus menampilkan foto dari cache lama.
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

  // Bersihkan elemen duplikat dari versi lama yang pernah dibuat lewat JavaScript.
  document.querySelectorAll('#pnWelcomeWrap,.pnWelcomeWrap,#pnEkskulInfo,.pnEkskulInfo').forEach(el=>el.remove());

  // Tambahkan pintu masuk Portal Siswa CBT tanpa mengubah login admin.
  const loginArea=document.getElementById('bottomAdminLogin');
  if(loginArea && !document.getElementById('studentCbtLoginBtn')){
    const style=document.createElement('style');
    style.textContent='.bottomAdminLogin{gap:10px;flex-wrap:wrap}.studentCbtLoginBtn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#166534;border:0;border-radius:10px;padding:12px 24px;color:#fff;font-weight:900;box-shadow:0 4px 14px rgba(22,101,52,.18)}.studentCbtLoginBtn:hover{filter:brightness(1.05)}';
    document.head.appendChild(style);
    const link=document.createElement('a');
    link.id='studentCbtLoginBtn';
    link.className='studentCbtLoginBtn';
    link.href='siswa.html';
    link.textContent='🎓 LOGIN SISWA / CBT';
    loginArea.insertBefore(link,loginArea.firstChild);
  }

  // Samakan tipografi tombol LOGIN SISWA / CBT dengan LOGIN ADMIN.
  const studentBtn=document.getElementById('studentCbtLoginBtn');
  const adminBtn=document.getElementById('topLoginBtn');
  if(studentBtn && adminBtn){
    const adminStyle=getComputedStyle(adminBtn);
    studentBtn.style.fontSize=adminStyle.fontSize;
    studentBtn.style.fontFamily=adminStyle.fontFamily;
    studentBtn.style.lineHeight=adminStyle.lineHeight;
    studentBtn.style.letterSpacing=adminStyle.letterSpacing;
  }
});

// Build marker v32: permanent Google Sheets registration backend.
