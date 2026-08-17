(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const SOURCE='pn-content';
let publicGallery=[];
let adminContent=[];
let adminGallery=[];
let editingContentId='';
let editingGalleryId='';
let activeTab='content';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const makeRid=()=>`cms-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function jsonp(action,payload={},timeout=18000){
  return new Promise((resolve,reject)=>{
    const cb='pnCmsCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');
    let done=false;
    const clean=()=>{clearTimeout(timer);delete window[cb];script.remove()};
    window[cb]=data=>{if(done)return;done=true;clean();resolve(data)};
    const params=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>params.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+params.toString();
    script.async=true;
    script.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Koneksi database konten gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Database konten terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

async function postReliable(action,payload={},timeout=45000){
  const rid=makeRid();
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');
    frame.name='pnCmsFrame_'+rid.replace(/\W/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([k,v])=>{
      const input=document.createElement('input');input.type='hidden';input.name=k;input.value=String(v??'');form.appendChild(input);
    });

    let done=false;
    let pollTimer=0;
    let hardTimer=0;

    const cleanup=()=>{
      if(pollTimer)clearTimeout(pollTimer);
      if(hardTimer)clearTimeout(hardTimer);
      window.removeEventListener('message',onMessage);
      setTimeout(()=>frame.remove(),120);
    };
    const succeed=data=>{if(done)return;done=true;cleanup();resolve(data)};
    const fail=err=>{if(done)return;done=true;cleanup();reject(err instanceof Error?err:new Error(String(err||'Koneksi server konten gagal.')))};

    const onMessage=e=>{
      const d=e&&e.data;
      if(!d||d.source!==SOURCE||String(d.rid||'')!==rid)return;
      if(d.ok)succeed(d);
      else fail(new Error(d.message||'Perubahan konten ditolak server.'));
    };
    window.addEventListener('message',onMessage);

    const poll=async()=>{
      if(done)return;
      try{
        const r=await jsonp('contentResult',{rid},6500);
        if(done)return;
        if(r&&r.pending){pollTimer=setTimeout(poll,700);return}
        if(r&&r.ok){succeed(r);return}
        if(r&&!r.pending){fail(new Error(r.message||'Perubahan konten ditolak server.'));return}
      }catch(_){
        if(!done)pollTimer=setTimeout(poll,900);
      }
    };

    hardTimer=setTimeout(()=>fail(new Error('Server konten tidak merespons tepat waktu. Silakan coba lagi.')),timeout);
    document.body.append(frame,form);
    form.submit();
    form.remove();
    pollTimer=setTimeout(poll,1200);
  });
}

function ensureStyles(){
  if($('pnCmsStyles'))return;
  const s=document.createElement('style');s.id='pnCmsStyles';s.textContent=`
  .pnCmsCard{border:1px solid #b9d4c2!important;overflow:hidden}.pnCmsHead{display:flex;justify-content:space-between;align-items:center;gap:12px}.pnCmsHeadActions{display:flex;gap:7px;flex-wrap:wrap}.pnCmsBtn{border:0;border-radius:8px;padding:9px 12px;font-weight:900;cursor:pointer}.pnCmsBtn.green{background:#166534;color:#fff}.pnCmsBtn.teal{background:#0f766e;color:#fff}.pnCmsBtn.light{background:#e8f1eb;color:#14532d}.pnCmsBtn.red{background:#fee2e2;color:#991b1b}.pnCmsBtn:disabled{opacity:.55;cursor:not-allowed}.pnCmsStatus{margin:0 0 12px;padding:9px 11px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;color:#92400e;font-size:11px;font-weight:800}.pnCmsStatus.ok{background:#ecfdf3;border-color:#bbf7d0;color:#166534}.pnCmsStatus.err{background:#fef2f2;border-color:#fecaca;color:#991b1b}.pnCmsTabs{display:flex;gap:8px;margin-bottom:13px}.pnCmsTab{flex:1;border:1px solid #cfe0d5;border-radius:9px;padding:10px;background:#f7fbf8;color:#14532d;font-weight:900;cursor:pointer}.pnCmsTab.active{background:#14532d;color:#fff;border-color:#14532d}.pnCmsGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}.pnCmsField.full{grid-column:1/-1}.pnCmsField label{display:block;margin:0 0 5px;font-size:10px;font-weight:900;color:#334155}.pnCmsField input,.pnCmsField select,.pnCmsField textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:9px 10px;background:#fff;font:inherit;font-size:11px}.pnCmsField textarea{min-height:84px;resize:vertical}.pnCmsActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pnCmsList{display:grid;gap:9px;margin-top:15px}.pnCmsItem{display:grid;grid-template-columns:1fr auto;gap:10px;padding:11px;border:1px solid #dbe7df;border-radius:10px;background:#fff}.pnCmsItem h4{margin:0 0 5px;color:#14532d;font-size:12px}.pnCmsItem p{margin:0;color:#64748b;font-size:10px;line-height:1.55}.pnCmsItemBtns{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pnCmsMini{border:0;border-radius:7px;padding:7px 8px;font-size:9px;font-weight:900;cursor:pointer}.pnCmsMini.edit{background:#e0f2fe;color:#075985}.pnCmsMini.del{background:#fee2e2;color:#991b1b}.pnCmsMini.pub{background:#dcfce7;color:#166534}.pnCmsGalleryItem{grid-template-columns:82px 1fr auto;align-items:center}.pnCmsThumb{width:82px;height:62px;object-fit:cover;border-radius:8px;border:1px solid #dbe7df;background:#f1f5f9}.pnCmsPreview{width:100%;max-height:220px;object-fit:contain;border-radius:10px;background:#f8fafc;border:1px dashed #cbd5e1;margin-top:7px}.pnCmsHidden{display:none!important}.pnCmsPublicModal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.66)}.pnCmsPublicModalCard{width:min(720px,100%);max-height:85vh;overflow:auto;background:#fff;border-radius:15px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.pnCmsPublicModalHead{padding:18px 20px;background:#14532d;color:#fff}.pnCmsPublicModalHead h3{margin:0;font-size:18px}.pnCmsPublicModalHead p{margin:6px 0 0;font-size:11px;opacity:.9}.pnCmsPublicModalBody{padding:20px;color:#334155;font-size:13px;line-height:1.8;white-space:normal;text-align:justify;text-justify:inter-word}.pnCmsPublicModalBody p{margin:0 0 14px;text-align:justify;text-justify:inter-word}.pnCmsPublicModalBody p:last-child{margin-bottom:0}.pnCmsPublicModalClose{float:right;border:0;background:rgba(255,255,255,.16);color:#fff;width:32px;height:32px;border-radius:50%;font-size:20px;cursor:pointer}
  @media(max-width:760px){.pnCmsGrid{grid-template-columns:1fr}.pnCmsField.full{grid-column:auto}.pnCmsHead{align-items:flex-start;flex-direction:column}.pnCmsItem,.pnCmsGalleryItem{grid-template-columns:1fr}.pnCmsThumb{width:100%;height:150px}.pnCmsItemBtns{justify-content:flex-start}.pnCmsTabs{display:grid;grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);
}

function newsIcon(type){const t=String(type||'').toUpperCase();if(t.includes('PENGUMUMAN'))return'📢';if(t.includes('INFORMASI'))return'ℹ️';if(t.includes('PRESTASI'))return'🏆';if(t.includes('ORGANISASI'))return'🏛️';return'📰'}

function formatPublicBody(value){
  const text=String(value??'').replace(/\r\n?/g,'\n').trim();
  if(!text)return '';
  return text.split(/\n\s*\n/).map(block=>{
    const clean=block.replace(/\n+/g,' ').replace(/\s+/g,' ').trim();
    return clean?`<p>${esc(clean)}</p>`:'';
  }).join('');
}

function applyPublicNews(items){
  items=Array.isArray(items)?items.filter(item=>String(item?.id||'')!=='CFG-REGISTRATION'&&String(item?.type||'').toUpperCase()!=='PENGATURAN'):[];
  if(!items.length)return;
  const grid=document.querySelector('.newsSection .newsGrid');if(!grid)return;
  grid.innerHTML='';
  items.forEach(item=>{
    const article=document.createElement('article');article.className='newsCard';
    const icon=document.createElement('div');icon.className='newsIcon';icon.setAttribute('aria-hidden','true');icon.textContent=newsIcon(item.type||item.badge);
    const meta=document.createElement('div');meta.className='newsMeta';
    const date=document.createElement('span');date.className='newsDate';date.textContent=item.date||'';
    const badge=document.createElement('span');badge.className='newsBadge';badge.textContent=item.badge||item.type||'INFORMASI';
    meta.append(date,badge);
    const h=document.createElement('h3');h.textContent=item.title||'';
    const p=document.createElement('p');p.textContent=item.summary||item.body||'';
    article.append(icon,meta,h,p);
    if(item.link){const a=document.createElement('a');a.className='newsReadMore';a.href=item.link;a.textContent='BACA SELENGKAPNYA →';article.appendChild(a)}
    else if(item.body){const b=document.createElement('button');b.className='newsReadMore';b.type='button';b.style.border='0';b.style.background='transparent';b.style.padding='0';b.style.cursor='pointer';b.textContent='BACA INFORMASI →';b.onclick=()=>openPublicInfo(item);article.appendChild(b)}
    grid.appendChild(article);
  });
  const ticker=document.querySelector('.newsTickerTrack');if(ticker)ticker.textContent='  '+items.map(x=>x.title).filter(Boolean).join('   •   ')+'   •   ';
}

function openPublicInfo(item){
  ensureStyles();$('pnCmsPublicModal')?.remove();
  const modal=document.createElement('div');modal.id='pnCmsPublicModal';modal.className='pnCmsPublicModal';
  modal.innerHTML=`<div class="pnCmsPublicModalCard"><div class="pnCmsPublicModalHead"><button class="pnCmsPublicModalClose" type="button">×</button><h3>${esc(item.title)}</h3><p>${esc(item.date||'')} · ${esc(item.badge||item.type||'INFORMASI')}</p></div><div class="pnCmsPublicModalBody">${formatPublicBody(item.body||item.summary||'')}</div></div>`;
  modal.querySelector('.pnCmsPublicModalClose').onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};document.body.appendChild(modal);
}

function applyPublicGallery(items){
  if(!Array.isArray(items)||!items.length)return;
  publicGallery=items.slice();
  const strip=document.querySelector('#gallerySection .galleryStrip');if(!strip)return;
  strip.innerHTML='';
  items.forEach((item,i)=>{
    const btn=document.createElement('button');btn.className='galleryItem';btn.type='button';btn.dataset.galleryIndex=String(i);btn.setAttribute('aria-label','Buka '+(item.title||('foto dokumentasi '+(i+1))));
    const img=document.createElement('img');img.src=item.url;img.alt=item.alt||item.title||('Dokumentasi kegiatan Pagar Nusa '+(i+1));img.loading='lazy';
    const zoom=document.createElement('span');zoom.className='galleryZoom';zoom.textContent='⌕';
    const overlay=document.createElement('span');overlay.className='galleryOverlay';overlay.textContent=item.title||('Dokumentasi Kegiatan • Foto '+(i+1));
    btn.append(img,zoom,overlay);btn.onclick=()=>window.openGallery(i);strip.appendChild(btn);
  });
  const badge=document.querySelector('#gallerySection .galleryHead .badge');if(badge)badge.textContent=items.length+' FOTO';
  window.openGallery=function(i){
    if(!publicGallery.length)return;const idx=((Number(i)||0)%publicGallery.length+publicGallery.length)%publicGallery.length;window.pnManagedGalleryIndex=idx;
    const box=$('galleryLightbox'),img=$('galleryLightboxImg'),cap=$('galleryCaption');if(!box||!img)return;const item=publicGallery[idx];img.src=item.url;img.alt=item.alt||item.title||'Foto galeri';if(cap)cap.textContent=(item.title||'Dokumentasi Kegiatan Pagar Nusa')+' • Foto '+(idx+1)+' dari '+publicGallery.length;box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  };
  window.stepGallery=function(dir){const n=publicGallery.length;if(!n)return;window.pnManagedGalleryIndex=((window.pnManagedGalleryIndex||0)+Number(dir||0)+n)%n;window.openGallery(window.pnManagedGalleryIndex)};
}

async function loadPublic(){
  try{
    const r=await jsonp('contentPublicList',{},18000);
    if(!r||!r.ok)return;
    window.__pnCmsPublicData=r;
    window.__pnCmsPublicLoadedAt=Date.now();
    window.dispatchEvent(new CustomEvent('pn:cms-public-data',{detail:r}));
    applyPublicNews(r.content||[]);
    applyPublicGallery(r.gallery||[]);
  }catch(_){/* static content remains as fallback */}
}

function panelHtml(){return `
  <div class="card pnCmsCard" id="pnContentAdminPanel">
    <div class="cardTitle pnCmsHead"><span>⚙️ KELOLA FOTO, KABAR & INFORMASI WEBSITE</span><div class="pnCmsHeadActions"><button id="pnCmsConnect" class="pnCmsBtn teal" type="button">🔐 HUBUNGKAN AKSES</button><button id="pnCmsReload" class="pnCmsBtn light" type="button">↻ MUAT ULANG</button></div></div>
    <div class="cardBody">
      <div id="pnCmsStatus" class="pnCmsStatus">Memeriksa akses pengelola konten...</div>
      <div class="pnCmsTabs"><button id="pnCmsTabContent" class="pnCmsTab active" type="button">📰 KABAR & INFORMASI</button><button id="pnCmsTabGallery" class="pnCmsTab" type="button">🖼️ GALERI / FOTO</button></div>
      <section id="pnCmsContentPane">
        <div class="pnCmsGrid">
          <div class="pnCmsField"><label>Jenis</label><select id="pnCmsType"><option>BERITA</option><option>INFORMASI</option><option>PENGUMUMAN</option><option>PRESTASI</option><option>ORGANISASI</option><option>KEGIATAN</option></select></div>
          <div class="pnCmsField"><label>Status</label><select id="pnCmsContentStatus"><option value="PUBLIK">PUBLIK / TAMPIL</option><option value="DRAFT">DRAFT / SEMBUNYI</option></select></div>
          <div class="pnCmsField full"><label>Judul</label><input id="pnCmsTitle" maxlength="160" placeholder="Judul kabar atau informasi"></div>
          <div class="pnCmsField full"><label>Ringkasan untuk kartu dashboard</label><textarea id="pnCmsSummary" maxlength="700" placeholder="Ringkasan singkat yang tampil di dashboard"></textarea></div>
          <div class="pnCmsField full"><label>Isi lengkap / informasi</label><textarea id="pnCmsBody" maxlength="6000" placeholder="Isi lengkap. Jika link berita dikosongkan, isi ini dapat dibaca langsung dari dashboard."></textarea></div>
          <div class="pnCmsField"><label>Tanggal</label><input id="pnCmsDate" type="date"></div>
          <div class="pnCmsField"><label>Badge / Label</label><input id="pnCmsBadge" maxlength="30" placeholder="Contoh: KEGIATAN"></div>
          <div class="pnCmsField"><label>Urutan</label><input id="pnCmsOrder" type="number" min="1" max="999" value="1"></div>
          <div class="pnCmsField"><label>Link berita (opsional)</label><input id="pnCmsLink" maxlength="500" placeholder="berita-....html atau https://..."></div>
        </div>
        <div class="pnCmsActions"><button id="pnCmsSaveContent" class="pnCmsBtn green" type="button">💾 SIMPAN & PUBLIKASIKAN</button><button id="pnCmsNewContent" class="pnCmsBtn light" type="button">＋ DATA BARU</button></div>
        <div id="pnCmsContentList" class="pnCmsList"></div>
      </section>
      <section id="pnCmsGalleryPane" class="pnCmsHidden">
        <div class="pnCmsGrid">
          <div class="pnCmsField full"><label>Pilih foto dari HP / komputer</label><input id="pnCmsImageFile" type="file" accept="image/jpeg,image/png,image/webp"><img id="pnCmsImagePreview" class="pnCmsPreview pnCmsHidden" alt="Preview foto"></div>
          <div class="pnCmsField full"><label>Judul / Keterangan foto</label><input id="pnCmsGalleryTitle" maxlength="160" placeholder="Contoh: Latihan rutin Agustus 2026"></div>
          <div class="pnCmsField"><label>Alt text</label><input id="pnCmsGalleryAlt" maxlength="180" placeholder="Keterangan gambar untuk aksesibilitas"></div>
          <div class="pnCmsField"><label>Status</label><select id="pnCmsGalleryStatus"><option value="PUBLIK">PUBLIK / TAMPIL</option><option value="DRAFT">DRAFT / SEMBUNYI</option></select></div>
          <div class="pnCmsField"><label>Urutan</label><input id="pnCmsGalleryOrder" type="number" min="1" max="999" value="1"></div>
          <div class="pnCmsField"><label>Catatan admin</label><input id="pnCmsGalleryNote" maxlength="300" placeholder="Opsional"></div>
        </div>
        <div class="pnCmsActions"><button id="pnCmsSaveGallery" class="pnCmsBtn green" type="button">📤 UPLOAD / SIMPAN FOTO</button><button id="pnCmsNewGallery" class="pnCmsBtn light" type="button">＋ FOTO BARU</button></div>
        <div id="pnCmsGalleryList" class="pnCmsList"></div>
      </section>
    </div>
  </div>`}

function setStatus(text,kind=''){const el=$('pnCmsStatus');if(!el)return;el.textContent=text;el.className='pnCmsStatus '+(kind==='ok'?'ok':kind==='err'?'err':'')}
function setBusy(btn,busy,text){if(!btn)return;if(busy){btn.dataset.old=btn.textContent;btn.disabled=true;btn.textContent=text||'MEMPROSES...'}else{btn.disabled=false;btn.textContent=btn.dataset.old||btn.textContent}}
function token(){try{return localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY)||''}catch(_){return sessionStorage.getItem(TOKEN_KEY)||''}}
function saveToken(value){try{localStorage.setItem(TOKEN_KEY,String(value))}catch(_){};try{sessionStorage.setItem(TOKEN_KEY,String(value))}catch(_){}}
function clearToken(){try{localStorage.removeItem(TOKEN_KEY)}catch(_){};try{sessionStorage.removeItem(TOKEN_KEY)}catch(_){}}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date())}

