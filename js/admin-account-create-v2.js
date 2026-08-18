(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const MODAL_ID='pnAccountCreateV2Modal';
let target=null;
let scheduled=false;

const $=id=>document.getElementById(id);
const savedValue=key=>{try{return localStorage.getItem(key)||sessionStorage.getItem(key)||''}catch(_){try{return sessionStorage.getItem(key)||''}catch(__){return''}}};

function post(action,payload={},timeoutMs=30000){
  return new Promise((resolve,reject)=>{
    const rid='pn-account-create-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnAccountCreateFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
    const data={action,rid,...payload};
    Object.entries(data).forEach(([name,value])=>{const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value??'');form.appendChild(input)});
    let done=false;
    const cleanup=()=>{window.removeEventListener('message',onMessage);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),300)};
    const onMessage=event=>{const d=event.data;if(!d||d.source!=='pn-account-admin'||d.rid!==rid||done)return;done=true;cleanup();d.ok?resolve(d):reject(new Error(d.message||'Pembuatan akun gagal.'))};
    window.addEventListener('message',onMessage);
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Server terlalu lama memproses pembuatan akun.'))},timeoutMs);
    document.body.appendChild(frame);document.body.appendChild(form);form.submit();
  });
}

function ensureStyle(){
  if($('pnAccountCreateV2Style'))return;
  const style=document.createElement('style');style.id='pnAccountCreateV2Style';style.textContent=`
    .pnAccountCreateV2Modal{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.58)}.pnAccountCreateV2Modal.hidden{display:none!important}.pnAccountCreateV2Dialog{width:min(600px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.3)}.pnAccountCreateV2Head{padding:15px 17px;background:#14532d;color:#fff;display:flex;justify-content:space-between;gap:12px}.pnAccountCreateV2Head h3{margin:0;font-size:15px}.pnAccountCreateV2Head p{margin:4px 0 0;font-size:9.5px;line-height:1.5;color:#dcfce7}.pnAccountCreateV2Close{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:8px;width:32px;height:32px;font-size:18px;cursor:pointer}.pnAccountCreateV2Body{padding:16px 17px 18px}.pnAccountCreateV2Identity{margin-bottom:12px;padding:10px 12px;border:1px solid #bbf7d0;border-radius:9px;background:#f0fdf4;color:#14532d;font-size:10px;font-weight:900;line-height:1.55}.pnAccountCreateV2Grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.pnAccountCreateV2Field.full{grid-column:1/-1}.pnAccountCreateV2Field label{display:block;margin-bottom:5px;color:#334155;font-size:9px;font-weight:1000}.pnAccountCreateV2Field input,.pnAccountCreateV2Field select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;font:inherit;font-size:11px}.pnAccountCreateV2Pass{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;margin-top:11px}.pnAccountCreateV2Actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px;flex-wrap:wrap}.pnAccountCreateV2Btn{border:1px solid #cfe0d5;border-radius:8px;padding:8px 10px;background:#fff;color:#14532d;font:inherit;font-size:9px;font-weight:1000;cursor:pointer}.pnAccountCreateV2Btn.primary{background:#166534;color:#fff;border-color:#166534}.pnAccountCreateV2Btn:disabled{opacity:.5;cursor:wait}.pnAccountCreateV2Msg{min-height:17px;margin-top:10px;font-size:9.5px;font-weight:900}.pnAccountCreateV2Msg.ok{color:#166534}.pnAccountCreateV2Msg.err{color:#b91c1c}
    @media(max-width:700px){.pnAccountCreateV2Grid,.pnAccountCreateV2Pass{grid-template-columns:1fr}.pnAccountCreateV2Field.full{grid-column:auto}.pnAccountCreateV2Actions{display:grid;grid-template-columns:1fr}.pnAccountCreateV2Actions button{width:100%}}
  `;document.head.appendChild(style);
}

