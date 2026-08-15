(()=>{
'use strict';
const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const LOCAL_KEY='pnReviewPublishedV2';
let lastData=[];
let rendering=false;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(n)||0)));
function localPublished(){try{const x=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function keyOf(r){return String(r.id||'')||[r.name,r.message,r.date,r.rating].map(v=>String(v||'')).join('|')}
function merge(...sets){const map=new Map();sets.flat().forEach(r=>{if(!r||!r.name||!r.message)return;map.set(keyOf(r),r)});return [...map.values()]}
function formatDate(v){try{return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v))}catch(_){return String(v||'')}}
function render(data){
  const list=$('reviewList'),bars=$('reviewBars');if(!list||!bars)return;
  rendering=true;
  const valid=(Array.isArray(data)?data:[]).filter(r=>Number(r.rating)>=1&&Number(r.rating)<=5&&r.name&&r.message).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  lastData=valid;
  const total=valid.length,avg=total?valid.reduce((s,r)=>s+Number(r.rating),0)/total:0;
  if($('reviewAvg'))$('reviewAvg').textContent=avg.toFixed(1);
  if($('reviewAvgStars'))$('reviewAvgStars').textContent=total?stars(Math.round(avg)):'☆☆☆☆☆';
  if($('reviewTotal'))$('reviewTotal').textContent=String(total);
  bars.innerHTML=[5,4,3,2,1].map(n=>{const c=valid.filter(r=>Number(r.rating)===n).length,p=total?Math.round(c/total*100):0;return `<div class="reviewBarRow"><span>${n}★</span><div class="reviewBar"><div class="reviewBarFill" style="width:${p}%"></div></div><span>${p}%</span></div>`}).join('');
  list.innerHTML=total?valid.slice(0,6).map(r=>`<article class="reviewCard" data-review-refresh="v3"><div class="reviewCardTop"><span class="reviewCardStars">${stars(r.rating)}</span><span class="reviewCardDate">${formatDate(r.date)}</span></div><p class="reviewCardText">“${esc(r.message)}”</p><div class="reviewCardFoot"><div class="reviewCardName">${esc(r.name)}</div><span class="reviewVerified">✓ ${esc(r.role||'Pengunjung')} Terverifikasi</span></div></article>`).join(''):'<div class="reviewEmpty" data-review-refresh="v3"><b>Belum ada ulasan yang diterbitkan.</b><br>Ulasan baru akan tampil setelah disetujui admin.</div>';
  setTimeout(()=>{rendering=false},0);
}
async function loadStaticAndLocal(){
  let base=[];try{const res=await fetch('data/reviews.json?v=43',{cache:'no-store'});if(res.ok)base=await res.json()}catch(_){}
  render(merge(base,localPublished(),lastData));
}
function requestOnline(){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-v3-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');frame.name='pnReviewV3_'+rid.replace(/[^a-zA-Z0-9_]/g,'');frame.style.display='none';
    const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    [['action','reviewPublicList'],['rid',rid]].forEach(([n,v])=>{const i=document.createElement('input');i.type='hidden';i.name=n;i.value=v;form.appendChild(i)});
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMsg);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),300)};
    const onMsg=e=>{const d=e.data;if(done||!d||d.source!=='pn-reviews'||d.rid!==rid)return;done=true;cleanup();d.ok?resolve(d.reviews||[]):reject(new Error(d.message||'Gagal'))};
    window.addEventListener('message',onMsg);
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('timeout'))},2500);
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}
async function refresh(){
  render(merge(lastData,localPublished()));
  loadStaticAndLocal();
  try{const online=await requestOnline();render(merge(online,localPublished()))}catch(_){}
}
function wrapPublicDashboard(){
  const old=window.showPublicDashboard;if(typeof old!=='function'||old.__reviewRefreshV3)return;
  const wrapped=function(...args){const out=old.apply(this,args);setTimeout(refresh,0);setTimeout(refresh,350);return out};
  wrapped.__reviewRefreshV3=true;window.showPublicDashboard=wrapped;
}
document.addEventListener('DOMContentLoaded',()=>{
  wrapPublicDashboard();
  render(localPublished());
  setTimeout(refresh,80);setTimeout(refresh,500);setTimeout(refresh,1600);
  const list=$('reviewList');if(list){const obs=new MutationObserver(()=>{if(rendering)return;const local=localPublished();if(local.length&&!list.querySelector('[data-review-refresh="v3"]'))setTimeout(()=>render(merge(lastData,local)),0)});obs.observe(list,{childList:true,subtree:true})}
});
window.addEventListener('storage',e=>{if(e.key===LOCAL_KEY)refresh()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
