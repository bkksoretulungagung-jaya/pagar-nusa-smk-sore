(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const PANEL_ID='pnAccountAdminPanel';
const NAV_ID='pnAccountAdminNav';
const ASPEL_NAV_ID='pnAspelMonitorNav';
let portalOpen=false;
let portalData=null;
let loading=false;
let activeFilter='ALL';
let selectedAccount=null;
let observer=null;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const norm=value=>String(value||'').trim().toLowerCase();
const savedValue=key=>{try{return localStorage.getItem(key)||sessionStorage.getItem(key)||''}catch(_){return sessionStorage.getItem(key)||''}};

function jsonp(action,payload={},timeoutMs=22000){
  return new Promise((resolve,reject)=>{
    const cb='pnAccountCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}script.remove()};
    window[cb]=data=>{
      if(done)return;done=true;cleanup();
      if(data&&data.ok)resolve(data);else reject(new Error(data?.message||'Permintaan portal akun ditolak server.'));
    };
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([key,value])=>qs.set(key,String(value??'')));
    script.src=ENDPOINT+'?'+qs.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Tidak dapat menghubungi database akun anggota.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Database akun terlalu lama merespons.'))},timeoutMs);
    document.head.appendChild(script);
  });
}

function post(action,payload={},timeoutMs=25000){
  return new Promise((resolve,reject)=>{
    const rid='pn-account-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnAccountFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    const data={action,rid,...payload};
    Object.entries(data).forEach(([name,value])=>{
      const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input);
    });
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),400)};
    const onMessage=event=>{
      const d=event.data;
      if(!d||d.source!=='pn-account-admin'||d.rid!==rid||done)return;
      done=true;cleanup();if(d.ok)resolve(d);else reject(new Error(d.message||'Perubahan akun gagal.'));
    };
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Server terlalu lama memproses perubahan akun.'))},timeoutMs);
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

