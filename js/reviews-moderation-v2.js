(()=>{
'use strict';

const PN_REVIEW_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const PN_REVIEW_SOURCE='pn-reviews';
const PN_REVIEW_LOCAL_KEY='pnReviewPendingV2';
const PN_REVIEW_LOCAL_PUBLISHED_KEY='pnReviewPublishedV2';
let pnReviewSelectedRating=0;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(n)||0)));

function pnReviewRequest(action,payload={}){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=PN_REVIEW_ENDPOINT;form.target=frame.name;form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([name,value])=>{
      const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);
    });
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),500)};
    const onMessage=event=>{
      const d=event.data;
      if(!d||d.source!==PN_REVIEW_SOURCE||d.rid!==rid||done)return;
      done=true;cleanup();d.ok?resolve(d):reject(new Error(d.message||'Permintaan ulasan gagal.'));
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Server ulasan belum merespons.'))},9000);
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

function localRead(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function localWrite(key,data){try{localStorage.setItem(key,JSON.stringify(data))}catch(_){}}
function formatDate(v){try{return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v))}catch(_){return String(v||'')}}

function renderPublicReviews(data){
  const list=$('reviewList'),bars=$('reviewBars');if(!list||!bars)return;
  const valid=(Array.isArray(data)?data:[]).filter(r=>Number(r.rating)>=1&&Number(r.rating)<=5&&r.name&&r.message);
  valid.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const total=valid.length,avg=total?valid.reduce((s,r)=>s+Number(r.rating),0)/total:0;
  if($('reviewAvg'))$('reviewAvg').textContent=avg.toFixed(1);
  if($('reviewAvgStars'))$('reviewAvgStars').textContent=total?stars(Math.round(avg)):'☆☆☆☆☆';
  if($('reviewTotal'))$('reviewTotal').textContent=String(total);
  bars.innerHTML=[5,4,3,2,1].map(n=>{const c=valid.filter(r=>Number(r.rating)===n).length,p=total?Math.round(c/total*100):0;return `<div class="reviewBarRow"><span>${n}★</span><div class="reviewBar"><div class="reviewBarFill" style="width:${p}%"></div></div><span>${p}%</span></div>`}).join('');
  if(!total){list.innerHTML='<div class="reviewEmpty"><b>Belum ada ulasan yang diterbitkan.</b><br>Ulasan baru akan tampil setelah disetujui admin.</div>';return}
  list.innerHTML=valid.slice(0,6).map(r=>`<article class="reviewCard"><div class="reviewCardTop"><span class="reviewCardStars">${stars(r.rating)}</span><span class="reviewCardDate">${formatDate(r.date)}</span></div><p class="reviewCardText">“${esc(r.message)}”</p><div class="reviewCardFoot"><div class="reviewCardName">${esc(r.name)}</div><span class="reviewVerified">✓ ${esc(r.role||'Pengunjung')} Terverifikasi</span></div></article>`).join('');
}

async function loadPublicReviews(){
  try{const r=await pnReviewRequest('reviewPublicList');renderPublicReviews(r.reviews||[]);return}catch(_){}
  let base=[];try{const res=await fetch('data/reviews.json?v=42',{cache:'no-store'});if(res.ok)base=await res.json()}catch(_){}
  renderPublicReviews([...(Array.isArray(base)?base:[]),...localRead(PN_REVIEW_LOCAL_PUBLISHED_KEY)]);
}

function setStars(n){
  pnReviewSelectedRating=Number(n)||0;
  const hidden=$('reviewRating');if(hidden)hidden.value=pnReviewSelectedRating?String(pnReviewSelectedRating):'';
  document.querySelectorAll('#reviewForm .reviewStarBtn').forEach(b=>b.classList.toggle('active',Number(b.dataset.rating)<=pnReviewSelectedRating));
}

function installPublicForm(){
  const old=$('reviewForm');if(!old)return;
  const form=old.cloneNode(true);old.replaceWith(form);pnReviewSelectedRating=0;
  form.querySelectorAll('.reviewStarBtn').forEach(b=>b.addEventListener('click',()=>setStars(b.dataset.rating)));
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    const name=$('reviewName')?.value.trim()||'',role=$('reviewRole')?.value||'',message=$('reviewMessage')?.value.trim()||'',status=$('reviewStatus');
    if(!name||!role||!message||!pnReviewSelectedRating){if(status){status.style.display='block';status.textContent='Lengkapi nama, status, rating bintang, dan ulasan.'}return}
    const btn=form.querySelector('.reviewSubmit');if(btn){btn.disabled=true;btn.textContent='MENYIMPAN...'}
    try{
      await pnReviewRequest('reviewSubmit',{name,role,rating:pnReviewSelectedRating,message});
      if(status){status.style.display='block';status.textContent='✓ Ulasan sudah masuk ke antrean verifikasi admin. Ulasan belum tampil sampai disetujui.'}
      form.reset();setStars(0);
    }catch(_){
      const rows=localRead(PN_REVIEW_LOCAL_KEY);rows.push({id:'LOCAL-'+Date.now(),date:new Date().toISOString(),name,role,rating:pnReviewSelectedRating,message,status:'PENDING',note:'Mode lokal'});localWrite(PN_REVIEW_LOCAL_KEY,rows);
      if(status){status.style.display='block';status.textContent='✓ Ulasan masuk ke antrean admin pada perangkat ini. Backend online perlu diperbarui agar antrean tersimpan lintas perangkat.'}
      form.reset();setStars(0);
    }finally{if(btn){btn.disabled=false;btn.textContent='KIRIM ULASAN UNTUK VERIFIKASI'}}
  });
  const submit=form.querySelector('.reviewSubmit');if(submit)submit.textContent='KIRIM ULASAN UNTUK VERIFIKASI';
  const note=form.querySelector('.reviewFormNote');if(note)note.textContent='Ulasan tidak langsung tampil. Setelah dikirim, ulasan masuk ke LOGIN ADMIN untuk diperiksa lalu admin dapat memilih Terbitkan, Tolak, atau Hapus.';
}

