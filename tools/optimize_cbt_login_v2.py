from pathlib import Path
import re

repo = Path('.')
code_path = repo / 'backend' / 'Code.gs'
siswa_path = repo / 'siswa.html'
code = code_path.read_text(encoding='utf-8')
siswa = siswa_path.read_text(encoding='utf-8')

# ===== Backend constants / health =====
if "PN_CBT_CONFIG_PROPERTY" not in code:
    marker = "const PN_CBT_LOG_SHEET_NAME = 'Log CBT';\n"
    addition = marker + "const PN_CBT_CONFIG_PROPERTY = 'PN_CBT_CONFIG_V2';\nconst PN_CBT_TOKEN_CACHE_SECONDS = 300;\n"
    if marker not in code:
        raise SystemExit('Konstanta CBT tidak ditemukan')
    code = code.replace(marker, addition, 1)

if "cbtFastLogin:true" not in code:
    marker = "      cbtScheduleVersion:'1',\n"
    addition = marker + "      cbtFastLogin:true,\n      cbtFastLoginVersion:'2',\n"
    if marker not in code:
        raise SystemExit('Health CBT tidak ditemukan')
    code = code.replace(marker, addition, 1)

# ===== Simpan konfigurasi CBT ke Script Properties saat Admin mengganti ON/OFF/link =====
old = "    contentUpsertRow_(sheets.content,id,row,12);\n    return {id:id,type:type,title:title,summary:summary,body:body,date:date,badge:badge,link:link,status:status,order:order};\n"
new = "    contentUpsertRow_(sheets.content,id,row,12);\n    if (id === 'CFG-CBT') {\n      try { cbtStoreConfigProperty_(body || summary || 'ON', link); } catch (_) {}\n    }\n    return {id:id,type:type,title:title,summary:summary,body:body,date:date,badge:badge,link:link,status:status,order:order};\n"
if old in code and new not in code:
    code = code.replace(old, new, 1)