function askContentPassword(){
  return new Promise(resolve=>{
    document.getElementById('pnCmsPasswordDialog')?.remove();
    const wrap=document.createElement('div');
    wrap.id='pnCmsPasswordDialog';
    wrap.style.cssText='position:fixed;inset:0;z-index:1000000;background:rgba(2,6,23,.7);display:flex;align-items:center;justify-content:center;padding:18px';
    const card=document.createElement('div');
    card.style.cssText='width:min(430px,100%);background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.32);padding:22px;color:#1e293b';
    card.innerHTML='<div style="font-size:18px;font-weight:900;color:#14532d;margin-bottom:7px">Hubungkan Pengelola Konten</div><div style="font-size:12px;line-height:1.6;color:#64748b;margin-bottom:14px">Masukkan password pengelola konten.</div><label for="pnCmsPasswordInput" style="display:block;font-size:11px;font-weight:900;margin-bottom:6px">Password</label><input id="pnCmsPasswordInput" type="password" autocomplete="current-password" spellcheck="false" style="width:100%;box-sizing:border-box;border:1px solid #94a3b8;border-radius:10px;padding:12px 13px;font:inherit;font-size:15px;outline:none"><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px"><button id="pnCmsPasswordCancel" type="button" style="border:0;border-radius:9px;padding:10px 16px;background:#e2e8f0;color:#334155;font-weight:900;cursor:pointer">BATAL</button><button id="pnCmsPasswordSubmit" type="button" style="border:0;border-radius:9px;padding:10px 16px;background:#0f766e;color:#fff;font-weight:900;cursor:pointer">HUBUNGKAN</button></div>';
    wrap.appendChild(card);document.body.appendChild(wrap);
    const input=card.querySelector('#pnCmsPasswordInput');
    let done=false;
    const finish=v=>{if(done)return;done=true;wrap.remove();resolve(v)};
    card.querySelector('#pnCmsPasswordCancel').onclick=()=>finish(null);
    card.querySelector('#pnCmsPasswordSubmit').onclick=()=>finish(input.value);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();finish(input.value)}else if(e.key==='Escape'){e.preventDefault();finish(null)}});
    wrap.addEventListener('click',e=>{if(e.target===wrap)finish(null)});
    setTimeout(()=>input.focus(),30);
  });
}

