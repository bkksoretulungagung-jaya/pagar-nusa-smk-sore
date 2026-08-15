(()=>{
'use strict';

const $=id=>document.getElementById(id);
let installed=false;

function ensureStyles(){
  if($('pnAdminCompactStyle'))return;
  const s=document.createElement('style');
  s.id='pnAdminCompactStyle';
  s.textContent=`
    .pnAdminFeatureCompact{margin:0 0 13px;border:1px solid #cfe0d5;border-radius:11px;background:#f8fbf9;overflow:hidden}
    .pnAdminFeatureHead{width:100%;border:0;background:#f1f8f3;color:#14532d;padding:11px 13px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;text-align:left;font:inherit}
    .pnAdminFeatureTitle{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:1000}.pnAdminFeatureSummary{font-size:9px;font-weight:900;color:#64748b;margin-left:auto}.pnAdminFeatureChevron{font-size:13px;font-weight:1000;transition:transform .18s ease}
    .pnAdminFeatureCompact.open .pnAdminFeatureChevron{transform:rotate(180deg)}
    .pnAdminFeatureBody{display:none;padding:11px 11px 0;border-top:1px solid #dbe7df;background:#fff}
    .pnAdminFeatureCompact.open .pnAdminFeatureBody{display:block}
    .pnAdminFeatureBody .pnRegSwitchBox,.pnAdminFeatureBody .pnCbtSwitchBox{margin-bottom:10px}
    @media(max-width:680px){.pnAdminFeatureHead{align-items:flex-start;flex-wrap:wrap}.pnAdminFeatureSummary{order:3;width:100%;margin-left:26px}}
  `;
  document.head.appendChild(s);
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

function refreshSummary(){
  const el=$('pnAdminFeatureSummary');
  if(el)el.textContent=stateText();
}

function setOpen(open){
  const box=$('pnAdminFeatureCompact');
  const btn=$('pnAdminFeatureHead');
  if(!box||!btn)return;
  box.classList.toggle('open',!!open);
  btn.setAttribute('aria-expanded',open?'true':'false');
}

function closeOnEditorUse(){
  const ids=['pnCmsTabContent','pnCmsTabGallery'];
  ids.forEach(id=>$(id)?.addEventListener('click',()=>setOpen(false)));
  const panel=$('pnContentAdminPanel');
  panel?.addEventListener('focusin',e=>{
    if(e.target?.closest('#pnCmsContentPane,#pnCmsGalleryPane'))setOpen(false);
  });
}

function install(){
  ensureStyles();
  if(installed){refreshSummary();return true}
  const panel=$('pnContentAdminPanel');
  const reg=$('pnRegistrationAdminSwitch');
  const cbt=$('pnCbtAdminSwitch');
  if(!panel||!reg||!cbt)return false;
  const body=panel.querySelector('.cardBody');
  if(!body)return false;

  const shell=document.createElement('div');
  shell.id='pnAdminFeatureCompact';
  shell.className='pnAdminFeatureCompact';
  shell.innerHTML=`
    <button id="pnAdminFeatureHead" class="pnAdminFeatureHead" type="button" aria-expanded="false" aria-controls="pnAdminFeatureBody">
      <span class="pnAdminFeatureTitle">⚙️ PENGATURAN FITUR</span>
      <span id="pnAdminFeatureSummary" class="pnAdminFeatureSummary">Memuat status...</span>
      <span class="pnAdminFeatureChevron">⌄</span>
    </button>
    <div id="pnAdminFeatureBody" class="pnAdminFeatureBody"></div>`;

  body.insertBefore(shell,reg);
  const featureBody=$('pnAdminFeatureBody');
  featureBody.appendChild(reg);
  featureBody.appendChild(cbt);

  $('pnAdminFeatureHead').addEventListener('click',()=>setOpen(!shell.classList.contains('open')));
  closeOnEditorUse();
  installed=true;
  refreshSummary();

  const observer=new MutationObserver(refreshSummary);
  observer.observe(featureBody,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  return true;
}

function watch(){
  if(!install())return;
  refreshSummary();
}

document.addEventListener('DOMContentLoaded',()=>{
  watch();
  const timer=setInterval(()=>{
    watch();
    if(installed)setTimeout(()=>clearInterval(timer),5000);
  },250);
});
})();
