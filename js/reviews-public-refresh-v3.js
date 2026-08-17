(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
let loading=false;
let lastGood=[];
let retryTimer=0;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(n)||0)));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function formatDate(v){
  try{return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date(v))}
  catch(_){return String(v||'')}
}

function ensureState(){
  const section=document.getElementById('reviewList')?.closest('.reviewSection');
  if(!section||$('reviewDataState'))return;
  const state=document.createElement('div');
  state.id='reviewDataState';
  const list=$('reviewList');
  list?.parentNode?.insertBefore(state,list);
}

function setState(type,text){
  ensureState();
  const el=$('reviewDataState');if(!el)return;
  const base='margin:0 0 12px;padding:8px 11px;border-radius:9px;font-size:9px;font-weight:900;line-height:1.45;';
  if(type==='online')el.style.cssText=base+'background:rgba(220,252,231,.12);border:1px solid rgba(187,247,208,.25);color:#dcfce7';
  else if(type==='loading')el.style.cssText=base+'background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.15);color:#dcfce7';
  else el.style.cssText=base+'background:rgba(254,226,226,.12);border:1px solid rgba(254,202,202,.25);color:#fee2e2';
  el.textContent=text;
}

function render(data){
  const list=$('reviewList'),bars=$('reviewBars');if(!list||!bars)return;
  const valid=(Array.isArray(data)?data:[])
    .filter(r=>Number(r.rating)>=1&&Number(r.rating)<=5&&r.name&&r.message&&String(r.status||'DITERBITKAN').toUpperCase()==='DITERBITKAN')
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  lastGood=valid;
  const total=valid.length;
  const avg=total?valid.reduce((sum,r)=>sum+Number(r.rating),0)/total:0;
  if($('reviewAvg'))$('reviewAvg').textContent=avg.toFixed(1);
  if($('reviewAvgStars'))$('reviewAvgStars').textContent=total?stars(Math.round(avg)):'☆☆☆☆☆';
  if($('reviewTotal'))$('reviewTotal').textContent=String(total);
  bars.innerHTML=[5,4,3,2,1].map(n=>{
    const c=valid.filter(r=>Number(r.rating)===n).length;
    const pct=total?Math.round(c/total*100):0;
    return `<div class="reviewBarRow"><span>${n}★</span><div class="reviewBar"><div class="reviewBarFill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`;
  }).join('');
  if(!total){
    list.innerHTML='<div class="reviewEmpty"><b>Belum ada ulasan yang diterbitkan.</b><br>Ulasan yang lolos verifikasi admin akan muncul otomatis di sini.</div>';
    return;
  }
  list.innerHTML=valid.slice(0,6).map(r=>`<article class="reviewCard"><div class="reviewCardTop"><span class="reviewCardStars">${stars(r.rating)}</span><span class="reviewCardDate">${formatDate(r.date)}</span></div><p class="reviewCardText">“${esc(r.message)}”</p><div class="reviewCardFoot"><div class="reviewCardName">${esc(r.name)}</div><span class="reviewVerified">✓ ${esc(r.role||'Pengunjung')} • Terverifikasi Admin</span></div></article>`).join('');
}

// Primary transport: GET + JSONP. Apps Script officially supports serving JavaScript
// through ContentService, avoiding cross-origin POST/hidden-iframe instability.
function requestPublicJsonp(timeoutMs=12000){
  return new Promise((resolve,reject)=>{
    const cb='pnReviewPublicCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{
      clearTimeout(timer);
      try{delete window[cb]}catch(_){window[cb]=undefined}
      script.remove();
    };
    window[cb]=payload=>{
      if(done)return;done=true;cleanup();
      if(payload&&payload.ok)resolve(Array.isArray(payload.reviews)?payload.reviews:[]);
      else reject(new Error(payload?.message||'Server menolak daftar ulasan.'));
    };
    script.async=true;
    script.src=ENDPOINT+'?action=reviewPublicList&callback='+encodeURIComponent(cb)+'&rid='+encodeURIComponent(cb)+'&_='+Date.now();
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('GET ulasan gagal dimuat.'));};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('GET ulasan timeout.'));},timeoutMs);
    document.head.appendChild(script);
  });
}

// Compatibility fallback for an older Apps Script deployment.
function requestPublicPost(timeoutMs=12000){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-public-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewPublic_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    [['action','reviewPublicList'],['rid',rid]].forEach(([name,value])=>{
      const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input);
    });
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),250)};
    const onMessage=e=>{
      const d=e.data;
      if(done||!d||d.source!=='pn-reviews'||d.rid!==rid)return;
      done=true;cleanup();
      d.ok?resolve(Array.isArray(d.reviews)?d.reviews:[]):reject(new Error(d.message||'Gagal memuat ulasan.'));
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('POST ulasan timeout.'))},timeoutMs);
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

async function requestPublic(){
  try{return await requestPublicJsonp(12000)}catch(jsonpErr){
    setState('loading','● Jalur GET belum merespons • mencoba jalur kompatibilitas...');
    try{return await requestPublicPost(14000)}catch(postErr){
      throw new Error('GET: '+jsonpErr.message+' | POST: '+postErr.message);
    }
  }
}

async function refresh(){
  if(loading)return;
  loading=true;
  if(retryTimer){clearTimeout(retryTimer);retryTimer=0;}
  setState('loading','● Menyinkronkan ulasan terverifikasi dengan database pusat...');
  try{
    const rows=await requestPublic();
    render(rows);
    setState('online','● DATABASE ONLINE • '+rows.length+' ulasan terverifikasi dimuat dari database pusat.');
  }catch(err){
    if(lastGood.length)render(lastGood);else render([]);
    setState('offline','● SINKRONISASI TERGANGGU • '+err.message+' Sistem mencoba ulang otomatis.');
    retryTimer=setTimeout(refresh,15000);
  }finally{loading=false;}
}

function wrapPublicDashboard(){
  const old=window.showPublicDashboard;
  if(typeof old!=='function'||old.__reviewOnlineOnly)return;
  const wrapped=function(...args){const out=old.apply(this,args);setTimeout(refresh,50);return out;};
  wrapped.__reviewOnlineOnly=true;window.showPublicDashboard=wrapped;
}

document.addEventListener('DOMContentLoaded',()=>{
  ensureState();wrapPublicDashboard();render([]);
  setTimeout(refresh,4800);
  setTimeout(()=>{if(!loading)refresh()},9500);
});
window.addEventListener('pn:reviews-changed',()=>setTimeout(refresh,80));
window.addEventListener('pn:review-public-refresh',()=>setTimeout(refresh,80));
window.addEventListener('focus',()=>refresh());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
})();
