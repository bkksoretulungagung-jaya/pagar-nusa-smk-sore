(()=>{
'use strict';

const REVIEW_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const REVIEW_SOURCE='pn-reviews';
const REVIEW_TOKEN_KEY='pnReviewAdminToken';
let selectedRating=0;
let adminRows=[];
let adminOnline=false;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(n)||0)));
const upper=v=>String(v||'').trim().toUpperCase();

function request(action,payload={}){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';
    form.action=REVIEW_ENDPOINT;
    form.target=frame.name;
    form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';input.name=name;input.value=String(value??'');
      form.appendChild(input);
    });

    let done=false;
    let submitStartedAt=0;
    let loadFallbackTimer=0;

    const cleanup=()=>{
      window.removeEventListener('message',onMessage);
      frame.removeEventListener('load',onLoad);
      clearTimeout(timer);
      clearTimeout(loadFallbackTimer);
      form.remove();
      setTimeout(()=>frame.remove(),250);
    };

    const finishOk=data=>{
      if(done)return;
      done=true;cleanup();resolve(data||{ok:true});
    };

    const onMessage=e=>{
      const d=e.data;
      if(done||!d||d.source!==REVIEW_SOURCE||d.rid!==rid)return;
      if(d.ok)finishOk(d);
      else{
        done=true;cleanup();reject(new Error(d.message||'Permintaan gagal.'));
      }
    };

    // iOS/HP tertentu menyimpan POST dengan benar tetapi postMessage dari
    // iframe Apps Script tidak sampai. Jika halaman respons POST sudah selesai
    // dimuat, khusus reviewSubmit kita anggap permintaan telah diterima server.
    const onLoad=()=>{
      if(done||action!=='reviewSubmit'||!submitStartedAt)return;
      if(Date.now()-submitStartedAt<500)return; // abaikan about:blank awal iframe
      clearTimeout(loadFallbackTimer);
      loadFallbackTimer=setTimeout(()=>{
        finishOk({ok:true,assumed:true,id:'',status:'PENDING'});
      },600);
    };

    window.addEventListener('message',onMessage);
    frame.addEventListener('load',onLoad);

    const timer=setTimeout(()=>{
      if(done)return;
      done=true;cleanup();
      reject(new Error('Server belum menyelesaikan permintaan. Coba lagi setelah beberapa saat.'));
    },45000);

    document.body.appendChild(frame);
    document.body.appendChild(form);
    submitStartedAt=Date.now();
    form.submit();
  });
}

function setFormStatus(type,text){
  const el=$('reviewStatus');
  if(!el)return;
  el.style.display='block';
  el.className='reviewStatus reviewStatus-'+type;
  el.textContent=text;
}

function setStars(n){
  selectedRating=Number(n)||0;
  const input=$('reviewRating');
  if(input)input.value=selectedRating?String(selectedRating):'';
  document.querySelectorAll('#reviewForm .reviewStarBtn').forEach(btn=>{
    btn.classList.toggle('active',Number(btn.dataset.rating)<=selectedRating);
  });
}

