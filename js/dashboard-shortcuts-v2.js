(()=>{
'use strict';

const ITEMS=[
  {id:'dashStatusMember',icon:'👥',label:'Status Keanggotaan'},
  {id:'dashBelt',icon:'🥋',label:'Tingkat / Sabuk'},
  {id:'dashClass',icon:'🏫',label:'Kelas'},
  {id:'dashPengurus',icon:'🛡️',label:'Status Pengurus'},
  {id:'dashAlumniActivity',icon:'🎓',label:'Aktivitas Alumni'},
  {id:'registrationShortcut',icon:'📝',label:'PENDAFTARAN CALON ANGGOTA',action:'registration'},
  {id:'studentBioShortcut',icon:'👤',label:'BIODATA ANGGOTA',action:'biodata'},
  {id:'studentCbtShortcut',icon:'📝',label:'CBT ONLINE',action:'cbt'},
  {id:'pengurusGuideShortcut',icon:'📚',label:'PEDOMAN PENGURUS',action:'pengurus'}
];

function updatePublicLabels(){
  const ticker=document.querySelector('.welcomeTickerTrack');
  if(ticker)ticker.textContent='SELAMAT DATANG DI WEBSITE RESMI PAGAR NUSA RAYON SMK SORE TULUNGAGUNG';
  const aboutTitle=document.querySelector('.dashboardHeroHead h2');
  if(aboutTitle)aboutTitle.textContent='TENTANG PAGAR NUSA';
  const headerText=document.querySelector('.topText p');
  if(headerText)headerText.textContent='Website resmi Pagar Nusa Rayon SMK SORE Tulungagung hadir sebagai pusat informasi dan dokumentasi digital yang menyajikan profil anggota, data organisasi, kegiatan, prestasi, berita terbaru, galeri, pendaftaran anggota, serta berbagai informasi penting lainnya. Melalui website ini, diharapkan seluruh anggota, alumni, siswa, dan masyarakat dapat mengenal lebih dekat perjalanan, kegiatan, serta perkembangan Pagar Nusa Rayon SMK SORE Tulungagung.';
}

function installStyles(){
  if(document.getElementById('pnDashboardShortcutStyle'))return;
  const style=document.createElement('style');
  style.id='pnDashboardShortcutStyle';
  style.textContent=`
    .pnDashShortcutWrap{max-width:1180px;margin:14px auto 8px;padding:0 2px;box-sizing:border-box}
    .pnDashShortcutHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 2px 8px}
    .pnDashShortcutTitle{display:flex;align-items:center;gap:7px;color:#14532d;font-size:11px;font-weight:1000;letter-spacing:.35px}
    .pnDashShortcutHint{color:#64748b;font-size:9px;font-weight:800}
    .pnDashShortcutBar{display:flex;align-items:stretch;gap:8px;padding:9px;background:#fff;border:1px solid #cfe0d5;border-radius:13px;box-shadow:0 5px 16px rgba(15,61,36,.08);overflow-x:auto;overscroll-behavior-inline:contain;scrollbar-width:thin;scroll-behavior:smooth}
    .pnDashShortcutBtn{flex:1 0 auto;min-width:132px;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1px solid #d8e6dc;border-radius:10px;padding:10px 12px;background:#f7fbf8;color:#14532d;font:inherit;font-size:10px;font-weight:1000;line-height:1.25;white-space:nowrap;cursor:pointer;transition:transform .16s ease,background .16s ease,border-color .16s ease,box-shadow .16s ease}
    .pnDashShortcutBtn:hover,.pnDashShortcutBtn:focus-visible{background:#ecfdf3;border-color:#86c59a;box-shadow:0 4px 10px rgba(20,83,45,.10);transform:translateY(-1px);outline:none}
    .pnDashShortcutBtn.active{background:#14532d;border-color:#14532d;color:#fff;box-shadow:0 4px 11px rgba(20,83,45,.18)}
    .pnDashShortcutBtn.registrationShortcut{background:#166534;border-color:#166534;color:#fff}
    .pnDashShortcutBtn.registrationShortcut:hover,.pnDashShortcutBtn.registrationShortcut:focus-visible{background:#14532d;border-color:#14532d;color:#fff}
    .pnDashShortcutBtn.bioShortcut{background:#0f766e;border-color:#0f766e;color:#fff}
    .pnDashShortcutBtn.bioShortcut:hover,.pnDashShortcutBtn.bioShortcut:focus-visible{background:#0b5f59;border-color:#0b5f59;color:#fff}
    .pnDashShortcutBtn.cbtShortcut{background:#166534;border-color:#166534;color:#fff}
    .pnDashShortcutBtn.cbtShortcut:hover,.pnDashShortcutBtn.cbtShortcut:focus-visible{background:#14532d;border-color:#14532d;color:#fff}
    .pnDashShortcutBtn.pengurusShortcut{background:#14532d;border-color:#14532d;color:#fff}
    .pnDashShortcutBtn.pengurusShortcut:hover,.pnDashShortcutBtn.pengurusShortcut:focus-visible{background:#0f3d24;border-color:#0f3d24;color:#fff}
    .pnDashShortcutBtn.adminShortcut{background:#14532d;border-color:#14532d;color:#fff}
    .pnDashShortcutBtn.adminShortcut:hover,.pnDashShortcutBtn.adminShortcut:focus-visible{background:#0f3d24;border-color:#0f3d24;color:#fff}
    .pnDashShortcutIcon{font-size:14px;line-height:1}
    #bottomAdminLogin #pnRegistrationBtn{display:none!important}
    .dashPanel.pnShortcutFocus{scroll-margin-top:18px;animation:pnShortcutPulse 1.5s ease}
    @keyframes pnShortcutPulse{0%,100%{box-shadow:inherit}20%{box-shadow:0 0 0 4px rgba(22,101,52,.18),0 9px 24px rgba(15,61,36,.14)}}
    @media(max-width:800px){
      .pnDashShortcutWrap{margin:10px 10px 7px;padding:0}
      .pnDashShortcutHead{margin-bottom:6px}
      .pnDashShortcutHint{display:none}
      .pnDashShortcutBar{gap:7px;padding:8px;border-radius:11px}
      .pnDashShortcutBtn{flex:0 0 auto;min-width:auto;padding:9px 11px;font-size:9px}
    }
    @media(prefers-reduced-motion:reduce){.pnDashShortcutBtn{transition:none}.dashPanel.pnShortcutFocus{animation:none}}
  `;
  document.head.appendChild(style);
}

function targetPanel(id){
  const inner=document.getElementById(id);
  return inner?.closest('.dashPanel')||inner||null;
}

function activateButton(id){
  document.querySelectorAll('#pnDashboardShortcuts .pnDashShortcutBtn').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.target===id);
  });
}