async function connectContent(){
  const password=await askContentPassword();if(password===null)return false;
  const requested='cms_'+cryptoRandom(56);const btn=$('pnCmsConnect');setBusy(btn,true,'MENGHUBUNGKAN...');setStatus('Menghubungkan pengelola konten ke database pusat...');
  try{const r=await postReliable('contentAdminLogin',{username:'admin',password,token:requested});if(!r.token)throw new Error('Token admin tidak diterima.');saveToken(r.token);setStatus('✓ Akses konten aktif terus di perangkat ini sampai logout atau password diubah.','ok');await loadAdmin();return true}catch(err){setStatus(err.message||'Gagal menghubungkan akses konten.','err');return false}finally{setBusy(btn,false)}
}
function cryptoRandom(n=48){const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';const a=new Uint8Array(n);if(window.crypto?.getRandomValues)window.crypto.getRandomValues(a);else for(let i=0;i<n;i++)a[i]=Math.floor(Math.random()*256);return Array.from(a,b=>chars[b%chars.length]).join('')}

function currentDomSeed(){
  const content=Array.from(document.querySelectorAll('.newsSection .newsCard')).map((card,i)=>({
    type:card.querySelector('.newsBadge')?.textContent?.trim()||'BERITA',title:card.querySelector('h3')?.textContent?.trim()||'',summary:card.querySelector('p')?.textContent?.trim()||'',body:'',date:card.querySelector('.newsDate')?.textContent?.trim()||'',badge:card.querySelector('.newsBadge')?.textContent?.trim()||'',link:card.querySelector('.newsReadMore')?.getAttribute('href')||'',status:'PUBLIK',order:i+1
  })).filter(x=>x.title);
  const gallery=Array.from(document.querySelectorAll('#gallerySection .galleryItem')).map((btn,i)=>({title:btn.querySelector('.galleryOverlay')?.textContent?.trim()||('Dokumentasi Kegiatan • Foto '+(i+1)),url:btn.querySelector('img')?.getAttribute('src')||'',fileId:'',status:'PUBLIK',order:i+1,alt:btn.querySelector('img')?.getAttribute('alt')||'',note:''})).filter(x=>x.url);
  return{content,gallery};
}

async function maybeSeed(){
  if(adminContent.length||adminGallery.length)return;
  const seed=currentDomSeed();if(!seed.content.length&&!seed.gallery.length)return;
  setStatus('Menyalin konten website yang sekarang ke database pengelola untuk pertama kali...');
  try{await postReliable('contentAdminSeed',{token:token(),contentJson:JSON.stringify(seed.content),galleryJson:JSON.stringify(seed.gallery)});setStatus('✓ Konten lama sudah dipindahkan ke database pengelola.','ok')}catch(err){setStatus('Konten lama belum dapat diimpor: '+err.message,'err')}
}

async function loadAdmin(){
  if(!token()){setStatus('Akses konten belum aktif. Klik HUBUNGKAN AKSES dan masukkan password admin.');return}
  try{
    let r=await jsonp('contentAdminList',{token:token()},18000);
    if(!r.ok)throw new Error(r.message||'Sesi admin konten tidak valid.');
    adminContent=Array.isArray(r.content)?r.content.filter(x=>String(x?.id||'')!=='CFG-REGISTRATION'&&String(x?.type||'').toUpperCase()!=='PENGATURAN'):[];adminGallery=Array.isArray(r.gallery)?r.gallery:[];
    if(!adminContent.length&&!adminGallery.length){await maybeSeed();r=await jsonp('contentAdminList',{token:token()},18000);adminContent=Array.isArray(r.content)?r.content.filter(x=>String(x?.id||'')!=='CFG-REGISTRATION'&&String(x?.type||'').toUpperCase()!=='PENGATURAN'):[];adminGallery=r.gallery||[]}
    window.__pnCmsAdminData=r;
    window.__pnCmsAdminLoadedAt=Date.now();
    window.dispatchEvent(new CustomEvent('pn:cms-admin-data',{detail:r}));
    setStatus(`✓ Database konten online • ${adminContent.length} kabar/informasi • ${adminGallery.length} foto`,'ok');renderContentList();renderGalleryList();
  }catch(err){const msg=String(err&&err.message||'');if(/sesi admin sudah dinonaktifkan|sesi verifikasi admin tidak valid|sesi admin perangkat tidak ditemukan/i.test(msg)){clearToken();try{localStorage.setItem('pnAdminAuth','1');sessionStorage.setItem('pnAdminAuth','1')}catch(_){}}setStatus(msg||'Gagal memuat database konten.','err')}
}

function resetContent(){editingContentId='';$('pnCmsType').value='BERITA';$('pnCmsContentStatus').value='PUBLIK';$('pnCmsTitle').value='';$('pnCmsSummary').value='';$('pnCmsBody').value='';$('pnCmsDate').value=today();$('pnCmsBadge').value='';$('pnCmsOrder').value=String(Math.max(1,adminContent.length+1));$('pnCmsLink').value='';$('pnCmsSaveContent').textContent='💾 SIMPAN & PUBLIKASIKAN'}
function editContent(id){const x=adminContent.find(v=>v.id===id);if(!x)return;editingContentId=x.id;$('pnCmsType').value=x.type||'BERITA';$('pnCmsContentStatus').value=x.status==='DRAFT'?'DRAFT':'PUBLIK';$('pnCmsTitle').value=x.title||'';$('pnCmsSummary').value=x.summary||'';$('pnCmsBody').value=x.body||'';$('pnCmsDate').value=normalizeDateInput(x.date);$('pnCmsBadge').value=x.badge||'';$('pnCmsOrder').value=String(x.order||1);$('pnCmsLink').value=x.link||'';$('pnCmsSaveContent').textContent='💾 SIMPAN PERUBAHAN';$('pnContentAdminPanel').scrollIntoView({behavior:'smooth',block:'start'})}
function normalizeDateInput(s){const m=String(s||'').match(/(\d{4})-(\d{2})-(\d{2})/);if(m)return m[0];const d=new Date(s);return isNaN(d)?today():new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(d)}

async function saveContent(){
  if(!token()&&!await connectContent())return;const title=$('pnCmsTitle').value.trim();if(!title){setStatus('Judul kabar/informasi wajib diisi.','err');return}
  const item={id:editingContentId,type:$('pnCmsType').value,title,summary:$('pnCmsSummary').value.trim(),body:$('pnCmsBody').value.trim(),date:$('pnCmsDate').value,badge:$('pnCmsBadge').value.trim()||$('pnCmsType').value,link:$('pnCmsLink').value.trim(),status:$('pnCmsContentStatus').value,order:Number($('pnCmsOrder').value||1)};
  const btn=$('pnCmsSaveContent');setBusy(btn,true,'MENYIMPAN...');try{await postReliable('contentAdminSave',{token:token(),section:'content',itemJson:JSON.stringify(item)});setStatus('✓ Kabar/informasi berhasil disimpan. Dashboard publik diperbarui otomatis.','ok');resetContent();await loadAdmin();await loadPublic()}catch(err){setStatus(err.message,'err')}finally{setBusy(btn,false)}
}

async function deleteItem(section,id){if(!confirm('Hapus/sembunyikan data ini dari website?'))return;try{await postReliable('contentAdminDelete',{token:token(),section,id});setStatus('✓ Data dihapus dari tampilan publik.','ok');await loadAdmin();await loadPublic()}catch(err){setStatus(err.message,'err')}}
async function togglePublish(section,item){const copy={...item,status:item.status==='PUBLIK'?'DRAFT':'PUBLIK'};try{await postReliable('contentAdminSave',{token:token(),section,itemJson:JSON.stringify(copy)});await loadAdmin();await loadPublic()}catch(err){setStatus(err.message,'err')}}

function renderContentList(){const box=$('pnCmsContentList');if(!box)return;box.innerHTML='';if(!adminContent.length){box.innerHTML='<div class="pnCmsItem"><div><h4>Belum ada data</h4><p>Tambahkan kabar, berita, pengumuman, atau informasi di atas.</p></div></div>';return}adminContent.forEach(x=>{const row=document.createElement('div');row.className='pnCmsItem';row.innerHTML=`<div><h4>${esc(x.title)}</h4><p>${esc(x.type||'INFORMASI')} • ${esc(x.date||'')} • Urutan ${esc(x.order||1)} • <b>${esc(x.status||'DRAFT')}</b><br>${esc(x.summary||'')}</p></div><div class="pnCmsItemBtns"><button class="pnCmsMini edit">EDIT</button><button class="pnCmsMini pub">${x.status==='PUBLIK'?'SEMBUNYIKAN':'TERBITKAN'}</button><button class="pnCmsMini del">HAPUS</button></div>`;const [edit,pub,del]=row.querySelectorAll('button');edit.onclick=()=>editContent(x.id);pub.onclick=()=>togglePublish('content',x);del.onclick=()=>deleteItem('content',x.id);box.appendChild(row)})}

function resetGallery(){editingGalleryId='';$('pnCmsGalleryTitle').value='';$('pnCmsGalleryAlt').value='';$('pnCmsGalleryStatus').value='PUBLIK';$('pnCmsGalleryOrder').value=String(Math.max(1,adminGallery.length+1));$('pnCmsGalleryNote').value='';$('pnCmsImageFile').value='';$('pnCmsImagePreview').src='';$('pnCmsImagePreview').classList.add('pnCmsHidden');$('pnCmsSaveGallery').textContent='📤 UPLOAD / SIMPAN FOTO'}
function editGallery(id){const x=adminGallery.find(v=>v.id===id);if(!x)return;editingGalleryId=x.id;$('pnCmsGalleryTitle').value=x.title||'';$('pnCmsGalleryAlt').value=x.alt||'';$('pnCmsGalleryStatus').value=x.status==='DRAFT'?'DRAFT':'PUBLIK';$('pnCmsGalleryOrder').value=String(x.order||1);$('pnCmsGalleryNote').value=x.note||'';$('pnCmsImageFile').value='';const p=$('pnCmsImagePreview');p.src=x.url||'';p.classList.toggle('pnCmsHidden',!x.url);$('pnCmsSaveGallery').textContent='💾 SIMPAN PERUBAHAN FOTO';$('pnContentAdminPanel').scrollIntoView({behavior:'smooth',block:'start'})}

function renderGalleryList(){const box=$('pnCmsGalleryList');if(!box)return;box.innerHTML='';if(!adminGallery.length){box.innerHTML='<div class="pnCmsItem"><div><h4>Belum ada foto</h4><p>Pilih foto dari HP/komputer lalu upload.</p></div></div>';return}adminGallery.forEach(x=>{const row=document.createElement('div');row.className='pnCmsItem pnCmsGalleryItem';row.innerHTML=`<img class="pnCmsThumb" src="${esc(x.url)}" alt=""><div><h4>${esc(x.title||'Foto Galeri')}</h4><p>Urutan ${esc(x.order||1)} • <b>${esc(x.status||'DRAFT')}</b></p></div><div class="pnCmsItemBtns"><button class="pnCmsMini edit">EDIT</button><button class="pnCmsMini pub">${x.status==='PUBLIK'?'SEMBUNYIKAN':'TERBITKAN'}</button><button class="pnCmsMini del">HAPUS</button></div>`;const [edit,pub,del]=row.querySelectorAll('button');edit.onclick=()=>editGallery(x.id);pub.onclick=()=>togglePublish('gallery',x);del.onclick=()=>deleteItem('gallery',x.id);box.appendChild(row)})}

function readAsDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Gagal membaca foto.'));r.readAsDataURL(file)})}
async function compressImage(file){
  const data=await readAsDataURL(file);const img=new Image();img.src=data;await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('Format gambar tidak dapat dibaca.'))});
  const max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);const out=c.toDataURL('image/jpeg',.82);if(out.length>4_800_000)throw new Error('Foto masih terlalu besar. Pilih foto dengan ukuran lebih kecil.');return{base64:out.split(',')[1],mimeType:'image/jpeg',fileName:(file.name||'foto').replace(/\.[^.]+$/,'')+'.jpg',preview:out}}

