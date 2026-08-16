(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const PANEL_ID='pnAspelMonitorPanel';
const NAV_ID='pnAspelMonitorNav';
let monitorOpen=false;
let monitorData=null;
let loading=false;
let navObserver=null;

const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const norm=value=>String(value||'').trim().toLowerCase();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function jsonp(action,payload={},timeoutMs=22000){
  return new Promise((resolve,reject)=>{
    const cb='pnAspelCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{
      clearTimeout(timer);
      try{delete window[cb]}catch(_){window[cb]=undefined}
      script.remove();
    };
    window[cb]=data=>{
      if(done)return;
      done=true;cleanup();
      if(data&&data.ok)resolve(data);
      else reject(new Error(data?.message||'Permintaan pemantauan ditolak server.'));
    };
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([key,value])=>qs.set(key,String(value??'')));
    script.src=ENDPOINT+'?'+qs.toString();
    script.async=true;
    script.onerror=()=>{
      if(done)return;
      done=true;cleanup();reject(new Error('Tidak dapat menghubungi database Portal Biodata Siswa.'));
    };
    const timer=setTimeout(()=>{
      if(done)return;
      done=true;cleanup();reject(new Error('Database Portal Biodata Siswa terlalu lama merespons.'));
    },timeoutMs);
    document.head.appendChild(script);
  });
}

function ensureStyles(){
  if($('pnAspelMonitorStyle'))return;
  const style=document.createElement('style');
  style.id='pnAspelMonitorStyle';
  style.textContent=`
    .pnAspelMonitorHidden{display:none!important}
    .pnAspelMonitorPanel{margin:0 0 18px;border:1px solid #b9d4c2;border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 4px 14px rgba(15,61,36,.07)}
    .pnAspelMonitorPanel.hidden{display:none!important}
    .pnAspelHead{padding:16px 18px;background:linear-gradient(135deg,#14532d,#0f766e);color:#fff;display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
    .pnAspelHead h2{margin:0;font-size:17px;line-height:1.35;font-weight:1000}.pnAspelHead p{margin:5px 0 0;font-size:10px;line-height:1.55;color:#e7fff0;max-width:760px}
    .pnAspelRefresh{border:1px solid rgba(255,255,255,.28);border-radius:9px;padding:9px 12px;background:#fff;color:#14532d;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnAspelRefresh:disabled{opacity:.6;cursor:wait}
    .pnAspelBody{padding:15px 16px 18px}.pnAspelStatus{margin-bottom:12px;padding:10px 12px;border:1px solid #fed7aa;border-radius:9px;background:#fff7ed;color:#92400e;font-size:10px;font-weight:850;line-height:1.5}.pnAspelStatus.ok{border-color:#bbf7d0;background:#ecfdf3;color:#166534}.pnAspelStatus.err{border-color:#fecaca;background:#fef2f2;color:#991b1b}
    .pnAspelSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:12px}.pnAspelStat{padding:11px 12px;border:1px solid #dbe7df;border-radius:10px;background:#f8fbf9}.pnAspelStat strong{display:block;color:#14532d;font-size:20px;line-height:1}.pnAspelStat span{display:block;margin-top:5px;color:#64748b;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.35px}
    .pnAspelTools{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:9px;align-items:end;margin:0 0 13px}.pnAspelTools label{display:block;margin:0 0 5px;color:#334155;font-size:9px;font-weight:1000}.pnAspelSearch{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:9px;padding:10px 11px;background:#fff;font:inherit;font-size:11px}.pnAspelSource{padding:9px 11px;border-radius:9px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:9px;font-weight:900;white-space:nowrap}
    .pnAspelHierarchy{margin:0 0 13px;padding:10px 12px;border-left:4px solid #166534;border-radius:8px;background:#f0fdf4;color:#14532d;font-size:10px;font-weight:900}.pnAspelList{display:grid;gap:11px}.pnAspelEmpty{padding:20px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#64748b;text-align:center;font-size:11px;line-height:1.6}
    .pnAspelCoord{border:1px solid #cfe0d5;border-radius:11px;background:#fff;overflow:hidden}.pnAspelCoord>summary{list-style:none;cursor:pointer;padding:13px 14px;background:#f1f8f3;display:flex;align-items:center;justify-content:space-between;gap:12px}.pnAspelCoord>summary::-webkit-details-marker{display:none}.pnAspelCoordName{color:#14532d;font-size:12px;font-weight:1000}.pnAspelMeta{margin-top:4px;color:#64748b;font-size:9px;line-height:1.45}.pnAspelCount{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;background:#14532d;color:#fff;font-size:9px;font-weight:1000;white-space:nowrap}
    .pnAspelCoordBody{padding:12px 13px 14px}.pnAspelMember{margin-bottom:10px;border:1px solid #dbe7df;border-radius:10px;background:#fbfefc;overflow:hidden}.pnAspelMember:last-child{margin-bottom:0}.pnAspelMemberHead{padding:10px 11px;border-bottom:1px solid #e5eee8;background:#fff}.pnAspelMemberTitle{color:#0f5132;font-size:11px;font-weight:1000}.pnAspelMemberTitle span{color:#64748b;font-size:8px;font-weight:900}.pnAspelCandidateList{display:grid;gap:7px;padding:9px}.pnAspelCandidate{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:9px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff}.pnAspelCandidateName{color:#1e293b;font-size:10px;font-weight:1000}.pnAspelCandidateMeta{margin-top:3px;color:#64748b;font-size:8.5px;line-height:1.45}.pnAspelBadge{align-self:start;padding:4px 7px;border-radius:999px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;font-size:8px;font-weight:1000;white-space:nowrap}.pnAspelUnassigned{margin-top:10px;border:1px solid #fecaca;border-radius:10px;background:#fff7f7;overflow:hidden}.pnAspelUnassigned .pnAspelMemberHead{background:#fef2f2}.pnAspelNote{margin-top:10px;color:#64748b;font-size:9px;line-height:1.55}
    #${NAV_ID}{border-color:#bbd7c4!important;background:#f0fdf4!important;color:#14532d!important}#${NAV_ID}.active{background:#14532d!important;color:#fff!important;border-color:#14532d!important}
    @media(max-width:760px){.pnAspelHead{display:block}.pnAspelRefresh{margin-top:10px;width:100%}.pnAspelSummary{grid-template-columns:1fr 1fr}.pnAspelTools{grid-template-columns:1fr}.pnAspelSource{white-space:normal}.pnAspelCandidate{grid-template-columns:1fr}.pnAspelBadge{justify-self:start}}
  `;
  document.head.appendChild(style);
}