# ===== Fast helpers + secure access check =====
helper_block = r'''function cbtStoreConfigProperty_(state, link) {
  const normalizedState = String(state || 'ON').trim().toUpperCase() === 'OFF' ? 'OFF' : 'ON';
  const rawLink = String(link || '').trim();
  const safeLink = /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(rawLink) ? rawLink : '';
  PropertiesService.getScriptProperties().setProperty(PN_CBT_CONFIG_PROPERTY, JSON.stringify({
    enabled:normalizedState !== 'OFF',
    link:safeLink,
    updatedAt:Date.now()
  }));
}

function cbtFormSettingFast_() {
  const props = PropertiesService.getScriptProperties();
  const raw = String(props.getProperty(PN_CBT_CONFIG_PROPERTY) || '');
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      return {enabled:saved.enabled !== false, link:String(saved.link || '')};
    } catch (_) {}
  }
  const cfg = cbtFormSetting_();
  cbtStoreConfigProperty_(cfg.enabled ? 'ON' : 'OFF', cfg.link);
  return cfg;
}

function verifyFirebaseTokenCached_(idToken) {
  const token = String(idToken || '').trim();
  if (!token) throw new Error('Sesi login tidak tersedia.');
  const cache = CacheService.getScriptCache();
  const key = 'pn-cbt-firebase-v2:' + sha256Hex_(token).slice(0,40);
  try {
    const raw = cache.get(key);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && obj.email && obj.localId) return obj;
    }
  } catch (_) {}
  const user = verifyFirebaseToken_(token);
  const compact = {email:String(user.email || ''), localId:String(user.localId || '')};
  try { cache.put(key, JSON.stringify(compact), PN_CBT_TOKEN_CACHE_SECONDS); } catch (_) {}
  return compact;
}

function cbtAccountScheduleFast_(username, email) {
  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const accountSheet = book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!accountSheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');

  const u = String(username || '').trim().toLowerCase();
  const e = String(email || '').trim().toLowerCase();
  let account = null;
  const lastAccount = accountSheet.getLastRow();
  if (lastAccount >= 2) {
    const rows = accountSheet.getRange(2,1,lastAccount-1,5).getDisplayValues();
    for (let i=0;i<rows.length;i++) {
      const rowUser = String(rows[i][0] || '').trim().toLowerCase();
      const rowEmail = String(rows[i][2] || '').trim().toLowerCase();
      if (rowUser === u && rowEmail === e) {
        account = {
          row:i+2,
          username:String(rows[i][0] || '').trim(),
          memberId:String(rows[i][1] || '').trim(),
          email:rowEmail,
          uid:String(rows[i][3] || '').trim(),
          status:String(rows[i][4] || 'AKTIF').trim().toUpperCase()
        };
        break;
      }
    }
  }

  let schedule = null;
  const scheduleSheet = book.getSheetByName(PN_CBT_SCHEDULE_SHEET_NAME);
  if (account && scheduleSheet && scheduleSheet.getLastRow() >= 2) {
    const rows = scheduleSheet.getRange(2,1,scheduleSheet.getLastRow()-1,9).getValues();
    const target = account.username.toLowerCase();
    for (let i=0;i<rows.length;i++) {
      if (String(rows[i][0] || '').trim().toLowerCase() === target) {
        schedule = cbtScheduleObject_(rows[i]);
        break;
      }
    }
  }
  return {book:book, accountSheet:accountSheet, account:account, schedule:schedule};
}

function cbtAccessCheck_(data) {
  const startedAt = Date.now();
  const username = String(data.username || '').trim();
  const idToken = String(data.idToken || '').trim();
  if (!username || !idToken) throw new Error('Username dan sesi login CBT wajib tersedia.');

  const firebaseUser = verifyFirebaseTokenCached_(idToken);
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  const uid = String(firebaseUser.localId || '').trim();
  if (!email || !uid) throw new Error('Akun Firebase tidak valid.');

  const dataFast = cbtAccountScheduleFast_(username, email);
  const account = dataFast.account;
  if (!account) {
    return {ok:true,allowed:false,code:'ACCOUNT_NOT_FOUND',message:'Akun CBT tidak terdaftar. Hubungi admin.'};
  }
  if (account.status !== 'AKTIF') {
    return {ok:true,allowed:false,code:'ACCOUNT_INACTIVE',message:'Akun portal Anda sedang nonaktif.'};
  }
  if (account.uid && account.uid !== uid) {
    return {ok:true,allowed:false,code:'UID_MISMATCH',message:'Akun ini sudah terhubung dengan pengguna lain. Hubungi admin.'};
  }
  if (!account.uid) {
    try { dataFast.accountSheet.getRange(account.row,4).setValue(uid); } catch (_) {}
  }

  const schedule = dataFast.schedule;
  if (!schedule || !schedule.exists || schedule.status !== 'AKTIF') {
    return {ok:true,allowed:false,code:'NOT_SCHEDULED',message:'Anda belum dijadwalkan mengikuti CBT. Hubungi admin/pengurus.'};
  }
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  const now = Date.now();
  if (!start || !end) return {ok:true,allowed:false,code:'INVALID_SCHEDULE',message:'Jadwal CBT akun Anda belum valid. Hubungi admin.'};
  if (now < start) {
    return {ok:true,allowed:false,code:'NOT_STARTED',message:'Jadwal CBT Anda belum dimulai.',startAt:schedule.startAt,endAt:schedule.endAt};
  }
  if (now > end) {
    return {ok:true,allowed:false,code:'EXPIRED',message:'Waktu CBT Anda sudah selesai.',startAt:schedule.startAt,endAt:schedule.endAt};
  }

  const cfg = cbtFormSettingFast_();
  if (!cfg.enabled) return {ok:true,allowed:false,code:'PORTAL_OFF',message:'Portal CBT sedang ditutup oleh admin.'};
  if (!cfg.link) return {ok:true,allowed:false,code:'NO_FORM',message:'Link soal CBT belum dipasang oleh admin.'};

  return {
    ok:true,
    allowed:true,
    username:account.username,
    memberId:account.memberId,
    email:account.email,
    startAt:schedule.startAt,
    endAt:schedule.endAt,
    formUrl:cfg.link,
    responseMs:Date.now()-startedAt,
    message:'Akses CBT diizinkan sesuai jadwal.',
    version:'2'
  };
}

'''

pattern = re.compile(r"function cbtAccessCheck_\(data\) \{.*?\n\}\n\n(?=/\* =========================================================\n   CONTENT MANAGER / CMS V1)", re.S)
if pattern.search(code):
    code = pattern.sub(helper_block, code, count=1)
elif "function verifyFirebaseTokenCached_" not in code:
    raise SystemExit('Fungsi cbtAccessCheck_ tidak ditemukan')

# ===== Frontend: jangan paksa refresh token + retry sekali secara transparan =====
siswa = siswa.replace("function cbtRequest(action,payload={},timeout=25000)", "function cbtRequest(action,payload={},timeout=35000)")
old_auth = "  const idToken=await user.getIdToken(true);\n  const r=await cbtRequest('cbtAccessCheck',{username:uname,idToken});\n"
new_auth = "  const idToken=await user.getIdToken();\n  let r;\n  try{r=await cbtRequest('cbtAccessCheck',{username:uname,idToken},22000)}\n  catch(firstErr){\n    await new Promise(resolve=>setTimeout(resolve,500));\n    r=await cbtRequest('cbtAccessCheck',{username:uname,idToken},35000);\n  }\n"
if old_auth in siswa:
    siswa = siswa.replace(old_auth, new_auth, 1)
elif "const idToken=await user.getIdToken();" not in siswa:
    raise SystemExit('Blok authorizeCbt tidak ditemukan')

siswa = siswa.replace("Server jadwal CBT terlalu lama merespons.", "Koneksi CBT sedang sibuk. Silakan coba sekali lagi.")

code_path.write_text(code, encoding='utf-8')
siswa_path.write_text(siswa, encoding='utf-8')
print('Optimasi CBT login v2 diterapkan.')
