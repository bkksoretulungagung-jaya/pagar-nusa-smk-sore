(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const SOURCE='pn-content';
const makeRid=()=>`cmsmask-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function setStatus(text,kind=''){
  const el=document.getElementById('pnCmsStatus');
  if(!el)return;
  el.textContent=text;
  el.className='pnCmsStatus '+(kind==='ok'?'ok':kind==='err'?'err':'');
}

function askPassword(){
  return new Promise(resolve=>{
    document.getElementById('pnCmsPasswordMaskV2')?.remove();
    const wrap=document.createElement('div');
    wrap.id='pnCmsPasswordMaskV2';
    wrap.style.cssText='position:fixed;inset:0;z-index:1000000;background:rgba(2,6,23,.70);display:flex;align-items:center;justify-content:center;padding:18px';
    const card=document.createElement('div');
    card.style.cssText='width:min(430px,100%);background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.32);padding:22px;color:#1e293b';
    card.innerHTML='<div style="font-size:18px;font-weight:900;color:#14532d;margin-bottom:7px">Hubungkan Pengelola Konten</div><div style="font-size:12px;line-height:1.6;color:#64748b;margin-bottom:14px">Masukkan password pengelola konten. Karakter password akan disembunyikan.</div><label for="pnCmsPasswordInputV2" style="display:block;font-size:11px;font-weight:900;margin-bottom:6px">Password</label><input id="pnCmsPasswordInputV2" type="password" autocomplete="current-password" spellcheck="false" style="width:100%;box-sizing:border-box;border:1px solid #94a3b8;border-radius:10px;padding:12px 13px;font:inherit;font-size:15px;outline:none"><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px"><button id="pnCmsPasswordCancelV2" type="button" style="border:0;border-radius:9px;padding:10px 16px;background:#e2e8f0;color:#334155;font-weight:900;cursor:pointer">BATAL</button><button id="pnCmsPasswordSubmitV2" type="button" style="border:0;border-radius:9px;padding:10px 16px;background:#0f766e;color:#fff;font-weight:900;cursor:pointer">HUBUNGKAN</button></div>';
    wrap.appendChild(card);
    document.body.appendChild(wrap);
    const input=card.querySelector('#pnCmsPasswordInputV2');
    let done=false;
    const finish=value=>{if(done)return;done=true;wrap.remove();resolve(value)};
    card.querySelector('#pnCmsPasswordCancelV2').onclick=()=>finish(null);
    card.querySelector('#pnCmsPasswordSubmitV2').onclick=()=>finish(input.value);
    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'){e.preventDefault();finish(input.value)}
      else if(e.key==='Escape'){e.preventDefault();finish(null)}
    });
    wrap.addEventListener('click',e=>{if(e.target===wrap)finish(null)});
    setTimeout(()=>input.focus(),30);
  });
}

function jsonp(action,payload={},timeout=6500){
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
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Server konten terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

function login(password){
  const rid=makeRid();
  const requested='cms_'+Array.from(crypto.getRandomValues(new Uint8Array(48)),b=>'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'[b%64]).join('');
  return new Promise((resolve,reject)=>{
    const frame=document.createElement('iframe');
    frame.name='pnCmsMaskFrame_'+rid.replace(/\W/g,'');
    frame.style.display='none';
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    const payload={action:'contentAdminLogin',rid,username:'admin',password,token:requested};
    Object.entries(payload).forEach(([k,v])=>{const input=document.createElement('input');input.type='hidden';input.name=k;input.value=String(v);form.appendChild(input)});
    let done=false,pollTimer=0,hardTimer=0;
    const cleanup=()=>{if(pollTimer)clearTimeout(pollTimer);if(hardTimer)clearTimeout(hardTimer);window.removeEventListener('message',onMessage);setTimeout(()=>frame.remove(),100)};
    const ok=data=>{if(done)return;done=true;cleanup();resolve(data)};
    const fail=err=>{if(done)return;done=true;cleanup();reject(err instanceof Error?err:new Error(String(err||'Login pengelola konten gagal.')))};
    const onMessage=e=>{const d=e&&e.data;if(!d||d.source!==SOURCE||String(d.rid||'')!==rid)return;if(d.ok)ok(d);else fail(new Error(d.message||'Login admin verifikasi tidak valid.'))};
    window.addEventListener('message',onMessage);
    const poll=async()=>{
      if(done)return;
      try{
        const r=await jsonp('contentResult',{rid},6500);
        if(done)return;
        if(r&&r.pending){pollTimer=setTimeout(poll,700);return}
        if(r&&r.ok){ok(r);return}
        if(r&&!r.pending){fail(new Error(r.message||'Login admin verifikasi tidak valid.'));return}
      }catch(_){if(!done)pollTimer=setTimeout(poll,900)}
    };
    hardTimer=setTimeout(()=>fail(new Error('Server konten tidak merespons tepat waktu.')),30000);
    document.body.append(frame,form);form.submit();form.remove();pollTimer=setTimeout(poll,1200);
  });
}

async function handleConnect(button){
  const password=await askPassword();
  if(password===null)return;
  const old=button.textContent;
  button.disabled=true;button.textContent='MENGHUBUNGKAN...';
  setStatus('Menghubungkan pengelola konten ke database pusat...');
  try{
    const r=await login(password);
    if(!r||!r.token)throw new Error('Token admin tidak diterima.');
    sessionStorage.setItem(TOKEN_KEY,r.token);
    setStatus('✓ Akses konten aktif. Memuat data...','ok');
    setTimeout(()=>location.reload(),180);
  }catch(err){
    setStatus(err.message||'Gagal menghubungkan akses konten.','err');
    button.disabled=false;button.textContent=old;
  }
}

document.addEventListener('click',e=>{
  const btn=e.target&&e.target.closest?e.target.closest('#pnCmsConnect'):null;
  if(!btn||btn.disabled)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  handleConnect(btn);
},true);
})();