function ensureStyles(){
  if($('pnAccountAdminStyle'))return;
  const style=document.createElement('style');
  style.id='pnAccountAdminStyle';
  style.textContent=`
    .pnAccountHidden{display:none!important}.pnAccountPanel{margin:0 0 18px;border:1px solid #b9d4c2;border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 4px 14px rgba(15,61,36,.07)}.pnAccountPanel.hidden{display:none!important}
    .pnAccountHead{padding:16px 18px;background:linear-gradient(135deg,#14532d,#0f766e);color:#fff;display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.pnAccountHead h2{margin:0;font-size:17px;line-height:1.35;font-weight:1000}.pnAccountHead p{margin:5px 0 0;font-size:10px;line-height:1.55;color:#e7fff0;max-width:780px}.pnAccountRefresh{border:1px solid rgba(255,255,255,.28);border-radius:9px;padding:9px 12px;background:#fff;color:#14532d;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnAccountRefresh:disabled{opacity:.6;cursor:wait}
    .pnAccountBody{padding:15px 16px 18px}.pnAccountStatus{margin-bottom:12px;padding:10px 12px;border:1px solid #fed7aa;border-radius:9px;background:#fff7ed;color:#92400e;font-size:10px;font-weight:850;line-height:1.5}.pnAccountStatus.ok{border-color:#bbf7d0;background:#ecfdf3;color:#166534}.pnAccountStatus.err{border-color:#fecaca;background:#fef2f2;color:#991b1b}
    .pnAccountSummary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:12px}.pnAccountStat{padding:11px 12px;border:1px solid #dbe7df;border-radius:10px;background:#f8fbf9}.pnAccountStat strong{display:block;color:#14532d;font-size:20px;line-height:1}.pnAccountStat span{display:block;margin-top:5px;color:#64748b;font-size:8.5px;font-weight:900;text-transform:uppercase;letter-spacing:.3px}
    .pnAccountTools{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:10px;align-items:end;margin-bottom:11px}.pnAccountTools label{display:block;margin:0 0 5px;color:#334155;font-size:9px;font-weight:1000}.pnAccountSearch{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;background:#fff;font:inherit;font-size:11px}.pnAccountFilters{display:flex;gap:6px;flex-wrap:wrap}.pnAccountFilter{border:1px solid #cfe0d5;border-radius:999px;padding:8px 11px;background:#f8fbf9;color:#14532d;font:inherit;font-size:9px;font-weight:1000;cursor:pointer}.pnAccountFilter.active{background:#14532d;color:#fff;border-color:#14532d}
    .pnAccountInfo{margin:0 0 12px;padding:9px 11px;border-left:4px solid #166534;border-radius:8px;background:#f0fdf4;color:#14532d;font-size:9.5px;line-height:1.55;font-weight:850}.pnAccountTableWrap{overflow:auto;border:1px solid #dbe7df;border-radius:10px}.pnAccountTable{width:100%;min-width:930px;border-collapse:collapse;background:#fff}.pnAccountTable th{position:sticky;top:0;z-index:1;background:#f1f8f3;color:#14532d;text-align:left;padding:10px 9px;border-bottom:1px solid #cfe0d5;font-size:8.5px;font-weight:1000;white-space:nowrap}.pnAccountTable td{padding:10px 9px;border-bottom:1px solid #edf2ef;color:#334155;font-size:9.5px;vertical-align:top}.pnAccountTable tr:last-child td{border-bottom:0}.pnAccountName{font-weight:1000;color:#153f28}.pnAccountSub{margin-top:3px;color:#64748b;font-size:8.5px;line-height:1.4}.pnAccountBadge{display:inline-flex;align-items:center;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:1000;white-space:nowrap}.pnAccountBadge.anggota{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}.pnAccountBadge.calon{background:#fef3c7;color:#92400e;border:1px solid #fde68a}.pnAccountBadge.aktif{background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe}.pnAccountBadge.nonaktif,.pnAccountBadge.missing{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}.pnAccountBtn{border:1px solid #cfe0d5;border-radius:8px;padding:7px 9px;background:#fff;color:#14532d;font:inherit;font-size:8.5px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnAccountBtn.primary{background:#166534;color:#fff;border-color:#166534}.pnAccountBtn.warn{background:#fff7ed;color:#9a3412;border-color:#fed7aa}.pnAccountBtn:disabled{opacity:.45;cursor:not-allowed}.pnAccountActions{display:flex;gap:5px;flex-wrap:wrap}.pnAccountEmpty{padding:24px;text-align:center;color:#64748b;font-size:10.5px;line-height:1.6}
    .pnAccountModal{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.55)}.pnAccountModal.hidden{display:none!important}.pnAccountDialog{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.pnAccountDialogHead{padding:15px 17px;background:#14532d;color:#fff;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.pnAccountDialogHead h3{margin:0;font-size:15px}.pnAccountDialogHead p{margin:4px 0 0;font-size:9.5px;line-height:1.45;color:#dcfce7}.pnAccountClose{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:8px;width:32px;height:32px;font-size:18px;cursor:pointer}.pnAccountDialogBody{padding:16px 17px 18px}.pnAccountGrid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.pnAccountField.full{grid-column:1/-1}.pnAccountField label{display:block;margin-bottom:5px;color:#334155;font-size:9px;font-weight:1000}.pnAccountField input,.pnAccountField select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;font:inherit;font-size:11px}.pnAccountField input[disabled]{background:#f8fafc;color:#64748b}.pnAccountSection{margin-top:16px;padding-top:15px;border-top:1px solid #e2e8f0}.pnAccountSection h4{margin:0 0 8px;color:#14532d;font-size:11px}.pnAccountSection p{margin:0 0 10px;color:#64748b;font-size:9.5px;line-height:1.55}.pnPasswordRow{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end}.pnAccountDialogActions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:15px}.pnAccountMsg{min-height:16px;margin-top:10px;font-size:9.5px;font-weight:900}.pnAccountMsg.ok{color:#166534}.pnAccountMsg.err{color:#b91c1c}
    #${NAV_ID}{border-color:#bbd7c4!important;background:#f0fdf4!important;color:#14532d!important}#${NAV_ID}.active{background:#14532d!important;color:#fff!important;border-color:#14532d!important}
    @media(max-width:760px){.pnAccountHead{display:block}.pnAccountRefresh{margin-top:10px;width:100%}.pnAccountSummary{grid-template-columns:1fr 1fr}.pnAccountTools{grid-template-columns:1fr}.pnAccountGrid{grid-template-columns:1fr}.pnAccountField.full{grid-column:auto}.pnPasswordRow{grid-template-columns:1fr}.pnAccountDialogActions{display:grid;grid-template-columns:1fr}.pnAccountDialogActions button{width:100%}}
  `;
  document.head.appendChild(style);
}

