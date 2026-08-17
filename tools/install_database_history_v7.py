from pathlib import Path

backend = Path('backend/Code.gs')
s = backend.read_text()

const_anchor = "const PN_EXCEL_BACKUP_KEEP = 5;\n"
if "PN_EXCEL_HISTORY_SHEET_NAME" not in s:
    if const_anchor not in s:
        raise SystemExit('constant anchor not found')
    s = s.replace(const_anchor, const_anchor + "const PN_EXCEL_HISTORY_SHEET_NAME = 'Riwayat Perubahan Database Excel';\nconst PN_EXCEL_HISTORY_KEEP = 2000;\n", 1)

excel_anchor = "/* ===== EXCEL CLOUD DATABASE V1 ===== */\n"
history_code = r'''/* ===== RIWAYAT PERUBAHAN DATABASE EXCEL V1 ===== */
function excelDatabaseHistorySheet_() {
  const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
  let sheet = book.getSheetByName(PN_EXCEL_HISTORY_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(PN_EXCEL_HISTORY_SHEET_NAME);
    sheet.appendRow(['Waktu','Admin','Aksi','Modul','Nama / Subjek','Baris','Detail']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function excelDatabaseHistoryText_(value, maxLen) {
  return String(value || '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen || 300);
}

function excelDatabaseHistoryAdd_(data) {
  const admin = requireReviewAdmin_(data.token);
  const action = excelDatabaseHistoryText_(data.changeAction, 20).toUpperCase();
  if (!['SIMPAN','UBAH','HAPUS'].includes(action)) throw new Error('Aksi riwayat perubahan tidak valid.');
  const moduleName = excelDatabaseHistoryText_(data.module, 100) || 'Database Excel';
  const subject = excelDatabaseHistoryText_(data.subject, 160);
  const row = excelDatabaseHistoryText_(data.row, 20);
  const detail = excelDatabaseHistoryText_(data.detail, 500);
  const now = new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = excelDatabaseHistorySheet_();
    sheet.appendRow([now, admin, action, moduleName, subject, row, detail]);
    const dataRows = Math.max(0, sheet.getLastRow() - 1);
    if (dataRows > PN_EXCEL_HISTORY_KEEP) {
      sheet.deleteRows(2, dataRows - PN_EXCEL_HISTORY_KEEP);
    }
  } finally {
    lock.releaseLock();
  }
  return {
    ok:true,
    saved:true,
    at:Utilities.formatDate(now, 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss"),
    action:action,
    module:moduleName
  };
}

function excelDatabaseHistoryList_(data) {
  requireReviewAdmin_(data.token);
  const requested = Math.floor(Number(data.limit || 100));
  const limit = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 100, 200));
  const sheet = excelDatabaseHistorySheet_();
  const last = sheet.getLastRow();
  if (last < 2) return {ok:true, history:[], count:0, version:'1'};
  const count = Math.min(limit, last - 1);
  const start = last - count + 1;
  const values = sheet.getRange(start, 1, count, 7).getValues();
  const history = values.reverse().map(function(row, index) {
    const when = row[0] instanceof Date && !isNaN(row[0].getTime())
      ? Utilities.formatDate(row[0], 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss")
      : String(row[0] || '');
    return {
      id:String(start + (count - 1 - index)),
      at:when,
      admin:String(row[1] || ''),
      action:String(row[2] || ''),
      module:String(row[3] || ''),
      subject:String(row[4] || ''),
      row:String(row[5] || ''),
      detail:String(row[6] || '')
    };
  });
  return {ok:true, history:history, count:history.length, version:'1'};
}

'''
if "function excelDatabaseHistoryList_" not in s:
    if excel_anchor not in s:
        raise SystemExit('excel section anchor not found')
    s = s.replace(excel_anchor, history_code + excel_anchor, 1)

# doGet: history list via JSONP, so devices can read reliably.
get_anchor = "  if (action === 'contentResult') {\n"
get_block = r'''  if (action === 'databaseHistoryList') {
    let result;
    try {
      result = excelDatabaseHistoryList_(data);
    } catch (err) {
      result = {ok:false, history:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

'''
if "action === 'databaseHistoryList'" not in s:
    if get_anchor not in s:
        raise SystemExit('doGet anchor not found')
    s = s.replace(get_anchor, get_block + get_anchor, 1)

# doPost: append history through authenticated POST.
post_anchor = "    if (action === 'databaseManifest') {\n"
post_block = r'''    if (action === 'databaseHistoryAdd') {
      result = excelDatabaseHistoryAdd_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-database');
    }

'''
if "action === 'databaseHistoryAdd'" not in s:
    if post_anchor not in s:
        raise SystemExit('doPost anchor not found')
    s = s.replace(post_anchor, post_block + post_anchor, 1)

