(()=>{
'use strict';

const $=id=>document.getElementById(id);
let featureInstalled=false;
let workInstalled=false;
let observerStarted=false;
let watchQueued=false;

function ensureStyles(){
  if($('pnAdminCompactStyle'))return;
  const s=document.createElement('style');
  s.id='pnAdminCompactStyle';
  s.textContent=`
    /* Accordion kartu utama AREA ADMIN */
    #adminApp .layout main>.card.pnAdminAutoCard{overflow:hidden}
    #adminApp .layout main>.card.pnAdminAutoCard>.cardTitle{gap:9px}
    #adminApp .layout main>.card.pnAdminAutoCard.pnAdminCardClosed>.cardBody{display:none!important}
    .pnAdminCardToggle{margin-left:auto;border:1px solid #cbd5e1;border-radius:8px;padding:7px 10px;background:#f8fafc;color:#14532d;font:inherit;font-size:9px;font-weight:1000;cursor:pointer;white-space:nowrap}
    .pnAdminCardToggle:hover{background:#ecfdf3;border-color:#bbd7c4}.pnAdminCardToggle .arr{display:inline-block;margin-left:5px;transition:transform .18s ease}.pnAdminAutoCard:not(.pnAdminCardClosed)>.cardTitle .pnAdminCardToggle .arr{transform:rotate(180deg)}

    /* Pengaturan fitur */
    .pnAdminFeatureCompact{margin:0 0 12px;border:1px solid #cfe0d5;border-radius:11px;background:#f8fbf9;overflow:hidden}
    .pnAdminFeatureHead{width:100%;border:0;background:#f1f8f3;color:#14532d;padding:11px 13px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;text-align:left;font:inherit}
    .pnAdminFeatureTitle{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:1000}.pnAdminFeatureSummary{font-size:9px;font-weight:900;color:#64748b;margin-left:auto}.pnAdminFeatureChevron{font-size:13px;font-weight:1000;transition:transform .18s ease}
    .pnAdminFeatureCompact.open .pnAdminFeatureChevron{transform:rotate(180deg)}
    .pnAdminFeatureBody{display:none;padding:11px 11px 0;border-top:1px solid #dbe7df;background:#fff}
    .pnAdminFeatureCompact.open .pnAdminFeatureBody{display:block}
    .pnAdminFeatureBody .pnRegSwitchBox,.pnAdminFeatureBody .pnCbtSwitchBox{margin-bottom:10px}

    /* Pilihan kerja Kelola Konten */
    #pnContentAdminPanel.pnAdminCmsCompact .pnCmsTabs{display:none!important}
    .pnAdminWorkMenu{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}
    .pnAdminWorkBtn{border:1px solid #cfe0d5;border-radius:10px;padding:11px 12px;background:#f7fbf8;color:#14532d;font:inherit;font-size:11px;font-weight:1000;cursor:pointer}
    .pnAdminWorkBtn.active{background:#14532d;border-color:#14532d;color:#fff}
    #pnContentAdminPanel[data-pn-work-open="none"] #pnCmsContentPane,
    #pnContentAdminPanel[data-pn-work-open="none"] #pnCmsGalleryPane{display:none!important}
    #pnContentAdminPanel[data-pn-work-open="content"] #pnCmsGalleryPane{display:none!important}
    #pnContentAdminPanel[data-pn-work-open="gallery"] #pnCmsContentPane{display:none!important}

    /* Daftar data tersimpan di dalam CMS */
    .pnAdminListHead{width:100%;margin:14px 0 0;border:1px solid #d8e5dc;border-radius:9px;padding:10px 12px;background:#f8fbf9;color:#14532d;display:flex;align-items:center;justify-content:space-between;gap:10px;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;text-align:left}
    .pnAdminListHead .arr{transition:transform .18s ease}.pnAdminListHead[aria-expanded="true"] .arr{transform:rotate(180deg)}
    .pnAdminListHead[aria-expanded="false"]+.pnCmsList{display:none!important}

    @media(max-width:680px){
      .pnAdminFeatureHead{align-items:flex-start;flex-wrap:wrap}.pnAdminFeatureSummary{order:3;width:100%;margin-left:26px}
      .pnAdminWorkMenu{grid-template-columns:1fr}.pnAdminCardToggle{padding:6px 8px}
    }
  `;
  document.head.appendChild(s);
}

function topCards(){
  return Array.from(document.querySelectorAll('#adminApp .layout main>.card'));
}

function updateCardToggle(card){
  const btn=card.querySelector(':scope>.cardTitle .pnAdminCardToggle');
  if(!btn)return;
  const closed=card.classList.contains('pnAdminCardClosed');
  btn.setAttribute('aria-expanded',closed?'false':'true');
  btn.innerHTML=(closed?'BUKA':'TUTUP')+' <span class="arr">⌄</span>';
}

function setCardOpen(card,open,closeOthers=true){
  if(!card)return;
  if(open&&closeOthers){
    topCards().forEach(other=>{
      if(other===card)return;
      other.classList.add('pnAdminCardClosed');
      updateCardToggle(other);
    });
  }
  card.classList.toggle('pnAdminCardClosed',!open);
  updateCardToggle(card);
}

function installTopCards(){
  topCards().forEach(card=>{
    const title=card.querySelector(':scope>.cardTitle');
    const body=card.querySelector(':scope>.cardBody');
    if(!title||!body)return;
    // DATA / HASIL khusus selalu terbuka dan tidak memakai tombol BUKA/TUTUP.
    if(card.id==='dataResultsCard'){
      card.classList.remove('pnAdminAutoCard','pnAdminCardClosed');
      delete card.dataset.pnAdminCompactInit;
      title.querySelector('.pnAdminCardToggle')?.remove();
      return;
    }
    card.classList.add('pnAdminAutoCard');
    if(!card.dataset.pnAdminCompactInit){
      card.dataset.pnAdminCompactInit='1';
      card.classList.add('pnAdminCardClosed');
    }
    if(!title.querySelector('.pnAdminCardToggle')){
      const btn=document.createElement('button');
      btn.type='button';btn.className='pnAdminCardToggle';btn.setAttribute('aria-label','Buka atau tutup bagian ini');
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        setCardOpen(card,card.classList.contains('pnAdminCardClosed'),true);
      });
      title.appendChild(btn);
    }
    updateCardToggle(card);
  });
}