function ensurePanel(){
  ensureStyles();
  let panel=$(PANEL_ID);if(panel)return panel;
  const main=document.querySelector('#adminApp .layout main');if(!main)return null;
  panel=document.createElement('section');panel.id=PANEL_ID;panel.className='pnAccountPanel hidden';
  panel.innerHTML=`
    <div class="pnAccountHead"><div><h2>🔐 PORTAL AKUN ANGGOTA</h2><p>Pusat pemantauan akun seluruh Anggota dan Calon Anggota. Admin dapat mengecek username, email, status akun, memperbarui data akun, dan mereset password langsung.</p></div><button id="pnAccountRefresh" class="pnAccountRefresh" type="button">↻ MUAT ULANG</button></div>
    <div class="pnAccountBody">
      <div id="pnAccountStatus" class="pnAccountStatus">Siap memuat database akun.</div>
      <div id="pnAccountSummary" class="pnAccountSummary"></div>
      <div class="pnAccountTools"><div><label for="pnAccountSearch">Cari nama, ID anggota, username, atau email</label><input id="pnAccountSearch" class="pnAccountSearch" type="search" placeholder="Ketik nama / ID / username / email..." autocomplete="off"></div><div class="pnAccountFilters"><button class="pnAccountFilter active" data-filter="ALL" type="button">ALL</button><button class="pnAccountFilter" data-filter="ANGGOTA" type="button">ANGGOTA</button><button class="pnAccountFilter" data-filter="CALON" type="button">CALON ANGGOTA</button></div></div>
      <div class="pnAccountInfo">Password lama tidak ditampilkan atau disimpan. Jika anggota lupa password, Admin membuat password baru melalui tombol <b>RESET PASSWORD</b>.</div>
      <div id="pnAccountList"></div>
    </div>`;
  main.prepend(panel);
  $('pnAccountRefresh')?.addEventListener('click',()=>loadPortal(true));
  $('pnAccountSearch')?.addEventListener('input',renderPortal);
  panel.querySelectorAll('.pnAccountFilter').forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.filter||'ALL';panel.querySelectorAll('.pnAccountFilter').forEach(x=>x.classList.toggle('active',x===btn));renderPortal()}));
  return panel;
}

function ensureModal(){
  ensureStyles();
  let modal=$('pnAccountModal');if(modal)return modal;
  modal=document.createElement('div');modal.id='pnAccountModal';modal.className='pnAccountModal hidden';
  modal.innerHTML=`<div class="pnAccountDialog" role="dialog" aria-modal="true" aria-labelledby="pnAccountDialogTitle"><div class="pnAccountDialogHead"><div><h3 id="pnAccountDialogTitle">DETAIL AKUN</h3><p id="pnAccountDialogSubtitle">-</p></div><button id="pnAccountClose" class="pnAccountClose" type="button" aria-label="Tutup">×</button></div><div class="pnAccountDialogBody">
    <div class="pnAccountGrid">
      <div class="pnAccountField"><label>ID Anggota</label><input id="pnAccountMemberId" disabled></div><div class="pnAccountField"><label>Status Keanggotaan</label><input id="pnAccountMembership" disabled></div>
      <div class="pnAccountField full"><label>Nama</label><input id="pnAccountName" disabled></div>
      <div class="pnAccountField"><label>Username</label><input id="pnAccountUsername" autocomplete="off"></div><div class="pnAccountField"><label>Email</label><input id="pnAccountEmail" type="email" autocomplete="off"></div>
      <div class="pnAccountField"><label>Status Akun</label><select id="pnAccountAccountStatus"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div><div class="pnAccountField"><label>UID Firebase</label><input id="pnAccountUid" disabled></div>
    </div>
    <div class="pnAccountDialogActions"><button id="pnAccountSave" class="pnAccountBtn primary" type="button">SIMPAN PERUBAHAN AKUN</button></div>
    <div class="pnAccountSection"><h4>RESET PASSWORD LANGSUNG OLEH ADMIN</h4><p>Masukkan password baru. Password baru langsung menggantikan password login anggota dan tidak dikirim ke email.</p><div class="pnPasswordRow"><div class="pnAccountField"><label>Password Baru</label><input id="pnAccountPassword" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter"></div><div class="pnAccountField"><label>Ulangi Password</label><input id="pnAccountPassword2" type="password" autocomplete="new-password" placeholder="Ulangi password"></div><button id="pnAccountGenerate" class="pnAccountBtn" type="button">BUAT PASSWORD</button></div><div class="pnAccountDialogActions"><button id="pnAccountReset" class="pnAccountBtn warn" type="button">RESET PASSWORD</button></div></div>
    <div id="pnAccountModalMsg" class="pnAccountMsg" aria-live="polite"></div>
  </div></div>`;
  document.body.appendChild(modal);
  $('pnAccountClose')?.addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
  $('pnAccountSave')?.addEventListener('click',saveSelectedAccount);
  $('pnAccountReset')?.addEventListener('click',resetSelectedPassword);
  $('pnAccountGenerate')?.addEventListener('click',generatePassword);
  return modal;
}