function installPublicForm(){
  const old=$('reviewForm');
  if(!old||old.dataset.professionalReviews==='1')return;
  const form=old.cloneNode(true);
  form.dataset.professionalReviews='1';
  old.replaceWith(form);
  selectedRating=0;

  form.querySelectorAll('.reviewStarBtn').forEach(btn=>btn.addEventListener('click',()=>setStars(btn.dataset.rating)));
  const submit=form.querySelector('.reviewSubmit');
  if(submit)submit.textContent='KIRIM UNTUK VERIFIKASI';
  const note=form.querySelector('.reviewFormNote');
  if(note)note.textContent='Ulasan disimpan ke database pusat dan tidak langsung tampil. Admin akan memeriksa lalu memilih Terbitkan, Tolak, atau Hapus.';

  const openBtn=$('reviewOpenBtn');
  const closeBtn=$('reviewCloseBtn');
  const wrap=$('reviewFormWrap');
  if(openBtn&&!openBtn.dataset.reviewProBound){
    openBtn.dataset.reviewProBound='1';
    openBtn.addEventListener('click',()=>{wrap?.classList.add('open');setTimeout(()=>wrap?.scrollIntoView({behavior:'smooth',block:'nearest'}),50);});
  }
  if(closeBtn&&!closeBtn.dataset.reviewProBound){
    closeBtn.dataset.reviewProBound='1';
    closeBtn.addEventListener('click',()=>wrap?.classList.remove('open'));
  }

  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    const name=$('reviewName')?.value.trim()||'';
    const role=$('reviewRole')?.value||'';
    const message=$('reviewMessage')?.value.trim()||'';
    if(!name||!role||!message||!selectedRating){
      setFormStatus('warn','Lengkapi nama, status, rating bintang, dan ulasan terlebih dahulu.');
      return;
    }
    if(name.length>60||message.length>500){
      setFormStatus('warn','Nama maksimal 60 karakter dan ulasan maksimal 500 karakter.');
      return;
    }
    if(submit){submit.disabled=true;submit.textContent='MENYIMPAN KE DATABASE...';}
    setFormStatus('info','Menghubungkan ke database ulasan...');
    try{
      const r=await request('reviewSubmit',{name,role,rating:selectedRating,message});
      setFormStatus('ok',r.assumed?'✓ Ulasan telah dikirim ke database. Status: MENUNGGU VERIFIKASI ADMIN.':'✓ Ulasan tersimpan dengan ID '+String(r.id||'')+'. Status: MENUNGGU VERIFIKASI ADMIN.');
      form.reset();setStars(0);
      window.dispatchEvent(new CustomEvent('pn:review-submitted'));
    }catch(err){
      setFormStatus('error','Gagal menyimpan. Tidak ada data yang disimpan di perangkat ini. Server ulasan perlu diaktifkan terlebih dahulu. '+err.message);
    }finally{
      if(submit){submit.disabled=false;submit.textContent='KIRIM UNTUK VERIFIKASI';}
    }
  });
}

function installStyles(){
  if($('pnReviewProfessionalStyles'))return;
  const s=document.createElement('style');
  s.id='pnReviewProfessionalStyles';
  s.textContent=`
  .reviewStatus{margin-top:10px;padding:10px 12px;border-radius:9px;font-size:10px;font-weight:800;line-height:1.55}
  .reviewStatus-info{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8}.reviewStatus-ok{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}.reviewStatus-warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}.reviewStatus-error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}
  .pnReviewPro{margin:0 0 18px;background:#f8faf9;border:1px solid #d7e4dc;border-radius:15px;overflow:hidden;box-shadow:0 8px 22px rgba(15,61,36,.08)}
  .pnReviewProHead{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:16px 18px;background:linear-gradient(135deg,#0f3d24,#166534);color:#fff}.pnReviewProHead h2{margin:0;font-size:15px;font-weight:1000;letter-spacing:.25px}.pnReviewProHead p{margin:4px 0 0;font-size:10px;line-height:1.5;color:#dcfce7}.pnReviewConn{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);font-size:9px;font-weight:1000;white-space:nowrap}.pnReviewConnDot{width:7px;height:7px;border-radius:50%;background:#f59e0b}.pnReviewConn.online .pnReviewConnDot{background:#4ade80}.pnReviewConn.offline .pnReviewConnDot{background:#f87171}
  .pnReviewProBody{padding:15px}.pnReviewStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:13px}.pnReviewStat{background:#fff;border:1px solid #dce7df;border-radius:10px;padding:11px}.pnReviewStat strong{display:block;color:#14532d;font-size:18px;line-height:1}.pnReviewStat span{display:block;margin-top:5px;color:#64748b;font-size:9px;font-weight:800}.pnReviewStat.pending strong{color:#b45309}.pnReviewStat.published strong{color:#15803d}.pnReviewStat.rejected strong{color:#b91c1c}
  .pnReviewTools{display:grid;grid-template-columns:minmax(180px,1fr) 170px auto;gap:8px;margin-bottom:11px}.pnReviewTools input,.pnReviewTools select{width:100%;box-sizing:border-box;border:1px solid #cbdad0;background:#fff;border-radius:9px;padding:9px 10px;color:#334155;font-size:10px;outline:none}.pnReviewTools input:focus,.pnReviewTools select:focus{border-color:#4d9a68;box-shadow:0 0 0 3px rgba(22,101,52,.08)}.pnReviewRefresh{border:0;border-radius:9px;padding:9px 13px;background:#14532d;color:#fff;font-size:9px;font-weight:1000;cursor:pointer}
  .pnReviewAdminMessage{margin-bottom:11px;padding:10px 12px;border-radius:9px;background:#fff;border:1px solid #dce7df;color:#475569;font-size:10px;line-height:1.55}.pnReviewAdminMessage.ok{background:#ecfdf3;border-color:#bbf7d0;color:#166534}.pnReviewAdminMessage.error{background:#fef2f2;border-color:#fecaca;color:#991b1b}
  .pnReviewAdminList{display:grid;gap:9px}.pnReviewAdminItem{background:#fff;border:1px solid #dbe7df;border-radius:11px;padding:13px}.pnReviewItemHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.pnReviewName{font-size:12px;font-weight:1000;color:#14532d}.pnReviewMeta{margin-top:3px;font-size:9px;color:#64748b}.pnReviewStars{font-size:12px;color:#e6a700;letter-spacing:1px}.pnReviewText{margin:10px 0;color:#334155;font-size:11px;line-height:1.65;white-space:pre-wrap}.pnReviewFoot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.pnReviewBadge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:8px;font-weight:1000;background:#fef3c7;color:#92400e}.pnReviewBadge.DITERBITKAN{background:#dcfce7;color:#166534}.pnReviewBadge.DITOLAK,.pnReviewBadge.DIHAPUS{background:#fee2e2;color:#991b1b}.pnReviewActions{display:flex;gap:6px;flex-wrap:wrap}.pnReviewActions button{border:0;border-radius:8px;padding:7px 10px;color:#fff;font-size:8px;font-weight:1000;cursor:pointer}.pnReviewPublish{background:#15803d}.pnReviewReject{background:#d97706}.pnReviewDelete{background:#b91c1c}.pnReviewEmpty{padding:22px;text-align:center;background:#fff;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;font-size:10px;line-height:1.6}
  @media(max-width:760px){.pnReviewProHead{align-items:flex-start;flex-direction:column}.pnReviewStats{grid-template-columns:1fr 1fr}.pnReviewTools{grid-template-columns:1fr}.pnReviewItemHead{display:block}.pnReviewStars{margin-top:6px}.pnReviewActions{width:100%;display:grid;grid-template-columns:1fr}.pnReviewActions button{width:100%}}
  `;
  document.head.appendChild(s);
}