function openInputCard(){
  const title=$('moduleTitle');
  const card=title?.closest('.card');
  if(card)setCardOpen(card,true,true);
}

function openResultsCard(){
  const card=$('dataResultsCard');
  if(!card)return;
  card.classList.remove('pnAdminAutoCard','pnAdminCardClosed');
  delete card.dataset.pnAdminCompactInit;
  card.querySelector(':scope>.cardTitle .pnAdminCardToggle')?.remove();
}

function stateText(){
  const reg=$('pnRegSwitchBadge');
  const cbt=$('pnCbtSwitchBadge');
  const clean=el=>{
    const t=String(el?.textContent||'').toUpperCase();
    if(t.includes('ON')||t.includes('AKTIF'))return'ON';
    if(t.includes('OFF')||t.includes('TUTUP'))return'OFF';
    return'...';
  };
  return `Pendaftaran ${clean(reg)} • CBT ${clean(cbt)}`;
}

function refreshFeatureSummary(){
  const el=$('pnAdminFeatureSummary');
  if(el)el.textContent=stateText();
}

function setFeatureOpen(open){
  const box=$('pnAdminFeatureCompact');
  const btn=$('pnAdminFeatureHead');
  if(!box||!btn)return;
  box.classList.toggle('open',!!open);
  btn.setAttribute('aria-expanded',open?'true':'false');
}

