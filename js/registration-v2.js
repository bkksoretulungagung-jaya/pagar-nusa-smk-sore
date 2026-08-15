'use strict';

const PN_REG_SHEET = 'Data Daftar Siswa Baru';
const PN_REG_START = 6;
const PN_REG_END = 5000;
const PN_REG_MAJORS = ['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];
const PN_REG_SHEET_ID = '1WBpDiXDeVCKiAKWze7Dh_J-jG8t8_PAApGkAsBEchtc';
const PN_REG_WEB_APP = 'https://script.google.com/macros/s/AKfycbyJi_83IJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0I2ehWBlgaad8Oyw/exec';
const PN_REG_SHEET_URL = `https://docs.google.com/spreadsheets/d/${PN_REG_SHEET_ID}/edit`;
const PN_REG_XLSX_URL = `https://docs.google.com/spreadsheets/d/${PN_REG_SHEET_ID}/export?format=xlsx`;
const PN_REG_CONSENT = 'Saya bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa. Saya Siap dan bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa Rayon SMK Sore Tulungagung, dan Sudah dapat izin dari kedua orang tua.';

function pnEnsureRegistrationSheet(){
  try{
    if(typeof docs === 'undefined' || typeof cellMaps === 'undefined') return false;
    if(docs[PN_REG_SHEET] && cellMaps[PN_REG_SHEET]) return true;
    if(typeof sheetPaths === 'undefined' || typeof entryMap === 'undefined') return false;
    const p=sheetPaths[PN_REG_SHEET];
    if(!p || !entryMap?.has(p)) return false;
    docs[PN_REG_SHEET]=parseXML(bytesToText(entryMap.get(p).data));
    cellMaps[PN_REG_SHEET]=buildCellMap(docs[PN_REG_SHEET]);
    return true;
  }catch(e){
    console.error('Gagal memuat sheet pendaftaran:',e);
    return false;
  }
}

function pnRegStatus(){
  const e=document.getElementById('pnRegDbStatus');
  if(!e) return;
  e.className='pnRegDb ready';
  e.textContent='Pendaftaran online aktif • data tersimpan permanen ke database Google Sheets pusat. Tidak perlu upload Excel.';
}

function pnOpenRegistration(){
  const m=document.getElementById('pnRegistrationModal');
  if(!m) return;
  m.classList.add('open');
  m.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  pnRegStatus();
  setTimeout(()=>document.getElementById('pnRegName')?.focus(),50);
}

function pnCloseRegistration(){
  const m=document.getElementById('pnRegistrationModal');
  if(!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}

function pnRegistrationPayload(){
  return {
    name:trim(document.getElementById('pnRegName')?.value),
    place:trim(document.getElementById('pnRegBirthPlace')?.value),
    date:trim(document.getElementById('pnRegBirthDate')?.value),
    kelas:trim(document.getElementById('pnRegClass')?.value),
    major:trim(document.getElementById('pnRegMajor')?.value),
    address:trim(document.getElementById('pnRegAddress')?.value),
    parent:trim(document.getElementById('pnRegParent')?.value),
    wa:trim(document.getElementById('pnRegWa')?.value),
    email:trim(document.getElementById('pnRegEmail')?.value),
    willing:!!document.getElementById('pnRegWilling')?.checked,
    honey:trim(document.getElementById('pnRegWebsite')?.value)
  };
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

  try{
    if(submit){submit.disabled=true;submit.textContent='MENYIMPAN...'}
    const body=new URLSearchParams({
      action:'register',
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
    });
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),20000);
    try{
      await fetch(PN_REG_WEB_APP,{
        method:'POST',
        mode:'no-cors',
        cache:'no-store',
        redirect:'follow',
        body,
        signal:controller.signal
      });
    }finally{
      clearTimeout(timeout);
    }
    try{localStorage.setItem('pnLastRegistration',JSON.stringify({name:v.name,wa:v.wa,at:Date.now()}))}catch(_){}
    document.getElementById('pnRegistrationForm').reset();
    msg.className='pnRegMsg ok';
    msg.textContent='Pendaftaran berhasil dikirim ke database permanen Pagar Nusa.';
    pnRegStatus();
  }catch(e){
    console.error(e);
    msg.className='pnRegMsg err';
    msg.textContent='Pendaftaran belum berhasil dikirim. Periksa koneksi internet lalu coba kembali.';
  }finally{
    if(submit){submit.disabled=false;submit.textContent='KIRIM PENDAFTARAN'}
  }
  return false;
}

