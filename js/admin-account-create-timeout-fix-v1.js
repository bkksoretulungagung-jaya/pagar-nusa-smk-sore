(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
let busy=false;

const $=id=>document.getElementById(id);
const savedValue=key=>{try{return localStorage.getItem(key)||sessionStorage.getItem(key)||''}catch(_){try{return sessionStorage.getItem(key)||''}catch(__){return''}}};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function setMessage(kind,text){
  const el=$('pnAccountCreateV2Msg');
  if(!el)return;
  el.className='pnAccountCreateV2Msg'+(kind?' '+kind:'');
  el.textContent=text||'';
}

function setBusy(value){
  busy=!!value;
  ['pnAccountCreateV2Member','pnAccountCreateV2Username','pnAccountCreateV2Email','pnAccountCreateV2Status','pnAccountCreateV2Password','pnAccountCreateV2Password2','pnAccountCreateV2Generate','pnAccountCreateV2Submit','pnAccountCreateV2Cancel'].forEach(id=>{
    const el=$(id);if(el)el.disabled=busy;
  });
}

function jsonp(action,payload={},timeoutMs=18000){
  return new Promise((resolve,reject)=>{
    const cb='pnAccountCreateVerify_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();resolve(data||{})};
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([key,value])=>qs.set(key,String(value??'')));
    script.src=ENDPOINT+'?'+qs.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Tidak dapat memeriksa hasil pembuatan akun.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Pemeriksaan hasil terlalu lama.'))},timeoutMs);
    document.head.appendChild(script);
  });
}

async function verifyCreated(token,memberId,email,maxMs=70000){
  const started=Date.now();
  while(Date.now()-started<maxMs){
    await sleep(1800);
    try{
      const data=await jsonp('portalAccountAdminList',{token},15000);
      if(data&&data.ok){
        const found=(data.accounts||[]).find(item=>String(item.memberId||'').trim().toLowerCase()===String(memberId||'').trim().toLowerCase());
        if(found&&found.hasAccount&&String(found.email||'').trim().toLowerCase()===String(email||'').trim().toLowerCase()){
          return {ok:true,verified:true,message:'Akun berhasil dibuat dan sudah terhubung ke Firebase serta database anggota.'};
        }
      }
    }catch(_){}
  }
  return null;
}

function submitPost(payload){
  return new Promise((resolve,reject)=>{
    const rid='pn-account-create-safe-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnAccountCreateSafe_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    const data={action:'portalAccountAdminCreate',rid,...payload};
    Object.entries(data).forEach(([name,value])=>{
      const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);
    });

    let done=false;
    let verifyDone=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(hardTimer);form.remove();setTimeout(()=>frame.remove(),500)};
    const finishOk=result=>{if(done)return;done=true;cleanup();resolve(result)};
    const finishErr=err=>{if(done)return;done=true;cleanup();reject(err instanceof Error?err:new Error(String(err||'Pembuatan akun gagal.')))};
    const onMessage=event=>{
      const d=event.data;
      if(!d||d.source!=='pn-account-admin'||d.rid!==rid||done)return;
      if(d.ok)finishOk(d);else finishErr(new Error(d.message||'Pembuatan akun gagal.'));
    };
    window.addEventListener('message',onMessage);

    verifyCreated(payload.token,payload.memberId,payload.email,70000).then(result=>{
      verifyDone=true;
      if(result)finishOk(result);
    }).catch(()=>{verifyDone=true});

    const hardTimer=setTimeout(()=>{
      if(done)return;
      const suffix=verifyDone?'':' Pemeriksaan database juga belum selesai.';
      finishErr(new Error('Belum menerima konfirmasi akhir dari server.'+suffix+' Klik MUAT ULANG sebelum mencoba lagi agar tidak membuat akun ganda.'));
    },85000);

    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

async function handleSubmit(event){
  const button=event.target&&event.target.closest?event.target.closest('#pnAccountCreateV2Submit'):null;
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  if(busy)return;

  const token=savedValue(TOKEN_KEY);
  const memberId=String($('pnAccountCreateV2Member')?.value||'').trim();
  const selected=$('pnAccountCreateV2Member')?.selectedOptions?.[0];
  const memberLabel=String(selected?.textContent||memberId).trim();
  const username=String($('pnAccountCreateV2Username')?.value||'').trim();
  const email=String($('pnAccountCreateV2Email')?.value||'').trim().toLowerCase();
  const status=String($('pnAccountCreateV2Status')?.value||'AKTIF').trim().toUpperCase();
  const p1=String($('pnAccountCreateV2Password')?.value||'');
  const p2=String($('pnAccountCreateV2Password2')?.value||'');

  if(!token)return setMessage('err','Sesi Admin tidak tersedia. Silakan login ulang.');
  if(!memberId)return setMessage('err','Pilih Anggota atau Calon Anggota terlebih dahulu.');
  if(username.length<3)return setMessage('err','Username minimal 3 karakter.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setMessage('err','Format email belum benar.');
  if(p1.length<8||!/[A-Za-z]/.test(p1)||!/[0-9]/.test(p1))return setMessage('err','Password minimal 8 karakter dan harus mengandung huruf serta angka.');
  if(p1!==p2)return setMessage('err','Ulangi password harus sama.');
  if(!confirm('Buat akun baru untuk '+memberLabel+'?'))return;

  try{
    setBusy(true);
    setMessage('','Membuat akun Firebase... Sistem juga akan memeriksa database sampai akun benar-benar tercatat.');
    const res=await submitPost({token,memberId,username,email,status,password:p1});
    setMessage('ok',res.message||'Akun berhasil dibuat.');
    if($('pnAccountCreateV2Password'))$('pnAccountCreateV2Password').value='';
    if($('pnAccountCreateV2Password2'))$('pnAccountCreateV2Password2').value='';
    $('pnAccountRefresh')?.click();
    setTimeout(()=>$('pnAccountCreateV2Modal')?.classList.add('hidden'),1400);
  }catch(err){
    setMessage('err',err&&err.message?err.message:String(err));
  }finally{
    setBusy(false);
  }
}

document.addEventListener('click',handleSubmit,true);
})();
