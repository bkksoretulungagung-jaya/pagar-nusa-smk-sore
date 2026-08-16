(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const ROOT_ID='pnAdminNotificationCenter';
let loading=false;
let lastData=null;
let pollTimer=0;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function saved(key){try{return localStorage.getItem(key)||sessionStorage.getItem(key)||''}catch(_){try{return sessionStorage.getItem(key)||''}catch(__){return''}}}
function isAdmin(){return saved(AUTH_KEY)==='1'&&!!saved(TOKEN_KEY)}

function jsonp(action,payload={},timeoutMs=22000){
  return new Promise((resolve,reject)=>{
    const cb='pnAdminNoticeCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();data&&data.ok?resolve(data):reject(new Error(data?.message||'Notifikasi admin tidak dapat dimuat.'))};
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>qs.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+qs.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Tidak dapat menghubungi pusat notifikasi.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Pusat notifikasi terlalu lama merespons.'))},timeoutMs);
    document.head.appendChild(script);
  });
}

function ensureStyle(){
  if($('pnAdminNotificationStyle'))return;
  const style=document.createElement('style');
  style.id='pnAdminNotificationStyle';
  style.textContent=`
    .pnAdminNotice{position:relative;margin:0 0 13px;border:1px solid #cfe0d5;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(15,61,36,.07);overflow:visible}
    .pnAdminNotice.hidden{display:none!important}.pnAdminNoticeHead{width:100%;border:0;background:linear-gradient(135deg,#f0fdf4,#f8fbf9);padding:11px 13px;display:flex;align-items:center;gap:9px;cursor:pointer;text-align:left;font:inherit;color:#14532d}
    .pnAdminNoticeBell{font-size:17px}.pnAdminNoticeTitle{font-size:11px;font-weight:1000;letter-spacing:.15px}.pnAdminNoticeSummary{margin-left:auto;color:#64748b;font-size:9px;font-weight:900}.pnAdminNoticeBadge{min-width:23px;height:23px;padding:0 6px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#14532d;color:#fff;font-size:10px;font-weight:1000;box-sizing:border-box}.pnAdminNoticeBadge.alert{background:#b91c1c}.pnAdminNoticeChevron{font-size:13px;font-weight:1000;transition:transform .18s ease}.pnAdminNotice.open .pnAdminNoticeChevron{transform:rotate(180deg)}
    .pnAdminNoticePanel{display:none;border-top:1px solid #dbe7df;padding:12px;background:#fff}.pnAdminNotice.open .pnAdminNoticePanel{display:block}
    .pnAdminNoticeInfo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}.pnAdminNoticeStat{padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc}.pnAdminNoticeStat strong{display:block;color:#14532d;font-size:16px;line-height:1}.pnAdminNoticeStat span{display:block;margin-top:4px;color:#64748b;font-size:8px;font-weight:900;text-transform:uppercase}
    .pnAdminNoticeList{display:grid;gap:7px}.pnAdminNoticeItem{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:start;padding:10px 11px;border:1px solid #e2e8f0;border-radius:9px;background:#fff}.pnAdminNoticeItem.critical{border-color:#fecaca;background:#fff7f7}.pnAdminNoticeItem.warning{border-color:#fed7aa;background:#fffaf3}.pnAdminNoticeIcon{font-size:14px;line-height:1.35}.pnAdminNoticeItemTitle{color:#1e293b;font-size:10px;font-weight:1000;line-height:1.4}.pnAdminNoticeItemDetail{margin-top:3px;color:#64748b;font-size:8.5px;line-height:1.5}.pnAdminNoticeGo{border:1px solid #cbd5e1;border-radius:8px;padding:6px 8px;background:#fff;color:#14532d;font:inherit;font-size:8px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnAdminNoticeEmpty{padding:14px;border:1px dashed #bbd7c4;border-radius:9px;background:#f0fdf4;color:#166534;text-align:center;font-size:10px;font-weight:900}.pnAdminNoticeFoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;color:#94a3b8;font-size:8px}.pnAdminNoticeRefresh{border:0;background:transparent;color:#166534;font:inherit;font-size:8px;font-weight:1000;cursor:pointer;padding:3px}
    @media(max-width:680px){.pnAdminNoticeSummary{display:none}.pnAdminNoticeInfo{grid-template-columns:1fr 1fr}.pnAdminNoticeItem{grid-template-columns:auto minmax(0,1fr)}.pnAdminNoticeGo{grid-column:2;justify-self:start}}
  `;
  document.head.appendChild(style);
}

function ensureRoot(){
  ensureStyle();
  let root=$(ROOT_ID);if(root)return root;
  const main=document.querySelector('#adminApp .layout main');if(!main)return null;
  root=document.createElement('section');root.id=ROOT_ID;root.className='pnAdminNotice hidden';
  root.innerHTML=`<button id="pnAdminNoticeHead" class="pnAdminNoticeHead" type="button" aria-expanded="false"><span class="pnAdminNoticeBell">🔔</span><span class="pnAdminNoticeTitle">PUSAT NOTIFIKASI ADMIN</span><span id="pnAdminNoticeSummary" class="pnAdminNoticeSummary">Memuat...</span><span id="pnAdminNoticeBadge" class="pnAdminNoticeBadge">0</span><span class="pnAdminNoticeChevron">⌄</span></button><div id="pnAdminNoticePanel" class="pnAdminNoticePanel"><div id="pnAdminNoticeInfo" class="pnAdminNoticeInfo"></div><div id="pnAdminNoticeList" class="pnAdminNoticeList"></div><div class="pnAdminNoticeFoot"><span id="pnAdminNoticeChecked">Belum diperiksa</span><button id="pnAdminNoticeRefresh" class="pnAdminNoticeRefresh" type="button">↻ MUAT ULANG</button></div></div>`;
  const first=main.firstElementChild;first?main.insertBefore(root,first):main.appendChild(root);
  $('pnAdminNoticeHead')?.addEventListener('click',()=>{
    const open=!root.classList.contains('open');root.classList.toggle('open',open);$('pnAdminNoticeHead')?.setAttribute('aria-expanded',open?'true':'false');
    if(open&&(!lastData||Date.now()-Number(root.dataset.loadedAt||0)>60000))load(true);
  });
  $('pnAdminNoticeRefresh')?.addEventListener('click',()=>load(true));
  $('pnAdminNoticeList')?.addEventListener('click',e=>{const btn=e.target.closest('[data-target]');if(btn)goTarget(btn.dataset.target)});
  return root;
}

function formatTime(v){try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(v))}catch(_){return String(v||'')}}

