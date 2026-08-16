from pathlib import Path

backend = Path('backend/Code.gs')
index = Path('index.html')
notice_js = Path('js/admin-notifications-v1.js')

code = backend.read_text(encoding='utf-8')
html = index.read_text(encoding='utf-8')

# 1) Health flags
health_old = "      backupRetentionDays:PN_BACKUP_RETENTION_DAYS,\n      adminPasswordConfigured:adminPasswordConfigured_(),"
health_new = "      backupRetentionDays:PN_BACKUP_RETENTION_DAYS,\n      adminNotificationCenter:true,\n      adminNotificationCenterVersion:'1',\n      adminPasswordConfigured:adminPasswordConfigured_(),"
if "adminNotificationCenterVersion:'1'" not in code:
    if health_old not in code:
        raise SystemExit('health anchor not found')
    code = code.replace(health_old, health_new, 1)

# 2) GET route
route_anchor = "  if (action === 'contentResult') {"
route = """  if (action === 'adminNotificationCenter') {
    let result;
    try {
      result = adminNotificationCenter_(data);
    } catch (err) {
      result = {ok:false, attentionCount:0, items:[], stats:{}, message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

"""
if "action === 'adminNotificationCenter'" not in code:
    if route_anchor not in code:
        raise SystemExit('route anchor not found')
    code = code.replace(route_anchor, route + route_anchor, 1)