function goTo(id){
  const target=targetPanel(id);
  if(!target)return;
  activateButton(id);
  target.classList.remove('pnShortcutFocus');
  void target.offsetWidth;
  target.classList.add('pnShortcutFocus');
  target.scrollIntoView({behavior:'smooth',block:'start'});
  setTimeout(()=>target.classList.remove('pnShortcutFocus'),1700);
}

function pulse(btn){
  if(!btn)return;
  btn.classList.add('active');
  setTimeout(()=>btn.classList.remove('active'),700);
}

function openAdminFromShortcut(btn){
  pulse(btn);
  if(typeof window.openAdminLogin==='function'){
    window.openAdminLogin();
    return;
  }
  const original=document.getElementById('topLoginBtn');
  if(original)original.click();
}

function openRegistrationFromShortcut(btn){
  pulse(btn);
  if(typeof window.pnOpenRegistration==='function'){
    window.pnOpenRegistration();
    return;
  }
  const original=document.getElementById('pnRegistrationBtn');
  if(original)original.click();
}

function openBiodataFromShortcut(btn){
  pulse(btn);
  window.location.href='biodata.html?v=20260816-1553';
}

function openCbtFromShortcut(btn){
  pulse(btn);
  window.location.href='siswa.html';
}

function openPengurusFromShortcut(btn){
  pulse(btn);
  window.location.href='portal-pengurus.html';
}

function install(){
  updatePublicLabels();
  installStyles();
  if(document.getElementById('pnDashboardShortcuts'))return;
  const home=document.getElementById('publicHome');
  const ticker=home?.querySelector('.welcomeTicker');
  if(!home||!ticker)return;

  const available=ITEMS.filter(item=>['admin','biodata','registration','cbt','pengurus'].includes(item.action)||document.getElementById(item.id));
  if(!available.length)return;

  const wrap=document.createElement('nav');
  wrap.id='pnDashboardShortcuts';
  wrap.className='pnDashShortcutWrap';
  wrap.setAttribute('aria-label','MENU PINTASAN');
  wrap.innerHTML=`
    <div class="pnDashShortcutHead">
      <div class="pnDashShortcutTitle"><span>MENU PINTASAN</span></div>
      <div class="pnDashShortcutHint">Klik menu untuk langsung menuju ringkasan data</div>
    </div>
    <div class="pnDashShortcutBar">
      ${available.map(item=>`<button class="pnDashShortcutBtn${item.action==='admin'?' adminShortcut':''}${item.action==='biodata'?' bioShortcut':''}${item.action==='registration'?' registrationShortcut':''}${item.action==='cbt'?' cbtShortcut':''}${item.action==='pengurus'?' pengurusShortcut':''}" type="button" data-target="${item.id}" data-action="${item.action||'scroll'}"><span class="pnDashShortcutIcon" aria-hidden="true">${item.icon}</span><span>${item.label}</span></button>`).join('')}
    </div>`;

  wrap.querySelectorAll('.pnDashShortcutBtn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(btn.dataset.action==='admin')openAdminFromShortcut(btn);
      else if(btn.dataset.action==='registration')openRegistrationFromShortcut(btn);
      else if(btn.dataset.action==='biodata')openBiodataFromShortcut(btn);
      else if(btn.dataset.action==='cbt')openCbtFromShortcut(btn);
      else if(btn.dataset.action==='pengurus')openPengurusFromShortcut(btn);
      else goTo(btn.dataset.target);
    });
  });

  ticker.parentNode.insertBefore(wrap,ticker);
}

document.addEventListener('DOMContentLoaded',install);
setTimeout(install,400);
})();
