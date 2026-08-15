(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
let rows=[];
let online=false;
let connecting=false;

const $=id=>document.getElementById(id);
const upper=v=>String(v||'').trim().toUpperCase();
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(n)||0)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function randomToken(){
  try{
    const a=new Uint8Array(32);
    crypto.getRandomValues(a);
    return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
  }catch(_){
    return 'pn'+Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
  }
}

function jsonp(action,payload={},timeoutMs=20000){
  return new Promise((resolve,reject)=>{
    const cb='pnReviewCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{
      clearTimeout(timer);
      try{delete window[cb]}catch(_){window[cb]=undefined}
      script.remove();
    };
    window[cb]=data=>{
      if(done)return;
      done=true;cleanup();
      data&&data.ok?resolve(data):reject(new Error(data?.message||'Permintaan database ditolak.'));
    };
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>qs.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+qs.toString();
    script.async=true;
    script.onerror=()=>{
      if(done)return;
      done=true;cleanup();reject(new Error('Tidak dapat memuat respons database.'));
    };
    const timer=setTimeout(()=>{
      if(done)return;
      done=true;cleanup();reject(new Error('Database terlalu lama merespons.'));
    },timeoutMs);
    document.head.appendChild(script);
  });
}

function postHidden(action,payload={},timeoutMs=25000){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-post-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewPost_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);
    });
    let done=false;
    let started=0;
    let settleTimer=0;
    const cleanup=()=>{
      window.removeEventListener('message',onMessage);
      frame.removeEventListener('load',onLoad);
      clearTimeout(timer);clearTimeout(settleTimer);
      form.remove();setTimeout(()=>frame.remove(),250);
    };
    const finish=(ok,data)=>{
      if(done)return;
      done=true;cleanup();
      ok?resolve(data||{ok:true,assumed:true}):reject(new Error(data?.message||'Permintaan ditolak server.'));
    };
    const onMessage=e=>{
      const d=e.data;
      if(done||!d||d.source!=='pn-reviews'||d.rid!==rid)return;
      finish(!!d.ok,d);
    };
    const onLoad=()=>{
      if(done||!started||Date.now()-started<500)return;
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>finish(true,{ok:true,assumed:true}),500);
    };
    window.addEventListener('message',onMessage);
    frame.addEventListener('load',onLoad);
    const timer=setTimeout(()=>finish(false,{message:'Server belum menyelesaikan permintaan.'}),timeoutMs);
    document.body.appendChild(frame);document.body.appendChild(form);
    started=Date.now();form.submit();
  });
}

function setState(kind,text){
  const badge=$('pnReviewConnection');
  const badgeText=$('pnReviewConnectionText');
  const msg=$('pnReviewAdminMessage');
  if(badge)badge.className='pnReviewConn '+(kind==='online'?'online':kind==='loading'?'':'offline');
  if(badgeText)badgeText.textContent=kind==='online'?'DATABASE ONLINE':kind==='loading'?'MENYINKRONKAN...':'SESI BELUM AKTIF';
  if(msg){
    msg.className='pnReviewAdminMessage '+(kind==='online'?'ok':kind==='error'?'error':'');
    msg.textContent=text||'';
  }
}

function formatDate(v){
  try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(v))}
  catch(_){return String(v||'')}
}

function stats(){
  const pending=rows.filter(r=>upper(r.status||'PENDING')==='PENDING').length;
  const published=rows.filter(r=>upper(r.status)==='DITERBITKAN').length;
  const rejected=rows.filter(r=>['DITOLAK','DIHAPUS'].includes(upper(r.status))).length;
  if($('pnReviewStatPending'))$('pnReviewStatPending').textContent=pending;
  if($('pnReviewStatPublished'))$('pnReviewStatPublished').textContent=published;
  if($('pnReviewStatRejected'))$('pnReviewStatRejected').textContent=rejected;
  if($('pnReviewStatTotal'))$('pnReviewStatTotal').textContent=rows.length;
  return pending;
}