async function saveGallery(){
  if(!token()&&!await connectContent())return;const title=$('pnCmsGalleryTitle').value.trim()||'Dokumentasi Kegiatan Pagar Nusa';const old=adminGallery.find(v=>v.id===editingGalleryId)||{};let url=old.url||'',fileId=old.fileId||'';const file=$('pnCmsImageFile').files?.[0];const btn=$('pnCmsSaveGallery');setBusy(btn,true,file?'MENGUPLOAD FOTO...':'MENYIMPAN...');
  try{
    if(file){const pic=await compressImage(file);const up=await postReliable('contentUploadImage',{token:token(),fileName:pic.fileName,mimeType:pic.mimeType,base64:pic.base64},70000);url=up.url;fileId=up.fileId}
    if(!url)throw new Error('Pilih foto terlebih dahulu.');
    const item={id:editingGalleryId,title,url,fileId,status:$('pnCmsGalleryStatus').value,order:Number($('pnCmsGalleryOrder').value||1),alt:$('pnCmsGalleryAlt').value.trim()||title,note:$('pnCmsGalleryNote').value.trim()};
    await postReliable('contentAdminSave',{token:token(),section:'gallery',itemJson:JSON.stringify(item)});setStatus('✓ Foto berhasil disimpan. Galeri publik diperbarui otomatis.','ok');resetGallery();await loadAdmin();await loadPublic();
  }catch(err){setStatus(err.message,'err')}finally{setBusy(btn,false)}
}

