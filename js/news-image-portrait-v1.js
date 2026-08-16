(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const SOURCE='pn-content';
const NEWS_NOTE_PREFIX='NEWS:';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let adminContent=[];
let adminGallery=[];
let editingContentId='';
let editingRowIndex=-1;
let savingWithImage=false;

function token(){return sessionStorage.getItem(TOKEN_KEY)||''}
function setStatus(text,kind=''){
  const s=$('pnCmsStatus');
  if(!s)return;
  s.textContent=text;
  s.className='pnCmsStatus '+(kind==='err'?'err':kind==='ok'?'ok':'');
}
function setButtonBusy(btn,busy,label){
  if(!btn)return;
  if(busy){btn.dataset.pnOldText=btn.textContent;btn.disabled=true;btn.textContent=label||'MENYIMPAN...'}
  else{btn.disabled=false;btn.textContent=btn.dataset.pnOldText||'💾 SIMPAN & PUBLIKASIKAN';delete btn.dataset.pnOldText}
}
function makeRid(){return 'newsfix-'+Date.now()+'-'+Math.random().toString(36).slice(2)}

function jsonp(action,payload={},timeout=18000){
  return new Promise((resolve,reject)=>{
    const cb='pnNewsFixCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');
    let done=false;
    const clean=()=>{clearTimeout(timer);delete window[cb];script.remove()};
    window[cb]=data=>{if(done)return;done=true;clean();resolve(data)};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+q.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Koneksi database konten gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Database konten terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

async function postReliable(action,payload={},timeout=70000){
  const rid=makeRid();
  const frame=document.createElement('iframe');
  frame.name='pnNewsFixFrame_'+rid.replace(/\W/g,'');
  frame.style.display='none';
  frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');
  form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{
    const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i);
  });
  document.body.append(frame,form);form.submit();form.remove();
  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(650);
      try{
        const r=await jsonp('contentResult',{rid},7000);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Perubahan konten ditolak server.');
      }catch(err){lastErr=err}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server konten tidak merespons tepat waktu.');
}

function isNewsImage(x){return String(x?.note||'').toUpperCase().startsWith(NEWS_NOTE_PREFIX)}
function newsId(x){return isNewsImage(x)?String(x.note||'').slice(NEWS_NOTE_PREFIX.length).trim():''}

async function refreshAdminState(){
  if(!token())return;
  const r=await jsonp('contentAdminList',{token:token()},18000);
  if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');
  adminContent=Array.isArray(r.content)?r.content.filter(x=>String(x?.id||'')!=='CFG-REGISTRATION'&&String(x?.type||'').toUpperCase()!=='PENGATURAN'):[];
  adminGallery=Array.isArray(r.gallery)?r.gallery:[];
  if(editingRowIndex>=0&&adminContent[editingRowIndex])editingContentId=adminContent[editingRowIndex].id||editingContentId;
}

function installHint(){
  const input=$('pnCmsNewsImageFile');
  if(!input)return;
  input.setAttribute('accept','image/jpeg,image/png,image/webp');
  input.dataset.pnPortraitRule='1';
  const wrap=input.closest('.pnNewsImageField');
  const hint=wrap?.querySelector('.pnNewsImageHint');
  if(hint)hint.textContent='Aturan foto kabar: gunakan foto POTRET / tegak. Disarankan rasio 4:5 atau 3:4. Format JPG, PNG, atau WEBP. Foto landscape / mendatar akan ditolak.';
  const preview=$('pnCmsNewsImagePreview');
  if(preview){
    preview.style.objectFit='contain';
    preview.style.maxHeight='360px';
    preview.style.background='#eef4ef';
  }
}

function imageDimensions(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight,url});
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Foto tidak dapat dibaca.'))};
    img.src=url;
  });
}

function showPreview(file){
  const p=$('pnCmsNewsImagePreview');
  if(!p)return;
  const r=new FileReader();
  r.onload=()=>{p.src=r.result;p.classList.remove('hidden');p.classList.remove('pnCmsHidden')};
  r.readAsDataURL(file);
}

function readAsDataURL(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);
    r.onerror=()=>reject(new Error('Gagal membaca gambar.'));
    r.readAsDataURL(file);
  });
}