function installFeature(){
  if(featureInstalled){refreshFeatureSummary();return true}
  const panel=$('pnContentAdminPanel');
  const reg=$('pnRegistrationAdminSwitch');
  const cbt=$('pnCbtAdminSwitch');
  if(!panel||!reg||!cbt)return false;
  const body=panel.querySelector('.cardBody');
  if(!body)return false;

  const shell=document.createElement('div');
  shell.id='pnAdminFeatureCompact';shell.className='pnAdminFeatureCompact';
  shell.innerHTML=`
    <button id="pnAdminFeatureHead" class="pnAdminFeatureHead" type="button" aria-expanded="false" aria-controls="pnAdminFeatureBody">
      <span class="pnAdminFeatureTitle">⚙️ PENGATURAN FITUR</span>
      <span id="pnAdminFeatureSummary" class="pnAdminFeatureSummary">Memuat status...</span>
      <span class="pnAdminFeatureChevron">⌄</span>
    </button>
    <div id="pnAdminFeatureBody" class="pnAdminFeatureBody"></div>`;
  body.insertBefore(shell,reg);
  const featureBody=$('pnAdminFeatureBody');
  featureBody.appendChild(reg);featureBody.appendChild(cbt);
  $('pnAdminFeatureHead').addEventListener('click',()=>setFeatureOpen(!shell.classList.contains('open')));
  featureInstalled=true;refreshFeatureSummary();
  new MutationObserver(refreshFeatureSummary).observe(featureBody,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  return true;
}

function setWorkOpen(which){
  const panel=$('pnContentAdminPanel');if(!panel)return;
  const val=['content','gallery'].includes(which)?which:'none';
  panel.dataset.pnWorkOpen=val;
  const bc=$('pnAdminWorkContent'),bg=$('pnAdminWorkGallery');
  if(bc){bc.classList.toggle('active',val==='content');bc.setAttribute('aria-expanded',val==='content'?'true':'false')}
  if(bg){bg.classList.toggle('active',val==='gallery');bg.setAttribute('aria-expanded',val==='gallery'?'true':'false')}
  if(val!=='content')setFeatureOpen(false);
}

function openWork(which){
  const panel=$('pnContentAdminPanel');if(!panel)return;
  const current=panel.dataset.pnWorkOpen||'none';
  if(current===which){setWorkOpen('none');return}
  if(which==='content')$('pnCmsTabContent')?.click();
  if(which==='gallery')$('pnCmsTabGallery')?.click();
  setWorkOpen(which);
}

function installWorkMenu(){
  if(workInstalled)return true;
  const panel=$('pnContentAdminPanel');
  const tabs=panel?.querySelector('.pnCmsTabs');
  const cp=$('pnCmsContentPane'),gp=$('pnCmsGalleryPane');
  if(!panel||!tabs||!cp||!gp)return false;
  panel.classList.add('pnAdminCmsCompact');panel.dataset.pnWorkOpen='none';
  const menu=document.createElement('div');menu.id='pnAdminWorkMenu';menu.className='pnAdminWorkMenu';
  menu.innerHTML=`<button id="pnAdminWorkContent" class="pnAdminWorkBtn" type="button" aria-expanded="false">📰 KABAR & INFORMASI</button><button id="pnAdminWorkGallery" class="pnAdminWorkBtn" type="button" aria-expanded="false">🖼️ GALERI / FOTO</button>`;
  tabs.parentNode.insertBefore(menu,tabs);
  $('pnAdminWorkContent').addEventListener('click',()=>openWork('content'));
  $('pnAdminWorkGallery').addEventListener('click',()=>openWork('gallery'));
  $('pnCmsTabContent')?.addEventListener('click',()=>setTimeout(()=>{if(panel.dataset.pnWorkOpen!=='none')setWorkOpen('content')},0));
  $('pnCmsTabGallery')?.addEventListener('click',()=>setTimeout(()=>{if(panel.dataset.pnWorkOpen!=='none')setWorkOpen('gallery')},0));
  workInstalled=true;
  return true;
}

function listCount(list){
  const n=list.querySelectorAll('.pnCmsItem').length;
  return n;
}

function refreshListHead(btn,list,label){
  if(!btn||!list)return;
  btn.querySelector('.txt').textContent=`${label} • ${listCount(list)} data`;
}

function installListToggle(pane,label,key){
  if(!pane)return;
  const list=pane.querySelector('.pnCmsList');if(!list)return;
  let btn=pane.querySelector(`.pnAdminListHead[data-key="${key}"]`);
  if(!btn){
    btn=document.createElement('button');btn.type='button';btn.className='pnAdminListHead';btn.dataset.key=key;btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span class="txt"></span><span class="arr">⌄</span>';
    list.parentNode.insertBefore(btn,list);
    btn.addEventListener('click',()=>btn.setAttribute('aria-expanded',btn.getAttribute('aria-expanded')==='true'?'false':'true'));
    list.addEventListener('click',e=>{
      if(e.target?.closest('.pnCmsMini.edit'))setTimeout(()=>btn.setAttribute('aria-expanded','false'),50);
    });
    new MutationObserver(()=>refreshListHead(btn,list,label)).observe(list,{subtree:true,childList:true});
  }
  refreshListHead(btn,list,label);
}

function installCmsLists(){
  installListToggle($('pnCmsContentPane'),'📚 DATA KABAR / INFORMASI TERSIMPAN','content');
  installListToggle($('pnCmsGalleryPane'),'📚 DATA FOTO TERSIMPAN','gallery');
}

function installGlobalBehaviour(){
  if(document.documentElement.dataset.pnAdminCompactEvents)return;
  document.documentElement.dataset.pnAdminCompactEvents='1';
  document.addEventListener('click',e=>{
    const nav=e.target?.closest('#nav button,#nav a,#nav [onclick]');
    if(nav)setTimeout(openInputCard,60);
    const view=e.target?.closest('button[onclick*="lihatData"]');
    if(view)setTimeout(openResultsCard,80);
  });
}

function watch(){
  ensureStyles();installTopCards();installFeature();installWorkMenu();installCmsLists();refreshFeatureSummary();installGlobalBehaviour();
}

function queueWatch(){
  if(watchQueued)return;watchQueued=true;
  setTimeout(()=>{watchQueued=false;watch()},60);
}

function startObserver(){
  if(observerStarted)return;
  const app=$('adminApp');if(!app)return;
  observerStarted=true;
  new MutationObserver(queueWatch).observe(app,{subtree:true,childList:true});
}

document.addEventListener('DOMContentLoaded',()=>{
  watch();startObserver();
  setInterval(()=>{watch();startObserver()},1200);
});
})();