function installAdminPanel(){
  installStyles();
  const main=document.querySelector('#adminApp main');
  if(!main)return;
  const old=$('pnReviewAdminPanel');if(old)old.remove();
  const panel=document.createElement('section');
  panel.id='pnReviewAdminPanel';panel.className='pnReviewPro';
  panel.innerHTML=`
    <div class="pnReviewProHead">
      <div><h2>★ MODERASI ULASAN WEBSITE</h2><p>Database terpusat • hanya ulasan berstatus DITERBITKAN yang tampil di dashboard publik.</p></div>
      <div id="pnReviewConnection" class="pnReviewConn"><span class="pnReviewConnDot"></span><span id="pnReviewConnectionText">MEMERIKSA SERVER</span></div>
    </div>
    <div class="pnReviewProBody">
      <div class="pnReviewStats">
        <div class="pnReviewStat pending"><strong id="pnReviewStatPending">0</strong><span>Menunggu</span></div>
        <div class="pnReviewStat published"><strong id="pnReviewStatPublished">0</strong><span>Diterbitkan</span></div>
        <div class="pnReviewStat rejected"><strong id="pnReviewStatRejected">0</strong><span>Ditolak / Dihapus</span></div>
        <div class="pnReviewStat"><strong id="pnReviewStatTotal">0</strong><span>Total</span></div>
      </div>
      <div class="pnReviewTools">
        <input id="pnReviewSearch" type="search" placeholder="Cari nama atau isi ulasan..." autocomplete="off">
        <select id="pnReviewFilter"><option value="ALL">Semua status</option><option value="PENDING">Menunggu</option><option value="DITERBITKAN">Diterbitkan</option><option value="DITOLAK">Ditolak</option><option value="DIHAPUS">Dihapus</option></select>
        <button id="pnReviewRefresh" class="pnReviewRefresh" type="button">↻ MUAT ULANG</button>
      </div>
      <div id="pnReviewAdminMessage" class="pnReviewAdminMessage">Menghubungkan ke database ulasan...</div>
      <div id="pnReviewAdminList" class="pnReviewAdminList"></div>
    </div>`;
  main.prepend(panel);
  $('pnReviewRefresh')?.addEventListener('click',loadAdminReviews);
  $('pnReviewSearch')?.addEventListener('input',renderAdminRows);
  $('pnReviewFilter')?.addEventListener('change',renderAdminRows);
}

