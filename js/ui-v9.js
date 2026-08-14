document.write('<script src="js/ui-v9-core.js?v=12"><\/script>');

function applyPagarNusaUiV12(){
  const logos=document.querySelectorAll('.topLogos img');
  if(logos[0]) logos[0].src='assets/logo-smk-sore-v4.svg?v=12';
  if(logos[1]) logos[1].src='assets/logo-pagar-nusa-v3.svg?v=12';

  let style=document.getElementById('pnUiV12Style');
  if(!style){
    style=document.createElement('style');
    style.id='pnUiV12Style';
    style.textContent=`
      .topBar{grid-template-columns:auto 1fr!important;align-items:center!important}
      .topAction{display:none!important}
      .topLogos{display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;overflow:visible!important}
      .topLogos img{width:92px!important;height:92px!important;min-width:92px!important;min-height:92px!important;max-width:92px!important;max-height:92px!important;object-fit:contain!important;object-position:center!important;padding:6px!important;box-sizing:border-box!important;background:#ffffff!important;border:1px solid #ffffff!important;border-radius:14px!important;box-shadow:0 3px 10px rgba(0,0,0,.18)!important}
      .frontActions{display:none!important}
      .dashboardHeroHead h2{font-size:18px!important;line-height:1.45!important;max-width:980px!important}
      .dashboardHeroHead p{display:none!important}
      .bottomAdminLogin{display:flex;justify-content:center;align-items:center;margin:18px 0 4px;padding:18px 14px;border-top:1px solid #d7e4dc}
      .bottomAdminLogin .adminLoginBtn{background:#14532d!important;border:0!important;border-radius:10px!important;padding:12px 24px!important;color:#fff!important;font-weight:900!important;box-shadow:0 4px 14px rgba(20,83,45,.18)!important}
      .bottomAdminLogin .adminLoginBtn:hover{background:#166534!important}
      @media(max-width:680px){
        .topLogos img{width:76px!important;height:76px!important;min-width:76px!important;min-height:76px!important;max-width:76px!important;max-height:76px!important;padding:5px!important}
        .topBar{display:flex!important;flex-wrap:wrap!important}
        .dashboardHeroHead h2{font-size:15px!important;line-height:1.5!important}
      }
    `;
    document.head.appendChild(style);
  }

  const title=document.querySelector('.topText h1');
  if(title) title.textContent='PAGAR NUSA RAYON SMK SORE TULUNGAGUNG';

  const dashTitle=document.querySelector('.dashboardHeroHead h2');
  if(dashTitle) dashTitle.textContent='Rayon SMK Sore Tulungagung Memuat semangat juang, kekeluargaan, serta komitmen dalam menjaga ajaran Ahlussunnah wal Jamaah dan melestarikan budaya bangsa';

  const dashSub=document.querySelector('.dashboardHeroHead p');
  if(dashSub) dashSub.remove();

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

document.addEventListener('DOMContentLoaded',applyPagarNusaUiV12);