catch_old = "    if (['databaseManifest','databaseChunk','databaseGet','databaseSave'].includes(action)) {\n      if (['databaseManifest','databaseSave'].includes(action)) contentRememberResult_(data.rid, result);\n      return iframeResult_(result, 'pn-database');\n    }"
catch_new = "    if (['databaseManifest','databaseChunk','databaseGet','databaseSave','databaseHistoryAdd'].includes(action)) {\n      if (['databaseManifest','databaseSave','databaseHistoryAdd'].includes(action)) contentRememberResult_(data.rid, result);\n      return iframeResult_(result, 'pn-database');\n    }"
if catch_old in s:
    s = s.replace(catch_old, catch_new, 1)
elif "'databaseHistoryAdd'" not in s[s.find("} catch (err)"):]:
    raise SystemExit('database catch anchor not found')

backend.write_text(s)

js = Path('js/database-cloud-v1.js')
j = js.read_text()

# Poll fallback for history writes too.
j = j.replace("if(action==='databaseManifest'||action==='databaseSave')pollTimer=setTimeout(poll,900);",
              "if(action==='databaseManifest'||action==='databaseSave'||action==='databaseHistoryAdd')pollTimer=setTimeout(poll,900);", 1)

status_anchor = "function pnCloudStatus(label='DATABASE CLOUD'){\n"
history_js = r'''function pnHistoryEsc(value){
  return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function pnHistoryFormatTime(value){
  const d=pnParseWibTime(value);
  if(!d)return String(value||'-');
  const date=new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Jakarta'}).format(d);
  const time=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(d).replace(/\./g,':');
  return date+' • '+time+' WIB';
}
function pnEnsureHistoryUi(){
  if(document.getElementById('pnHistoryBtn'))return;
  const sync=pnEnsureLastSyncElement();
  if(!sync)return;
  const btn=document.createElement('button');
  btn.id='pnHistoryBtn';btn.type='button';btn.textContent='🕘 RIWAYAT PERUBAHAN';
  btn.style.cssText='width:100%;margin:8px 0 0;padding:10px 12px;border:0;border-radius:9px;background:#0f3d24;color:#fff;font-weight:900;cursor:pointer';
  btn.onclick=()=>window.pnOpenDatabaseHistory();
  sync.insertAdjacentElement('afterend',btn);

  const modal=document.createElement('div');
  modal.id='pnHistoryModal';
  modal.style.cssText='display:none;position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,.58);padding:18px;overflow:auto';
  modal.innerHTML='<div style="max-width:900px;margin:4vh auto;background:#fff;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.25);overflow:hidden">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:#0f172a;color:#fff"><div><b>RIWAYAT PERUBAHAN DATA</b><div style="font-size:11px;opacity:.8;margin-top:3px">100 perubahan terbaru • tersimpan di server</div></div><button id="pnHistoryClose" type="button" style="border:0;border-radius:8px;background:#334155;color:#fff;font-size:20px;width:36px;height:36px;cursor:pointer">×</button></div>'
    +'<div style="padding:12px 14px"><div style="display:flex;justify-content:flex-end;margin-bottom:9px"><button id="pnHistoryReload" type="button" style="border:0;border-radius:8px;background:#166534;color:#fff;padding:8px 12px;font-weight:800;cursor:pointer">↻ MUAT ULANG</button></div><div id="pnHistoryBody" style="min-height:110px"><div style="padding:18px;text-align:center;color:#64748b">Memuat riwayat…</div></div></div></div>';
  modal.addEventListener('click',e=>{if(e.target===modal)window.pnCloseDatabaseHistory()});
  document.body.appendChild(modal);
  document.getElementById('pnHistoryClose').onclick=()=>window.pnCloseDatabaseHistory();
  document.getElementById('pnHistoryReload').onclick=()=>pnLoadDatabaseHistory();
}
async function pnLoadDatabaseHistory(){
  pnEnsureHistoryUi();
  const body=document.getElementById('pnHistoryBody');
  const token=pnDbToken();
  if(!body)return;
  if(!token){body.innerHTML='<div style="padding:18px;text-align:center;color:#991b1b">HUBUNGKAN AKSES admin terlebih dahulu.</div>';return}
  body.innerHTML='<div style="padding:18px;text-align:center;color:#64748b">Memuat riwayat dari server…</div>';
  try{
    const r=await pnDatabaseJsonp('databaseHistoryList',{token,limit:100},20000);
    const rows=Array.isArray(r.history)?r.history:[];
    if(!rows.length){body.innerHTML='<div style="padding:22px;text-align:center;color:#64748b">Belum ada riwayat perubahan. Perubahan berikutnya akan dicatat otomatis.</div>';return}
    body.innerHTML='<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#f1f5f9;color:#334155"><th style="padding:9px;text-align:left">Waktu</th><th style="padding:9px;text-align:left">Aksi</th><th style="padding:9px;text-align:left">Modul / Subjek</th><th style="padding:9px;text-align:left">Detail</th><th style="padding:9px;text-align:left">Admin</th></tr></thead><tbody>'
      +rows.map(x=>{const action=String(x.action||'').toUpperCase();const badge=action==='HAPUS'?'#b91c1c':action==='UBAH'?'#b45309':'#166534';const subject=[x.module,x.subject,x.row?('Baris '+x.row):''].filter(Boolean).join(' • ');return '<tr style="border-top:1px solid #e2e8f0"><td style="padding:9px;white-space:nowrap">'+pnHistoryEsc(pnHistoryFormatTime(x.at))+'</td><td style="padding:9px"><span style="display:inline-block;padding:3px 7px;border-radius:999px;background:'+badge+';color:#fff;font-weight:900">'+pnHistoryEsc(action)+'</span></td><td style="padding:9px">'+pnHistoryEsc(subject||'-')+'</td><td style="padding:9px;min-width:220px">'+pnHistoryEsc(x.detail||'-')+'</td><td style="padding:9px">'+pnHistoryEsc(x.admin||'-')+'</td></tr>'}).join('')
      +'</tbody></table></div>';
  }catch(err){body.innerHTML='<div style="padding:18px;text-align:center;color:#991b1b">Gagal memuat riwayat: '+pnHistoryEsc(err.message)+'</div>'}
}
window.pnOpenDatabaseHistory=function(){pnEnsureHistoryUi();const m=document.getElementById('pnHistoryModal');if(m){m.style.display='block';void pnLoadDatabaseHistory()}};
window.pnCloseDatabaseHistory=function(){const m=document.getElementById('pnHistoryModal');if(m)m.style.display='none'};
async function pnLogDatabaseHistory(message){
  const token=pnDbToken();
  if(!token)return false;
  const text=String(message||'').trim();
  const match=text.match(/^\s*(SIMPAN|UBAH|HAPUS)\b/i);
  if(!match)return false;
  const changeAction=match[1].toUpperCase();
  let moduleName='',subject='',row='';
  try{moduleName=(typeof modules!=='undefined'&&modules[activeModule])?String(modules[activeModule].title||activeModule):String(activeModule||'')}catch(_){}
  try{subject=(typeof selectedPerson!=='undefined'&&selectedPerson)?String(selectedPerson.name||selectedPerson.id||''):''}catch(_){}
  try{row=(typeof selectedRow!=='undefined'&&selectedRow)?String(selectedRow):''}catch(_){}
  try{
    await pnDatabasePost('databaseHistoryAdd',{token,changeAction,module:moduleName,subject,row,detail:text},30000);
    const modal=document.getElementById('pnHistoryModal');
    if(modal&&modal.style.display!=='none')void pnLoadDatabaseHistory();
    return true;
  }catch(err){console.warn('Riwayat perubahan belum dapat dicatat:',err);return false}
}

'''
if "function pnEnsureHistoryUi" not in j:
    if status_anchor not in j:
        raise SystemExit('frontend status anchor not found')
    j = j.replace(status_anchor, history_js + status_anchor, 1)

# Log every successful mutation after local persistence has been accepted.
after_anchor = "window.afterMutation=async function(msg){\n  const p=await window.persistWorkingCopy();\n\n"
if "void pnLogDatabaseHistory(msg);" not in j:
    if after_anchor not in j:
        raise SystemExit('afterMutation anchor not found')
    j = j.replace(after_anchor, after_anchor + "  void pnLogDatabaseHistory(msg);\n\n", 1)

startup_anchor = "setTimeout(()=>pnRenderLastSync('idle'),120);\n"
if "pnEnsureHistoryUi" in j and "setTimeout(()=>pnEnsureHistoryUi(),180);" not in j:
    if startup_anchor not in j:
        raise SystemExit('startup anchor not found')
    j = j.replace(startup_anchor, startup_anchor + "setTimeout(()=>pnEnsureHistoryUi(),180);\n", 1)

js.write_text(j)

idx = Path('index.html')
h = idx.read_text()
if 'js/database-cloud-v1.js?v=6' not in h:
    raise SystemExit('loader v6 not found')
h = h.replace('js/database-cloud-v1.js?v=6','js/database-cloud-v1.js?v=7',1)
idx.write_text(h)
