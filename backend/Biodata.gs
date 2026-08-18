const PN_BIODATA_SPREADSHEET_ID = '1t_PLScKuFhFYOSqAAkeVw4rQDzC2mE7iqFyiwYrvV7w';
const PN_BIODATA_SHEET_NAME = 'Data Biodata Siswa Anggota';
const PN_BIODATA_LOG_SHEET_NAME = 'Log Perubahan Biodata';
const PN_PORTAL_ACCOUNT_SHEET_NAME = 'Akun Portal Siswa';
const PN_UKT_SHEET_NAME = 'Riwayat UKT';
const PN_UKT_STAGES = ['UKT 1','UKT 2','UKT 3','UKT 4','UKT 5','ASPEL'];
const PN_UKT_MAX = PN_UKT_STAGES.length;
const PN_FIREBASE_API_KEY = 'AIzaSyCMWsvVJPem3_5Y-x8Zrjz90LodbNLkxUs';
const PN_PROGRAMS = ['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];

const PN_BIODATA_HEADERS = [
  'ID Anggota','Nama Lengkap','L/P','Tempat Lahir','Tanggal Lahir','Kelas','Program Keahlian','Alamat','No. HP Siswa',
  'Nama Orang Tua/Wali','No. HP Wali','Tahun Pengesahan','Tahun Masuk','Tingkat/Sabuk','Status Keanggotaan','Status Siswa',
  'Nomor Sertifikat','Catatan','Tanggal Pengesahan','Koordinator Aspel','Anggota Aspel 1','Anggota Aspel 2'
];

// Hanya kolom berikut yang boleh diedit siswa.
const PN_BIODATA_EDITABLE = {
  name:1,
  gender:2,
  birthPlace:3,
  birthDate:4,
  className:5,
  program:6,
  address:7,
  studentPhone:8,
  parentName:9,
  parentPhone:10,
  notes:17
};

function doGet(e) {
  return json_({
    ok:true,
    service:'Pagar Nusa Student Biodata API',
    storage:'Google Sheets',
    spreadsheet:PN_BIODATA_SPREADSHEET_ID,
    aspelRelations:true,
    ukt:true,
    uktMax:PN_UKT_MAX,
    version:'10'
  });
}

function doPost(e) {
  const data = Object.assign({}, (e && e.parameter) || {}, parseBody_(e));
  const action = String(data.action || '');
  let result;

  try {
    if (action === 'biodataGet') {
      result = getStudentBiodata_(data);
    } else if (action === 'biodataUpdate') {
      result = updateStudentBiodata_(data);
    } else {
      result = {ok:false, message:'Action tidak dikenal.'};
    }
  } catch (err) {
    result = {ok:false, message:String(err && err.message || err)};
  }

  result.rid = String(data.rid || '');
  return iframeResult_(result);
}

function getStudentBiodata_(data) {
  const auth = authorizePortalStudent_(data);
  const found = findBiodataRow_(auth.book, auth.memberId);
  const biodata = biodataObject_(found.values);

  return {
    ok:true,
    message:'Biodata berhasil dimuat.',
    biodata:biodata,
    aspel:getAspelSupervision_(auth.book, auth.memberId, [biodata.name, auth.username]),
    ukt:getStudentUktHistory_(auth.book, auth.memberId),
    account:{
      username:auth.username,
      memberId:auth.memberId,
      email:auth.email
    }
  };
}

function updateStudentBiodata_(data) {
  const auth = authorizePortalStudent_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const found = findBiodataRow_(auth.book, auth.memberId);
    const oldRaw = found.values.slice();
    const oldDisplay = displayBiodataRow_(oldRaw);
    const next = oldRaw.slice();
    const cleaned = validateBiodataEditable_(data);

    Object.keys(PN_BIODATA_EDITABLE).forEach(key => {
      const col = PN_BIODATA_EDITABLE[key];
      if (key === 'birthDate') {
        next[col] = cleaned[key] ? parseIsoDate_(cleaned[key]) : '';
      } else {
        next[col] = sanitize_(cleaned[key]);
      }
    });

    const nextDisplay = displayBiodataRow_(next);
    const changes = [];

    Object.keys(PN_BIODATA_EDITABLE).forEach(key => {
      const col = PN_BIODATA_EDITABLE[key];
      const before = String(oldDisplay[col] == null ? '' : oldDisplay[col]);
      const after = String(nextDisplay[col] == null ? '' : nextDisplay[col]);
      if (before !== after) {
        changes.push({column:PN_BIODATA_HEADERS[col], before:before, after:after});
      }
    });

    if (!changes.length) {
      const oldBio = biodataObject_(oldRaw);
      return {
        ok:true,
        unchanged:true,
        message:'Tidak ada perubahan biodata.',
        biodata:oldBio,
        aspel:getAspelSupervision_(auth.book, auth.memberId, [oldBio.name, auth.username]),
        ukt:getStudentUktHistory_(auth.book, auth.memberId)
      };
    }

    found.sheet.getRange(found.row,1,1,PN_BIODATA_HEADERS.length).setValues([next]);

    const logSheet = auth.book.getSheetByName(PN_BIODATA_LOG_SHEET_NAME);
    if (!logSheet) throw new Error('Sheet Log Perubahan Biodata tidak ditemukan.');

    const now = new Date();
    const logRows = changes.map(ch => [
      now,
      auth.memberId,
      auth.username,
      auth.email,
      auth.uid,
      ch.column,
      sanitize_(ch.before),
      sanitize_(ch.after)
    ]);

    logSheet.getRange(logSheet.getLastRow()+1,1,logRows.length,8).setValues(logRows);

    const nextBio = biodataObject_(next);
    return {
      ok:true,
      message:'Perubahan biodata berhasil disimpan.',
      changed:changes.length,
      biodata:nextBio,
      aspel:getAspelSupervision_(auth.book, auth.memberId, [nextBio.name, auth.username]),
      ukt:getStudentUktHistory_(auth.book, auth.memberId)
    };
  } finally {
    lock.releaseLock();
  }
}

