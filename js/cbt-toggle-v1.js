(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const SETTING_ID='CFG-CBT';
let currentState='ON';
let currentLink='';
let lastToken='';
let loadingAdmin=false;

const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function sharedCmsData(key,timeout=6500){
  const started=Date.now();
  while(Date.now()-started<timeout){
    const value=window[key];
    if(value&&value.ok)return value;
    await sleep(140);
  }
  return null;
}
const makeRid=()=>`cbttoggle-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function jsonp(action,payload={},timeout=16000){
  return new Promise((resolve,reject)=>{
    const cb='pnCbtToggleCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');
    let done=false;
    const clean=()=>{clearTimeout(timer);delete window[cb];script.remove()};
    window[cb]=data=>{if(done)return;done=true;clean();resolve(data)};
    const params=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>params.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+params.toString();
    script.async=true;
    script.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Koneksi pengaturan CBT gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Server pengaturan CBT terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

async function postReliable(action,payload={},timeout=45000){
  const rid=makeRid();
  const frame=document.createElement('iframe');
  frame.name='pnCbtToggleFrame_'+rid.replace(/\W/g,'');
  frame.style.display='none';
  frame.setAttribute('aria-hidden','true');
  const form=document.createElement('form');
  form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{
    const input=document.createElement('input');input.type='hidden';input.name=k;input.value=String(v??'');form.appendChild(input);
  });
  document.body.append(frame,form);form.submit();form.remove();
  const started=Date.now();let lastErr;
  try{
    while(Date.now()-started<timeout){
      await sleep(700);
      try{
        const r=await jsonp('contentResult',{rid},6500);
        if(r&&r.pending)continue;
        if(r&&r.ok)return r;
        if(r&&!r.pending)throw new Error(r.message||'Pengaturan CBT ditolak server.');
      }catch(err){lastErr=err}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server pengaturan CBT tidak merespons tepat waktu.');
}

function ensureStyles(){
  if($('pnCbtToggleStyle'))return;
  const s=document.createElement('style');s.id='pnCbtToggleStyle';s.textContent=`
  html:not([data-pn-cbt="on"]) #studentCbtLoginBtn,html:not([data-pn-cbt="on"]) #pnDashboardShortcuts [data-action="cbt"]{display:none!important}
  html[data-pn-cbt="on"] #studentCbtLoginBtn,html[data-pn-cbt="on"] #pnDashboardShortcuts [data-action="cbt"]{display:inline-flex!important}
  .pnCbtSwitchBox{margin:0 0 13px;padding:12px 13px;border:1px solid #cfe0d5;border-radius:11px;background:#f8fbf9;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .pnCbtSwitchInfo{min-width:220px;flex:1}.pnCbtSwitchInfo strong{display:block;color:#14532d;font-size:12px}.pnCbtSwitchInfo span{display:block;margin-top:4px;color:#64748b;font-size:10px;line-height:1.45}
  .pnCbtSwitchActions{display:flex;align-items:center;gap:7px}.pnCbtSwitchBtn{min-width:70px;border:1px solid #cbd5e1;border-radius:9px;padding:9px 12px;background:#fff;color:#475569;font:inherit;font-size:10px;font-weight:1000;cursor:pointer}.pnCbtSwitchBtn.on.active{background:#166534;border-color:#166534;color:#fff}.pnCbtSwitchBtn.off.active{background:#b91c1c;border-color:#b91c1c;color:#fff}.pnCbtSwitchBtn:disabled{opacity:.5;cursor:not-allowed}.pnCbtSwitchBadge{padding:7px 9px;border-radius:999px;font-size:9px;font-weight:1000;background:#e2e8f0;color:#475569}.pnCbtSwitchBadge.on{background:#dcfce7;color:#166534}.pnCbtSwitchBadge.off{background:#fee2e2;color:#991b1b}
  .pnCbtLinkBox{flex:1 0 100%;padding-top:10px;border-top:1px dashed #cbd5e1}.pnCbtLinkBox label{display:block;margin:0 0 6px;color:#14532d;font-size:10px;font-weight:1000}.pnCbtLinkRow{display:flex;gap:7px;align-items:center}.pnCbtLinkInput{flex:1;min-width:180px;border:1px solid #cbd5e1;border-radius:9px;padding:9px 10px;background:#fff;color:#1e293b;font:inherit;font-size:10px}.pnCbtLinkSave{border:0;border-radius:9px;padding:9px 12px;background:#0f766e;color:#fff;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnCbtLinkSave:disabled,.pnCbtLinkInput:disabled{opacity:.55;cursor:not-allowed}.pnCbtLinkHelp{display:block;margin-top:6px;color:#64748b;font-size:9px;line-height:1.45}
  .pnCbtScheduleLink{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:9px;padding:9px 12px;background:#14532d;color:#fff;font-size:10px;font-weight:1000;white-space:nowrap}
  @media(max-width:680px){.pnCbtSwitchBox{align-items:flex-start}.pnCbtSwitchActions{width:100%}.pnCbtSwitchBtn{flex:1}.pnCbtLinkRow{display:grid;grid-template-columns:1fr}.pnCbtLinkSave{width:100%}}
  `;document.head.appendChild(s);
}

function settingFromItems(items){
  const arr=Array.isArray(items)?items:[];
  return arr.find(x=>String(x?.id||'')===SETTING_ID)||arr.find(x=>String(x?.type||'').toUpperCase()==='PENGATURAN'&&String(x?.title||'').toUpperCase()==='PORTAL CBT ONLINE')||null;
}
function stateFromItems(items){
  const item=settingFromItems(items);
  if(!item)return'ON';
  const value=String(item.body||item.summary||'ON').trim().toUpperCase();
  return value==='OFF'?'OFF':'ON';
}
function validFormUrl(value){return /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(String(value||'').trim())}
function linkFromItems(items){
  const item=settingFromItems(items);
  const value=String(item?.link||'').trim();
  return validFormUrl(value)?value:'';
}

function applyState(state){
  currentState=state==='OFF'?'OFF':'ON';
  document.documentElement.setAttribute('data-pn-cbt',currentState.toLowerCase());
  renderSwitchState();
}

async function loadPublicState(){
  const shared=await sharedCmsData('__pnCmsPublicData');
  if(shared){applyState(stateFromItems(shared.content));return}
  try{
    const r=await jsonp('contentPublicList',{},15000);
    if(r&&r.ok)applyState(stateFromItems(r.content));
    else applyState('ON');
  }catch(_){applyState('ON')}
}

function token(){try{return localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY)||''}catch(_){return sessionStorage.getItem(TOKEN_KEY)||''}}

function switchHtml(){return `
  <div id="pnCbtAdminSwitch" class="pnCbtSwitchBox">
    <div class="pnCbtSwitchInfo"><strong>📝 PORTAL CBT ONLINE</strong><span id="pnCbtSwitchHelp">Atur apakah Portal CBT ditampilkan untuk anggota.</span></div>
    <div class="pnCbtSwitchActions"><span id="pnCbtSwitchBadge" class="pnCbtSwitchBadge">MEMUAT</span><button id="pnCbtSwitchOn" class="pnCbtSwitchBtn on" type="button">ON</button><button id="pnCbtSwitchOff" class="pnCbtSwitchBtn off" type="button">OFF</button></div>
    <div class="pnCbtLinkBox"><label for="pnCbtFormUrl">🔗 LINK GOOGLE FORM CBT</label><div class="pnCbtLinkRow"><input id="pnCbtFormUrl" class="pnCbtLinkInput" type="url" inputmode="url" placeholder="https://forms.gle/... atau https://docs.google.com/forms/..."><button id="pnCbtSaveLink" class="pnCbtLinkSave" type="button">SIMPAN LINK</button><a class="pnCbtScheduleLink" href="jadwal-cbt.html">🗓 ATUR PESERTA / JADWAL</a></div><span id="pnCbtLinkHelp" class="pnCbtLinkHelp">Tempel link Google Form baru lalu klik SIMPAN LINK.</span></div>
  </div>`}

function installAdminSwitch(){
  const panel=$('pnContentAdminPanel');if(!panel||$('pnCbtAdminSwitch'))return false;
  const body=panel.querySelector('.cardBody');if(!body)return false;
  const reg=$('pnRegistrationAdminSwitch');
  const status=$('pnCmsStatus');
  const wrap=document.createElement('div');wrap.innerHTML=switchHtml();const box=wrap.firstElementChild;
  if(reg&&reg.nextSibling)body.insertBefore(box,reg.nextSibling);
  else if(reg)body.appendChild(box);
  else if(status?.nextSibling)body.insertBefore(box,status.nextSibling);
  else body.prepend(box);
  $('pnCbtSwitchOn').onclick=()=>saveState('ON');
  $('pnCbtSwitchOff').onclick=()=>saveState('OFF');
  $('pnCbtSaveLink').onclick=saveLink;
  renderSwitchState();
  loadAdminState();
  return true;
}

function renderSwitchState(message=''){
  const badge=$('pnCbtSwitchBadge'),on=$('pnCbtSwitchOn'),off=$('pnCbtSwitchOff'),help=$('pnCbtSwitchHelp'),input=$('pnCbtFormUrl'),save=$('pnCbtSaveLink'),linkHelp=$('pnCbtLinkHelp');
  if(!badge||!on||!off)return;
  const hasToken=!!token();
  on.classList.toggle('active',currentState==='ON');off.classList.toggle('active',currentState==='OFF');
  badge.textContent=currentState==='ON'?'AKTIF / ON':'TUTUP / OFF';badge.className='pnCbtSwitchBadge '+(currentState==='ON'?'on':'off');
  on.disabled=off.disabled=!hasToken;
  if(input){input.disabled=!hasToken;if(document.activeElement!==input)input.value=currentLink||''}
  if(save)save.disabled=!hasToken;
  if(linkHelp)linkHelp.textContent=currentLink?'✓ Link CBT tersimpan. Anda dapat menggantinya kapan saja.':'Belum ada link tersimpan di pengaturan. Tempel link Google Form lalu klik SIMPAN LINK.';
  if(help)help.textContent=message||(hasToken?(currentState==='ON'?'Portal CBT aktif. Tombol CBT tampil untuk anggota.':'Portal CBT ditutup. Tombol CBT disembunyikan dari pengunjung.'):'Klik HUBUNGKAN AKSES terlebih dahulu untuk mengubah pengaturan.');
}

async function loadAdminState(){
  if(loadingAdmin)return;const t=token();if(!t){renderSwitchState();return}
  loadingAdmin=true;
  try{
    const shared=await sharedCmsData('__pnCmsAdminData');
    const r=shared||await jsonp('contentAdminList',{token:t},16000);
    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');
    currentLink=linkFromItems(r.content);
    applyState(stateFromItems(r.content));
  }catch(err){renderSwitchState(err.message||'Gagal membaca status Portal CBT.')}finally{loadingAdmin=false}
}

async function saveState(state){
  const t=token();if(!t){renderSwitchState('Hubungkan akses admin terlebih dahulu.');return}
  const on=$('pnCbtSwitchOn'),off=$('pnCbtSwitchOff');on.disabled=off.disabled=true;
  renderSwitchState('Menyimpan pengaturan '+state+' ke database...');
  const item={id:SETTING_ID,type:'PENGATURAN',title:'PORTAL CBT ONLINE',summary:state,body:state,date:'',badge:'FITUR',link:currentLink,status:'PUBLIK',order:998};
  try{
    await postReliable('contentAdminSave',{token:t,section:'content',itemJson:JSON.stringify(item)});
    applyState(state);
    renderSwitchState(state==='ON'?'✓ Portal CBT diaktifkan. Tombol CBT sekarang tampil untuk anggota.':'✓ Portal CBT dinonaktifkan. Tombol CBT sekarang disembunyikan dari pengunjung.');
  }catch(err){renderSwitchState(err.message||'Gagal menyimpan pengaturan CBT.')}finally{on.disabled=off.disabled=!token()}
}

async function saveLink(){
  const t=token();if(!t){renderSwitchState('Hubungkan akses admin terlebih dahulu.');return}
  const input=$('pnCbtFormUrl'),save=$('pnCbtSaveLink');
  const value=String(input?.value||'').trim();
  if(!validFormUrl(value)){
    if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent='Link tidak valid. Gunakan link Google Form dari forms.gle atau docs.google.com/forms.';
    input?.focus();return;
  }
  if(save)save.disabled=true;
  if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent='Menyimpan link Google Form CBT...';
  const item={id:SETTING_ID,type:'PENGATURAN',title:'PORTAL CBT ONLINE',summary:currentState,body:currentState,date:'',badge:'FITUR',link:value,status:'PUBLIK',order:998};
  try{
    await postReliable('contentAdminSave',{token:t,section:'content',itemJson:JSON.stringify(item)});
    currentLink=value;
    renderSwitchState('✓ Link Google Form CBT berhasil diperbarui.');
    if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent='✓ Link CBT tersimpan dan akan dipakai Portal CBT.';
  }catch(err){
    if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent=err.message||'Gagal menyimpan link CBT.';
  }finally{if(save)save.disabled=!token()}
}

function watchAdmin(){
  installAdminSwitch();
  const t=token();if(t!==lastToken){lastToken=t;if($('pnCbtAdminSwitch'))loadAdminState()}
}

ensureStyles();
document.documentElement.setAttribute('data-pn-cbt','pending');
document.addEventListener('DOMContentLoaded',()=>{loadPublicState();watchAdmin();setInterval(watchAdmin,1800);setInterval(loadPublicState,60000)});
window.addEventListener('pn:cms-public-data',e=>{if(e.detail?.ok)applyState(stateFromItems(e.detail.content))});
window.addEventListener('pn:cms-admin-data',e=>{if(e.detail?.ok&&token()){currentLink=linkFromItems(e.detail.content);applyState(stateFromItems(e.detail.content))}});
document.addEventListener('click',e=>{const id=e.target?.id;if(id==='pnCmsConnect'||id==='pnCmsReload')setTimeout(()=>{watchAdmin();loadAdminState()},1300)});
})();