function ensureNav(){
  const nav=$('nav');if(!nav)return;
  let button=$(NAV_ID);
  if(!button){
    button=document.createElement('button');button.id=NAV_ID;button.type='button';button.className='navBtn';button.innerHTML='🔐 Portal Akun Anggota<span>Cek akun, email & reset password</span>';button.addEventListener('click',openPortal);
  }
  const aspel=$(ASPEL_NAV_ID);
  if(button.parentNode!==nav){if(aspel&&aspel.parentNode===nav)nav.insertBefore(button,aspel.nextSibling);else nav.appendChild(button)}
  else if(aspel&&button.previousElementSibling!==aspel)nav.insertBefore(button,aspel.nextSibling);
  if(portalOpen){nav.querySelectorAll('.navBtn.active').forEach(el=>el.classList.remove('active'));button.classList.add('active')}else button.classList.remove('active');
}

function suppressOtherAdminCards(){
  const main=document.querySelector('#adminApp .layout main');const panel=$(PANEL_ID);if(!main||!panel)return;
  Array.from(main.children).forEach(child=>{if(child!==panel)child.classList.add('pnAccountHidden')});
}
function restoreOtherAdminCards(){document.querySelectorAll('#adminApp .layout main>.pnAccountHidden').forEach(el=>el.classList.remove('pnAccountHidden'))}

function openPortal(){
  if(savedValue(AUTH_KEY)!=='1'){if(typeof window.openAdminLogin==='function')window.openAdminLogin();return}
  portalOpen=true;const panel=ensurePanel();if(!panel)return;suppressOtherAdminCards();panel.classList.remove('hidden');ensureNav();panel.scrollIntoView({behavior:'smooth',block:'start'});if(!portalData)loadPortal(false);else renderPortal();
}
function closePortal(clearData=false){
  if(!portalOpen&&!clearData)return;portalOpen=false;restoreOtherAdminCards();$(PANEL_ID)?.classList.add('hidden');$(NAV_ID)?.classList.remove('active');closeModal();if(clearData){portalData=null;const list=$('pnAccountList');if(list)list.innerHTML='';const summary=$('pnAccountSummary');if(summary)summary.innerHTML=''}
}
function setStatus(kind,text){const el=$('pnAccountStatus');if(!el)return;el.className='pnAccountStatus'+(kind==='ok'?' ok':kind==='err'?' err':'');el.textContent=text||''}

function groupClass(item){return item.membershipGroup==='CALON'?'calon':'anggota'}
function accountBadge(item){if(!item.hasAccount)return '<span class="pnAccountBadge missing">BELUM ADA AKUN</span>';return `<span class="pnAccountBadge ${item.accountStatus==='AKTIF'?'aktif':'nonaktif'}">${esc(item.accountStatus||'NONAKTIF')}</span>`}
function matches(item,q){if(!q)return true;return norm([item.name,item.memberId,item.username,item.email,item.membershipStatus,item.className,item.program].filter(Boolean).join(' ')).includes(q)}