function ensureModal(){
  ensureStyle();let modal=$(MODAL_ID);if(modal)return modal;
  modal=document.createElement('div');modal.id=MODAL_ID;modal.className='pnAccountCreateV2Modal hidden';
  modal.innerHTML=`<div class="pnAccountCreateV2Dialog" role="dialog" aria-modal="true"><div class="pnAccountCreateV2Head"><div><h3>BUAT AKUN ANGGOTA</h3><p>Buat akun login Firebase untuk Anggota atau Calon Anggota yang belum mempunyai akun.</p></div><button id="pnAccountCreateV2Close" class="pnAccountCreateV2Close" type="button">×</button></div><div class="pnAccountCreateV2Body"><div id="pnAccountCreateV2Identity" class="pnAccountCreateV2Identity">-</div><div class="pnAccountCreateV2Grid"><div class="pnAccountCreateV2Field full"><label>Username</label><input id="pnAccountCreateV2Username" autocomplete="off" maxlength="100"></div><div class="pnAccountCreateV2Field full"><label>Email Login Firebase</label><input id="pnAccountCreateV2Email" type="email" autocomplete="off" maxlength="254" placeholder="contoh@gmail.com"></div><div class="pnAccountCreateV2Field"><label>Status Akun</label><select id="pnAccountCreateV2Status"><option value="AKTIF">AKTIF</option><option value="NONAKTIF">NONAKTIF</option></select></div></div><div class="pnAccountCreateV2Pass"><div class="pnAccountCreateV2Field"><label>Password Baru</label><input id="pnAccountCreateV2Password" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter"></div><div class="pnAccountCreateV2Field"><label>Ulangi Password</label><input id="pnAccountCreateV2Password2" type="password" autocomplete="new-password" placeholder="Ulangi password"></div><button id="pnAccountCreateV2Generate" class="pnAccountCreateV2Btn" type="button">BUAT PASSWORD</button></div><div class="pnAccountCreateV2Actions"><button id="pnAccountCreateV2Cancel" class="pnAccountCreateV2Btn" type="button">BATAL</button><button id="pnAccountCreateV2Submit" class="pnAccountCreateV2Btn primary" type="button">BUAT AKUN</button></div><div id="pnAccountCreateV2Msg" class="pnAccountCreateV2Msg" aria-live="polite"></div></div></div>`;
  document.body.appendChild(modal);
  $('pnAccountCreateV2Close')?.addEventListener('click',closeModal);$('pnAccountCreateV2Cancel')?.addEventListener('click',closeModal);modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});$('pnAccountCreateV2Generate')?.addEventListener('click',generatePassword);$('pnAccountCreateV2Submit')?.addEventListener('click',submitCreate);
  return modal;
}

function msg(kind,text){const el=$('pnAccountCreateV2Msg');if(!el)return;el.className='pnAccountCreateV2Msg'+(kind?' '+kind:'');el.textContent=text||''}
function setBusy(busy){['pnAccountCreateV2Username','pnAccountCreateV2Email','pnAccountCreateV2Status','pnAccountCreateV2Password','pnAccountCreateV2Password2','pnAccountCreateV2Generate','pnAccountCreateV2Submit','pnAccountCreateV2Cancel'].forEach(id=>{const el=$(id);if(el)el.disabled=!!busy})}
function closeModal(){if($(MODAL_ID))$(MODAL_ID).classList.add('hidden');target=null;msg('','')}

function generatePassword(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';const bytes=new Uint32Array(12);crypto.getRandomValues(bytes);let out='';for(let i=0;i<bytes.length;i++)out+=alphabet[bytes[i]%alphabet.length];$('pnAccountCreateV2Password').value=out;$('pnAccountCreateV2Password2').value=out;msg('ok','Password sudah dibuat. Catat password ini untuk diberikan langsung kepada anggota.')
}

