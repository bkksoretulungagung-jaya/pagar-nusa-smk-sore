(()=>{
'use strict';

const $=id=>document.getElementById(id);

function setStatus(text,kind=''){
  const s=$('pnCmsStatus');
  if(!s)return;
  s.textContent=text;
  s.className='pnCmsStatus '+(kind==='err'?'err':kind==='ok'?'ok':'');
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
    img.onload=()=>{const out={width:img.naturalWidth,height:img.naturalHeight,url};resolve(out)};
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

function boot(){installHint();setTimeout(installHint,500);setTimeout(installHint,1500);setInterval(installHint,3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