function installAdminStyles(){
  if($('pnReviewAdminStyles'))return;const s=document.createElement('style');s.id='pnReviewAdminStyles';s.textContent=`
  .pnReviewAdmin{margin:0 0 16px;background:#fff;border:1px solid #d7e4dc;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(15,61,36,.07)}
  .pnReviewAdminHead{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 17px;background:#0f3d24;color:#fff}.pnReviewAdminHead h2{margin:0;font-size:15px}.pnReviewAdminHead p{margin:3px 0 0;font-size:10px;opacity:.9}.pnReviewRefresh{border:1px solid rgba(255,255,255,.25);background:#fff;color:#14532d;border-radius:9px;padding:8px 12px;font-weight:900;cursor:pointer}
  .pnReviewAdminBody{padding:15px}.pnReviewAdminStatus{margin:0 0 12px;padding:10px 12px;border-radius:9px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:10px;line-height:1.55}.pnReviewAdminStatus.ok{background:#ecfdf3;border-color:#bbf7d0;color:#166534}.pnReviewAdminStatus.warn{background:#fff7ed;border-color:#fed7aa;color:#9a3412}
  .pnReviewAdminList{display:grid;gap:10px}.pnReviewAdminItem{padding:13px;border:1px solid #dbe7df;border-radius:11px;background:#fff}.pnReviewAdminTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.pnReviewAdminName{font-size:12px;font-weight:1000;color:#14532d}.pnReviewAdminMeta{margin-top:3px;color:#64748b;font-size:9px}.pnReviewAdminStars{color:#e6a700;font-size:12px}.pnReviewAdminText{margin:10px 0;color:#334155;font-size:11px;line-height:1.65}.pnReviewAdminBadge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:1000;background:#fef3c7;color:#92400e}.pnReviewAdminBadge.published{background:#dcfce7;color:#166534}.pnReviewAdminBadge.rejected{background:#fee2e2;color:#991b1b}.pnReviewAdminActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.pnReviewAdminActions button{border:0;border-radius:8px;padding:8px 11px;font-size:9px;font-weight:1000;cursor:pointer}.pnReviewPublish{background:#166534;color:#fff}.pnReviewReject{background:#f59e0b;color:#fff}.pnReviewDelete{background:#b91c1c;color:#fff}.pnReviewEmpty{padding:18px;text-align:center;color:#64748b;font-size:11px;border:1px dashed #cbd5e1;border-radius:10px}
  @media(max-width:680px){.pnReviewAdminHead{align-items:flex-start;flex-direction:column}.pnReviewRefresh{width:100%}.pnReviewAdminTop{display:block}.pnReviewAdminStars{margin-top:7px}.pnReviewAdminActions{display:grid;grid-template-columns:1fr}.pnReviewAdminActions button{width:100%}}
  `;document.head.appendChild(s);
}

function installAdminPanel(){
  installAdminStyles();if($('pnReviewAdminPanel'))return;
  const main=document.querySelector('#adminApp main');if(!main)return;
  const panel=document.createElement('section');panel.id='pnReviewAdminPanel';panel.className='pnReviewAdmin';panel.innerHTML=`<div class="pnReviewAdminHead"><div><h2>★ VERIFIKASI ULASAN WEBSITE</h2><p>Periksa ulasan sebelum ditampilkan pada dashboard publik.</p></div><button id="pnReviewRefresh" class="pnReviewRefresh" type="button">↻ MUAT ULANG</button></div><div class="pnReviewAdminBody"><div id="pnReviewAdminStatus" class="pnReviewAdminStatus">Memuat antrean ulasan...</div><div id="pnReviewAdminList" class="pnReviewAdminList"></div></div>`;
  main.prepend(panel);$('pnReviewRefresh')?.addEventListener('click',loadAdminReviews);
}