function openCreate(button){
  const row=button.closest('tr');if(!row)return;const detail=row.querySelector('[data-detail-row]');const memberId=String(detail?.dataset.member||'').trim();if(!memberId)return;
  const name=String(row.querySelector('.pnAccountName')?.textContent||'').trim();const membership=String(row.querySelector('td:nth-child(2) .pnAccountBadge')?.textContent||'').trim();target={memberId,name,membership};
  const modal=ensureModal();$('pnAccountCreateV2Identity').textContent=[memberId,name,membership].filter(Boolean).join(' • ');$('pnAccountCreateV2Username').value=(name||memberId).toUpperCase().slice(0,100);$('pnAccountCreateV2Email').value='';$('pnAccountCreateV2Status').value='AKTIF';$('pnAccountCreateV2Password').value='';$('pnAccountCreateV2Password2').value='';msg('','Isi email dan password untuk membuat akun login baru.');modal.classList.remove('hidden');setTimeout(()=>$('pnAccountCreateV2Email')?.focus(),30)
}

async function submitCreate(){
  if(!target)return;const token=savedValue(TOKEN_KEY);if(!token){msg('err','Sesi Admin tidak tersedia. Silakan login ulang.');return}
  const username=String($('pnAccountCreateV2Username')?.value||'').trim();const email=String($('pnAccountCreateV2Email')?.value||'').trim().toLowerCase();const status=String($('pnAccountCreateV2Status')?.value||'AKTIF').trim().toUpperCase();const p1=String($('pnAccountCreateV2Password')?.value||'');const p2=String($('pnAccountCreateV2Password2')?.value||'');
  if(username.length<3){msg('err','Username minimal 3 karakter.');return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg('err','Format email belum benar.');return}if(p1.length<8||!/[A-Za-z]/.test(p1)||!/[0-9]/.test(p1)){msg('err','Password minimal 8 karakter dan harus mengandung huruf serta angka.');return}if(p1!==p2){msg('err','Ulangi password harus sama.');return}
  if(!confirm(`Buat akun baru untuk ${target.name||target.memberId}?`))return;
  try{setBusy(true);msg('','Membuat akun Firebase dan mencatat ke database...');const res=await post('portalAccountAdminCreate',{token,memberId:target.memberId,username,email,status,password:p1});msg('ok',res.message||'Akun berhasil dibuat.');$('pnAccountCreateV2Password').value='';$('pnAccountCreateV2Password2').value='';document.getElementById('pnAccountRefresh')?.click();setTimeout(closeModal,900)}catch(err){msg('err',err.message||String(err))}finally{setBusy(false)}
}

function renamePortal(){
  const nav=$('pnAccountAdminNav');if(nav&&nav.dataset.pnAccountNameV2!=='1'){nav.innerHTML='🔐 Akun Anggota<span>Anggota & calon anggota</span>';nav.dataset.pnAccountNameV2='1'}
  const panel=$('pnAccountAdminPanel');const h2=panel?.querySelector('.pnAccountHead h2');if(h2&&h2.textContent!=='🔐 AKUN ANGGOTA')h2.textContent='🔐 AKUN ANGGOTA';const p=panel?.querySelector('.pnAccountHead p');if(p&&p.dataset.pnAccountNameV2!=='1'){p.textContent='Pusat pengelolaan akun seluruh Anggota dan Calon Anggota. Admin dapat membuat akun baru, mengecek username dan email, mengubah status, serta mereset password langsung.';p.dataset.pnAccountNameV2='1'}
}

function enhanceRows(){
  const list=$('pnAccountList');if(!list)return;list.querySelectorAll('tbody tr').forEach(row=>{const detail=row.querySelector('[data-detail-row="0"]');if(!detail)return;const actions=row.querySelector('.pnAccountActions');if(!actions||actions.querySelector('[data-account-create-v2]'))return;const btn=document.createElement('button');btn.type='button';btn.className='pnAccountBtn primary';btn.dataset.accountCreateV2='1';btn.textContent='BUAT AKUN';btn.addEventListener('click',()=>openCreate(btn));actions.prepend(btn)})
}

function apply(){renamePortal();enhanceRows()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();

})();
