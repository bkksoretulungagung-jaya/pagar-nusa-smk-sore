(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const SETTING_ID='CFG-REGISTRATION';
let currentState='ON';
let lastToken='';
let loadingAdmin=false;

const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const makeRid=()=>`regtoggle-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function jsonp(action,payload={},timeout=16000){
  return new Promise((resolve,reject)=>{
    const cb='pnRegToggleCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const script=document.createElement('script');
    let done=false;
    const clean=()=>{clearTimeout(timer);delete window[cb];script.remove()};
    window[cb]=data=>{if(done)return;done=true;clean();resolve(data)};
    const params=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>params.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+params.toString();
    script.async=true;
    script.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Koneksi pengaturan pendaftaran gagal.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Server pengaturan terlalu lama merespons.'))},timeout);
    document.head.appendChild(script);
  });
}

async function postReliable(action,payload={},timeout=45000){
  const rid=makeRid();
  const frame=document.createElement('iframe');
  frame.name='pnRegToggleFrame_'+rid.replace(/\W/g,'');
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
        if(r&&!r.pending)throw new Error(r.message||'Pengaturan pendaftaran ditolak server.');
      }catch(err){lastErr=err}
    }
  }finally{setTimeout(()=>frame.remove(),300)}
  throw lastErr||new Error('Server pengaturan tidak merespons tepat waktu.');
}

function ensureStyles(){
  if($('pnRegistrationToggleStyle'))return;
  const s=document.createElement('style');s.id='pnRegistrationToggleStyle';s.textContent=`
  html:not([data-pn-registration="on"]) #pnDashboardShortcuts .registrationShortcut{display:none!important}
  html[data-pn-registration="on"] #pnDashboardShortcuts .registrationShortcut{display:inline-flex!important}
  #bottomAdminLogin #pnRegistrationBtn{display:none!important}
  .pnRegSwitchBox{margin:0 0 13px;padding:12px 13px;border:1px solid #cfe0d5;border-radius:11px;background:#f8fbf9;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .pnRegSwitchInfo{min-width:220px;flex:1}.pnRegSwitchInfo strong{display:block;color:#14532d;font-size:12px}.pnRegSwitchInfo span{display:block;margin-top:4px;color:#64748b;font-size:10px;line-height:1.45}
  .pnRegSwitchActions{display:flex;align-items:center;gap:7px}.pnRegSwitchBtn{min-width:70px;border:1px solid #cbd5e1;border-radius:9px;padding:9px 12px;background:#fff;color:#475569;font:inherit;font-size:10px;font-weight:1000;cursor:pointer}.pnRegSwitchBtn.on.active{background:#166534;border-color:#166534;color:#fff}.pnRegSwitchBtn.off.active{background:#b91c1c;border-color:#b91c1c;color:#fff}.pnRegSwitchBtn:disabled{opacity:.5;cursor:not-allowed}.pnRegSwitchBadge{padding:7px 9px;border-radius:999px;font-size:9px;font-weight:1000;background:#e2e8f0;color:#475569}.pnRegSwitchBadge.on{background:#dcfce7;color:#166534}.pnRegSwitchBadge.off{background:#fee2e2;color:#991b1b}
  @media(max-width:680px){.pnRegSwitchBox{align-items:flex-start}.pnRegSwitchActions{width:100%}.pnRegSwitchBtn{flex:1}}
  `;document.head.appendChild(s);
}

function stateFromItems(items){
  const arr=Array.isArray(items)?items:[];
  const item=arr.find(x=>String(x?.id||'')===SETTING_ID)||arr.find(x=>String(x?.type||'').toUpperCase()==='PENGATURAN'&&String(x?.title||'').toUpperCase()==='PENDAFTARAN CALON ANGGOTA');
  if(!item)return'ON';
  const value=String(item.body||item.summary||'ON').trim().toUpperCase();
  return value==='OFF'?'OFF':'ON';
}

function applyState(state){
  currentState=state==='OFF'?'OFF':'ON';
  document.documentElement.setAttribute('data-pn-registration',currentState.toLowerCase());
  if(currentState==='OFF'){
    const modal=$('pnRegistrationModal');
    if(modal?.classList.contains('open')&&typeof window.pnCloseRegistration==='function')window.pnCloseRegistration();
  }
  renderSwitchState();
}

async function loadPublicState(){
  try{
    const r=await jsonp('contentPublicList',{},15000);
    if(r&&r.ok)applyState(stateFromItems(r.content));
    else applyState('ON');
  }catch(_){applyState('ON')}
}

function token(){return sessionStorage.getItem(TOKEN_KEY)||''}

function switchHtml(){return `
  <div id="pnRegistrationAdminSwitch" class="pnRegSwitchBox">
    <div class="pnRegSwitchInfo"><strong>📝 PENDAFTARAN CALON ANGGOTA</strong><span id="pnRegSwitchHelp">Atur apakah menu pendaftaran dibuka untuk calon anggota.</span></div>
    <div class="pnRegSwitchActions"><span id="pnRegSwitchBadge" class="pnRegSwitchBadge">MEMUAT</span><button id="pnRegSwitchOn" class="pnRegSwitchBtn on" type="button">ON</button><button id="pnRegSwitchOff" class="pnRegSwitchBtn off" type="button">OFF</button></div>
  </div>`}

function installAdminSwitch(){
  const panel=$('pnContentAdminPanel');if(!panel||$('pnRegistrationAdminSwitch'))return false;
  const body=panel.querySelector('.cardBody');if(!body)return false;
  const status=$('pnCmsStatus');
  const wrap=document.createElement('div');wrap.innerHTML=switchHtml();const box=wrap.firstElementChild;
  if(status?.nextSibling)body.insertBefore(box,status.nextSibling);else body.prepend(box);
  $('pnRegSwitchOn').onclick=()=>saveState('ON');
  $('pnRegSwitchOff').onclick=()=>saveState('OFF');
  renderSwitchState();
  loadAdminState();
  return true;
}

function renderSwitchState(message=''){
  const badge=$('pnRegSwitchBadge'),on=$('pnRegSwitchOn'),off=$('pnRegSwitchOff'),help=$('pnRegSwitchHelp');
  if(!badge||!on||!off)return;
  const hasToken=!!token();
  on.classList.toggle('active',currentState==='ON');off.classList.toggle('active',currentState==='OFF');
  badge.textContent=currentState==='ON'?'AKTIF / ON':'TUTUP / OFF';badge.className='pnRegSwitchBadge '+(currentState==='ON'?'on':'off');
  on.disabled=off.disabled=!hasToken;
  if(help)help.textContent=message||(hasToken?(currentState==='ON'?'Pendaftaran terbuka. Tombol pendaftaran tampil untuk pengunjung.':'Pendaftaran ditutup. Tombol pendaftaran disembunyikan dari pengunjung.'):'Klik HUBUNGKAN AKSES terlebih dahulu untuk mengubah ON/OFF.');
}

async function loadAdminState(){
  if(loadingAdmin)return;const t=token();if(!t){renderSwitchState();return}
  loadingAdmin=true;
  try{
    const r=await jsonp('contentAdminList',{token:t},16000);
    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');
    applyState(stateFromItems(r.content));
  }catch(err){renderSwitchState(err.message||'Gagal membaca status pendaftaran.')}finally{loadingAdmin=false}
}

async function saveState(state){
  const t=token();if(!t){renderSwitchState('Hubungkan akses admin terlebih dahulu.');return}
  const on=$('pnRegSwitchOn'),off=$('pnRegSwitchOff');on.disabled=off.disabled=true;
  renderSwitchState('Menyimpan pengaturan '+state+' ke database...');
  const item={id:SETTING_ID,type:'PENGATURAN',title:'PENDAFTARAN CALON ANGGOTA',summary:state,body:state,date:'',badge:'FITUR',link:'',status:'PUBLIK',order:999};
  try{
    await postReliable('contentAdminSave',{token:t,section:'content',itemJson:JSON.stringify(item)});
    applyState(state);
    renderSwitchState(state==='ON'?'✓ Pendaftaran dibuka. Menu pendaftaran sekarang tampil untuk pengunjung.':'✓ Pendaftaran ditutup. Menu pendaftaran sekarang disembunyikan dari pengunjung.');
  }catch(err){renderSwitchState(err.message||'Gagal menyimpan pengaturan.')}finally{on.disabled=off.disabled=!token()}
}

function watchAdmin(){
  installAdminSwitch();
  const t=token();if(t!==lastToken){lastToken=t;if($('pnRegistrationAdminSwitch'))loadAdminState()}
}

ensureStyles();
document.documentElement.setAttribute('data-pn-registration','pending');
document.addEventListener('DOMContentLoaded',()=>{loadPublicState();watchAdmin();setInterval(watchAdmin,1800);setInterval(loadPublicState,60000)});
document.addEventListener('click',e=>{const id=e.target?.id;if(id==='pnCmsConnect'||id==='pnCmsReload')setTimeout(()=>{watchAdmin();loadAdminState()},1300)});
})();