function authorizePortalStudent_(data) {
  const username = String(data.username || '').trim();
  const requestedMemberId = String(data.memberId || '').trim().toLowerCase();
  const idToken = String(data.idToken || '').trim();

  if (!username || !idToken) {
    throw new Error('Username dan sesi login wajib tersedia.');
  }

  const firebaseUser = verifyFirebaseToken_(idToken);
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  const uid = String(firebaseUser.localId || '').trim();
  if (!email || !uid) throw new Error('Akun Firebase tidak valid.');

  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const accountSheet = book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!accountSheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');

  const last = accountSheet.getLastRow();
  if (last < 2) throw new Error('Akun Portal Siswa belum dihubungkan oleh admin.');

  const rows = accountSheet.getRange(2,1,last-1,5).getDisplayValues();
  const targetUsername = username.toLowerCase();
  let rowIndex = -1;
  let memberId = '';

  for (let i=0; i<rows.length; i++) {
    const rowUsername = String(rows[i][0] || '').trim().toLowerCase();
    const rowIdRaw = String(rows[i][1] || '').trim();
    const rowId = rowIdRaw.toLowerCase();
    const rowEmail = String(rows[i][2] || '').trim().toLowerCase();
    const rowUid = String(rows[i][3] || '').trim();
    const status = String(rows[i][4] || 'AKTIF').trim().toUpperCase();

    if (rowUsername === targetUsername && rowEmail === email && (!requestedMemberId || rowId === requestedMemberId)) {
      if (status && status !== 'AKTIF') throw new Error('Akun portal ini sedang nonaktif.');
      if (rowUid && rowUid !== uid) throw new Error('Akun ini sudah terhubung dengan pengguna lain.');
      if (!rowIdRaw) throw new Error('ID Anggota akun ini belum dihubungkan oleh admin.');
      rowIndex = i + 2;
      memberId = rowIdRaw;
      break;
    }
  }

  if (rowIndex < 0) {
    throw new Error('Username atau email tidak cocok dengan akun yang terdaftar. Hubungi admin.');
  }

  const savedUid = String(accountSheet.getRange(rowIndex,4).getDisplayValue() || '').trim();
  if (!savedUid) accountSheet.getRange(rowIndex,4).setValue(uid);

  return {book, accountSheet, accountRow:rowIndex, username, memberId, email, uid};
}

function verifyFirebaseToken_(idToken) {
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(PN_FIREBASE_API_KEY);
  const response = UrlFetchApp.fetch(url, {
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify({idToken:idToken}),
    muteHttpExceptions:true
  });

  const code = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (_) {}

  if (code < 200 || code >= 300 || !body.users || !body.users.length) {
    throw new Error('Sesi login tidak valid atau sudah berakhir. Silakan login ulang.');
  }

  return body.users[0];
}

function findBiodataRow_(book, memberId) {
  const sheet = book.getSheetByName(PN_BIODATA_SHEET_NAME);
  if (!sheet) throw new Error('Sheet Data Biodata Siswa Anggota tidak ditemukan.');

  const last = sheet.getLastRow();
  if (last < 2) throw new Error('Biodata anggota belum tersedia.');

  const ids = sheet.getRange(2,1,last-1,1).getDisplayValues();
  const target = String(memberId || '').trim().toLowerCase();

  for (let i=0; i<ids.length; i++) {
    if (String(ids[i][0] || '').trim().toLowerCase() === target) {
      const row = i + 2;
      return {
        sheet,
        row,
        values:sheet.getRange(row,1,1,PN_BIODATA_HEADERS.length).getValues()[0]
      };
    }
  }

  throw new Error('Biodata untuk ID Anggota tersebut belum ditemukan.');
}