function renderPortal(){
  const list=$('pnAccountList'),summary=$('pnAccountSummary');if(!list||!summary)return;
  if(!portalData){summary.innerHTML='';list.innerHTML='<div class="pnAccountEmpty">Data akun belum dimuat.</div>';return}
  const s=portalData.summary||{};
  summary.innerHTML=`<div class="pnAccountStat"><strong>${Number(s.total||0)}</strong><span>Total Data</span></div><div class="pnAccountStat"><strong>${Number(s.anggota||0)}</strong><span>Anggota</span></div><div class="pnAccountStat"><strong>${Number(s.calon||0)}</strong><span>Calon Anggota</span></div><div class="pnAccountStat"><strong>${Number(s.activeAccounts||0)}</strong><span>Akun Aktif</span></div><div class="pnAccountStat"><strong>${Number(s.missingAccounts||0)}</strong><span>Belum Ada Akun</span></div>`;
  const q=norm($('pnAccountSearch')?.value||'');
  const items=(portalData.accounts||[]).filter(item=>(activeFilter==='ALL'||item.membershipGroup===activeFilter)&&matches(item,q));
  if(!items.length){list.innerHTML='<div class="pnAccountEmpty">Tidak ada data yang cocok dengan pencarian/filter.</div>';return}
  list.innerHTML=`<div class="pnAccountTableWrap"><table class="pnAccountTable"><thead><tr><th>NAMA / ID</th><th>STATUS</th><th>USERNAME</th><th>EMAIL</th><th>AKUN</th><th>AKSI ADMIN</th></tr></thead><tbody>${items.map(item=>`<tr><td><div class="pnAccountName">${esc(item.name||'-')}</div><div class="pnAccountSub">${esc([item.memberId,item.className,item.program].filter(Boolean).join(' • ')||'-')}</div></td><td><span class="pnAccountBadge ${groupClass(item)}">${esc(item.membershipStatus||item.membershipGroup||'-')}</span></td><td>${esc(item.username||'-')}</td><td>${esc(item.email||'-')}</td><td>${accountBadge(item)}</td><td><div class="pnAccountActions"><button class="pnAccountBtn" data-detail-row="${Number(item.accountRow||0)}" data-member="${esc(item.memberId||'')}" type="button">DETAIL</button><button class="pnAccountBtn warn" data-reset-row="${Number(item.accountRow||0)}" data-member="${esc(item.memberId||'')}" type="button" ${item.hasAccount?'':'disabled'}>RESET PASSWORD</button></div></td></tr>`).join('')}</tbody></table></div>`;
  list.querySelectorAll('[data-detail-row]').forEach(btn=>btn.addEventListener('click',()=>openItem(findItem(btn.dataset.member,btn.dataset.detailRow),false)));
  list.querySelectorAll('[data-reset-row]').forEach(btn=>btn.addEventListener('click',()=>openItem(findItem(btn.dataset.member,btn.dataset.resetRow),true)));
}

function findItem(memberId,row){return (portalData?.accounts||[]).find(x=>String(x.accountRow||0)===String(row||0)&&String(x.memberId||'')===String(memberId||''))||(portalData?.accounts||[]).find(x=>String(x.memberId||'')===String(memberId||''))}
function modalMessage(kind,text){const el=$('pnAccountModalMsg');if(!el)return;el.className='pnAccountMsg'+(kind?' '+kind:'');el.textContent=text||''}
function openItem(item,focusPassword){
  if(!item)return;selectedAccount=item;const modal=ensureModal();
  $('pnAccountDialogSubtitle').textContent=[item.memberId,item.name].filter(Boolean).join(' • ')||'Data akun';
  $('pnAccountMemberId').value=item.memberId||'';$('pnAccountMembership').value=item.membershipStatus||item.membershipGroup||'';$('pnAccountName').value=item.name||'';$('pnAccountUsername').value=item.username||'';$('pnAccountEmail').value=item.email||'';$('pnAccountAccountStatus').value=item.accountStatus||'AKTIF';$('pnAccountUid').value=item.uid||'(belum terhubung)';$('pnAccountPassword').value='';$('pnAccountPassword2').value='';
  const disabled=!item.hasAccount;$('pnAccountUsername').disabled=disabled;$('pnAccountEmail').disabled=disabled;$('pnAccountAccountStatus').disabled=disabled;$('pnAccountSave').disabled=disabled;$('pnAccountReset').disabled=disabled;$('pnAccountGenerate').disabled=disabled;modalMessage(disabled?'err':'',disabled?'Data biodata ini belum mempunyai akun pada sheet Akun Portal Siswa.':'');modal.classList.remove('hidden');
  setTimeout(()=>{(focusPassword&&!disabled?$('pnAccountPassword'):$('pnAccountUsername'))?.focus()},50);
}
function closeModal(){$('pnAccountModal')?.classList.add('hidden');selectedAccount=null}
function setModalBusy(busy){['pnAccountSave','pnAccountReset','pnAccountGenerate','pnAccountUsername','pnAccountEmail','pnAccountAccountStatus','pnAccountPassword','pnAccountPassword2'].forEach(id=>{const el=$(id);if(el)el.disabled=!!busy||(!selectedAccount?.hasAccount&&id!=='pnAccountGenerate')})}

