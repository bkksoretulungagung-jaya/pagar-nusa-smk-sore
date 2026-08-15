'use strict';

const PN_REG_GET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';

async function pnSubmitRegistration(ev){
  ev.preventDefault();

  const msg=document.getElementById('pnRegMessage');
  const submit=document.querySelector('#pnRegistrationForm .submit');
  msg.className='pnRegMsg';
  msg.textContent='';

  const v=pnRegistrationPayload();
  if(v.honey) return false;

  if(!v.name||!v.place||!v.date||!v.kelas||!v.major||!v.address||!v.parent||!v.wa||!v.email||!v.willing){
    msg.className='pnRegMsg err';
    msg.textContent='Lengkapi semua data dan centang pernyataan kesediaan serta izin orang tua.';
    return false;
  }
  if(!PN_REG_MAJORS.includes(v.major)){
    msg.className='pnRegMsg err';
    msg.textContent='Pilihan jurusan tidak valid.';
    return false;
  }
  if(!/^\S+@\S+\.\S+$/.test(v.email)){
    msg.className='pnRegMsg err';
    msg.textContent='Alamat email belum valid.';
    return false;
  }
  if(!/^[0-9+() .-]{8,20}$/.test(v.wa)){
    msg.className='pnRegMsg err';
    msg.textContent='Nomor WhatsApp belum valid.';
    return false;
  }

  const rid='pn-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');
  frame.name='pnRegFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
  frame.style.display='none';
  frame.setAttribute('aria-hidden','true');
  document.body.appendChild(frame);

  const form=document.createElement('form');
  form.method='GET';
  form.action=PN_REG_GET_ENDPOINT;
  form.target=frame.name;
  form.style.display='none';

  const payload={
    action:'register',
    rid,
    name:v.name,
    place:v.place,
    date:v.date,
    kelas:v.kelas,
    major:v.major,
    address:v.address,
    parent:v.parent,
    wa:v.wa,
    email:v.email,
    willing:'true'
  };

  Object.entries(payload).forEach(([name,value])=>{
    const input=document.createElement('input');
    input.type='hidden';
    input.name=name;
    input.value=String(value ?? '');
    form.appendChild(input);
  });
  document.body.appendChild(form);

  let finished=false;
  let timeoutId=0;

  function cleanup(){
    window.removeEventListener('message',onMessage);
    clearTimeout(timeoutId);
    form.remove();
    setTimeout(()=>frame.remove(),1000);
  }

  function finishError(text){
    if(finished) return;
    finished=true;
    cleanup();
    msg.className='pnRegMsg err';
    msg.textContent=text;
    if(submit){submit.disabled=false;submit.textContent='KIRIM PENDAFTARAN'}
  }

  function onMessage(event){
    const d=event.data;
    if(!d || d.source!=='pn-registration' || d.rid!==rid) return;
    if(finished) return;
    finished=true;
    cleanup();

    if(d.ok){
      try{localStorage.setItem('pnLastRegistration',JSON.stringify({name:v.name,wa:v.wa,at:Date.now()}))}catch(_){}
      document.getElementById('pnRegistrationForm')?.reset();
      msg.className='pnRegMsg ok';
      msg.textContent='Pendaftaran berhasil. Data sudah tersimpan permanen di Google Sheets Pagar Nusa.';
      pnRegStatus();
    }else{
      msg.className='pnRegMsg err';
      msg.textContent=d.message||'Pendaftaran belum berhasil disimpan.';
    }

    if(submit){submit.disabled=false;submit.textContent='KIRIM PENDAFTARAN'}
  }

  window.addEventListener('message',onMessage);
  timeoutId=setTimeout(()=>finishError('Server belum memberi konfirmasi. Silakan coba lagi beberapa saat.'),25000);

  if(submit){submit.disabled=true;submit.textContent='MENYIMPAN...'}
  form.submit();
  return false;
}