function renderAdminReviews(rows,online){
  const list=$('pnReviewAdminList'),state=$('pnReviewAdminStatus');if(!list||!state)return;
  const data=(Array.isArray(rows)?rows:[]).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const pending=data.filter(r=>String(r.status||'PENDING').toUpperCase()==='PENDING').length;
  state.className='pnReviewAdminStatus '+(online?'ok':'warn');state.textContent=online?`✓ Terhubung ke database online • ${pending} ulasan menunggu verifikasi`:`Mode lokal • ${pending} ulasan menunggu verifikasi pada perangkat ini. Login ulang setelah backend Apps Script diperbarui untuk mode online.`;
  if(!data.length){list.innerHTML='<div class="pnReviewEmpty">Belum ada ulasan yang menunggu atau sudah dimoderasi.</div>';return}
  list.innerHTML=data.slice(0,100).map(r=>{const st=String(r.status||'PENDING').toUpperCase(),cls=st==='DITERBITKAN'?'published':(st==='DITOLAK'||st==='DIHAPUS'?'rejected':'');return `<article class="pnReviewAdminItem" data-review-id="${esc(r.id)}"><div class="pnReviewAdminTop"><div><div class="pnReviewAdminName">${esc(r.name)}</div><div class="pnReviewAdminMeta">${esc(r.role||'-')} • ${formatDate(r.date)}</div></div><div class="pnReviewAdminStars">${stars(r.rating)}</div></div><p class="pnReviewAdminText">${esc(r.message)}</p><span class="pnReviewAdminBadge ${cls}">${esc(st)}</span>${st==='PENDING'?`<div class="pnReviewAdminActions"><button class="pnReviewPublish" data-action="DITERBITKAN" type="button">✓ TERBITKAN</button><button class="pnReviewReject" data-action="DITOLAK" type="button">✕ TOLAK</button><button class="pnReviewDelete" data-action="DIHAPUS" type="button">🗑 HAPUS</button></div>`:''}</article>`}).join('');
  list.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>moderateReview(btn.closest('[data-review-id]')?.dataset.reviewId,btn.dataset.action,online)));
}

async function loadAdminReviews(){
  installAdminPanel();const token=sessionStorage.getItem('pnReviewAdminToken')||'';
  if(token){try{const r=await pnReviewRequest('reviewAdminList',{token});renderAdminReviews(r.reviews||[],true);return}catch(_){sessionStorage.removeItem('pnReviewAdminToken')}}
  renderAdminReviews(localRead(PN_REVIEW_LOCAL_KEY),false);
}

async function moderateReview(id,status,online){
  if(!id)return;let note='';if(status==='DITOLAK')note=prompt('Catatan penolakan (opsional):','')||'';if(status==='DIHAPUS'&&!confirm('Tandai ulasan ini sebagai dihapus?'))return;
  if(online){
    const token=sessionStorage.getItem('pnReviewAdminToken')||'';
    try{await pnReviewRequest('reviewModerate',{token,id,status,note});await loadAdminReviews();await loadPublicReviews();return}catch(err){alert('Moderasi online gagal: '+err.message);return}
  }
  const rows=localRead(PN_REVIEW_LOCAL_KEY),i=rows.findIndex(r=>String(r.id)===String(id));if(i<0)return;const row=rows[i];row.status=status;row.note=note;row.verifiedAt=new Date().toISOString();row.verifiedBy='admin';
  if(status==='DITERBITKAN'){const pub=localRead(PN_REVIEW_LOCAL_PUBLISHED_KEY);pub.push({...row});localWrite(PN_REVIEW_LOCAL_PUBLISHED_KEY,pub)}
  localWrite(PN_REVIEW_LOCAL_KEY,rows);renderAdminReviews(rows,false);loadPublicReviews();
}

function wrapAdminLogin(){
  if(typeof window.submitAdminLogin!=='function'||window.submitAdminLogin.__reviewWrapped)return;
  const wrapped=async function(ev){
    if(ev)ev.preventDefault();
    const u=$('adminUser')?.value.trim()||'',p=$('adminPass')?.value||'',err=$('loginError');
    const hash=typeof sha256Hex==='function'?await sha256Hex(p):'';
    if(typeof PN_ADMIN_USER!=='undefined'&&typeof PN_ADMIN_PASS_HASH!=='undefined'&&u===PN_ADMIN_USER&&hash===PN_ADMIN_PASS_HASH){
      try{const auth=await pnReviewRequest('reviewAdminLogin',{username:u,password:p});if(auth.token)sessionStorage.setItem('pnReviewAdminToken',auth.token)}catch(_){sessionStorage.removeItem('pnReviewAdminToken')}
      sessionStorage.setItem('pnAdminAuth','1');if(typeof closeAdminLogin==='function')closeAdminLogin();if(typeof enterAdmin==='function')enterAdmin(true);setTimeout(loadAdminReviews,180);
    }else if(err)err.textContent='Username atau password admin salah.';
    return false;
  };
  wrapped.__reviewWrapped=true;window.submitAdminLogin=wrapped;
}

document.addEventListener('DOMContentLoaded',()=>{
  installPublicForm();installAdminPanel();wrapAdminLogin();loadPublicReviews();
  if(sessionStorage.getItem('pnAdminAuth')==='1')setTimeout(loadAdminReviews,220);
});
})();