async function saveSelectedAccount(){
  if(!selectedAccount?.hasAccount)return;const token=savedValue(TOKEN_KEY);if(!token){modalMessage('err','Sesi Admin tidak tersedia. Silakan login ulang.');return}
  const username=String($('pnAccountUsername')?.value||'').trim(),email=String($('pnAccountEmail')?.value||'').trim(),status=String($('pnAccountAccountStatus')?.value||'AKTIF').trim().toUpperCase();
  if(!username||!email){modalMessage('err','Username dan email wajib diisi.');return}
  try{setModalBusy(true);modalMessage('','Menyimpan perubahan akun...');const res=await post('portalAccountAdminUpdate',{token,accountRow:selectedAccount.accountRow,memberId:selectedAccount.memberId,username,email,status});modalMessage('ok',res.message||'Perubahan akun berhasil disimpan.');await loadPortal(true,true);const next=findItem(selectedAccount.memberId,selectedAccount.accountRow);if(next){selectedAccount=next;$('pnAccountUsername').value=next.username||'';$('pnAccountEmail').value=next.email||'';$('pnAccountAccountStatus').value=next.accountStatus||'AKTIF';$('pnAccountUid').value=next.uid||'(belum terhubung)'}}catch(err){modalMessage('err',err.message||String(err))}finally{setModalBusy(false)}
}

function generatePassword(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';let out='';const bytes=new Uint32Array(12);crypto.getRandomValues(bytes);for(let i=0;i<12;i++)out+=alphabet[bytes[i]%alphabet.length];$('pnAccountPassword').value=out;$('pnAccountPassword2').value=out;modalMessage('ok','Password baru sudah dibuat. Catat dan berikan langsung kepada anggota setelah reset berhasil.')
}

async function resetSelectedPassword(){
  if(!selectedAccount?.hasAccount)return;const token=savedValue(TOKEN_KEY);if(!token){modalMessage('err','Sesi Admin tidak tersedia. Silakan login ulang.');return}
  const p1=String($('pnAccountPassword')?.value||''),p2=String($('pnAccountPassword2')?.value||'');if(p1.length<8){modalMessage('err','Password baru minimal 8 karakter.');return}if(p1!==p2){modalMessage('err','Ulangi password harus sama.');return}
  if(!confirm(`Reset password untuk ${selectedAccount.name||selectedAccount.username||selectedAccount.memberId}?`))return;
  try{setModalBusy(true);modalMessage('','Mereset password melalui Firebase...');const res=await post('portalAccountAdminResetPassword',{token,accountRow:selectedAccount.accountRow,memberId:selectedAccount.memberId,password:p1});$('pnAccountPassword').value='';$('pnAccountPassword2').value='';modalMessage('ok',res.message||'Password berhasil direset oleh Admin.');await loadPortal(true,true)}catch(err){modalMessage('err',err.message||String(err))}finally{setModalBusy(false)}
}

async function loadPortal(force=false,keepModal=false){
  if(loading)return;const token=savedValue(TOKEN_KEY);if(!token){setStatus('err','Sesi verifikasi Admin tidak ditemukan. Silakan login ulang.');return}
  loading=true;const btn=$('pnAccountRefresh');if(btn)btn.disabled=true;setStatus('','Memuat seluruh akun Anggota dan Calon Anggota...');
  try{const data=await jsonp('portalAccountAdminList',{token,force:force?'1':'0'});portalData=data;renderPortal();setStatus('ok',data.message||`Database akun berhasil dimuat: ${Number(data.summary?.total||0)} data.`)}catch(err){setStatus('err',err.message||String(err));if(!portalData)$('pnAccountList').innerHTML='<div class="pnAccountEmpty">Database akun belum dapat dimuat. Pastikan backend Portal Akun Anggota sudah dipublikasikan.</div>'}finally{loading=false;if(btn)btn.disabled=false;if(!keepModal&&$('pnAccountModal')&&!$('pnAccountModal').classList.contains('hidden'))closeModal()}
}

function installNavigationClose(){
  if(document.documentElement.dataset.pnAccountAdminNavClose)return;document.documentElement.dataset.pnAccountAdminNavClose='1';
  document.addEventListener('click',event=>{const target=event.target?.closest('#nav .navBtn');if(!target||target.id===NAV_ID)return;if(portalOpen)closePortal(false)},true);
}
function watch(){ensureNav();if(portalOpen){ensurePanel();suppressOtherAdminCards()}}
function start(){ensureStyles();ensurePanel();ensureModal();ensureNav();installNavigationClose();watch();if(!observer){observer=new MutationObserver(()=>setTimeout(watch,30));observer.observe(document.documentElement,{subtree:true,childList:true})}setInterval(watch,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