function ensurePanel(){
  ensureStyles();
  let panel=$(PANEL_ID);
  if(panel)return panel;
  const main=document.querySelector('#adminApp .layout main');
  if(!main)return null;
  panel=document.createElement('section');
  panel.id=PANEL_ID;
  panel.className='pnAspelMonitorPanel hidden';
  panel.innerHTML=`
    <div class="pnAspelHead">
      <div><h2>👥 PEMANTAUAN KOORDINATOR ASPEL</h2><p>Data dibaca langsung dari Portal Biodata Siswa. Urutan pemantauan: Koordinator → Anggota Koordinator → Calon Anggota yang Didampingi.</p></div>
      <button id="pnAspelRefresh" class="pnAspelRefresh" type="button">↻ MUAT ULANG</button>
    </div>
    <div class="pnAspelBody">
      <div id="pnAspelStatus" class="pnAspelStatus">Siap memuat data pemantauan.</div>
      <div id="pnAspelSummary" class="pnAspelSummary"></div>
      <div class="pnAspelTools"><div><label for="pnAspelSearch">Cari koordinator, anggota koordinator, atau calon anggota</label><input id="pnAspelSearch" class="pnAspelSearch" type="search" placeholder="Ketik nama, ID, kelas, program..." autocomplete="off"></div><div class="pnAspelSource">SUMBER: PORTAL BIODATA SISWA</div></div>
      <div class="pnAspelHierarchy">KOORDINATOR → ANGGOTA KOORDINATOR → CALON ANGGOTA YANG DIDAMPINGI</div>
      <div id="pnAspelList" class="pnAspelList"></div>
      <div id="pnAspelNote" class="pnAspelNote"></div>
    </div>`;
  main.prepend(panel);
  $('pnAspelRefresh')?.addEventListener('click',()=>loadMonitor(true));
  $('pnAspelSearch')?.addEventListener('input',renderMonitor);
  return panel;
}

function ensureNav(){
  const nav=$('nav');
  if(!nav)return;
  let button=$(NAV_ID);
  if(!button){
    button=document.createElement('button');
    button.id=NAV_ID;
    button.type='button';
    button.className='navBtn';
    button.innerHTML='👥 Pemantauan Koordinator<span>Koordinator → anggota → calon anggota</span>';
    button.addEventListener('click',openMonitor);
    nav.appendChild(button);
  }
  if(monitorOpen){
    nav.querySelectorAll('.navBtn.active').forEach(el=>el.classList.remove('active'));
    button.classList.add('active');
  }else button.classList.remove('active');
}

