import {getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAuth,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';

const PN_BIODATA_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const PN_PROGRAMS=['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];
const $=id=>document.getElementById(id);
let pnBioUser=null;
let pnBioData=null;
let pnBioVerified=false;

function pnBioInstallStyles(){
  if($('pnBioStyles')) return;
  const style=document.createElement('style');
  style.id='pnBioStyles';
  style.textContent=`
    .pnPortalMenu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 16px}.pnPortalMenuBtn{display:flex;align-items:center;gap:11px;text-align:left;background:#fff;border:1px solid #d9e7dd;border-radius:13px;padding:14px 16px;color:#14532d;box-shadow:0 5px 16px rgba(15,23,42,.05)}.pnPortalMenuBtn strong{display:block;font-size:13px}.pnPortalMenuBtn span{display:block;margin-top:3px;font-size:10px;color:#64748b;font-weight:600}.pnPortalMenuBtn.active{border-color:#22c55e;background:#f0fdf4;box-shadow:0 0 0 3px rgba(34,197,94,.10)}.pnPortalMenuIcon{font-size:23px;line-height:1}
    .pnBioVerify{background:#fff;border:1px solid #bbf7d0;border-radius:14px;padding:18px;text-align:center;color:#166534;font-size:12px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,.07)}
    .pnBioCard{background:#fff;border:1px solid #d9e7dd;border-radius:15px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.07)}.pnBioHead{padding:18px 20px;background:linear-gradient(135deg,#0f3d24,#166534);color:#fff}.pnBioHead h2{margin:0;font-size:20px}.pnBioHead p{margin:6px 0 0;font-size:11px;line-height:1.55;opacity:.92}.pnBioBody{padding:20px}.pnBioLockedNote{margin:0 0 16px;padding:11px 13px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;color:#1e40af;font-size:11px;line-height:1.55}.pnBioGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px 16px}.pnBioField.full{grid-column:1/-1}.pnBioField label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;color:#334155;font-size:11px;font-weight:900}.pnBioLock{display:inline-flex;padding:3px 7px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:8px;letter-spacing:.3px}.pnBioField input,.pnBioField select,.pnBioField textarea{width:100%;min-height:42px;margin:0;border:1px solid #cbd5e1;border-radius:9px;padding:9px 11px;background:#fff;color:#172033;font:inherit;font-size:12px}.pnBioField textarea{min-height:86px;resize:vertical}.pnBioField input:disabled,.pnBioField select:disabled,.pnBioField textarea:disabled{background:#f8fafc;color:#475569;opacity:1}.pnBioField.locked input,.pnBioField.locked textarea{background:#f1f5f9;color:#475569;border-style:dashed}.pnBioActions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid #e2e8f0}.pnBioActions button{border:0;border-radius:10px;padding:11px 17px;font-weight:900}.pnBioEdit{background:#166534;color:#fff}.pnBioSave{background:#15803d;color:#fff}.pnBioCancel{background:#e2e8f0;color:#334155}.pnBioStatus{min-height:18px;margin-top:12px;font-size:11px;font-weight:800}.pnBioStatus.ok{color:#166534}.pnBioStatus.err{color:#b91c1c}.pnBioSaved{display:none;margin:16px 0 0;padding:15px;border:1px solid #bbf7d0;border-radius:12px;background:#ecfdf3;color:#166534;text-align:center}.pnBioSaved.show{display:block}.pnBioSaved strong{display:block;font-size:15px;margin-bottom:4px}.pnBioSaved span{font-size:11px;line-height:1.55}.pnBioLoading{opacity:.6;pointer-events:none}
    @media(max-width:700px){.pnPortalMenu{grid-template-columns:1fr}.pnBioGrid{grid-template-columns:1fr}.pnBioField.full{grid-column:auto}.pnBioHead h2{font-size:18px}.pnBioBody{padding:16px}.pnBioActions{display:grid;grid-template-columns:1fr}.pnBioActions button{width:100%}}
  `;
  document.head.appendChild(style);
}

function pnBioEnsureMemberIdInput(){
  const form=$('loginForm');
  if(!form || $('memberId')) return;
  const email=$('email');
  if(!email) return;
  const label=document.createElement('label');
  label.htmlFor='memberId';
  label.textContent='ID Anggota / No. Siswa';
  const input=document.createElement('input');
  input.id='memberId';
  input.type='text';
  input.autocomplete='off';
  input.placeholder='Contoh: PN-2026-001';
  input.required=true;
  form.insertBefore(label,email.previousElementSibling || email);
  form.insertBefore(input,email);
}

function pnBioRequest(action,payload){
  return new Promise((resolve,reject)=>{
    const rid='pnbio-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnBioFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';
    form.action=PN_BIODATA_ENDPOINT;
    form.target=frame.name;
    form.style.display='none';
    const data={action,rid,...payload};
    Object.entries(data).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';
      input.name=name;
      input.value=String(value??'');
      form.appendChild(input);
    });
    let done=false;
    const cleanup=()=>{
      window.removeEventListener('message',onMessage);
      clearTimeout(timer);
      form.remove();
      setTimeout(()=>frame.remove(),500);
    };
    const onMessage=event=>{
      const d=event.data;
      if(!d || d.source!=='pn-biodata' || d.rid!==rid) return;
      if(done) return;
      done=true;
      cleanup();
      if(d.ok) resolve(d);
      else reject(new Error(d.message||'Permintaan biodata gagal.'));
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>{
      if(done) return;
      done=true;
      cleanup();
      reject(new Error('Server biodata terlalu lama merespons.'));
    },15000);
    document.body.appendChild(frame);
    document.body.appendChild(form);
    form.submit();
  });
}