/* Load pemantauan Koordinator Aspel khusus area admin. */
(()=>{
  if(document.querySelector('script[data-pn-aspel-monitor]'))return;
  const script=document.createElement('script');
  script.src='js/aspel-monitor-v1.js?v=2';
  script.async=false;
  script.dataset.pnAspelMonitor='1';
  document.head.appendChild(script);
})();


/* Load Portal Akun Anggota khusus area admin. */
(()=>{
  if(document.querySelector('script[data-pn-account-admin]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-portal-v1.js?v=1';
  script.async=false;
  script.dataset.pnAccountAdmin='1';
  document.head.appendChild(script);
})();


/* Akun Anggota V2: nama portal ringkas + buat akun dari biodata. */
(()=>{
  if(document.querySelector('script[data-pn-account-create-v2]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-create-v2.js?v=3';
  script.async=false;
  script.dataset.pnAccountCreateV2='1';
  document.head.appendChild(script);
})();


/* Fix konfirmasi pembuatan akun: verifikasi hasil ke database jika iframe lambat. */
(()=>{
  if(document.querySelector('script[data-pn-account-create-timeout-fix]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-create-timeout-fix-v1.js?v=2';
  script.async=false;
  script.dataset.pnAccountCreateTimeoutFix='1';
  document.head.appendChild(script);
})();
