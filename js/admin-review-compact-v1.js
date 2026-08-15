(()=>{
'use strict';

const $=id=>document.getElementById(id);
let observerStarted=false;

function ensureStyles(){
  if($('pnAdminReviewCompactStyle'))return;
  const s=document.createElement('style');
  s.id='pnAdminReviewCompactStyle';
  s.textContent=`
    #pnReviewAdminPanel.pnAdminReviewCompact{overflow:hidden}
    #pnReviewAdminPanel.pnAdminReviewClosed>.pnReviewProBody{display:none!important}
    #pnReviewAdminPanel .pnReviewProHead{cursor:default}
    .pnAdminReviewToggle{margin-left:auto;border:1px solid rgba(255,255,255,.35);border-radius:8px;padding:7px 10px;background:rgba(255,255,255,.13);color:#fff;font:inherit;font-size:9px;font-weight:1000;cursor:pointer;white-space:nowrap}
    .pnAdminReviewToggle:hover{background:rgba(255,255,255,.22)}
    .pnAdminReviewToggle .arr{display:inline-block;margin-left:5px;transition:transform .18s ease}
    #pnReviewAdminPanel:not(.pnAdminReviewClosed) .pnAdminReviewToggle .arr{transform:rotate(180deg)}
    @media(max-width:760px){
      #pnReviewAdminPanel .pnReviewProHead{position:relative;padding-bottom:54px!important}
      .pnAdminReviewToggle{position:absolute;left:16px;right:16px;bottom:12px;width:calc(100% - 32px);margin:0}
    }
  `;
  document.head.appendChild(s);
}

function updateButton(panel){
  const btn=panel?.querySelector('.pnAdminReviewToggle');
  if(!btn)return;
  const closed=panel.classList.contains('pnAdminReviewClosed');
  btn.setAttribute('aria-expanded',closed?'false':'true');
  btn.innerHTML=(closed?'BUKA MODERASI':'TUTUP MODERASI')+' <span class="arr">⌄</span>';
}

function closeOtherAdminSections(panel){
  document.querySelectorAll('#adminApp .layout main>.card.pnAdminAutoCard').forEach(card=>{
    card.classList.add('pnAdminCardClosed');
    const btn=card.querySelector(':scope>.cardTitle .pnAdminCardToggle');
    if(btn){
      btn.setAttribute('aria-expanded','false');
      btn.innerHTML='BUKA <span class="arr">⌄</span>';
    }
  });
  document.querySelectorAll('#adminApp .pnAdminFeatureCompact.open').forEach(x=>x.classList.remove('open'));
  const cms=$('pnContentAdminPanel');
  if(cms)cms.dataset.pnWorkOpen='none';
}

function setOpen(panel,open){
  if(!panel)return;
  if(open)closeOtherAdminSections(panel);
  panel.classList.toggle('pnAdminReviewClosed',!open);
  updateButton(panel);
}

function install(){
  ensureStyles();
  const panel=$('pnReviewAdminPanel');
  if(!panel)return false;
  const head=panel.querySelector(':scope>.pnReviewProHead');
  const body=panel.querySelector(':scope>.pnReviewProBody');
  if(!head||!body)return false;

  panel.classList.add('pnAdminReviewCompact');
  if(!panel.dataset.pnAdminReviewCompactInit){
    panel.dataset.pnAdminReviewCompactInit='1';
    panel.classList.add('pnAdminReviewClosed');
  }

  let btn=head.querySelector('.pnAdminReviewToggle');
  if(!btn){
    btn=document.createElement('button');
    btn.type='button';
    btn.className='pnAdminReviewToggle';
    btn.setAttribute('aria-label','Buka atau tutup moderasi ulasan website');
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      setOpen(panel,panel.classList.contains('pnAdminReviewClosed'));
    });
    head.appendChild(btn);
  }
  updateButton(panel);
  return true;
}

function startObserver(){
  if(observerStarted)return;
  const app=$('adminApp');
  if(!app)return;
  observerStarted=true;
  let timer=0;
  new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(install,60);
  }).observe(app,{subtree:true,childList:true});
}

document.addEventListener('click',e=>{
  if(e.target?.closest('.pnAdminCardToggle,#nav button,#nav a,#nav [onclick],#pnAdminWorkContent,#pnAdminWorkGallery')){
    const panel=$('pnReviewAdminPanel');
    if(panel)setOpen(panel,false);
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  install();startObserver();
  setInterval(()=>{install();startObserver()},1200);
});
})();
