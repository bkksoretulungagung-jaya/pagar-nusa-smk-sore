document.write('<script src="js/ui-v9-core.js?v=15"><\/script>');

document.addEventListener('DOMContentLoaded',()=>{
  const adminUser=document.getElementById('adminUser');
  if(adminUser){adminUser.value='';adminUser.removeAttribute('value');adminUser.setAttribute('autocomplete','off')}
  const adminPass=document.getElementById('adminPass');
  if(adminPass)adminPass.value='';

  if(!document.getElementById('pnWelcomeStyle')){
    const style=document.createElement('style');
    style.id='pnWelcomeStyle';
    style.textContent=`
      .pnWelcomeWrap{max-width:1380px;margin:14px auto 0;padding:0 14px}
      .pnWelcomeTicker{overflow:hidden;background:linear-gradient(90deg,#14532d,#166534,#14532d);border:1px solid #15803d;border-radius:11px;box-shadow:0 3px 12px rgba(20,83,45,.14);height:42px;display:flex;align-items:center}
      .pnWelcomeTrack{display:inline-block;white-space:nowrap;padding-left:100%;font-size:14px;font-weight:900;letter-spacing:.25px;color:#fff;animation:pnWelcomeMove 17s linear infinite;will-change:transform}
      @keyframes pnWelcomeMove{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
      .pnEkskulInfo{margin:0 0 14px;padding:15px 16px;border-radius:12px;border:1px solid #bbf7d0;background:linear-gradient(135deg,#f0fdf4,#f8fafc);box-shadow:0 2px 10px rgba(20,83,45,.07)}
      .pnEkskulInfo h3{margin:0 0 7px;color:#14532d;font-size:15px;line-height:1.35;letter-spacing:.2px}
      .pnEkskulInfo p{margin:0!important;max-width:none!important;color:#475569!important;font-size:12.5px!important;line-height:1.7!important;opacity:1!important}
      @media(max-width:680px){
        .pnWelcomeWrap{margin-top:10px;padding:0 10px}
        .pnWelcomeTicker{height:38px;border-radius:9px}
        .pnWelcomeTrack{font-size:12px;animation-duration:14s}
        .pnEkskulInfo{padding:13px 14px}
        .pnEkskulInfo h3{font-size:14px}
        .pnEkskulInfo p{font-size:11.5px!important;line-height:1.65!important}
      }
      @media(prefers-reduced-motion:reduce){.pnWelcomeTrack{animation:none;padding-left:0;margin:auto}}
    `;
    document.head.appendChild(style);
  }

  if(!document.getElementById('pnWelcomeWrap')){
    const top=document.querySelector('.top');
    const welcome=document.createElement('div');
    welcome.id='pnWelcomeWrap';
    welcome.className='pnWelcomeWrap';
    welcome.innerHTML='<div class="pnWelcomeTicker" role="region" aria-label="Selamat datang"><div class="pnWelcomeTrack">Selamat Datang di Database Pagar Nusa Rayon SMK SORE Tulungagung.</div></div>';
    if(top)top.insertAdjacentElement('afterend',welcome);
  }

  if(!document.getElementById('pnEkskulInfo')){
    const dashHead=document.querySelector('.dashboardHeroHead');
    const info=document.createElement('section');
    info.id='pnEkskulInfo';
    info.className='pnEkskulInfo';
    info.innerHTML='<h3>TENTANG EKSTRAKURIKULER PENCAK SILAT PAGAR NUSA</h3><p>Ekstrakurikuler Pencak Silat Pagar Nusa Rayon SMK SORE Tulungagung merupakan wadah pembinaan siswa untuk mengembangkan keterampilan pencak silat, kedisiplinan, mental, fisik, spiritual, persaudaraan, dan rasa tanggung jawab. Kegiatan ini juga menanamkan nilai Ahlussunnah wal Jamaah, sportivitas, cinta tanah air, serta semangat melestarikan pencak silat sebagai budaya bangsa.</p>';
    if(dashHead)dashHead.insertAdjacentElement('afterend',info);
  }
});

// Build marker v15: welcome ticker + extracurricular information card.