function setConnection(online,text){
  adminOnline=!!online;
  const el=$('pnReviewConnection');if(el)el.className='pnReviewConn '+(online?'online':'offline');
  if($('pnReviewConnectionText'))$('pnReviewConnectionText').textContent=text|| (online?'ONLINE':'OFFLINE');
}
function setAdminMessage(type,text){
  const el=$('pnReviewAdminMessage');if(!el)return;
  el.className='pnReviewAdminMessage '+(type||'');el.textContent=text;
}

function formatDate(v){
  try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(v))}
  catch(_){return String(v||'')}
}

function updateStats(){
  const pending=adminRows.filter(r=>upper(r.status||'PENDING')==='PENDING').length;
  const published=adminRows.filter(r=>upper(r.status)==='DITERBITKAN').length;
  const rejected=adminRows.filter(r=>['DITOLAK','DIHAPUS'].includes(upper(r.status))).length;
  if($('pnReviewStatPending'))$('pnReviewStatPending').textContent=pending;
  if($('pnReviewStatPublished'))$('pnReviewStatPublished').textContent=published;
  if($('pnReviewStatRejected'))$('pnReviewStatRejected').textContent=rejected;
  if($('pnReviewStatTotal'))$('pnReviewStatTotal').textContent=adminRows.length;
}

function renderAdminRows(){
  updateStats();
  const list=$('pnReviewAdminList');if(!list)return;
  const q=String($('pnReviewSearch')?.value||'').trim().toLowerCase();
  const filter=upper($('pnReviewFilter')?.value||'ALL');
  const rows=adminRows.filter(r=>{
    const status=upper(r.status||'PENDING');
    const matchesStatus=filter==='ALL'||status===filter;
    const hay=[r.name,r.role,r.message,r.id].map(v=>String(v||'').toLowerCase()).join(' ');
    return matchesStatus&&(!q||hay.includes(q));
  });
  if(!rows.length){list.innerHTML='<div class="pnReviewEmpty">Tidak ada ulasan yang cocok dengan filter saat ini.</div>';return;}
  list.innerHTML=rows.slice(0,150).map(r=>{
    const st=upper(r.status||'PENDING');
    const actions=st==='PENDING'?`<div class="pnReviewActions"><button class="pnReviewPublish" data-action="DITERBITKAN" type="button">✓ TERBITKAN</button><button class="pnReviewReject" data-action="DITOLAK" type="button">✕ TOLAK</button><button class="pnReviewDelete" data-action="DIHAPUS" type="button">🗑 HAPUS</button></div>`:'';
    return `<article class="pnReviewAdminItem" data-review-id="${esc(r.id)}"><div class="pnReviewItemHead"><div><div class="pnReviewName">${esc(r.name)}</div><div class="pnReviewMeta">${esc(r.role||'-')} • ${esc(r.id||'-')} • ${formatDate(r.date)}</div></div><div class="pnReviewStars">${stars(r.rating)}</div></div><p class="pnReviewText">${esc(r.message)}</p><div class="pnReviewFoot"><span class="pnReviewBadge ${esc(st)}">${esc(st)}</span>${actions}</div></article>`;
  }).join('');
  list.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
    const card=btn.closest('[data-review-id]');moderate(card?.dataset.reviewId,btn.dataset.action,btn);
  }));
}

