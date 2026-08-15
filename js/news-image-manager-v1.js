(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const NEWS_NOTE_PREFIX='NEWS:';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let state={content:[],gallery:[]};
let editingId='';
let filteredGallery=[];
let galleryIndex=0;
let saveGeneration=0;
let installed=false;

function isNewsImage(x){return String(x?.note||'').toUpperCase().startsWith(NEWS_NOTE_PREFIX)}
function newsId(x){return isNewsImage(x)?String(x.note||'').slice(NEWS_NOTE_PREFIX.length).trim():''}
function token(){return sessionStorage.getItem(TOKEN_KEY)||''}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function jsonp(action,payload={},timeout=16000){
  return new Promise((resolve,reject)=>{
    const cb='pnNewsImgCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');let done=false;
    const clean=()=>{clearTimeout(timer);delete window[cb];script.remove()};
    window[cb]=data=>{if(done)return;done=true;clean();resolve(data)};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+q.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Koneksi database gambar gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Database gambar terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

async function postReliable(action,payload={},timeout=70000){
  const rid='newsimg-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnNewsImgFrame_'+rid.replace(/\W/g,'');frame.style.display='none';frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  document.body.append(frame,form);form.submit();form.remove();
  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(700);
      try{
        const r=await jsonp('contentResult',{rid},7000);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Perubahan gambar ditolak server.');
      }catch(err){lastErr=err}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server gambar tidak merespons tepat waktu.');
}

async function refreshAdminState(){
  if(!token())return state;
  const r=await jsonp('contentAdminList',{token:token()},18000);
  if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');
  state.content=Array.isArray(r.content)?r.content.filter(x=>String(x?.id||'')!=='CFG-REGISTRATION'&&String(x?.type||'').toUpperCase()!=='PENGATURAN'):[];
  state.gallery=Array.isArray(r.gallery)?r.gallery:[];
  hideNewsRowsFromGalleryAdmin();
  return state;
}

function imageForContent(id,gallery=state.gallery){return gallery.find(x=>isNewsImage(x)&&newsId(x)===String(id||''))||null}
function driveFileId(url){const s=String(url||'');let m=s.match(/[?&]id=([^&#]+)/i);if(m)return decodeURIComponent(m[1]);m=s.match(/drive\.google\.com\/file\/d\/([^/]+)/i);if(m)return m[1];m=s.match(/googleusercontent\.com\/d\/([^=/?&#]+)/i);return m?m[1]:''}
function imgUrl(url){return typeof window.pnNormalizeDriveImage==='function'?window.pnNormalizeDriveImage(url):url}

function ensureStyles(){
  if($('pnNewsImageStyles'))return;
  const s=document.createElement('style');s.id='pnNewsImageStyles';s.textContent=`
    .pnNewsImageField{grid-column:1/-1;border:1px solid #dbe7df;border-radius:10px;padding:11px;background:#f8fbf9}.pnNewsImageField label{display:block;margin:0 0 6px;font-size:10px;font-weight:900;color:#334155}.pnNewsImageField input[type=file]{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:8px;background:#fff;font-size:11px}.pnNewsImagePreview{display:block;width:100%;max-height:220px;object-fit:cover;margin-top:8px;border-radius:9px;border:1px solid #dbe7df;background:#eef4ef}.pnNewsImagePreview.hidden{display:none}.pnNewsImageTools{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:10px;color:#475569}.pnNewsImageTools input{width:auto!important}.pnNewsImageHint{margin:6px 0 0;color:#64748b;font-size:9px;line-height:1.5}
    .newsCard .pnNewsCardImage{display:block;width:calc(100% + 30px);height:170px;object-fit:cover;margin:-15px -15px 12px;border-bottom:1px solid #dbe7df}.newsCard .pnNewsCardImage+ .newsIcon{margin-top:2px}@media(max-width:800px){.newsCard .pnNewsCardImage{width:calc(100% + 28px);margin:-14px -14px 12px;height:190px}}
  `;document.head.appendChild(s);
}

function ensureAdminField(){
  const grid=document.querySelector('#pnCmsContentPane .pnCmsGrid');if(!grid||$('pnCmsNewsImageFile'))return;
  const wrap=document.createElement('div');wrap.className='pnNewsImageField';wrap.innerHTML=`<label for="pnCmsNewsImageFile">Gambar kabar / informasi</label><input id="pnCmsNewsImageFile" type="file" accept="image/jpeg,image/png,image/webp"><img id="pnCmsNewsImagePreview" class="pnNewsImagePreview hidden" alt="Preview gambar kabar"><div class="pnNewsImageTools"><label><input id="pnCmsNewsImageRemove" type="checkbox"> Hapus gambar yang tersimpan</label></div><p class="pnNewsImageHint">Foto dipilih dari HP/komputer dan disimpan ke database/Google Drive saat kabar atau informasi disimpan.</p>`;
  grid.appendChild(wrap);
  $('pnCmsNewsImageFile').addEventListener('change',async e=>{
    const f=e.target.files?.[0],p=$('pnCmsNewsImagePreview');if(!f){showEditingImage();return}
    try{p.src=await readAsDataURL(f);p.classList.remove('hidden');$('pnCmsNewsImageRemove').checked=false}catch(_){p.classList.add('hidden')}
  });
}

function showEditingImage(){
  const p=$('pnCmsNewsImagePreview'),rm=$('pnCmsNewsImageRemove');if(!p)return;
  const img=imageForContent(editingId);
  if(img?.url){p.src=imgUrl(img.url);p.classList.remove('hidden')}else{p.src='';p.classList.add('hidden')}
  if(rm)rm.checked=false;
}

function clearImageEditor(){editingId='';const f=$('pnCmsNewsImageFile'),p=$('pnCmsNewsImagePreview'),rm=$('pnCmsNewsImageRemove');if(f)f.value='';if(p){p.src='';p.classList.add('hidden')}if(rm)rm.checked=false}

function readAsDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Gagal membaca gambar.'));r.readAsDataURL(file)})}
async function compressImage(file){
  const data=await readAsDataURL(file);const img=new Image();img.src=data;await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('Format gambar tidak dapat dibaca.'))});
  const max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
  const out=c.toDataURL('image/jpeg',.84);if(out.length>4_800_000)throw new Error('Gambar masih terlalu besar. Pilih gambar yang lebih kecil.');
  return{base64:out.split(',')[1],mimeType:'image/jpeg',fileName:(file.name||'gambar-kabar').replace(/\.[^.]+$/,'')+'.jpg'};
}

function setCmsStatus(text,kind='ok'){const s=$('pnCmsStatus');if(!s)return;s.textContent=text;s.className='pnCmsStatus '+(kind==='err'?'err':'ok')}

async function waitForSavedContent(ctx){
  const started=Date.now();
  while(Date.now()-started<35000){
    if(ctx.gen!==saveGeneration)return null;
    try{await refreshAdminState()}catch(_){await sleep(900);continue}
    if(ctx.editingId){const x=state.content.find(v=>v.id===ctx.editingId);if(x)return x}
    const fresh=state.content.filter(v=>!ctx.beforeIds.has(v.id));
    let x=fresh.find(v=>String(v.title||'').trim()===ctx.title);
    if(!x)x=state.content.find(v=>String(v.title||'').trim()===ctx.title&&String(v.summary||'').trim()===ctx.summary);
    if(x)return x;
    await sleep(900);
  }
  throw new Error('Data kabar sudah diproses, tetapi ID untuk menyimpan gambar belum ditemukan. Coba simpan sekali lagi.');
}

async function processImageAfterSave(ctx){
  if(ctx.gen!==saveGeneration)return;
  try{
    const saved=await waitForSavedContent(ctx);if(!saved||ctx.gen!==saveGeneration)return;
    let old=imageForContent(saved.id);
    if(ctx.remove&&old){await postReliable('contentAdminDelete',{token:token(),section:'gallery',id:old.id});old=null}
    if(ctx.file){
      setCmsStatus('Mengupload gambar kabar ke database...');
      const pic=await compressImage(ctx.file);
      const up=await postReliable('contentUploadImage',{token:token(),fileName:pic.fileName,mimeType:pic.mimeType,base64:pic.base64},80000);
      const item={id:old?.id||'',title:'Gambar Kabar: '+saved.title,url:up.url,fileId:up.fileId,status:'PUBLIK',order:999,alt:saved.title,note:NEWS_NOTE_PREFIX+saved.id};
      await postReliable('contentAdminSave',{token:token(),section:'gallery',itemJson:JSON.stringify(item)});
      setCmsStatus('✓ Kabar/informasi dan gambarnya berhasil disimpan ke database.','ok');
    }else if(ctx.remove){setCmsStatus('✓ Gambar kabar berhasil dihapus dari database.','ok')}
    await refreshAdminState();
    clearImageEditor();
    await refreshPublicImages();
  }catch(err){setCmsStatus(err?.message||'Gagal menyimpan gambar kabar.','err')}
}

function hideNewsRowsFromGalleryAdmin(){
  const box=$('pnCmsGalleryList');if(!box)return;
  const rows=Array.from(box.querySelectorAll('.pnCmsItem'));
  if(rows.length!==state.gallery.length)return;
  rows.forEach((row,i)=>{row.style.display=isNewsImage(state.gallery[i])?'none':''});
}

function renderFilteredGallery(items){
  const strip=document.querySelector('#gallerySection .galleryStrip');if(!strip)return;
  filteredGallery=items.filter(x=>!isNewsImage(x));
  strip.innerHTML='';
  filteredGallery.forEach((item,i)=>{
    const btn=document.createElement('button');btn.className='galleryItem';btn.type='button';btn.dataset.galleryIndex=String(i);btn.setAttribute('aria-label','Buka '+(item.title||('foto dokumentasi '+(i+1))));
    const img=document.createElement('img');img.src=imgUrl(item.url);img.alt=item.alt||item.title||('Dokumentasi kegiatan Pagar Nusa '+(i+1));img.loading='lazy';
    const zoom=document.createElement('span');zoom.className='galleryZoom';zoom.textContent='⌕';const overlay=document.createElement('span');overlay.className='galleryOverlay';overlay.textContent=item.title||('Dokumentasi Kegiatan • Foto '+(i+1));
    btn.append(img,zoom,overlay);btn.onclick=()=>openFilteredGallery(i);strip.appendChild(btn);
  });
  const badge=document.querySelector('#gallerySection .galleryHead .badge');if(badge)badge.textContent=filteredGallery.length+' FOTO';
}

function openFilteredGallery(i){
  if(!filteredGallery.length)return;galleryIndex=((Number(i)||0)%filteredGallery.length+filteredGallery.length)%filteredGallery.length;
  const item=filteredGallery[galleryIndex],box=$('galleryLightbox'),img=$('galleryLightboxImg'),cap=$('galleryCaption');if(!box||!img)return;
  img.src=imgUrl(item.url);img.alt=item.alt||item.title||'Foto galeri';if(cap)cap.textContent=(item.title||'Dokumentasi Kegiatan Pagar Nusa')+' • Foto '+(galleryIndex+1)+' dari '+filteredGallery.length;
  box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
}
window.openGallery=openFilteredGallery;
window.stepGallery=function(dir){if(!filteredGallery.length)return;openFilteredGallery(galleryIndex+Number(dir||0))};

function applyNewsImages(content,gallery){
  const cards=Array.from(document.querySelectorAll('.newsSection .newsGrid .newsCard'));
  cards.forEach((card,i)=>{
    card.querySelector('.pnNewsCardImage')?.remove();const item=content[i];if(!item)return;
    const image=gallery.find(g=>isNewsImage(g)&&newsId(g)===String(item.id||''));if(!image?.url)return;
    const img=document.createElement('img');img.className='pnNewsCardImage';img.src=imgUrl(image.url);img.alt=image.alt||item.title||'Gambar kabar';img.loading='lazy';card.insertBefore(img,card.firstChild);
  });
}

async function refreshPublicImages(){
  try{
    const r=await jsonp('contentPublicList',{},16000);if(!r?.ok)return;
    const content=Array.isArray(r.content)?r.content.filter(x=>String(x?.id||'')!=='CFG-REGISTRATION'&&String(x?.type||'').toUpperCase()!=='PENGATURAN'):[];
    const gallery=Array.isArray(r.gallery)?r.gallery:[];
    applyNewsImages(content,gallery);renderFilteredGallery(gallery);
  }catch(_){/* tampilan statis tetap dipakai bila server sedang tidak tersedia */}
}

function bindEvents(){
  document.addEventListener('click',e=>{
    const edit=e.target?.closest?.('#pnCmsContentList .pnCmsMini.edit');
    if(edit){const rows=Array.from(document.querySelectorAll('#pnCmsContentList .pnCmsItem'));const idx=rows.indexOf(edit.closest('.pnCmsItem'));editingId=state.content[idx]?.id||'';setTimeout(showEditingImage,20);return}
    if(e.target?.closest?.('#pnCmsNewContent')){clearImageEditor();return}
    const save=e.target?.closest?.('#pnCmsSaveContent');if(!save)return;
    const file=$('pnCmsNewsImageFile')?.files?.[0]||null,remove=!!$('pnCmsNewsImageRemove')?.checked;
    if(!file&&!remove)return;
    const gen=++saveGeneration;
    const ctx={gen,file,remove,editingId,title:$('pnCmsTitle')?.value.trim()||'',summary:$('pnCmsSummary')?.value.trim()||'',beforeIds:new Set(state.content.map(x=>x.id))};
    setTimeout(()=>processImageAfterSave(ctx),200);
  },false);
}

function install(){
  ensureStyles();ensureAdminField();
  if(!installed){installed=true;bindEvents()}
  if(token())refreshAdminState().catch(()=>{});
  refreshPublicImages();
}

function boot(){install();setTimeout(install,600);setTimeout(install,1800);setInterval(()=>{ensureAdminField();if(token())refreshAdminState().catch(()=>{});hideNewsRowsFromGalleryAdmin()},3500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