function render(data){
  const root=ensureRoot();if(!root)return;
  const count=Number(data?.attentionCount||0);const stats=data?.stats||{};const items=Array.isArray(data?.items)?data.items:[];
  root.classList.toggle('hidden',!isAdmin());if(!isAdmin())return;
  const badge=$('pnAdminNoticeBadge');if(badge){badge.textContent=String(count);badge.classList.toggle('alert',count>0)}
  if($('pnAdminNoticeSummary'))$('pnAdminNoticeSummary').textContent=count?count+' hal perlu perhatian':'Semua aman';
  if($('pnAdminNoticeInfo'))$('pnAdminNoticeInfo').innerHTML=`<div class="pnAdminNoticeStat"><strong>${Number(stats.pendingReviews||0)}</strong><span>Ulasan Pending</span></div><div class="pnAdminNoticeStat"><strong>${Number(stats.unassignedCandidates||0)}</strong><span>Belum Didampingi</span></div><div class="pnAdminNoticeStat"><strong>${Number(stats.registrationsToday||0)}</strong><span>Pendaftaran Hari Ini</span></div>`;
  const list=$('pnAdminNoticeList');if(list){
    list.innerHTML=items.length?items.map(item=>`<div class="pnAdminNoticeItem ${esc(item.severity||'warning')}"><div class="pnAdminNoticeIcon">${esc(item.icon||'🔔')}</div><div><div class="pnAdminNoticeItemTitle">${esc(item.title||'Notifikasi')}</div><div class="pnAdminNoticeItemDetail">${esc(item.detail||'')}</div></div>${item.target&&item.target!=='backup'?`<button class="pnAdminNoticeGo" type="button" data-target="${esc(item.target)}">BUKA</button>`:''}</div>`).join(''):'<div class="pnAdminNoticeEmpty">✓ Tidak ada hal yang memerlukan perhatian admin.</div>';
  }
  if($('pnAdminNoticeChecked'))$('pnAdminNoticeChecked').textContent='Diperiksa '+formatTime(data?.checkedAt||new Date());
  root.dataset.loadedAt=String(Date.now());
}

function showError(err){
  const root=ensureRoot();if(!root||!isAdmin())return;
  root.classList.remove('hidden');
  if($('pnAdminNoticeSummary'))$('pnAdminNoticeSummary').textContent='Belum tersinkron';
  const list=$('pnAdminNoticeList');if(list)list.innerHTML=`<div class="pnAdminNoticeItem warning"><div class="pnAdminNoticeIcon">🟡</div><div><div class="pnAdminNoticeItemTitle">Pusat notifikasi belum dapat dimuat</div><div class="pnAdminNoticeItemDetail">${esc(String(err&&err.message||err))}</div></div></div>`;
}

async function load(force=false){
  const root=ensureRoot();if(!root)return false;
  if(!isAdmin()){root.classList.add('hidden');return false}
  root.classList.remove('hidden');
  if(loading)return false;
  if(!force&&lastData&&Date.now()-Number(root.dataset.loadedAt||0)<45000){render(lastData);return true}
  loading=true;
  try{
    const data=await jsonp('adminNotificationCenter',{token:saved(TOKEN_KEY)},24000);
    lastData=data;render(data);return true;
  }catch(err){showError(err);return false}
  finally{loading=false}
}

function openNormalCard(panel){
  if(!panel)return false;
  const card=panel.closest('#adminApp .layout main>.card');
  if(card&&card.classList.contains('pnAdminCardClosed'))card.querySelector(':scope>.cardTitle .pnAdminCardToggle')?.click();
  panel.scrollIntoView({behavior:'smooth',block:'start'});return true;
}

function goTarget(target){
  if(target==='aspel'){
    const nav=$('pnAspelMonitorNav');if(nav){nav.click();return}
  }
  if(target==='reviews'){
    if(openNormalCard($('pnReviewAdminPanel')))return;
  }
}

function boot(){
  ensureRoot();load(false);
  clearInterval(pollTimer);pollTimer=setInterval(()=>{if(document.visibilityState==='visible'&&isAdmin()&&navigator.onLine!==false)load(false)},60000);
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,400));
window.addEventListener('online',()=>setTimeout(()=>load(true),500));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load(false)});
window.addEventListener('pn:reviews-changed',()=>setTimeout(()=>load(true),500));
window.pnRefreshAdminNotifications=()=>load(true);
setInterval(()=>{const root=ensureRoot();if(root){root.classList.toggle('hidden',!isAdmin());if(isAdmin()&&!lastData)load(false)}},1500);
})();