async function loadAdminReviews(){
  installAdminPanelIfNeeded();
  const token=sessionStorage.getItem(REVIEW_TOKEN_KEY)||'';
  if(!token){
    adminRows=[];renderAdminRows();setConnection(false,'SESI BELUM AKTIF');
    setAdminMessage('error','Sesi moderasi online belum aktif. Keluar dari admin lalu login kembali setelah backend Apps Script versi terbaru di-deploy.');
    return;
  }
  setAdminMessage('','Memuat antrean ulasan dari database pusat...');
  try{
    const r=await request('reviewAdminList',{token});
    adminRows=Array.isArray(r.reviews)?r.reviews:[];
    adminRows.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    setConnection(true,'DATABASE ONLINE');
    const pending=adminRows.filter(x=>upper(x.status||'PENDING')==='PENDING').length;
    setAdminMessage('ok','✓ Terhubung ke database pusat • '+pending+' ulasan menunggu verifikasi.');
    renderAdminRows();
  }catch(err){
    sessionStorage.removeItem(REVIEW_TOKEN_KEY);
    adminRows=[];renderAdminRows();setConnection(false,'SERVER OFFLINE');
    setAdminMessage('error','Database ulasan belum bisa diakses. Tidak ada perubahan yang dilakukan. '+err.message);
  }
}

function installAdminPanelIfNeeded(){if(!$('pnReviewAdminPanel'))installAdminPanel();}

async function moderate(id,status,button){
  if(!id||!adminOnline)return;
  const token=sessionStorage.getItem(REVIEW_TOKEN_KEY)||'';
  if(!token)return loadAdminReviews();
  let note='';
  if(status==='DITOLAK')note=prompt('Catatan penolakan (opsional):','')||'';
  if(status==='DIHAPUS'&&!confirm('Hapus ulasan ini dari antrean publik?'))return;
  const oldText=button?.textContent;
  if(button){button.disabled=true;button.textContent='MEMPROSES...';}
  try{
    await request('reviewModerate',{token,id,status,note});
    setAdminMessage('ok',status==='DITERBITKAN'?'✓ Ulasan berhasil diterbitkan dan akan tampil di dashboard publik.':'✓ Status ulasan berhasil diperbarui.');
    await loadAdminReviews();
    window.dispatchEvent(new CustomEvent('pn:reviews-changed',{detail:{id,status}}));
  }catch(err){
    setAdminMessage('error','Moderasi gagal. '+err.message);
  }finally{if(button){button.disabled=false;button.textContent=oldText;}}
}

function wrapAdminLogin(){
  const old=window.submitAdminLogin;
  if(typeof old!=='function'||old.__professionalReviews)return;
  const wrapped=async function(ev){
    if(ev)ev.preventDefault();
    const username=$('adminUser')?.value.trim()||'';
    const password=$('adminPass')?.value||'';
    const result=await old.call(this,ev);
    if(sessionStorage.getItem('pnAdminAuth')==='1'){
      installAdminPanelIfNeeded();
      setConnection(false,'MENGHUBUNGKAN...');
      setAdminMessage('','Login admin berhasil. Mengaktifkan sesi moderasi online...');
      try{
        const r=await request('reviewAdminLogin',{username,password});
        if(!r.token)throw new Error('Token sesi tidak diterima.');
        sessionStorage.setItem(REVIEW_TOKEN_KEY,r.token);
        await loadAdminReviews();
      }catch(err){
        sessionStorage.removeItem(REVIEW_TOKEN_KEY);
        setConnection(false,'BACKEND BELUM AKTIF');
        setAdminMessage('error','Login dashboard berhasil, tetapi backend ulasan belum aktif. Deploy Apps Script versi terbaru untuk mengaktifkan moderasi online.');
      }
    }
    return result;
  };
  wrapped.__professionalReviews=true;
  window.submitAdminLogin=wrapped;
}

function wrapNavigation(){
  const oldShow=window.showPublicDashboard;
  if(typeof oldShow==='function'&&!oldShow.__professionalReviews){
    const wrapped=function(...args){const out=oldShow.apply(this,args);window.dispatchEvent(new CustomEvent('pn:review-public-refresh'));return out;};
    wrapped.__professionalReviews=true;window.showPublicDashboard=wrapped;
  }
  const oldLogout=window.logoutAdmin;
  if(typeof oldLogout==='function'&&!oldLogout.__professionalReviews){
    const wrapped=function(...args){sessionStorage.removeItem(REVIEW_TOKEN_KEY);adminRows=[];return oldLogout.apply(this,args);};
    wrapped.__professionalReviews=true;window.logoutAdmin=wrapped;
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  installStyles();
  installPublicForm();
  installAdminPanel();
  wrapAdminLogin();
  wrapNavigation();
  if(sessionStorage.getItem('pnAdminAuth')==='1')setTimeout(loadAdminReviews,150);
});
})();