async function compressImage(file){
  const data=await readAsDataURL(file);
  const img=new Image();img.src=data;
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Format gambar tidak dapat dibaca.'))});
  if(img.naturalHeight<=img.naturalWidth)throw new Error('Foto kabar harus POTRET / tegak.');
  const max=1600;
  const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.max(1,Math.round(img.naturalWidth*scale));
  const h=Math.max(1,Math.round(img.naturalHeight*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
  const out=c.toDataURL('image/jpeg',.84);
  if(out.length>4_800_000)throw new Error('Gambar masih terlalu besar. Pilih gambar yang lebih kecil.');
  return{base64:out.split(',')[1],mimeType:'image/jpeg',fileName:(file.name||'gambar-kabar').replace(/\.[^.]+$/,'')+'.jpg'};
}

function resetContentForm(){
  editingContentId='';editingRowIndex=-1;
  if($('pnCmsType'))$('pnCmsType').value='BERITA';
  if($('pnCmsContentStatus'))$('pnCmsContentStatus').value='PUBLIK';
  ['pnCmsTitle','pnCmsSummary','pnCmsBody','pnCmsBadge','pnCmsLink'].forEach(id=>{if($(id))$(id).value=''});
  if($('pnCmsDate'))$('pnCmsDate').value=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());
  if($('pnCmsOrder'))$('pnCmsOrder').value=String(Math.max(1,adminContent.length+1));
  if($('pnCmsNewsImageFile'))$('pnCmsNewsImageFile').value='';
  if($('pnCmsNewsImageRemove'))$('pnCmsNewsImageRemove').checked=false;
  const p=$('pnCmsNewsImagePreview');if(p){p.src='';p.classList.add('hidden');p.classList.add('pnCmsHidden')}
}

async function saveContentAndImage(btn,file,remove){
  if(savingWithImage)return;
  savingWithImage=true;
  setButtonBusy(btn,true,file?'MENYIMPAN & MENGUPLOAD...':'MENYIMPAN...');
  try{
    if(!token())throw new Error('Akses pengelola konten belum terhubung. Klik HUBUNGKAN AKSES lalu coba lagi.');
    if(!editingContentId && editingRowIndex>=0){
      await refreshAdminState();
    }
    const title=$('pnCmsTitle')?.value.trim()||'';
    if(!title)throw new Error('Judul kabar/informasi wajib diisi.');
    const item={
      id:editingContentId,
      type:$('pnCmsType')?.value||'BERITA',
      title,
      summary:$('pnCmsSummary')?.value.trim()||'',
      body:$('pnCmsBody')?.value.trim()||'',
      date:$('pnCmsDate')?.value||'',
      badge:$('pnCmsBadge')?.value.trim()||($('pnCmsType')?.value||'BERITA'),
      link:$('pnCmsLink')?.value.trim()||'',
      status:$('pnCmsContentStatus')?.value||'PUBLIK',
      order:Number($('pnCmsOrder')?.value||1)
    };

    setStatus('Menyimpan data kabar/informasi...');
    const savedResult=await postReliable('contentAdminSave',{token:token(),section:'content',itemJson:JSON.stringify(item)},45000);
    const saved=savedResult?.item;
    if(!saved?.id)throw new Error('Data kabar tersimpan, tetapi server tidak mengembalikan ID konten.');
    editingContentId=String(saved.id);

    await refreshAdminState();
    let old=adminGallery.find(x=>isNewsImage(x)&&newsId(x)===String(saved.id))||null;
    if(remove&&old){
      setStatus('Menghapus gambar kabar lama...');
      await postReliable('contentAdminDelete',{token:token(),section:'gallery',id:old.id},45000);
      old=null;
    }
    if(file){
      setStatus('Mengupload gambar kabar ke database...');
      const pic=await compressImage(file);
      const up=await postReliable('contentUploadImage',{token:token(),fileName:pic.fileName,mimeType:pic.mimeType,base64:pic.base64},80000);
      if(!up?.url)throw new Error('Upload gambar selesai tetapi URL gambar tidak diterima.');
      const imageItem={
        id:old?.id||'',
        title:'Gambar Kabar: '+saved.title,
        url:up.url,
        fileId:up.fileId||'',
        status:'PUBLIK',
        order:999,
        alt:saved.title,
        note:NEWS_NOTE_PREFIX+saved.id
      };
      await postReliable('contentAdminSave',{token:token(),section:'gallery',itemJson:JSON.stringify(imageItem)},45000);
    }

    setStatus(file?'✓ Kabar/informasi dan gambarnya berhasil disimpan.':'✓ Kabar/informasi berhasil disimpan dan gambar lama dihapus.','ok');
    resetContentForm();
    await refreshAdminState().catch(()=>{});
    setTimeout(()=>$('pnCmsReload')?.click(),250);
  }catch(err){
    setStatus(err?.message||'Gagal menyimpan kabar dan gambar.','err');
  }finally{
    savingWithImage=false;
    setButtonBusy(btn,false);
    if(!editingContentId)btn.textContent='💾 SIMPAN & PUBLIKASIKAN';
  }
}

/* Validasi di capture phase supaya aturan potret dijalankan sebelum handler upload utama. */
document.addEventListener('change',e=>{
  const input=e.target;
  if(!input||input.id!=='pnCmsNewsImageFile')return;
  e.stopImmediatePropagation();
  const file=input.files?.[0];
  if(!file)return;
  const allowed=['image/jpeg','image/png','image/webp'];
  if(!allowed.includes(String(file.type||'').toLowerCase())){
    input.value='';
    setStatus('Format foto harus JPG, PNG, atau WEBP.','err');
    return;
  }
  imageDimensions(file).then(dim=>{
    try{
      if(dim.height<=dim.width){
        input.value='';
        const p=$('pnCmsNewsImagePreview');
        if(p){p.src='';p.classList.add('hidden')}
        setStatus('Foto kabar harus POTRET / tegak. Silakan pilih foto yang tinggi gambarnya lebih besar daripada lebarnya.','err');
        return;
      }
      showPreview(file);
      const rm=$('pnCmsNewsImageRemove');if(rm)rm.checked=false;
      const ratio=dim.width/dim.height;
      const note=(ratio>=0.72&&ratio<=0.82)?' Rasio foto sudah sesuai untuk tampilan potret.':'';
      setStatus('✓ Foto potret diterima.'+note,'ok');
    }finally{URL.revokeObjectURL(dim.url)}
  }).catch(err=>{
    input.value='';
    setStatus(err?.message||'Foto tidak dapat dibaca.','err');
  });
},true);

/* Catat ID konten yang sedang diedit agar update gambar tidak membuat berita baru. */
document.addEventListener('click',e=>{
  const edit=e.target?.closest?.('#pnCmsContentList .pnCmsMini.edit');
  if(edit){
    const rows=Array.from(document.querySelectorAll('#pnCmsContentList .pnCmsItem'));
    editingRowIndex=rows.indexOf(edit.closest('.pnCmsItem'));
    if(editingRowIndex>=0&&adminContent[editingRowIndex])editingContentId=adminContent[editingRowIndex].id||'';
    else refreshAdminState().catch(()=>{});
    return;
  }
  if(e.target?.closest?.('#pnCmsNewContent')){editingContentId='';editingRowIndex=-1;return}
  if(e.target?.closest?.('#pnCmsReload')){setTimeout(()=>refreshAdminState().catch(()=>{}),500);return}
},true);

/*
  FIX ID GAMBAR KABAR:
  Saat ada file/hapus gambar, simpan konten dan gambar dalam satu alur.
  ID memakai item.id yang langsung dikembalikan server, bukan menebak lewat polling judul.
*/
document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#pnCmsSaveContent');
  if(!btn)return;
  const file=$('pnCmsNewsImageFile')?.files?.[0]||null;
  const remove=!!$('pnCmsNewsImageRemove')?.checked;
  if(!file&&!remove)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  saveContentAndImage(btn,file,remove);
},true);

function boot(){
  installHint();
  setTimeout(installHint,500);setTimeout(installHint,1500);setInterval(installHint,3000);
  setTimeout(()=>refreshAdminState().catch(()=>{}),900);
  setInterval(()=>{if(token())refreshAdminState().catch(()=>{})},5000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