function render(){
  const list=$('pnReviewAdminList');if(!list)return;
  const q=String($('pnReviewSearch')?.value||'').trim().toLowerCase();
  const filter=upper($('pnReviewFilter')?.value||'ALL');
  stats();
  const visible=rows.filter(r=>{
    const st=upper(r.status||'PENDING');
    const hay=[r.name,r.role,r.message,r.id].map(v=>String(v||'').toLowerCase()).join(' ');
    return (filter==='ALL'||st===filter)&&(!q||hay.includes(q));
  });
  if(!visible.length){
    list.innerHTML='<div class="pnReviewEmpty">Tidak ada ulasan yang cocok dengan filter saat ini.</div>';
    return;
  }
  list.innerHTML=visible.slice(0,150).map(r=>{
    const st=upper(r.status||'PENDING');
    const actions=st==='PENDING'?`<div class="pnReviewActions"><button class="pnReviewPublish" data-action="DITERBITKAN" type="button">✓ TERBITKAN</button><button class="pnReviewReject" data-action="DITOLAK" type="button">✕ TOLAK</button><button class="pnReviewDelete" data-action="DIHAPUS" type="button">🗑 HAPUS</button></div>`:'';
    return `<article class="pnReviewAdminItem" data-review-id="${esc(r.id)}"><div class="pnReviewItemHead"><div><div class="pnReviewName">${esc(r.name)}</div><div class="pnReviewMeta">${esc(r.role||'-')} • ${esc(r.id||'-')} • ${formatDate(r.date)}</div></div><div class="pnReviewStars">${stars(r.rating)}</div></div><p class="pnReviewText">${esc(r.message)}</p><div class="pnReviewFoot"><span class="pnReviewBadge ${esc(st)}">${esc(st)}</span>${actions}</div></article>`;
  }).join('');
}

async function loadRows({quiet=false}={}){
  const token=sessionStorage.getItem(TOKEN_KEY)||'';
  if(!token){rows=[];online=false;render();setState('error','Sesi moderasi belum aktif. Klik HUBUNGKAN MODERASI.');return false;}
  if(!quiet)setState('loading','Memuat antrean ulasan dari database pusat...');
  try{
    const r=await jsonp('reviewAdminList',{token},22000);
    rows=Array.isArray(r.reviews)?r.reviews:[];
    rows.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    online=true;
    const pending=stats();render();
    setState('online','✓ Database pusat terhubung • '+pending+' ulasan menunggu verifikasi.');
    updateConnectButton();
    return true;
  }catch(err){
    online=false;
    setState('error','Sesi moderasi tidak valid atau server belum memakai backend v6. '+err.message);
    updateConnectButton();
    return false;
  }
}

async function connect(username,password){
  if(connecting)return false;
  connecting=true;
  const token=randomToken();
  sessionStorage.setItem(TOKEN_KEY,token);
  setState('loading','Mengesahkan sesi moderasi ke database pusat...');
  try{
    await postHidden('reviewAdminLogin',{username,password,token},25000);
    for(const wait of [250,700,1600,3000]){
      await sleep(wait);
      if(await loadRows({quiet:true}))return true;
    }
    throw new Error('Token sesi belum dikenali server.');
  }catch(err){
    sessionStorage.removeItem(TOKEN_KEY);
    rows=[];online=false;render();
    setState('error','Gagal menghubungkan moderasi. Pastikan Apps Script sudah memakai backend v6 lalu Deploy versi baru. '+err.message);
    return false;
  }finally{
    connecting=false;updateConnectButton();
  }
}

