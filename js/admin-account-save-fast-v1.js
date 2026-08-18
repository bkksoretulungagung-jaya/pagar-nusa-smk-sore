(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
let saving=false;

const $=id=>document.getElementById(id);
const savedValue=key=>{try{return localStorage.getItem(key)||sessionStorage.getItem(key)||''}catch(_){try{return sessionStorage.getItem(key)||''}catch(__){return''}}};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const norm=value=>String(value||'').trim().toLowerCase();

function message(kind,text){
  const el=$('pnAccountModalMsg');
  if(!el)return;
  el.className='pnAccountMsg'+(kind?' '+kind:'');
  el.textContent=text||'';
}

function setBusy(value){
  saving=!!value;
  ['pnAccountSave','pnAccountReset','pnAccountGenerate','pnAccountUsername','pnAccountEmail','pnAccountAccountStatus','pnAccountPassword','pnAccountPassword2'].forEach(id=>{
    const el=$(id);if(el)el.disabled=!!value;
  });
}

function jsonp(action,payload={},timeoutMs=5500){
  return new Promise((resolve,reject)=>{
    const cb='pnAccountFastSave_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();resolve(data||{})};
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([key,value])=>qs.set(key,String(value??'')));
    script.src=ENDPOINT+'?'+qs.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Pemeriksaan database gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Pemeriksaan database terlalu lama.'))},timeoutMs);
    document.head.appendChild(script);
  });
}

async function verifyUpdate(token,memberId,username,email,status,maxMs=20000){
  const started=Date.now();
  let first=true;
  while(Date.now()-started<maxMs){
    await sleep(first?350:700);first=false;
    try{
      const data=await jsonp('portalAccountAdminList',{token,force:'1'},5500);
      if(!data||!data.ok)continue;
      const found=(data.accounts||[]).find(item=>norm(item.memberId)===norm(memberId));
      if(!found)continue;
      const sameUser=String(found.username||'').trim()===String(username||'').trim();
      const sameEmail=norm(found.email)===norm(email);
      const sameStatus=String(found.accountStatus||'').trim().toUpperCase()===String(status||'').trim().toUpperCase();
      if(sameUser&&sameEmail&&sameStatus){
        return {ok:true,verified:true,message:'Perubahan akun berhasil disimpan.'};
      }
    }catch(_){}
  }
  return null;
}

function submitUpdate(payload){
  return new Promise((resolve,reject)=>{
    const rid='pn-account-fast-update-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnAccountFastUpdate_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    const data={action:'portalAccountAdminUpdate',rid,...payload};
    Object.entries(data).forEach(([name,value])=>{
      const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);
    });

    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(hardTimer);form.remove();setTimeout(()=>frame.remove(),400)};
    const ok=result=>{if(done)return;done=true;cleanup();resolve(result||{ok:true})};
    const fail=err=>{if(done)return;done=true;cleanup();reject(err instanceof Error?err:new Error(String(err||'Perubahan akun gagal.')))};
    const onMessage=event=>{
      const d=event.data;
      if(!d||d.source!=='pn-account-admin'||d.rid!==rid||done)return;
      if(d.ok)ok(d);else fail(new Error(d.message||'Perubahan akun gagal.'));
    };
    window.addEventListener('message',onMessage);

    verifyUpdate(payload.token,payload.memberId,payload.username,payload.email,payload.status,20000)
      .then(result=>{if(result)ok(result)})
      .catch(()=>{});

    const hardTimer=setTimeout(()=>{
      if(done)return;
      fail(new Error('Perubahan belum terkonfirmasi. Klik MUAT ULANG untuk mengecek hasil sebelum mencoba lagi.'));
    },22000);

    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

async function handleSave(event){
  const button=event.target?.closest?.('#pnAccountSave');
  if(!button)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  if(saving)return;

  const token=savedValue(TOKEN_KEY);
  const memberId=String($('pnAccountMemberId')?.value||'').trim();
  const username=String($('pnAccountUsername')?.value||'').trim();
  const email=String($('pnAccountEmail')?.value||'').trim().toLowerCase();
  const status=String($('pnAccountAccountStatus')?.value||'AKTIF').trim().toUpperCase();

  if(!token)return message('err','Sesi Admin tidak tersedia. Silakan login ulang.');
  if(!memberId)return message('err','ID Anggota tidak tersedia.');
  if(username.length<3)return message('err','Username minimal 3 karakter.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return message('err','Format email belum benar.');
  if(status!=='AKTIF'&&status!=='NONAKTIF')return message('err','Status akun tidak valid.');

  try{
    setBusy(true);
    message('','Menyimpan perubahan...');
    const res=await submitUpdate({token,memberId,username,email,status});
    message('ok',res.message||'Perubahan akun berhasil disimpan.');
    setTimeout(()=>$('pnAccountRefresh')?.click(),650);
  }catch(err){
    message('err',err?.message||String(err));
  }finally{
    setBusy(false);
  }
}

document.addEventListener('click',handleSave,true);
})();