function pnBioSetLoginError(text){
  const el=$('loginError');
  if(el) el.textContent=text||'';
}

function pnBioSetVerifying(show,text){
  const student=$('studentView');
  if(!student) return;
  let box=$('pnBioVerify');
  if(show){
    if(!box){
      box=document.createElement('div');
      box.id='pnBioVerify';
      box.className='pnBioVerify';
      const bar=student.querySelector('.studentbar');
      (bar?.after?bar.after(box):student.prepend(box));
    }
    box.textContent=text||'Memverifikasi Username dan ID Anggota...';
    box.classList.remove('hidden');
    $('examCard')?.classList.add('hidden');
    $('cbtThanksView')?.classList.add('hidden');
  }else if(box){
    box.classList.add('hidden');
  }
}

function pnBioEnsurePortalMenu(){
  if($('pnPortalMenu')) return;
  const student=$('studentView');
  const bar=student?.querySelector('.studentbar');
  if(!student || !bar) return;
  const menu=document.createElement('div');
  menu.id='pnPortalMenu';
  menu.className='pnPortalMenu';
  menu.innerHTML=`
    <button id="pnMenuBiodata" class="pnPortalMenuBtn" type="button"><span class="pnPortalMenuIcon">👤</span><span><strong>BIODATA SAYA</strong><span>Cek dan perbarui data pribadi</span></span></button>
    <button id="pnMenuCbt" class="pnPortalMenuBtn active" type="button"><span class="pnPortalMenuIcon">📝</span><span><strong>CBT ONLINE</strong><span>Kerjakan test teori kenaikan tingkat</span></span></button>`;
  bar.after(menu);
  $('pnMenuBiodata')?.addEventListener('click',()=>pnBioShowBiodata());
  $('pnMenuCbt')?.addEventListener('click',()=>pnBioShowCbt());
}