async function moderate(id,status,button){
  if(!id)return;
  const token=sessionStorage.getItem(TOKEN_KEY)||'';
  if(!token){setState('error','Sesi moderasi belum aktif.');return;}
  let note='';
  if(status==='DITOLAK')note=prompt('Catatan penolakan (opsional):','')||'';
  if(status==='DIHAPUS'&&!confirm('Hapus ulasan ini?'))return;
  const old=button?.textContent;
  if(button){button.disabled=true;button.textContent='MEMPROSES...';}
  try{
    await postHidden('reviewModerate',{token,id,status,note},25000);
    let ok=false;
    for(const wait of [300,800,1600]){
      await sleep(wait);
      if(await loadRows({quiet:true})){
        const found=rows.find(r=>String(r.id)===String(id));
        if(found&&upper(found.status)===status){ok=true;break;}
      }
    }
    if(!ok)throw new Error('Perubahan belum terkonfirmasi di database.');
    setState('online',status==='DITERBITKAN'?'✓ Ulasan diterbitkan dan siap tampil di dashboard publik.':'✓ Status ulasan berhasil diperbarui.');
    window.dispatchEvent(new CustomEvent('pn:reviews-changed',{detail:{id,status}}));
    window.dispatchEvent(new CustomEvent('pn:review-public-refresh'));
  }catch(err){
    setState('error','Moderasi gagal. '+err.message);
  }finally{
    if(button){button.disabled=false;button.textContent=old;}
  }
}

function replaceControl(id,event,handler){
  const old=$(id);if(!old)return null;
  const neo=old.cloneNode(true);old.replaceWith(neo);neo.addEventListener(event,handler);return neo;
}

function updateConnectButton(){
  const btn=$('pnReviewDirectConnect');if(!btn)return;
  btn.textContent=online?'✓ MODERASI ONLINE':'🔐 HUBUNGKAN MODERASI';
}

function takeoverPanel(){
  const panel=$('pnReviewAdminPanel');if(!panel)return false;
  if(panel.dataset.sessionV10==='1')return true;
  panel.dataset.sessionV10='1';
  replaceControl('pnReviewRefresh','click',()=>loadRows());
  replaceControl('pnReviewSearch','input',render);
  replaceControl('pnReviewFilter','change',render);
  const tools=panel.querySelector('.pnReviewTools');
  if(tools){
    let btn=$('pnReviewDirectConnect');
    if(!btn){
      btn=document.createElement('button');btn.id='pnReviewDirectConnect';btn.type='button';btn.className='pnReviewRefresh';tools.appendChild(btn);
    }
    tools.style.gridTemplateColumns='minmax(180px,1fr) 160px auto auto';
    btn.onclick=async()=>{
      if(online){await loadRows();return;}
      const password=prompt('Masukkan password admin untuk menghubungkan moderasi:','');
      if(password===null)return;
      const username=(typeof PN_ADMIN_USER!=='undefined'&&PN_ADMIN_USER)||'admin';
      btn.disabled=true;
      try{await connect(username,password)}finally{btn.disabled=false}
    };
  }
  const list=$('pnReviewAdminList');
  if(list){
    list.onclick=e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      const card=btn.closest('[data-review-id]');
      moderate(card?.dataset.reviewId,upper(btn.dataset.action),btn);
    };
  }
  updateConnectButton();
  return true;
}

function installFastLogin(){
  window.submitAdminLogin=async function(ev){
    if(ev)ev.preventDefault();
    const username=$('adminUser')?.value.trim()||'';
    const password=$('adminPass')?.value||'';
    const err=$('loginError');
    const submit=document.querySelector('#loginModal .loginSubmit');
    if(err)err.textContent='';
    if(submit){submit.disabled=true;submit.textContent='MEMERIKSA...';}
    try{
      const hash=await sha256Hex(password);
      if(username!==PN_ADMIN_USER||hash!==PN_ADMIN_PASS_HASH){if(err)err.textContent='Username atau password admin salah.';return false;}
      sessionStorage.setItem('pnAdminAuth','1');
      closeAdminLogin();enterAdmin(true);
      setTimeout(()=>{
        takeoverPanel();
        connect(username,password);
      },120);
      return false;
    }finally{
      if(submit){submit.disabled=false;submit.textContent='MASUK';}
    }
  };
  window.submitAdminLogin.__reviewSessionV10=true;
}

function boot(){
  installFastLogin();
  setTimeout(()=>{
    if(!takeoverPanel())return;
    if(sessionStorage.getItem('pnAdminAuth')==='1'){
      if(sessionStorage.getItem(TOKEN_KEY))loadRows();
      else setState('error','Sesi moderasi belum aktif. Klik HUBUNGKAN MODERASI.');
    }
  },300);
}

document.addEventListener('DOMContentLoaded',boot);
})();