function pnInstallRegistrationModule(){
  if(typeof modules==='undefined') return;
  modules.daftarbaru={
    icon:'📝',
    title:'Data Daftar Siswa Baru',
    sheet:PN_REG_SHEET,
    start:PN_REG_START,
    end:PN_REG_END,
    primary:'A',
    recordCols:['A','B','C','D','E','G','H','I','J'],
    recordLabels:['Nama Lengkap','Tempat Lahir','Tanggal Lahir','Kelas','Jurusan','Orang Tua/Ayah','No WA','Alamat Email','Kesediaan'],
    intro:'Pendaftaran publik tersimpan permanen pada Google Sheets pusat. Database Excel lokal tetap dapat digunakan admin untuk pengelolaan internal.',
    fields:[
      {c:'A',l:'Nama Lengkap',req:1},
      {c:'B',l:'Tempat Lahir',req:1},
      {c:'C',l:'Tanggal Lahir',type:'date',req:1},
      {c:'D',l:'Kelas',type:'select',opts:['X','XI','XII'],req:1},
      {c:'E',l:'Jurusan',type:'select',opts:PN_REG_MAJORS,req:1},
      {c:'F',l:'Alamat',type:'textarea',cls:'two',req:1},
      {c:'G',l:'Orang Tua/Ayah',req:1},
      {c:'H',l:'No WA',req:1},
      {c:'I',l:'Alamat Email',req:1},
      {c:'J',l:'Kesediaan Mengikuti Ekstrakurikuler',type:'select',opts:['☑ Bersedia + Izin Orang Tua','☐ Tidak Bersedia'],req:1}
    ]
  };
  if(typeof renderNav==='function') renderNav();
}

function pnMatchRegistrationButtonTypography(button){
  const peer=document.getElementById('topLoginBtn')||document.getElementById('studentCbtLoginBtn');
  if(!button||!peer) return;
  const cs=getComputedStyle(peer);
  button.style.fontSize=cs.fontSize;
  button.style.fontFamily=cs.fontFamily;
  button.style.lineHeight=cs.lineHeight;
  button.style.letterSpacing=cs.letterSpacing;
  button.style.fontWeight=cs.fontWeight;
}

function pnOpenPermanentRegistrationDatabase(){
  window.open(PN_REG_SHEET_URL,'_blank','noopener');
}

function pnDownloadPermanentRegistrationDatabase(){
  const a=document.createElement('a');
  a.href=PN_REG_XLSX_URL;
  a.target='_blank';
  a.rel='noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function pnInstallAdminArchiveControls(){
  const picker=document.querySelector('#dbDrawer .picker');
  if(!picker||document.getElementById('pnDownloadRegistrations')) return;
  const open=document.createElement('button');
  open.id='pnOpenRegistrationDb';open.type='button';open.className='btn view';open.textContent='BUKA DATABASE PENDAFTARAN';open.onclick=pnOpenPermanentRegistrationDatabase;
  const down=document.createElement('button');
  down.id='pnDownloadRegistrations';down.type='button';down.className='btn down';down.textContent='DOWNLOAD HASIL PENDAFTARAN (XLSX)';down.onclick=pnDownloadPermanentRegistrationDatabase;
  picker.appendChild(open);picker.appendChild(down);
  const note=document.createElement('div');
  note.className='hint';
  note.style.marginTop='10px';
  note.innerHTML='<b>Database permanen:</b> data calon anggota masuk langsung ke Google Sheets pusat dan tidak memiliki batas penyimpanan 30 hari. Tombol BUKA/DOWNLOAD hanya dapat mengakses file jika akun Google admin memiliki izin.';
  picker.parentElement?.appendChild(note);
}

function pnInstallRegistrationUI(){
  const area=document.getElementById('bottomAdminLogin');
  if(area&&!document.getElementById('pnRegistrationBtn')){
    const b=document.createElement('button');
    b.id='pnRegistrationBtn';b.type='button';b.className='pnRegBtn';b.textContent='📝 PENDAFTARAN CALON ANGGOTA';b.onclick=pnOpenRegistration;
    area.insertBefore(b,area.firstChild);pnMatchRegistrationButtonTypography(b);
  }
  pnInstallAdminArchiveControls();
  if(document.getElementById('pnRegistrationModal')) return;
  const majorOptions=PN_REG_MAJORS.map(x=>`<option value="${x}">${x}</option>`).join('');
  const m=document.createElement('div');
  m.id='pnRegistrationModal';m.className='pnRegModal';m.setAttribute('aria-hidden','true');m.onclick=e=>{if(e.target===m)pnCloseRegistration()};
  m.innerHTML=`
    <div class="pnRegCard" role="dialog" aria-modal="true" aria-labelledby="pnRegTitle">
      <div class="pnRegHead">
        <div><small>PAGAR NUSA RAYON SMK SORE TULUNGAGUNG</small><h3 id="pnRegTitle">PENDAFTARAN CALON ANGGOTA</h3><p>Silakan isi biodata dengan lengkap dan benar.</p></div>
        <button type="button" onclick="pnCloseRegistration()" aria-label="Tutup">×</button>
      </div>
      <form id="pnRegistrationForm" class="pnRegForm" onsubmit="return pnSubmitRegistration(event)">
        <div id="pnRegDbStatus" class="pnRegDb ready">Pendaftaran online aktif • data tersimpan permanen ke database Google Sheets pusat. Tidak perlu upload Excel.</div>
        <input id="pnRegWebsite" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <div class="pnRegGrid">
          <label>Nama Lengkap *<input id="pnRegName" required></label>
          <label>Tempat Lahir *<input id="pnRegBirthPlace" required></label>
          <label>Tanggal Lahir *<input id="pnRegBirthDate" type="date" required></label>
          <label>Kelas *<select id="pnRegClass" required><option value="">— pilih kelas —</option><option>X</option><option>XI</option><option>XII</option></select></label>
          <label>Jurusan *<select id="pnRegMajor" required><option value="">— pilih jurusan —</option>${majorOptions}</select></label>
          <label>Orang Tua/Ayah *<input id="pnRegParent" required></label>
          <label class="wide">Alamat *<textarea id="pnRegAddress" rows="3" required></textarea></label>
          <label>No. WA *<input id="pnRegWa" type="tel" inputmode="tel" placeholder="08xxxxxxxxxx" required></label>
          <label>Alamat Email *<input id="pnRegEmail" type="email" placeholder="nama@email.com" required></label>
        </div>
        <label class="pnRegCheck"><input id="pnRegWilling" type="checkbox" required><span>${PN_REG_CONSENT}</span></label>
        <div id="pnRegMessage" class="pnRegMsg" aria-live="polite"></div>
        <div class="pnRegActions"><button type="button" class="cancel" onclick="pnCloseRegistration()">BATAL</button><button type="submit" class="submit">KIRIM PENDAFTARAN</button></div>
      </form>
    </div>`;
  document.body.appendChild(m);
}