# 3) Backend implementation
marker = '/* ===== PUSAT NOTIFIKASI ADMIN V1 ===== */'
if marker not in code:
    code += r'''

/* ===== PUSAT NOTIFIKASI ADMIN V1 ===== */
function adminNotificationCenter_(data) {
  const admin = requireReviewAdmin_(data.token);
  const items = [];
  const stats = {
    pendingReviews:0,
    unassignedCandidates:0,
    registrationsToday:0,
    backupActive:false,
    backupLastStatus:'',
    backupLastAt:''
  };

  // Ulasan yang benar-benar menunggu tindakan admin.
  try {
    const reviewSheet = reviewSheet_();
    const last = reviewSheet.getLastRow();
    if (last >= 2) {
      const statuses = reviewSheet.getRange(2,7,last-1,1).getDisplayValues();
      stats.pendingReviews = statuses.reduce(function(total,row){
        return total + (String(row[0] || '').trim().toUpperCase() === 'PENDING' ? 1 : 0);
      }, 0);
    }
  } catch (err) {
    items.push({
      id:'reviews-read-error',
      severity:'warning',
      icon:'🟡',
      title:'Status ulasan belum dapat diperiksa',
      detail:String(err && err.message || err).slice(0,220),
      target:'reviews'
    });
  }

  if (stats.pendingReviews > 0) {
    items.push({
      id:'reviews-pending',
      severity:'warning',
      icon:'🟡',
      title:stats.pendingReviews + ' ulasan menunggu pemeriksaan',
      detail:'Buka moderasi ulasan untuk menerbitkan, menolak, atau menghapus ulasan.',
      target:'reviews'
    });
  }

  // Calon Anggota yang sudah punya Koordinator tetapi belum punya Anggota Koordinator.
  try {
    const aspel = aspelMonitorAdminList_(data);
    stats.unassignedCandidates = Number(aspel && aspel.summary && aspel.summary.unassignedCount || 0);
  } catch (err) {
    items.push({
      id:'aspel-read-error',
      severity:'warning',
      icon:'🟡',
      title:'Status pendampingan Aspel belum dapat diperiksa',
      detail:String(err && err.message || err).slice(0,220),
      target:'aspel'
    });
  }

  if (stats.unassignedCandidates > 0) {
    items.push({
      id:'aspel-unassigned',
      severity:'warning',
      icon:'🟠',
      title:stats.unassignedCandidates + ' Calon Anggota belum memiliki Anggota Koordinator',
      detail:'Data masuk kategori Belum Memiliki Anggota Koordinator pada Pemantauan Koordinator Aspel.',
      target:'aspel'
    });
  }

  // Pendaftaran hari ini hanya informasi, tidak menambah badge perhatian.
  try {
    const regSheet = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID).getSheetByName(PN_SHEET_NAME);
    if (regSheet && regSheet.getLastRow() >= 2) {
      const values = regSheet.getRange(2,12,regSheet.getLastRow()-1,1).getValues();
      const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
      stats.registrationsToday = values.reduce(function(total,row){
        const value = row[0];
        if (!(value instanceof Date) || isNaN(value.getTime())) return total;
        return total + (Utilities.formatDate(value,'Asia/Jakarta','yyyy-MM-dd') === today ? 1 : 0);
      }, 0);
    }
  } catch (_) {}

  // Backup: cek trigger dan hasil backup terakhir.
  try {
    stats.backupActive = ScriptApp.getProjectTriggers().some(function(trigger){
      return trigger.getHandlerFunction() === 'runDailyDatabaseBackup';
    });
  } catch (_) {
    stats.backupActive = false;
  }

  try {
    const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
    const logSheet = book.getSheetByName(PN_BACKUP_LOG_SHEET_NAME);
    if (logSheet && logSheet.getLastRow() >= 2) {
      const start = Math.max(2, logSheet.getLastRow() - 49);
      const rows = logSheet.getRange(start,1,logSheet.getLastRow()-start+1,3).getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        const status = String(rows[i][1] || '').trim().toUpperCase();
        if (status !== 'OK' && status !== 'GAGAL') continue;
        stats.backupLastStatus = status;
        const when = rows[i][0];
        if (when instanceof Date && !isNaN(when.getTime())) stats.backupLastAt = when.toISOString();
        break;
      }
    }
  } catch (_) {}

  if (!stats.backupActive) {
    items.unshift({
      id:'backup-trigger-off',
      severity:'critical',
      icon:'🔴',
      title:'Backup otomatis belum aktif',
      detail:'Trigger backup harian tidak ditemukan. Jalankan installDailyBackupTrigger dari Apps Script.',
      target:'backup'
    });
  } else if (stats.backupLastStatus === 'GAGAL') {
    items.unshift({
      id:'backup-failed',
      severity:'critical',
      icon:'🔴',
      title:'Backup database terakhir gagal',
      detail:'Periksa Log Backup Otomatis pada Database Pendaftaran Permanen.',
      target:'backup'
    });
  } else if (!stats.backupLastStatus) {
    items.unshift({
      id:'backup-no-success',
      severity:'warning',
      icon:'🟠',
      title:'Backup belum memiliki catatan berhasil',
      detail:'Jalankan runDailyDatabaseBackup satu kali untuk memastikan salinan database dapat dibuat.',
      target:'backup'
    });
  } else if (stats.backupLastAt) {
    const ageMs = Date.now() - new Date(stats.backupLastAt).getTime();
    if (ageMs > 36 * 60 * 60 * 1000) {
      items.unshift({
        id:'backup-stale',
        severity:'warning',
        icon:'🟠',
        title:'Backup terakhir sudah lebih dari 36 jam',
        detail:'Periksa trigger backup harian dan Log Backup Otomatis.',
        target:'backup'
      });
    }
  }

  return {
    ok:true,
    admin:admin,
    attentionCount:items.length,
    items:items,
    stats:stats,
    checkedAt:new Date().toISOString(),
    version:'1'
  };
}
'''

backend.write_text(code, encoding='utf-8')

