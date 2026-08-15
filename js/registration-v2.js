'use strict';

const PN_REG_SHEET = 'Data Daftar Siswa Baru';
const PN_REG_START = 6;
const PN_REG_END = 5000;
const PN_REG_MAJORS = ['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];

function pnEnsureRegistrationSheet(){
  try{
    if(typeof docs === 'undefined' || typeof cellMaps === 'undefined') return false;
    if(docs[PN_REG_SHEET] && cellMaps[PN_REG_SHEET]) return true;
    if(typeof sheetPaths === 'undefined' || typeof entryMap === 'undefined') return false;
    const p = sheetPaths[PN_REG_SHEET];
    if(!p || !entryMap?.has(p)) return false;
    docs[PN_REG_SHEET] = parseXML(bytesToText(entryMap.get(p).data));
    cellMaps[PN_REG_SHEET] = buildCellMap(docs[PN_REG_SHEET]);
    return true;
  }catch(e){
    console.error('Gagal memuat sheet pendaftaran:', e);
    return false;
  }
}

function pnRegReady(){
  return typeof zipEntries !== 'undefined' && !!zipEntries && pnEnsureRegistrationSheet();
}

function pnRegBlankRow(){
  if(!pnEnsureRegistrationSheet()) return 0;
  for(let r=PN_REG_START;r<=PN_REG_END;r++){
    if(!trim(cellText(docs[PN_REG_SHEET],cellMaps[PN_REG_SHEET],'A'+r))) return r;
  }
  return 0;
}

function pnRegDuplicate(name,wa){
  if(!pnEnsureRegistrationSheet()) return false;
  const n=trim(name).toLowerCase();
  const w=trim(wa).replace(/\D/g,'');
  for(let r=PN_REG_START;r<=PN_REG_END;r++){
    const rn=trim(cellText(docs[PN_REG_SHEET],cellMaps[PN_REG_SHEET],'A'+r));
    if(!rn) continue;
    const rw=trim(cellText(docs[PN_REG_SHEET],cellMaps[PN_REG_SHEET],'H'+r)).replace(/\D/g,'');
    if(rn.toLowerCase()===n && rw===w) return true;
  }
  return false;
}

function pnRegStatus(){
  const e=document.getElementById('pnRegDbStatus');
  if(!e) return;
  if(pnRegReady()){
    e.className='pnRegDb ready';
    e.textContent='Database siap • hasil masuk ke sheet “Data Daftar Siswa Baru”.';
  }else if(typeof zipEntries!=='undefined' && zipEntries){
    e.className='pnRegDb warn';
    e.textContent='Database terhubung, tetapi sheet “Data Daftar Siswa Baru” belum ditemukan.';
  }else{
    e.className='pnRegDb warn';
    e.textContent='Database Excel belum terhubung pada perangkat ini. Hubungkan database melalui LOGIN ADMIN.';
  }
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

async function pnSubmitRegistration(ev){
  ev.preventDefault();
  const msg=document.getElementById('pnRegMessage');
  msg.className='pnRegMsg';
  msg.textContent='';

  if(typeof zipEntries==='undefined' || !zipEntries){
    msg.className='pnRegMsg err';
    msg.textContent='Database Excel belum terhubung pada perangkat ini.';
    pnRegStatus();
    return false;
  }
  if(!pnEnsureRegistrationSheet()){
    msg.className='pnRegMsg err';
    msg.textContent='Sheet “Data Daftar Siswa Baru” belum ada pada database yang dipakai.';
    pnRegStatus();
    return false;
  }

  const v={
    name:trim(document.getElementById('pnRegName').value),
    place:trim(document.getElementById('pnRegBirthPlace').value),
    date:trim(document.getElementById('pnRegBirthDate').value),
    kelas:trim(document.getElementById('pnRegClass').value),
    major:trim(document.getElementById('pnRegMajor').value),
    address:trim(document.getElementById('pnRegAddress').value),
    parent:trim(document.getElementById('pnRegParent').value),
    wa:trim(document.getElementById('pnRegWa').value),
    email:trim(document.getElementById('pnRegEmail').value),
    willing:document.getElementById('pnRegWilling').checked
  };

  if(Object.values(v).some(x=>!x)){
    msg.className='pnRegMsg err';
    msg.textContent='Lengkapi semua data, pilih jurusan, dan centang kesediaan mengikuti ekstrakurikuler.';
    return false;
  }
  if(!PN_REG_MAJORS.includes(v.major)){
    msg.className='pnRegMsg err';
    msg.textContent='Pilihan jurusan tidak valid.';
    return false;
  }
  if(pnRegDuplicate(v.name,v.wa)){
    msg.className='pnRegMsg err';
    msg.textContent='Nama Lengkap dan No. WA tersebut sudah terdaftar.';
    return false;
  }

  const r=pnRegBlankRow();
  if(!r){
    msg.className='pnRegMsg err';
    msg.textContent='Slot data pendaftaran sudah penuh.';
    return false;
  }

  try{
    writeOrCache(PN_REG_SHEET,'A'+r,v.name,false,'A6');
    writeOrCache(PN_REG_SHEET,'B'+r,v.place,false,'B6');
    writeOrCache(PN_REG_SHEET,'C'+r,isoToExcel(v.date),true,'C6');
    writeOrCache(PN_REG_SHEET,'D'+r,v.kelas,false,'D6');
    writeOrCache(PN_REG_SHEET,'E'+r,v.major,false,'E6');
    writeOrCache(PN_REG_SHEET,'F'+r,v.address,false,'F6');
    writeOrCache(PN_REG_SHEET,'G'+r,v.parent,false,'G6');
    writeOrCache(PN_REG_SHEET,'H'+r,v.wa,false,'H6');
    writeOrCache(PN_REG_SHEET,'I'+r,v.email,false,'I6');
    writeOrCache(PN_REG_SHEET,'J'+r,'☑ Bersedia',false,'J6');
    await afterMutation('PENDAFTARAN berhasil — '+v.name);
    document.getElementById('pnRegistrationForm').reset();
    msg.className='pnRegMsg ok';
    msg.textContent='Pendaftaran berhasil disimpan ke database. Terima kasih.';
    pnRegStatus();
  }catch(e){
    console.error(e);
    msg.className='pnRegMsg err';
    msg.textContent='Pendaftaran gagal disimpan: '+(e?.message||'kesalahan tidak diketahui');
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
    intro:'Kelola hasil formulir pendaftaran calon anggota. Data terpisah dari Data Siswa.',
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
      {c:'J',l:'Kesediaan Mengikuti Ekstrakurikuler',type:'select',opts:['☑ Bersedia','☐ Tidak Bersedia'],req:1}
    ]
  };
  if(typeof renderNav==='function') renderNav();
}

function pnMatchRegistrationButtonTypography(button){
  const peer=document.getElementById('topLoginBtn') || document.getElementById('studentCbtLoginBtn');
  if(!button || !peer) return;
  const cs=getComputedStyle(peer);
  button.style.fontSize=cs.fontSize;
  button.style.fontFamily=cs.fontFamily;
  button.style.lineHeight=cs.lineHeight;
  button.style.letterSpacing=cs.letterSpacing;
  button.style.fontWeight=cs.fontWeight;
}

function pnInstallRegistrationUI(){
  const area=document.getElementById('bottomAdminLogin');
  if(area && !document.getElementById('pnRegistrationBtn')){
    const b=document.createElement('button');
    b.id='pnRegistrationBtn';
    b.type='button';
    b.className='pnRegBtn';
    b.textContent='📝 PENDAFTARAN CALON ANGGOTA';
    b.onclick=pnOpenRegistration;
    area.insertBefore(b,area.firstChild);
    pnMatchRegistrationButtonTypography(b);
  }
  if(document.getElementById('pnRegistrationModal')) return;

  const majorOptions=PN_REG_MAJORS.map(x=>`<option value="${x}">${x}</option>`).join('');
  const m=document.createElement('div');
  m.id='pnRegistrationModal';
  m.className='pnRegModal';
  m.setAttribute('aria-hidden','true');
  m.onclick=e=>{if(e.target===m)pnCloseRegistration()};
  m.innerHTML=`
    <div class="pnRegCard" role="dialog" aria-modal="true" aria-labelledby="pnRegTitle">
      <div class="pnRegHead">
        <div>
          <small>PAGAR NUSA RAYON SMK SORE TULUNGAGUNG</small>
          <h3 id="pnRegTitle">PENDAFTARAN CALON ANGGOTA</h3>
          <p>Silakan isi biodata dengan lengkap dan benar.</p>
        </div>
        <button type="button" onclick="pnCloseRegistration()" aria-label="Tutup">×</button>
      </div>
      <form id="pnRegistrationForm" class="pnRegForm" onsubmit="return pnSubmitRegistration(event)">
        <div id="pnRegDbStatus" class="pnRegDb"></div>
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
        <label class="pnRegCheck"><input id="pnRegWilling" type="checkbox" required><span>Saya bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa.</span></label>
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
    .pnRegCheck{display:flex;gap:10px;margin-top:17px;padding:13px 14px;border-radius:11px;background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d;font-size:12px;font-weight:800}.pnRegCheck input{width:18px;height:18px;accent-color:#166534}
    .pnRegMsg{min-height:18px;margin-top:12px;font-size:12px;font-weight:800}.pnRegMsg.ok{color:#166534}.pnRegMsg.err{color:#b91c1c}.pnRegActions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}.pnRegActions button{border:0;border-radius:10px;padding:11px 18px;font-weight:900}.pnRegActions .cancel{background:#e2e8f0;color:#334155}.pnRegActions .submit{background:#166534;color:#fff}
    @media(max-width:680px){.pnRegBtn{width:100%}.pnRegModal{padding:9px}.pnRegCard{max-height:96vh}.pnRegHead{padding:18px 16px}.pnRegHead h3{font-size:18px}.pnRegForm{padding:16px}.pnRegGrid{grid-template-columns:1fr}.pnRegGrid .wide{grid-column:auto}.pnRegActions{display:grid}.pnRegActions button{width:100%}}
  `;
  document.head.appendChild(s);

  const old=typeof switchModule==='function'?switchModule:null;
  if(old){
    switchModule=function(k){
      if(k==='daftarbaru' && !pnEnsureRegistrationSheet()){
        alert('Sheet “Data Daftar Siswa Baru” belum ditemukan pada database Excel. Gunakan database versi yang sudah memiliki sheet pendaftaran.');
        return;
      }
      return old(k);
    };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    pnInstallRegistrationModule();
    pnInstallRegistrationUI();
    pnRegStatus();
    pnMatchRegistrationButtonTypography(document.getElementById('pnRegistrationBtn'));
    setTimeout(()=>pnMatchRegistrationButtonTypography(document.getElementById('pnRegistrationBtn')),0);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')pnCloseRegistration()});
  });
})();