function pnBioShowBiodata(){
  if(!pnBioVerified) return;
  $('pnMenuBiodata')?.classList.add('active');
  $('pnMenuCbt')?.classList.remove('active');
  $('examCard')?.classList.add('hidden');
  $('cbtThanksView')?.classList.add('hidden');
  $('pnBiodataCard')?.classList.remove('hidden');
  setTimeout(()=>$('pnBiodataCard')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
}

function pnBioShowCbt(){
  if(!pnBioVerified || !pnBioUser) return;
  $('pnMenuCbt')?.classList.add('active');
  $('pnMenuBiodata')?.classList.remove('active');
  $('pnBiodataCard')?.classList.add('hidden');
  const done=sessionStorage.getItem('pnCbtCompleted:'+String(pnBioUser.uid||''))==='1';
  $('examCard')?.classList.toggle('hidden',done);
  $('cbtThanksView')?.classList.toggle('hidden',!done);
}

function pnBioField(label,key,opts={}){
  const locked=!!opts.locked;
  const full=!!opts.full;
  const type=opts.type||'text';
  const cls='pnBioField'+(locked?' locked':'')+(full?' full':'');
  const lock=locked?'<span class="pnBioLock">DIKUNCI ADMIN</span>':'';
  let control='';
  if(opts.select){
    control=`<select id="pnBio_${key}" data-bio-key="${key}" ${locked?'disabled':'disabled'}>${opts.select.map(v=>`<option value="${v}">${v||'- Pilih -'}</option>`).join('')}</select>`;
  }else if(type==='textarea'){
    control=`<textarea id="pnBio_${key}" data-bio-key="${key}" ${locked?'disabled':'disabled'}></textarea>`;
  }else{
    control=`<input id="pnBio_${key}" data-bio-key="${key}" type="${type}" ${locked?'disabled':'disabled'}>`;
  }
  return `<div class="${cls}" data-locked="${locked?'1':'0'}"><label for="pnBio_${key}"><span>${label}</span>${lock}</label>${control}</div>`;
}

function pnBioEnsureCard(){
  if($('pnBiodataCard')) return;
  const student=$('studentView');
  if(!student) return;
  const card=document.createElement('article');
  card.id='pnBiodataCard';
  card.className='pnBioCard hidden';
  card.innerHTML=`
    <div class="pnBioHead"><h2>BIODATA SAYA</h2><p>Periksa data dengan teliti. Data yang dikunci hanya dapat diubah oleh admin Pagar Nusa.</p></div>
    <div class="pnBioBody">
      <div class="pnBioLockedNote"><b>Kolom yang tidak dapat diedit siswa:</b> ID Anggota, Tahun Pengesahan, Tahun Masuk, Tingkat/Sabuk, Status Keanggotaan, Status Siswa, Nomor Sertifikat, dan Tanggal Pengesahan.</div>
      <div class="pnBioGrid">
        ${pnBioField('ID Anggota','memberId',{locked:true})}
        ${pnBioField('Nama Lengkap','name')}
        ${pnBioField('L/P','gender',{select:['','L','P']})}
        ${pnBioField('Tempat Lahir','birthPlace')}
        ${pnBioField('Tanggal Lahir','birthDate',{type:'date'})}
        ${pnBioField('Kelas','className',{select:['','X','XI','XII']})}
        ${pnBioField('Program Keahlian','program',{select:['',...PN_PROGRAMS]})}
        ${pnBioField('Alamat','address',{type:'textarea',full:true})}
        ${pnBioField('No. HP Siswa','studentPhone')}
        ${pnBioField('Nama Orang Tua/Wali','parentName')}
        ${pnBioField('No. HP Wali','parentPhone')}
        ${pnBioField('Tahun Pengesahan','approvalYear',{locked:true})}
        ${pnBioField('Tahun Masuk','entryYear',{locked:true})}
        ${pnBioField('Tingkat/Sabuk','belt',{locked:true})}
        ${pnBioField('Status Keanggotaan','membershipStatus',{locked:true})}
        ${pnBioField('Status Siswa','studentStatus',{locked:true})}
        ${pnBioField('Nomor Sertifikat','certificateNumber',{locked:true})}
        ${pnBioField('Catatan','notes',{type:'textarea',full:true})}
        ${pnBioField('Tanggal Pengesahan','approvalDate',{locked:true,type:'date'})}
      </div>
      <div id="pnBioSaved" class="pnBioSaved"><strong>✓ TERIMA KASIH</strong><span>Perubahan biodata Anda berhasil disimpan ke database Pagar Nusa.</span></div>
      <div id="pnBioStatus" class="pnBioStatus" aria-live="polite"></div>
      <div class="pnBioActions">
        <button id="pnBioCancel" class="pnBioCancel hidden" type="button">BATAL</button>
        <button id="pnBioEdit" class="pnBioEdit" type="button">UBAH BIODATA</button>
        <button id="pnBioSave" class="pnBioSave hidden" type="button">SIMPAN PERUBAHAN</button>
      </div>
    </div>`;
  student.appendChild(card);
  $('pnBioEdit')?.addEventListener('click',()=>pnBioSetEditMode(true));
  $('pnBioCancel')?.addEventListener('click',()=>{pnBioRender(pnBioData);pnBioSetEditMode(false)});
  $('pnBioSave')?.addEventListener('click',pnBioSave);
}

function pnBioRender(data){
  if(!data) return;
  pnBioData=data;
  Object.entries(data).forEach(([key,value])=>{
    const el=$('pnBio_'+key);
    if(el) el.value=String(value??'');
  });
  pnBioSetEditMode(false);
}

function pnBioSetEditMode(edit){
  document.querySelectorAll('#pnBiodataCard [data-bio-key]').forEach(el=>{
    const wrap=el.closest('.pnBioField');
    const locked=wrap?.dataset.locked==='1';
    el.disabled=locked || !edit;
  });
  $('pnBioEdit')?.classList.toggle('hidden',edit);
  $('pnBioSave')?.classList.toggle('hidden',!edit);
  $('pnBioCancel')?.classList.toggle('hidden',!edit);
  $('pnBioSaved')?.classList.remove('show');
  const status=$('pnBioStatus');
  if(status){status.className='pnBioStatus';status.textContent=''}
}

function pnBioCollect(){
  const get=key=>String($('pnBio_'+key)?.value??'').trim();
  return {
    name:get('name'),
    gender:get('gender'),
    birthPlace:get('birthPlace'),
    birthDate:get('birthDate'),
    className:get('className'),
    program:get('program'),
    address:get('address'),
    studentPhone:get('studentPhone'),
    parentName:get('parentName'),
    parentPhone:get('parentPhone'),
    notes:get('notes')
  };
}

async function pnBioSave(){
  if(!pnBioUser || !pnBioVerified) return;
  const status=$('pnBioStatus');
  const card=$('pnBiodataCard');
  const save=$('pnBioSave');
  try{
    card?.classList.add('pnBioLoading');
    if(save) save.textContent='MENYIMPAN...';
    const idToken=await pnBioUser.getIdToken(true);
    const username=sessionStorage.getItem('pnStudentUsername')||pnBioUser.displayName||'';
    const memberId=sessionStorage.getItem('pnStudentMemberId')||'';
    const result=await pnBioRequest('biodataUpdate',{username,memberId,idToken,...pnBioCollect()});
    pnBioRender(result.biodata);
    if(status){status.className='pnBioStatus ok';status.textContent=result.unchanged?'Tidak ada data yang berubah.':'Biodata berhasil diperbarui.'}
    if(!result.unchanged){
      $('pnBioSaved')?.classList.add('show');
      setTimeout(()=>$('pnBioSaved')?.scrollIntoView({behavior:'smooth',block:'center'}),80);
    }
  }catch(err){
    if(status){status.className='pnBioStatus err';status.textContent=err?.message||'Biodata gagal disimpan.'}
  }finally{
    card?.classList.remove('pnBioLoading');
    if(save) save.textContent='SIMPAN PERUBAHAN';
  }
}

async function pnBioVerifyAndLoad(user){
  pnBioUser=user;
  pnBioVerified=false;
  pnBioSetVerifying(true,'Memverifikasi Username, ID Anggota, dan akun siswa...');
  const username=sessionStorage.getItem('pnStudentUsername')||user.displayName||'';
  const memberId=sessionStorage.getItem('pnPendingMemberId')||sessionStorage.getItem('pnStudentMemberId')||'';
  if(!username || !memberId){
    sessionStorage.setItem('pnPortalAuthError','Username dan ID Anggota / No. Siswa wajib dimasukkan saat login.');
    await signOut(getAuth());
    return;
  }
  try{
    const idToken=await user.getIdToken();
    const result=await pnBioRequest('biodataGet',{username,memberId,idToken});
    sessionStorage.setItem('pnStudentMemberId',memberId);
    sessionStorage.removeItem('pnPendingMemberId');
    pnBioVerified=true;
    pnBioEnsurePortalMenu();
    pnBioEnsureCard();
    pnBioRender(result.biodata);
    pnBioSetVerifying(false);
    pnBioShowCbt();
  }catch(err){
    sessionStorage.removeItem('pnStudentMemberId');
    sessionStorage.removeItem('pnPendingMemberId');
    sessionStorage.setItem('pnPortalAuthError',err?.message||'ID Anggota tidak dapat diverifikasi.');
    await signOut(getAuth());
  }
}

async function pnBioBoot(){
  pnBioInstallStyles();
  pnBioEnsureMemberIdInput();
  const loginForm=$('loginForm');
  loginForm?.addEventListener('submit',e=>{
    const id=String($('memberId')?.value||'').trim();
    if(!id){
      e.preventDefault();
      e.stopImmediatePropagation();
      pnBioSetLoginError('ID Anggota / No. Siswa wajib diisi.');
      $('memberId')?.focus();
      return;
    }
    sessionStorage.setItem('pnPendingMemberId',id);
  },true);

  $('logoutBtn')?.addEventListener('click',()=>{
    sessionStorage.removeItem('pnStudentMemberId');
    sessionStorage.removeItem('pnPendingMemberId');
  },true);
  $('cbtLogoutBtn')?.addEventListener('click',()=>{
    sessionStorage.removeItem('pnStudentMemberId');
    sessionStorage.removeItem('pnPendingMemberId');
  },true);

  let tries=0;
  while(!getApps().length && tries<50){
    await new Promise(r=>setTimeout(r,100));
    tries++;
  }
  if(!getApps().length){
    pnBioSetLoginError('Sistem akun siswa belum siap. Muat ulang halaman.');
    return;
  }
  const auth=getAuth(getApp());
  onAuthStateChanged(auth,user=>{
    if(user){
      pnBioVerifyAndLoad(user);
    }else{
      pnBioUser=null;
      pnBioVerified=false;
      $('pnPortalMenu')?.remove();
      $('pnBiodataCard')?.remove();
      $('pnBioVerify')?.remove();
      const err=sessionStorage.getItem('pnPortalAuthError');
      if(err){
        sessionStorage.removeItem('pnPortalAuthError');
        setTimeout(()=>pnBioSetLoginError(err),80);
      }
    }
  });
}

pnBioBoot();
