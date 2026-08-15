(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
let busy=false;

const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function makeToken(n=56){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const a=new Uint8Array(n);
  if(window.crypto?.getRandomValues)window.crypto.getRandomValues(a);
  else for(let i=0;i<n;i++)a[i]=Math.floor(Math.random()*256);
  return Array.from(a,b=>chars[b%chars.length]).join('');
}

function jsonp(action,payload={},timeout=18000){
  return new Promise((resolve,reject)=>{
    const cb='pnCmsMaskCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
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

async function postReliable(action,payload={},timeout=50000){
  const rid='cmsmask-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');
  frame.name='pnCmsMaskFrame_'+rid.replace(/\W/g,'');
  frame.style.display='none';
  frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');
  form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{
    const input=document.createElement('input');
    input.type='hidden';input.name=k;input.value=String(v??'');form.appendChild(input);
  });
  document.body.append(frame,form);
  form.submit();
  form.remove();
  const started=Date.now();
  let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(700);
      try{
        const r=await jsonp('contentResult',{rid},7000);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Akses admin ditolak server.');
      }catch(err){lastErr=err}
    }
  }finally{
    setTimeout(()=>frame.remove(),300);
  }
  throw lastErr||new Error('Server konten tidak merespons tepat waktu.');
}

function ensureStyles(){
  if($('pnCmsMaskStyles'))return;
  const s=document.createElement('style');
  s.id='pnCmsMaskStyles';
  s.textContent=`
    .pnCmsMaskModal{position:fixed;inset:0;z-index:120000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.62)}
    .pnCmsMaskCard{width:min(560px,100%);background:#151b15;color:#f8fafc;border:1px solid rgba(255,255,255,.16);border-radius:18px;box-shadow:0 26px 80px rgba(0,0,0,.45);overflow:hidden}
    .pnCmsMaskHead{padding:20px 24px 8px;font-size:17px;font-weight:900;color:#fff}
    .pnCmsMaskBody{padding:10px 24px 24px}
    .pnCmsMaskText{margin:0 0 11px;color:#e5e7eb;font-size:14px;line-height:1.5}
    .pnCmsMaskInput{width:100%;box-sizing:border-box;border:2px solid #9dd890;border-radius:11px;padding:12px 13px;background:#171d17;color:#fff;font:inherit;font-size:16px;outline:none}
    .pnCmsMaskInput:focus{box-shadow:0 0 0 3px rgba(157,216,144,.16)}
    .pnCmsMaskError{min-height:19px;margin:8px 0 0;color:#fecaca;font-size:12px;font-weight:700}
    .pnCmsMaskActions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
    .pnCmsMaskBtn{border:0;border-radius:999px;padding:11px 22px;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
    .pnCmsMaskBtn.ok{background:#9edb8c;color:#0b3b13}.pnCmsMaskBtn.cancel{background:#1d5d20;color:#fff}.pnCmsMaskBtn:disabled{opacity:.55;cursor:not-allowed}
    @media(max-width:600px){.pnCmsMaskCard{border-radius:14px}.pnCmsMaskHead{padding:18px 18px 7px}.pnCmsMaskBody{padding:10px 18px 18px}.pnCmsMaskActions{gap:8px}.pnCmsMaskBtn{padding:10px 18px}}
  `;
  document.head.appendChild(s);
}

function openMaskedPassword(){
  ensureStyles();
  $('pnCmsMaskModal')?.remove();
  return new Promise(resolve=>{
    const modal=document.createElement('div');
    modal.id='pnCmsMaskModal';
    modal.className='pnCmsMaskModal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.innerHTML=`<div class="pnCmsMaskCard"><div class="pnCmsMaskHead">www.pagarnusasmksore.com</div><form id="pnCmsMaskForm" class="pnCmsMaskBody"><p class="pnCmsMaskText">Masukkan password admin untuk mengaktifkan pengelola konten:</p><input id="pnCmsMaskInput" class="pnCmsMaskInput" type="password" autocomplete="current-password" aria-label="Password admin" required><div id="pnCmsMaskError" class="pnCmsMaskError"></div><div class="pnCmsMaskActions"><button id="pnCmsMaskOk" class="pnCmsMaskBtn ok" type="submit">Oke</button><button id="pnCmsMaskCancel" class="pnCmsMaskBtn cancel" type="button">Batal</button></div></form></div>`;
    document.body.appendChild(modal);
    const input=$('pnCmsMaskInput'),form=$('pnCmsMaskForm'),ok=$('pnCmsMaskOk'),cancel=$('pnCmsMaskCancel'),err=$('pnCmsMaskError');
    const finish=value=>{modal.remove();resolve(value)};
    cancel.onclick=()=>finish(null);
    modal.addEventListener('click',e=>{if(e.target===modal)finish(null)});
    document.addEventListener('keydown',function esc(e){if(e.key==='Escape'&&document.body.contains(modal)){document.removeEventListener('keydown',esc);finish(null)}});
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(busy)return;
      const password=input.value;
      if(!password){err.textContent='Password admin wajib diisi.';input.focus();return}
      busy=true;ok.disabled=true;cancel.disabled=true;ok.textContent='Memeriksa...';err.textContent='';
      try{
        const requested='cms_'+makeToken();
        const r=await postReliable('contentAdminLogin',{username:'admin',password,token:requested});
        if(!r?.token)throw new Error(r?.message||'Token admin tidak diterima.');
        sessionStorage.setItem(TOKEN_KEY,r.token);
        finish(true);
      }catch(ex){
        err.textContent=ex?.message||'Password admin salah atau server tidak dapat dihubungi.';
        input.value='';input.focus();ok.disabled=false;cancel.disabled=false;ok.textContent='Oke';
      }finally{busy=false}
    });
    setTimeout(()=>input.focus(),30);
  });
}

function markConnected(){
  const status=$('pnCmsStatus');
  if(status){status.textContent='✓ Akses konten aktif. Password disamarkan saat diketik.';status.className='pnCmsStatus ok'}
  setTimeout(()=>$('pnCmsReload')?.click(),0);
}

async function handleProtectedClick(btn){
  const isConnect=btn.id==='pnCmsConnect';
  if(!isConnect&&sessionStorage.getItem(TOKEN_KEY))return false;
  const result=await openMaskedPassword();
  if(!result)return true;
  markConnected();
  if(!isConnect)setTimeout(()=>btn.click(),0);
  return true;
}

/* Fallback: blokir prompt browser lama jika fungsi pengelola konten memanggil window.prompt langsung. */
const nativePrompt=window.prompt.bind(window);
let promptBridgeBusy=false;
window.prompt=function(message,defaultValue){
  const text=String(message||'');
  if(/Masukkan password admin untuk mengaktifkan pengelola konten/i.test(text)){
    if(!promptBridgeBusy){
      promptBridgeBusy=true;
      openMaskedPassword().then(ok=>{if(ok)markConnected()}).finally(()=>{promptBridgeBusy=false});
    }
    return null;
  }
  return nativePrompt(message,defaultValue);
};

document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#pnCmsConnect,#pnCmsSaveContent,#pnCmsSaveGallery');
  if(!btn)return;
  if(btn.id!=='pnCmsConnect'&&sessionStorage.getItem(TOKEN_KEY))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  handleProtectedClick(btn);
},true);

})();
