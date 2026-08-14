document.write('<script src="js/ui-v9-core.js?v=11"><\/script>');

function applyPagarNusaUiV11(){
  const logos=document.querySelectorAll('.topLogos img');
  if(logos[0]) logos[0].src='assets/logo-smk-sore-v4.svg?v=11';
  if(logos[1]) logos[1].src='assets/logo-pagar-nusa-v3.svg?v=11';

  let style=document.getElementById('pnUiV11Style');
  if(!style){
    style=document.createElement('style');
    style.id='pnUiV11Style';
    style.textContent=`
      .topBar{grid-template-columns:auto 1fr!important;align-items:center!important}
      .topAction{display:none!important}
      .topLogos{display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;overflow:visible!important}
      .topLogos img{width:88px!important;height:88px!important;max-width:88px!important;max-height:88px!important;object-fit:contain!important;object-position:center!important;padding:4px!important;box-sizing:border-box!important;background:rgba(255,255,255,.10)!important;border-radius:13px!important}
      .frontActions{display:none!important}
      .bottomAdminLogin{display:flex;justify-content:center;align-items:center;margin:18px 0 4px;padding:18px 14px;border-top:1px solid #d7e4dc}
      .bottomAdminLogin .adminLoginBtn{background:#14532d!important;border:0!important;border-radius:10px!important;padding:12px 24px!important;color:#fff!important;font-weight:900!important;box-shadow:0 4px 14px rgba(20,83,45,.18)!important}
      .bottomAdminLogin .adminLoginBtn:hover{background:#166534!important}
      @media(max-width:680px){
        .topLogos img{width:72px!important;height:72px!important;max-width:72px!important;max-height:72px!important}
        .topBar{display:flex!important;flex-wrap:wrap!important}
      }
    `;
    document.head.appendChild(style);
  }

  const title=document.querySelector('.topText h1');
  if(title) title.textContent='PAGAR NUSA RAYON SMK SORE TULUNGAGUNG';

  const dashSub=document.querySelector('.dashboardHeroHead p');
  if(dashSub) dashSub.textContent='Memuat semangat juang, kekeluargaan, serta komitmen dalam menjaga ajaran Ahlussunnah wal Jamaah dan melestarikan budaya bangsa';

  const frontActions=document.querySelector('.frontActions');
  if(frontActions) frontActions.remove();

  const topAction=document.querySelector('.topAction');
  if(topAction) topAction.style.display='none';

  const publicHome=document.getElementById('publicHome');
  const loginBtn=document.getElementById('topLoginBtn');
  if(publicHome&&loginBtn){
    let bottom=document.getElementById('bottomAdminLogin');
    if(!bottom){
      bottom=document.createElement('div');
      bottom.id='bottomAdminLogin';
      bottom.className='bottomAdminLogin';
      publicHome.appendChild(bottom);
    }
    loginBtn.textContent='🔐 LOGIN ADMIN';
    bottom.appendChild(loginBtn);
  }

  const adminUser=document.getElementById('adminUser');
  if(adminUser){adminUser.value='';adminUser.removeAttribute('value');adminUser.setAttribute('autocomplete','off')}
}

document.addEventListener('DOMContentLoaded',applyPagarNusaUiV11);