function switchTab(tab){activeTab=tab;const c=tab==='content';$('pnCmsContentPane').classList.toggle('pnCmsHidden',!c);$('pnCmsGalleryPane').classList.toggle('pnCmsHidden',c);$('pnCmsTabContent').classList.toggle('active',c);$('pnCmsTabGallery').classList.toggle('active',!c)}

function installAdmin(){
  ensureStyles();if($('pnContentAdminPanel'))return;const main=document.querySelector('#adminApp main');if(!main)return;main.insertAdjacentHTML('afterbegin',panelHtml());
  $('pnCmsConnect').onclick=connectContent;$('pnCmsReload').onclick=loadAdmin;$('pnCmsTabContent').onclick=()=>switchTab('content');$('pnCmsTabGallery').onclick=()=>switchTab('gallery');$('pnCmsSaveContent').onclick=saveContent;$('pnCmsNewContent').onclick=resetContent;$('pnCmsSaveGallery').onclick=saveGallery;$('pnCmsNewGallery').onclick=resetGallery;
  $('pnCmsImageFile').addEventListener('change',async e=>{const f=e.target.files?.[0],p=$('pnCmsImagePreview');if(!f){p.classList.add('pnCmsHidden');return}try{const d=await readAsDataURL(f);p.src=d;p.classList.remove('pnCmsHidden')}catch(_){}});
  resetContent();resetGallery();setStatus(token()?'Akses admin tersimpan. Data online dimuat setelah area admin siap.':'Login admin sudah tersedia. Klik HUBUNGKAN AKSES sekali untuk mengaktifkan update foto/kabar secara online.');
}

function boot(){
  // Prioritaskan area admin saat sesi aktif; konten publik tetap punya fallback statis.
  installAdmin();
  if(token())setTimeout(loadPublic,10000);else loadPublic();
  setTimeout(installAdmin,500);
  setTimeout(installAdmin,1500);
  window.addEventListener('online',()=>{if(token())loadAdmin();else loadPublic()});
}
let pnCmsAdminOpenTimer=0;
window.addEventListener('pn:admin-open',()=>{
  clearTimeout(pnCmsAdminOpenTimer);
  pnCmsAdminOpenTimer=setTimeout(()=>{
    installAdmin();
    if(!token())return;
    const age=Date.now()-Number(window.__pnCmsAdminLoadedAt||0);
    if(age<45000)return;
    void loadAdmin();
  },4200);
});
document.addEventListener('DOMContentLoaded',boot);
})();