function suppressOtherAdminCards(){
  const main=document.querySelector('#adminApp .layout main');
  const panel=$(PANEL_ID);
  if(!main||!panel)return;
  Array.from(main.children).forEach(child=>{
    if(child!==panel)child.classList.add('pnAspelMonitorHidden');
  });
}

function restoreOtherAdminCards(){
  document.querySelectorAll('#adminApp .layout main>.pnAspelMonitorHidden').forEach(el=>el.classList.remove('pnAspelMonitorHidden'));
}

function openMonitor(){
  if(sessionStorage.getItem(AUTH_KEY)!=='1'){
    if(typeof window.openAdminLogin==='function')window.openAdminLogin();
    return;
  }
  monitorOpen=true;
  const panel=ensurePanel();
  if(!panel)return;
  suppressOtherAdminCards();
  panel.classList.remove('hidden');
  ensureNav();
  panel.scrollIntoView({behavior:'smooth',block:'start'});
  if(!monitorData)loadMonitor(false);else renderMonitor();
}

function closeMonitor(clearData=false){
  if(!monitorOpen&&!clearData)return;
  monitorOpen=false;
  restoreOtherAdminCards();
  $(PANEL_ID)?.classList.add('hidden');
  $(NAV_ID)?.classList.remove('active');
  if(clearData){
    monitorData=null;
    const list=$('pnAspelList');if(list)list.innerHTML='';
    const summary=$('pnAspelSummary');if(summary)summary.innerHTML='';
  }
}

function setStatus(kind,text){
  const el=$('pnAspelStatus');if(!el)return;
  el.className='pnAspelStatus'+(kind==='ok'?' ok':kind==='err'?' err':'');
  el.textContent=text||'';
}

function personMeta(person){
  if(!person)return'';
  return [person.memberId,person.className,person.program,person.entryYear?('Masuk '+person.entryYear):'',person.membershipStatus,person.studentStatus].filter(Boolean).join(' • ');
}

function renderCandidate(candidate){
  return `<div class="pnAspelCandidate"><div><div class="pnAspelCandidateName">${esc(candidate.name||'-')}</div><div class="pnAspelCandidateMeta">${esc(personMeta(candidate)||'-')}</div></div><span class="pnAspelBadge">${esc(candidate.membershipStatus||'Calon Anggota')}</span></div>`;
}

function renderMember(member){
  const candidates=Array.isArray(member.candidates)?member.candidates:[];
  return `<section class="pnAspelMember"><div class="pnAspelMemberHead"><div class="pnAspelMemberTitle">ANGGOTA KOORDINATOR: ${esc(member.name||'-')} <span>• ${candidates.length} calon anggota</span></div><div class="pnAspelMeta">${esc(personMeta(member)||'Profil anggota belum ditemukan pada biodata.')}</div></div><div class="pnAspelCandidateList">${candidates.map(renderCandidate).join('')||'<div class="pnAspelEmpty">Belum ada calon anggota yang didampingi.</div>'}</div></section>`;
}

function coordinatorSearchText(coordinator){
  const parts=[coordinator.name,coordinator.memberId,coordinator.className,coordinator.program];
  (coordinator.members||[]).forEach(member=>{
    parts.push(member.name,member.memberId,member.className,member.program);
    (member.candidates||[]).forEach(candidate=>parts.push(candidate.name,candidate.memberId,candidate.className,candidate.program,candidate.entryYear,candidate.membershipStatus));
  });
  (coordinator.unassignedCandidates||[]).forEach(candidate=>parts.push(candidate.name,candidate.memberId,candidate.className,candidate.program,candidate.entryYear,candidate.membershipStatus));
  return norm(parts.filter(Boolean).join(' '));
}