(function(){
  const s=document.createElement('style');
  s.textContent=`
    .pnRegBtn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;padding:12px 24px;background:#14532d;color:#fff;font-weight:900;box-shadow:0 4px 14px rgba(20,83,45,.18);cursor:pointer}
    .pnRegModal{position:fixed;inset:0;z-index:10050;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,20,12,.72);backdrop-filter:blur(4px)}
    .pnRegModal.open{display:flex}.pnRegCard{width:min(880px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
    .pnRegHead{display:flex;justify-content:space-between;gap:20px;padding:22px 24px 18px;background:linear-gradient(135deg,#0f3d24,#166534);color:#fff}.pnRegHead h3{margin:4px 0 5px;font-size:22px}.pnRegHead p{margin:0;font-size:12px;opacity:.9}.pnRegHead small{font-weight:900;letter-spacing:.6px}.pnRegHead button{width:38px;height:38px;border:1px solid #ffffff55;border-radius:10px;background:#ffffff1f;color:#fff;font-size:26px}
    .pnRegForm{padding:22px 24px}.pnRegDb{margin-bottom:16px;padding:10px 12px;border-radius:10px;font-size:11px;font-weight:800}.pnRegDb.ready{background:#ecfdf3;border:1px solid #bbf7d0;color:#166534}.pnRegDb.warn{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}
    .pnRegGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pnRegGrid label{display:flex;flex-direction:column;gap:6px;font-size:11px;font-weight:900;color:#244735}.pnRegGrid .wide{grid-column:1/-1}.pnRegGrid input,.pnRegGrid select,.pnRegGrid textarea{box-sizing:border-box;width:100%;border:1px solid #b9d4c2;border-radius:10px;background:#fffef0;padding:11px 12px;font:inherit;font-size:13px}
    .pnRegCheck{display:flex;gap:10px;margin-top:17px;padding:13px 14px;border-radius:11px;background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d;font-size:12px;font-weight:800;line-height:1.55}.pnRegCheck input{width:18px;height:18px;min-width:18px;accent-color:#166534}
    .pnRegMsg{min-height:18px;margin-top:12px;font-size:12px;font-weight:800}.pnRegMsg.ok{color:#166534}.pnRegMsg.err{color:#b91c1c}.pnRegActions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}.pnRegActions button{border:0;border-radius:10px;padding:11px 18px;font-weight:900}.pnRegActions .cancel{background:#e2e8f0;color:#334155}.pnRegActions .submit{background:#166534;color:#fff}.pnRegActions .submit:disabled{opacity:.6;cursor:wait}
    @media(max-width:680px){.pnRegModal{padding:8px}.pnRegCard{max-height:96vh;border-radius:14px}.pnRegHead{padding:17px 16px}.pnRegHead h3{font-size:18px}.pnRegForm{padding:16px}.pnRegGrid{grid-template-columns:1fr}.pnRegGrid .wide{grid-column:auto}.pnRegActions{display:grid;grid-template-columns:1fr 1fr}.pnRegBtn{padding:12px 17px}}
  `;
  document.head.appendChild(s);
  document.addEventListener('DOMContentLoaded',()=>{pnInstallRegistrationModule();pnInstallRegistrationUI();});
  if(document.readyState!=='loading') setTimeout(()=>{pnInstallRegistrationModule();pnInstallRegistrationUI();},0);
})();