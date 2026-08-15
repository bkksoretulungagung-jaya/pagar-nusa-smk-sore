'use strict';

const PN_REG_GET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';

function pnInstallRegistrationThanksUI(){
  if(document.getElementById('pnRegistrationThanksStyle')) return;
  const style=document.createElement('style');
  style.id='pnRegistrationThanksStyle';
  style.textContent=`
    .pnThanksModal{position:fixed;inset:0;z-index:10150;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(2,20,12,.76);backdrop-filter:blur(5px)}
    .pnThanksModal.open{display:flex}
    .pnThanksCard{width:min(520px,100%);overflow:hidden;background:#fff;border-radius:22px;box-shadow:0 28px 80px rgba(0,0,0,.32);text-align:center;animation:pnThanksPop .22s ease-out}
    @keyframes pnThanksPop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
    .pnThanksTop{padding:30px 28px 24px;background:linear-gradient(135deg,#0f3d24,#16803f);color:#fff}
    .pnThanksIcon{display:flex;align-items:center;justify-content:center;width:72px;height:72px;margin:0 auto 16px;border-radius:50%;background:#fff;color:#15803d;font-size:40px;font-weight:1000;box-shadow:0 8px 28px rgba(0,0,0,.17)}
    .pnThanksTop h2{margin:0;font-size:24px;line-height:1.25;font-weight:1000}.pnThanksTop p{margin:8px 0 0;font-size:13px;line-height:1.6;opacity:.95}
    .pnThanksBody{padding:24px 28px 28px}.pnThanksName{margin:0 0 10px;color:#14532d;font-size:17px;font-weight:1000}.pnThanksText{margin:0;color:#475569;font-size:13px;line-height:1.75}
    .pnThanksInfo{margin:18px 0 0;padding:12px 14px;border:1px solid #bbf7d0;border-radius:12px;background:#ecfdf3;color:#166534;font-size:12px;font-weight:800;line-height:1.55}
    .pnThanksActions{display:flex;justify-content:center;gap:10px;margin-top:22px;flex-wrap:wrap}.pnThanksActions button{border:0;border-radius:11px;padding:12px 22px;font-weight:1000;cursor:pointer}.pnThanksDone{background:#166534;color:#fff}.pnThanksHome{background:#e2e8f0;color:#1e293b}
    @media(max-width:560px){.pnThanksCard{border-radius:18px}.pnThanksTop{padding:26px 20px 21px}.pnThanksBody{padding:20px}.pnThanksTop h2{font-size:21px}.pnThanksIcon{width:64px;height:64px;font-size:35px}.pnThanksActions{display:grid;grid-template-columns:1fr}.pnThanksActions button{width:100%}}
  `;
  document.head.appendChild(style);
}

function pnCloseRegistrationThanks(){
  const modal=document.getElementById('pnRegistrationThanksModal');
  if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
  document.body.style.overflow='';
}

function pnShowRegistrationThanks(name){
  pnInstallRegistrationThanksUI();
  let modal=document.getElementById('pnRegistrationThanksModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='pnRegistrationThanksModal';
    modal.className='pnThanksModal';
    modal.setAttribute('aria-hidden','true');
    modal.onclick=e=>{if(e.target===modal)pnCloseRegistrationThanks()};
    document.body.appendChild(modal);
  }
  const safeName=String(name||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  modal.innerHTML=`
    <div class="pnThanksCard" role="dialog" aria-modal="true" aria-labelledby="pnThanksTitle">
      <div class="pnThanksTop">
        <div class="pnThanksIcon">✓</div>
        <h2 id="pnThanksTitle">TERIMA KASIH</h2>
        <p>Pendaftaran calon anggota sudah berhasil terkirim.</p>
      </div>
      <div class="pnThanksBody">
        <p class="pnThanksName">${safeName ? 'Saudara/i '+safeName : 'Pendaftaran Anda'}</p>
        <p class="pnThanksText">Data pendaftaran Anda telah kami terima. Terima kasih atas kesiapan Anda mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa Rayon SMK Sore Tulungagung.</p>
        <div class="pnThanksInfo">✓ Data sudah tersimpan permanen di database Pagar Nusa.<br>Silakan menunggu informasi selanjutnya dari pengurus.</div>
        <div class="pnThanksActions">
          <button type="button" class="pnThanksHome" onclick="pnCloseRegistrationThanks();window.scrollTo({top:0,behavior:'smooth'})">KEMBALI KE BERANDA</button>
          <button type="button" class="pnThanksDone" onclick="pnCloseRegistrationThanks()">SELESAI</button>
        </div>
      </div>
    </div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}

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

  const normalizedWa=String(v.wa).replace(/\D/g,'');
  const submitKey=(String(v.name).trim().toLowerCase()+'|'+normalizedWa);
  try{
    const last=JSON.parse(localStorage.getItem('pnLastRegistration')||'null');
    if(last && last.key===submitKey && Date.now()-Number(last.at||0)<120000){
      msg.className='pnRegMsg ok';
      msg.textContent='Data ini sudah dikirim. Tidak perlu menekan tombol kirim lagi.';
      return false;
    }
  }catch(_){}

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
  let submitted=false;
  let timeoutId=0;
  let fallbackId=0;

  function cleanup(){
    window.removeEventListener('message',onMessage);
    frame.removeEventListener('load',onFrameLoad);
    clearTimeout(timeoutId);
    clearTimeout(fallbackId);
    form.remove();
    setTimeout(()=>frame.remove(),800);
  }

  function finishSuccess(){
    if(finished) return;
    finished=true;
    try{localStorage.setItem('pnLastRegistration',JSON.stringify({key:submitKey,name:v.name,wa:v.wa,at:Date.now()}))}catch(_){}
    cleanup();
    document.getElementById('pnRegistrationForm')?.reset();
    msg.className='pnRegMsg ok';
    msg.textContent='Pendaftaran berhasil. Data sudah tersimpan permanen di Google Sheets Pagar Nusa.';
    if(submit){submit.disabled=false;submit.textContent='KIRIM PENDAFTARAN'}
    try{pnRegStatus()}catch(_){}
    try{pnCloseRegistration()}catch(_){}
    setTimeout(()=>pnShowRegistrationThanks(v.name),120);
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
    if(d.ok){
      finishSuccess();
    }else{
      finishError(d.message||'Pendaftaran belum berhasil disimpan.');
    }
  }

  function onFrameLoad(){
    if(!submitted || finished) return;
    fallbackId=setTimeout(()=>finishSuccess(),450);
  }

  window.addEventListener('message',onMessage);
  frame.addEventListener('load',onFrameLoad);
  timeoutId=setTimeout(()=>finishError('Server terlalu lama merespons. Silakan periksa koneksi lalu coba lagi.'),12000);

  if(submit){submit.disabled=true;submit.textContent='MENYIMPAN...'}
  submitted=true;
  form.submit();
  return false;
}