function renderMonitor(){
  const list=$('pnAspelList');
  const summary=$('pnAspelSummary');
  const note=$('pnAspelNote');
  if(!list||!summary||!note)return;
  if(!monitorData){list.innerHTML='<div class="pnAspelEmpty">Data pemantauan belum dimuat.</div>';summary.innerHTML='';note.textContent='';return}
  const s=monitorData.summary||{};
  summary.innerHTML=`<div class="pnAspelStat"><strong>${Number(s.coordinatorCount||0)}</strong><span>Koordinator</span></div><div class="pnAspelStat"><strong>${Number(s.memberCount||0)}</strong><span>Anggota Koordinator</span></div><div class="pnAspelStat"><strong>${Number(s.candidateCount||0)}</strong><span>Calon Anggota</span></div><div class="pnAspelStat"><strong>${Number(s.unassignedCount||0)}</strong><span>Belum Ada Pendamping</span></div>`;
  const q=norm($('pnAspelSearch')?.value||'');
  const coordinators=(monitorData.coordinators||[]).filter(item=>!q||coordinatorSearchText(item).includes(q));
  if(!coordinators.length){
    list.innerHTML='<div class="pnAspelEmpty">Tidak ada data yang cocok dengan pencarian.</div>';
  }else{
    list.innerHTML=coordinators.map(coordinator=>{
      const members=Array.isArray(coordinator.members)?coordinator.members:[];
      const unassigned=Array.isArray(coordinator.unassignedCandidates)?coordinator.unassignedCandidates:[];
      const unassignedHtml=unassigned.length?`<section class="pnAspelUnassigned"><div class="pnAspelMemberHead"><div class="pnAspelMemberTitle">BELUM MEMILIKI ANGGOTA KOORDINATOR <span>• ${unassigned.length} calon anggota</span></div></div><div class="pnAspelCandidateList">${unassigned.map(renderCandidate).join('')}</div></section>`:'';
      return `<details class="pnAspelCoord" open><summary><div><div class="pnAspelCoordName">KOORDINATOR: ${esc(coordinator.name||'-')}</div><div class="pnAspelMeta">${esc(personMeta(coordinator)||'Profil koordinator belum ditemukan pada biodata.')}</div></div><span class="pnAspelCount">${Number(coordinator.memberCount||0)} anggota • ${Number(coordinator.candidateCount||0)} calon</span></summary><div class="pnAspelCoordBody">${members.map(renderMember).join('')||'<div class="pnAspelEmpty">Belum ada Anggota Koordinator pada calon anggota di bawah koordinator ini.</div>'}${unassignedHtml}</div></details>`;
    }).join('');
  }
  const ignored=Number(s.ignoredNonCandidateCount||0);
  note.textContent=ignored>0?`${ignored} relasi Aspel tidak ditampilkan karena Status Keanggotaan bukan “Calon Anggota”.`:'';
}

async function loadMonitor(force){
  if(loading)return;
  if(!force&&monitorData){renderMonitor();return}
  loading=true;
  const refresh=$('pnAspelRefresh');if(refresh){refresh.disabled=true;refresh.textContent='MEMUAT...'}
  setStatus('','Mengambil data terbaru dari Portal Biodata Siswa...');
  let lastError=null;
  try{
    for(const wait of [0,500,1000,1800,3000]){
      if(wait)await sleep(wait);
      if(sessionStorage.getItem(AUTH_KEY)!=='1')throw new Error('Sesi admin tidak aktif. Silakan login ulang.');
      const token=sessionStorage.getItem(TOKEN_KEY)||'';
      if(!token){lastError=new Error('Sesi server admin sedang disiapkan.');continue}
      try{
        monitorData=await jsonp('aspelMonitorAdminList',{token},23000);
        renderMonitor();
        setStatus('ok',`Data berhasil dimuat • ${Number(monitorData.summary?.coordinatorCount||0)} koordinator • ${Number(monitorData.summary?.candidateCount||0)} calon anggota.`);
        return;
      }catch(err){lastError=err}
    }
    throw lastError||new Error('Sesi server admin belum siap.');
  }catch(err){
    setStatus('err','Pemantauan belum dapat dimuat. '+err.message+' Jika backend baru saja diperbarui, deploy versi Apps Script terbaru lalu login admin kembali.');
    const list=$('pnAspelList');if(list&&!monitorData)list.innerHTML='<div class="pnAspelEmpty">Data belum tersedia.</div>';
  }finally{
    loading=false;
    if(refresh){refresh.disabled=false;refresh.textContent='↻ MUAT ULANG'}
  }
}

function installNavWatch(){
  const nav=$('nav');if(!nav)return false;
  ensureNav();
  if(!navObserver){
    navObserver=new MutationObserver(()=>setTimeout(ensureNav,0));
    navObserver.observe(nav,{childList:true});
  }
  return true;
}

function installNavigationClose(){
  if(document.documentElement.dataset.pnAspelMonitorNavClose)return;
  document.documentElement.dataset.pnAspelMonitorNavClose='1';
  document.addEventListener('click',event=>{
    const target=event.target?.closest('#nav .navBtn');
    if(!target||target.id===NAV_ID)return;
    if(monitorOpen)closeMonitor(false);
  },true);
}

function securityWatch(){
  if(sessionStorage.getItem(AUTH_KEY)!=='1'){
    closeMonitor(true);
  }else if(monitorOpen){
    suppressOtherAdminCards();
  }
}

function boot(){
  ensureStyles();ensurePanel();installNavWatch();installNavigationClose();securityWatch();
  setInterval(()=>{installNavWatch();securityWatch()},900);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