function normalizeAspelName_(value) {
  let s = String(value == null ? '' : value).trim().toUpperCase();
  if (!s) return '';
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch (_) {}
  return s.replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

function getAspelSupervision_(book, memberId, possibleNames) {
  const sheet = book.getSheetByName(PN_BIODATA_SHEET_NAME);
  if (!sheet) return {isAspel:false,total:0,coordinatorCount:0,memberCount:0,roles:[],members:[]};

  const aliases = new Set((possibleNames || []).map(normalizeAspelName_).filter(Boolean));
  if (!aliases.size) return {isAspel:false,total:0,coordinatorCount:0,memberCount:0,roles:[],members:[]};

  const last = sheet.getLastRow();
  if (last < 2) return {isAspel:false,total:0,coordinatorCount:0,memberCount:0,roles:[],members:[]};

  const rows = sheet.getRange(2,1,last-1,PN_BIODATA_HEADERS.length).getDisplayValues();
  const members = [];
  const roleSet = new Set();
  let coordinatorCount = 0;
  let memberCount = 0;

  rows.forEach(r => {
    const roles = [];
    if (aliases.has(normalizeAspelName_(r[19]))) roles.push('Koordinator Aspel');
    if (aliases.has(normalizeAspelName_(r[20]))) roles.push('Anggota Aspel 1');
    if (aliases.has(normalizeAspelName_(r[21]))) roles.push('Anggota Aspel 2');
    if (!roles.length || !String(r[1] || '').trim()) return;

    roles.forEach(role => roleSet.add(role));
    if (roles.includes('Koordinator Aspel')) coordinatorCount += 1;
    if (roles.some(role => role !== 'Koordinator Aspel')) memberCount += 1;

    members.push({
      memberId:String(r[0] || ''),
      name:String(r[1] || ''),
      className:String(r[5] || ''),
      program:String(r[6] || ''),
      entryYear:String(r[12] || ''),
      membershipStatus:String(r[14] || ''),
      studentStatus:String(r[15] || ''),
      role:roles.join(' / '),
      coordinator:String(r[19] || ''),
      member1:String(r[20] || ''),
      member2:String(r[21] || '')
    });
  });

  return {
    isAspel:members.length > 0,
    total:members.length,
    coordinatorCount:coordinatorCount,
    memberCount:memberCount,
    roles:Array.from(roleSet),
    members:members
  };
}

function emptyUktSlot_(number) {
  const label = PN_UKT_STAGES[number - 1] || ('UKT ' + number);
  return {
    number:number,
    ukt:label,
    label:label,
    taken:false,
    date:'',
    before:'',
    result:'',
    after:'',
    score:'',
    notes:'',
    examiner:''
  };
}

function getStudentUktHistory_(book, memberId) {
  const slots = Array.from({length:PN_UKT_MAX}, (_,i) => emptyUktSlot_(i+1));
  const sheet = book.getSheetByName(PN_UKT_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      max:PN_UKT_MAX,
      stages:PN_UKT_STAGES.slice(),
      completed:0,
      passed:0,
      latestPassed:0,
      slots:slots
    };
  }

  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues();
  const target = String(memberId || '').trim().toLowerCase();

  rows.forEach(r => {
    if (String(r[0] || '').trim().toLowerCase() !== target) return;

    const stageText = String(r[2] == null ? '' : r[2]).trim().toUpperCase();
    let number = 0;

    // Tahap keenam sekarang ASPEL. Format lama UKT-6 tetap dibaca sebagai
    // ASPEL agar data lama tidak hilang saat masa migrasi database.
    if (
      stageText === 'ASPEL' ||
      stageText === 'ASISTEN PELATIH' ||
      /^UKT[\s-]*6$/.test(stageText)
    ) {
      number = 6;
    } else {
      const match = stageText.match(/^(?:UKT[\s-]*)?([1-5])$/);
      number = match ? Number(match[1]) : 0;
    }

    if (!number || number < 1 || number > PN_UKT_MAX) return;

    const slot = slots[number - 1];
    slot.ukt = PN_UKT_STAGES[number - 1];
    slot.label = slot.ukt;
    slot.taken = true;
    slot.date = formatUktDate_(r[3]);
    slot.before = String(r[4] == null ? '' : r[4]);
    slot.result = String(r[5] == null ? '' : r[5]).trim().toUpperCase();
    slot.after = String(r[6] == null ? '' : r[6]);
    slot.score = String(r[7] == null ? '' : r[7]);
    slot.notes = String(r[8] == null ? '' : r[8]);
    slot.examiner = String(r[9] == null ? '' : r[9]);
  });

  const completed = slots.filter(s => s.taken).length;
  const passed = slots.filter(s => s.result === 'LULUS').length;
  let latestPassed = 0;
  slots.forEach(s => {
    if (s.result === 'LULUS') latestPassed = Math.max(latestPassed, s.number);
  });

  return {
    max:PN_UKT_MAX,
    stages:PN_UKT_STAGES.slice(),
    completed:completed,
    passed:passed,
    latestPassed:latestPassed,
    slots:slots
  };
}

function formatUktDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd');
  const s = String(value == null ? '' : value).trim();
  if (!s) return '';
  let m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);
  if (m) return m[3] + '-' + String(m[2]).padStart(2,'0') + '-' + String(m[1]).padStart(2,'0');
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return m[1] + '-' + String(m[2]).padStart(2,'0') + '-' + String(m[3]).padStart(2,'0');
  return s;
}

function biodataObject_(values) {
  const d = displayBiodataRow_(values);
  return {
    memberId:d[0],
    name:d[1],
    gender:d[2],
    birthPlace:d[3],
    birthDate:d[4],
    className:d[5],
    program:d[6],
    address:d[7],
    studentPhone:d[8],
    parentName:d[9],
    parentPhone:d[10],
    approvalYear:d[11],
    entryYear:d[12],
    belt:d[13],
    membershipStatus:d[14],
    studentStatus:d[15],
    certificateNumber:d[16],
    notes:d[17],
    approvalDate:d[18],
    aspelCoordinator:d[19],
    aspelMember1:d[20],
    aspelMember2:d[21]
  };
}

function displayBiodataRow_(values) {
  const tz = 'Asia/Jakarta';
  return values.map((v,i) => {
    if (v instanceof Date && !isNaN(v.getTime())) {
      if (i === 4 || i === 18) return Utilities.formatDate(v,tz,'yyyy-MM-dd');
      return Utilities.formatDate(v,tz,'yyyy-MM-dd HH:mm:ss');
    }
    return String(v == null ? '' : v);
  });
}

function validateBiodataEditable_(data) {
  const clean = key => String(data[key] == null ? '' : data[key]).trim();
  const out = {
    name:clean('name'),
    gender:clean('gender').toUpperCase(),
    birthPlace:clean('birthPlace'),
    birthDate:clean('birthDate'),
    className:clean('className').toUpperCase(),
    program:clean('program').toUpperCase(),
    address:clean('address'),
    studentPhone:clean('studentPhone'),
    parentName:clean('parentName'),
    parentPhone:clean('parentPhone'),
    notes:clean('notes')
  };

  if (!out.name) throw new Error('Nama Lengkap wajib diisi.');
  if (out.gender && !['L','P'].includes(out.gender)) throw new Error('Pilihan L/P tidak valid.');
  if (out.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(out.birthDate)) throw new Error('Tanggal lahir tidak valid.');
  if (out.className && !['X','XI','XII'].includes(out.className)) throw new Error('Kelas tidak valid.');
  if (out.program && !PN_PROGRAMS.includes(out.program)) throw new Error('Program Keahlian tidak valid.');
  if (out.studentPhone && !/^[0-9+() .-]{8,20}$/.test(out.studentPhone)) throw new Error('No. HP Siswa tidak valid.');
  if (out.parentPhone && !/^[0-9+() .-]{8,20}$/.test(out.parentPhone)) throw new Error('No. HP Wali tidak valid.');
  return out;
}

function parseIsoDate_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) throw new Error('Format tanggal tidak valid.');
  const d = new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2])-1 || d.getDate() !== Number(m[3])) {
    throw new Error('Tanggal tidak valid.');
  }
  return d;
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = String(e.postData.contents || '');
  try { return JSON.parse(raw); } catch (_) {}

  const out = {};
  raw.split('&').forEach(pair => {
    const p = pair.split('=');
    out[decodeURIComponent(p[0] || '')] = decodeURIComponent((p.slice(1).join('=') || '').replace(/\+/g,' '));
  });
  return out;
}

function sanitize_(s) {
  s = String(s == null ? '' : s);
  if (/^[=+\-@]/.test(s)) return "'" + s;
  return s;
}

function iframeResult_(obj) {
  const payload = JSON.stringify(Object.assign({source:'pn-biodata'},obj))
    .replace(/</g,'\\u003c')
    .replace(/\u2028/g,'\\u2028')
    .replace(/\u2029/g,'\\u2029');

  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>' +
    'try{window.parent.postMessage(' + payload + ',\"*\");}catch(e){}' +
    'try{window.top.postMessage(' + payload + ',\"*\");}catch(e){}' +
    '<\/script>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}