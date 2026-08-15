'use strict';

const PN_REG_SHEET = 'Data Daftar Siswa Baru';
const PN_REG_START = 6;
const PN_REG_END = 5000;
const PN_REG_MAJORS = ['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];
const PN_REG_ADMIN_EMAIL = 'pagarnusasmksore86@gmail.com';
const PN_REG_FORM_ENDPOINT = `https://formsubmit.co/ajax/${PN_REG_ADMIN_EMAIL}`;
const PN_REG_API_BASE = 'https://formsubmit.co/api';
const PN_REG_API_KEY_STORAGE = 'pnFormSubmitApiKeyV1';
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
  e.textContent='Pendaftaran online aktif • Anda tidak perlu upload atau memilih database Excel.';
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

  try{
    if(submit){submit.disabled=true;submit.textContent='MENGIRIM...'}
    const body={
      '_subject':`Pendaftaran Anggota Baru Pagar Nusa - ${v.name}`,
      '_template':'table',
      '_captcha':'false',
      '_url':location.href,
      '_honey':'',
      'Nama Lengkap':v.name,
      'Tempat Lahir':v.place,
      'Tanggal Lahir':v.date,
      'Kelas':v.kelas,
      'Jurusan':v.major,
      'Alamat':v.address,
      'Orang Tua/Ayah':v.parent,
      'No WA':v.wa,
      'Alamat Email':v.email,
      'Kesediaan Mengikuti Ekstrakurikuler':'Bersedia dan sudah mendapat izin orang tua',
      'Pernyataan':PN_REG_CONSENT,
      'Waktu Pendaftaran':new Date().toISOString()
    };
    const response=await fetch(PN_REG_FORM_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(body)
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok || data.success===false){
      throw new Error(data.message||`HTTP ${response.status}`);
    }
    localStorage.setItem('pnLastRegistration',JSON.stringify({name:v.name,wa:v.wa,at:Date.now()}));
    document.getElementById('pnRegistrationForm').reset();
    msg.className='pnRegMsg ok';
    msg.textContent='Pendaftaran berhasil dikirim. Data sudah masuk ke arsip pendaftaran pusat Pagar Nusa.';
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
    intro:'Kelola data pendaftaran pada workbook admin. Pendaftaran publik tersimpan terpusat dan dapat diunduh melalui tombol DOWNLOAD HASIL PENDAFTARAN.',
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

function pnCsvSafe(v){
  let s=String(v??'').replace(/\r?\n/g,' ');
  if(/^[=+\-@]/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}

function pnArchiveField(obj,...names){
  for(const n of names){if(obj && obj[n]!==undefined && obj[n]!==null) return obj[n]}
  return '';
}

function pnRegistrationRows(submissions){
  const rows=[];
  for(const s of submissions||[]){
    const f=s?.form_data||{};
    const name=pnArchiveField(f,'Nama Lengkap','name');
    const email=pnArchiveField(f,'Alamat Email','email');
    const statement=pnArchiveField(f,'Pernyataan');
    if(!name || !email || !String(statement).includes('Pagar Nusa Rayon SMK Sore Tulungagung')) continue;
    const submitted=s?.submitted_at?.date||pnArchiveField(f,'Waktu Pendaftaran');
    rows.push([
      name,
      pnArchiveField(f,'Tempat Lahir'),
      pnArchiveField(f,'Tanggal Lahir'),
      pnArchiveField(f,'Kelas'),
      pnArchiveField(f,'Jurusan'),
      pnArchiveField(f,'Alamat'),
      pnArchiveField(f,'Orang Tua/Ayah'),
      pnArchiveField(f,'No WA'),
      email,
      pnArchiveField(f,'Kesediaan Mengikuti Ekstrakurikuler'),
      statement,
      submitted
    ]);
  }
  return rows;
}

async function pnRequestArchiveKey(){
  window.open(`${PN_REG_API_BASE}/get-apikey/${encodeURIComponent(PN_REG_ADMIN_EMAIL)}`,'_blank','noopener');
  alert('Permintaan kunci download sudah dibuka. Kunci API akan dikirim ke email admin '+PN_REG_ADMIN_EMAIL+'. Setelah menerima kunci, klik DOWNLOAD HASIL PENDAFTARAN lagi dan tempel kuncinya. Ini hanya diperlukan satu kali pada perangkat admin.');
}

function pnGetStoredArchiveKey(){
  try{return localStorage.getItem(PN_REG_API_KEY_STORAGE)||''}catch(_){return''}
}
function pnStoreArchiveKey(k){try{localStorage.setItem(PN_REG_API_KEY_STORAGE,k)}catch(_){}}
function pnClearArchiveKey(){try{localStorage.removeItem(PN_REG_API_KEY_STORAGE)}catch(_){};alert('Kunci download arsip sudah dihapus dari perangkat ini.')}

async function pnDownloadRegistrationArchive(){
  let key=pnGetStoredArchiveKey();
  if(!key){
    const request=confirm('Perangkat ini belum memiliki kunci download arsip pendaftaran. Tekan OK untuk meminta kunci dikirim ke email admin. Setelah menerima email, klik tombol DOWNLOAD lagi.');
    if(request) await pnRequestArchiveKey();
    return;
  }
  try{
    const btn=document.getElementById('pnDownloadRegistrations');
    if(btn){btn.disabled=true;btn.textContent='MENGAMBIL DATA...'}
    const r=await fetch(`${PN_REG_API_BASE}/get-submissions/${encodeURIComponent(key)}`,{headers:{'Accept':'application/json'}});
    const data=await r.json().catch(()=>({}));
    if(!r.ok || !data.success || !Array.isArray(data.submissions)) throw new Error(data.message||'Kunci API tidak valid');
    const rows=pnRegistrationRows(data.submissions);
    const headers=['Nama Lengkap','Tempat Lahir','Tanggal Lahir','Kelas','Jurusan','Alamat','Orang Tua/Ayah','No WA','Alamat Email','Kesediaan Mengikuti Ekstrakurikuler','Pernyataan','Waktu Pendaftaran'];
    const csv='\ufeff'+[headers,...rows].map(row=>row.map(pnCsvSafe).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    const d=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
    a.href=url;a.download=`Hasil_Pendaftaran_Pagar_Nusa_${d}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
    alert(rows.length?`${rows.length} data pendaftaran berhasil diunduh.`:'Belum ada data pendaftaran yang cocok pada arsip.');
  }catch(e){
    console.error(e);
    pnClearArchiveKey();
    alert('Gagal mengambil arsip pendaftaran. Kunci mungkin belum benar atau arsip belum diaktifkan. Klik DOWNLOAD lagi untuk meminta/memasukkan kunci baru.');
  }finally{
    const btn=document.getElementById('pnDownloadRegistrations');
    if(btn){btn.disabled=false;btn.textContent='DOWNLOAD HASIL PENDAFTARAN'}
  }
}

function pnPromptArchiveKey(){
  const old=pnGetStoredArchiveKey();
  const key=prompt('Tempel kunci API FormSubmit yang dikirim ke email admin:',old||'');
  if(!key) return;
  pnStoreArchiveKey(key.trim());
  alert('Kunci download disimpan pada perangkat admin ini. Klik DOWNLOAD HASIL PENDAFTARAN.');
}

function pnInstallAdminArchiveControls(){
  const picker=document.querySelector('#dbDrawer .picker');
  if(!picker||document.getElementById('pnDownloadRegistrations')) return;
  const b=document.createElement('button');
  b.id='pnDownloadRegistrations';b.type='button';b.className='btn down';b.textContent='DOWNLOAD HASIL PENDAFTARAN';b.onclick=pnDownloadRegistrationArchive;
  const key=document.createElement('button');
  key.id='pnArchiveKeyBtn';key.type='button';key.className='btn clear';key.textContent='ATUR KUNCI DOWNLOAD';key.onclick=pnPromptArchiveKey;
  picker.appendChild(b);picker.appendChild(key);
  const note=document.createElement('div');
  note.className='hint';
  note.style.marginTop='10px';
  note.innerHTML='<b>Pendaftaran terpusat:</b> calon anggota tidak perlu upload database Excel. Hasil form disimpan pada arsip online dan admin cukup mengunduh hasil melalui tombol di atas. Database Excel pada menu ini hanya untuk pengelolaan internal admin.';
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
        <div id="pnRegDbStatus" class="pnRegDb ready">Pendaftaran online aktif • Anda tidak perlu upload atau memilih database Excel.</div>
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