# 4) Frontend Pusat Notifikasi Admin
notice_js.write_text(r'''(()=>{
'use strict';

const ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';
const TOKEN_KEY='pnReviewAdminToken';
const AUTH_KEY='pnAdminAuth';
const ROOT_ID='pnAdminNotificationCenter';
let loading=false;
let lastData=null;
let pollTimer=0;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function saved(key){try{return localStorage.getItem(key)||sessionStorage.getItem(key)||''}catch(_){try{return sessionStorage.getItem(key)||''}catch(__){return''}}}
function isAdmin(){return saved(AUTH_KEY)==='1'&&!!saved(TOKEN_KEY)}

function jsonp(action,payload={},timeoutMs=22000){
  return new Promise((resolve,reject)=>{
    const cb='pnAdminNoticeCb_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/[^a-z0-9_]/gi,'');
    const script=document.createElement('script');
    let done=false;
    const cleanup=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}script.remove()};
    window[cb]=data=>{if(done)return;done=true;cleanup();data&&data.ok?resolve(data):reject(new Error(data?.message||'Notifikasi admin tidak dapat dimuat.'))};
    const qs=new URLSearchParams({action,callback:cb,_:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>qs.set(k,String(v??'')));
    script.src=ENDPOINT+'?'+qs.toString();script.async=true;
    script.onerror=()=>{if(done)return;done=true;cleanup();reject(new Error('Tidak dapat menghubungi pusat notifikasi.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;cleanup();reject(new Error('Pusat notifikasi terlalu lama merespons.'))},timeoutMs);
    document.head.appendChild(script);
  });
}

function ensureStyle(){
  if($('pnAdminNotificationStyle'))return;
  const style=document.createElement('style');
  style.id='pnAdminNotificationStyle';
  style.textContent=`
    .pnAdminNotice{position:relative;margin:0 0 13px;border:1px solid #cfe0d5;border-radius:12px;background:#fff;box-shadow:0 4px 14px rgba(15,61,36,.07);overflow:visible}
    .pnAdminNotice.hidden{display:none!important}.pnAdminNoticeHead{width:100%;border:0;background:linear-gradient(135deg,#f0fdf4,#f8fbf9);padding:11px 13px;display:flex;align-items:center;gap:9px;cursor:pointer;text-align:left;font:inherit;color:#14532d}
    .pnAdminNoticeBell{font-size:17px}.pnAdminNoticeTitle{font-size:11px;font-weight:1000;letter-spacing:.15px}.pnAdminNoticeSummary{margin-left:auto;color:#64748b;font-size:9px;font-weight:900}.pnAdminNoticeBadge{min-width:23px;height:23px;padding:0 6px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#14532d;color:#fff;font-size:10px;font-weight:1000;box-sizing:border-box}.pnAdminNoticeBadge.alert{background:#b91c1c}.pnAdminNoticeChevron{font-size:13px;font-weight:1000;transition:transform .18s ease}.pnAdminNotice.open .pnAdminNoticeChevron{transform:rotate(180deg)}
    .pnAdminNoticePanel{display:none;border-top:1px solid #dbe7df;padding:12px;background:#fff}.pnAdminNotice.open .pnAdminNoticePanel{display:block}
    .pnAdminNoticeInfo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}.pnAdminNoticeStat{padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc}.pnAdminNoticeStat strong{display:block;color:#14532d;font-size:16px;line-height:1}.pnAdminNoticeStat span{display:block;margin-top:4px;color:#64748b;font-size:8px;font-weight:900;text-transform:uppercase}
    .pnAdminNoticeList{display:grid;gap:7px}.pnAdminNoticeItem{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:start;padding:10px 11px;border:1px solid #e2e8f0;border-radius:9px;background:#fff}.pnAdminNoticeItem.critical{border-color:#fecaca;background:#fff7f7}.pnAdminNoticeItem.warning{border-color:#fed7aa;background:#fffaf3}.pnAdminNoticeIcon{font-size:14px;line-height:1.35}.pnAdminNoticeItemTitle{color:#1e293b;font-size:10px;font-weight:1000;line-height:1.4}.pnAdminNoticeItemDetail{margin-top:3px;color:#64748b;font-size:8.5px;line-height:1.5}.pnAdminNoticeGo{border:1px solid #cbd5e1;border-radius:8px;padding:6px 8px;background:#fff;color:#14532d;font:inherit;font-size:8px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnAdminNoticeEmpty{padding:14px;border:1px dashed #bbd7c4;border-radius:9px;background:#f0fdf4;color:#166534;text-align:center;font-size:10px;font-weight:900}.pnAdminNoticeFoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;color:#94a3b8;font-size:8px}.pnAdminNoticeRefresh{border:0;background:transparent;color:#166534;font:inherit;font-size:8px;font-weight:1000;cursor:pointer;padding:3px}
    @media(max-width:680px){.pnAdminNoticeSummary{display:none}.pnAdminNoticeInfo{grid-template-columns:1fr 1fr}.pnAdminNoticeItem{grid-template-columns:auto minmax(0,1fr)}.pnAdminNoticeGo{grid-column:2;justify-self:start}}
  `;
  document.head.appendChild(style);
}

function ensureRoot(){
  ensureStyle();
  let root=$(ROOT_ID);if(root)return root;
  const main=document.querySelector('#adminApp .layout main');if(!main)return null;
  root=document.createElement('section');root.id=ROOT_ID;root.className='pnAdminNotice hidden';
  root.innerHTML=`<button id="pnAdminNoticeHead" class="pnAdminNoticeHead" type="button" aria-expanded="false"><span class="pnAdminNoticeBell">🔔</span><span class="pnAdminNoticeTitle">PUSAT NOTIFIKASI ADMIN</span><span id="pnAdminNoticeSummary" class="pnAdminNoticeSummary">Memuat...</span><span id="pnAdminNoticeBadge" class="pnAdminNoticeBadge">0</span><span class="pnAdminNoticeChevron">⌄</span></button><div id="pnAdminNoticePanel" class="pnAdminNoticePanel"><div id="pnAdminNoticeInfo" class="pnAdminNoticeInfo"></div><div id="pnAdminNoticeList" class="pnAdminNoticeList"></div><div class="pnAdminNoticeFoot"><span id="pnAdminNoticeChecked">Belum diperiksa</span><button id="pnAdminNoticeRefresh" class="pnAdminNoticeRefresh" type="button">↻ MUAT ULANG</button></div></div>`;
  const first=main.firstElementChild;first?main.insertBefore(root,first):main.appendChild(root);
  $('pnAdminNoticeHead')?.addEventListener('click',()=>{
    const open=!root.classList.contains('open');root.classList.toggle('open',open);$('pnAdminNoticeHead')?.setAttribute('aria-expanded',open?'true':'false');
    if(open&&(!lastData||Date.now()-Number(root.dataset.loadedAt||0)>60000))load(true);
  });
  $('pnAdminNoticeRefresh')?.addEventListener('click',()=>load(true));
  $('pnAdminNoticeList')?.addEventListener('click',e=>{const btn=e.target.closest('[data-target]');if(btn)goTarget(btn.dataset.target)});
  return root;
}

function formatTime(v){try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(v))}catch(_){return String(v||'')}}

function render(data){
  const root=ensureRoot();if(!root)return;
  const count=Number(data?.attentionCount||0);const stats=data?.stats||{};const items=Array.isArray(data?.items)?data.items:[];
  root.classList.toggle('hidden',!isAdmin());if(!isAdmin())return;
  const badge=$('pnAdminNoticeBadge');if(badge){badge.textContent=String(count);badge.classList.toggle('alert',count>0)}
  if($('pnAdminNoticeSummary'))$('pnAdminNoticeSummary').textContent=count?count+' hal perlu perhatian':'Semua aman';
  if($('pnAdminNoticeInfo'))$('pnAdminNoticeInfo').innerHTML=`<div class="pnAdminNoticeStat"><strong>${Number(stats.pendingReviews||0)}</strong><span>Ulasan Pending</span></div><div class="pnAdminNoticeStat"><strong>${Number(stats.unassignedCandidates||0)}</strong><span>Belum Didampingi</span></div><div class="pnAdminNoticeStat"><strong>${Number(stats.registrationsToday||0)}</strong><span>Pendaftaran Hari Ini</span></div>`;
  const list=$('pnAdminNoticeList');if(list){
    list.innerHTML=items.length?items.map(item=>`<div class="pnAdminNoticeItem ${esc(item.severity||'warning')}"><div class="pnAdminNoticeIcon">${esc(item.icon||'🔔')}</div><div><div class="pnAdminNoticeItemTitle">${esc(item.title||'Notifikasi')}</div><div class="pnAdminNoticeItemDetail">${esc(item.detail||'')}</div></div>${item.target&&item.target!=='backup'?`<button class="pnAdminNoticeGo" type="button" data-target="${esc(item.target)}">BUKA</button>`:''}</div>`).join(''):'<div class="pnAdminNoticeEmpty">✓ Tidak ada hal yang memerlukan perhatian admin.</div>';
  }
  if($('pnAdminNoticeChecked'))$('pnAdminNoticeChecked').textContent='Diperiksa '+formatTime(data?.checkedAt||new Date());
  root.dataset.loadedAt=String(Date.now());
}

function showError(err){
  const root=ensureRoot();if(!root||!isAdmin())return;
  root.classList.remove('hidden');
  if($('pnAdminNoticeSummary'))$('pnAdminNoticeSummary').textContent='Belum tersinkron';
  const list=$('pnAdminNoticeList');if(list)list.innerHTML=`<div class="pnAdminNoticeItem warning"><div class="pnAdminNoticeIcon">🟡</div><div><div class="pnAdminNoticeItemTitle">Pusat notifikasi belum dapat dimuat</div><div class="pnAdminNoticeItemDetail">${esc(String(err&&err.message||err))}</div></div></div>`;
}

async function load(force=false){
  const root=ensureRoot();if(!root)return false;
  if(!isAdmin()){root.classList.add('hidden');return false}
  root.classList.remove('hidden');
  if(loading)return false;
  if(!force&&lastData&&Date.now()-Number(root.dataset.loadedAt||0)<45000){render(lastData);return true}
  loading=true;
  try{
    const data=await jsonp('adminNotificationCenter',{token:saved(TOKEN_KEY)},24000);
    lastData=data;render(data);return true;
  }catch(err){showError(err);return false}
  finally{loading=false}
}

function openNormalCard(panel){
  if(!panel)return false;
  const card=panel.closest('#adminApp .layout main>.card');
  if(card&&card.classList.contains('pnAdminCardClosed'))card.querySelector(':scope>.cardTitle .pnAdminCardToggle')?.click();
  panel.scrollIntoView({behavior:'smooth',block:'start'});return true;
}

function goTarget(target){
  if(target==='aspel'){
    const nav=$('pnAspelMonitorNav');if(nav){nav.click();return}
  }
  if(target==='reviews'){
    if(openNormalCard($('pnReviewAdminPanel')))return;
  }
}

function boot(){
  ensureRoot();load(false);
  clearInterval(pollTimer);pollTimer=setInterval(()=>{if(document.visibilityState==='visible'&&isAdmin()&&navigator.onLine!==false)load(false)},60000);
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,400));
window.addEventListener('online',()=>setTimeout(()=>load(true),500));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load(false)});
window.addEventListener('pn:reviews-changed',()=>setTimeout(()=>load(true),500));
window.pnRefreshAdminNotifications=()=>load(true);
setInterval(()=>{const root=ensureRoot();if(root){root.classList.toggle('hidden',!isAdmin());if(isAdmin()&&!lastData)load(false)}},1500);
})();
''', encoding='utf-8')

# 5) Load frontend with cache-busting.
script_line = '<script src="js/admin-notifications-v1.js?v=1"></script>'
if script_line not in html:
    anchor = '<script src="js/admin-compact-v1.js?v=3"></script>'
    if anchor not in html:
        raise SystemExit('index script anchor not found')
    html = html.replace(anchor, anchor + '\n' + script_line, 1)
index.write_text(html, encoding='utf-8')

print('Admin Notification Center V1 patched successfully.')
