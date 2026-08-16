const PN_REG_SPREADSHEET_ID = '1WBpDiXDeVCKiAKWze7Dh_J-jG8t8_PAApGkAsBEchtc';
const PN_BIODATA_SPREADSHEET_ID = '1t_PLScKuFhFYOSqAAkeVw4rQDzC2mE7iqFyiwYrvV7w';
const PN_SHEET_NAME = 'Data Daftar Siswa Baru';
const PN_REVIEW_SHEET_NAME = 'Ulasan Website';
const PN_CONTENT_SHEET_NAME = 'Konten Website';
const PN_GALLERY_SHEET_NAME = 'Galeri Website';
const PN_CONTENT_FOLDER_ID = '1DaUWvaUAMTIPm1PbVdrQilv83vN6XMKv';
const PN_REVIEW_ADMIN_USER = 'admin';
const PN_ADMIN_PASS_PROPERTY = 'PN_ADMIN_PASS_HASH_V1'; // legacy Script Property; dimigrasikan otomatis lalu dihapus
const PN_ADMIN_CREDENTIAL_PROPERTY = 'PN_ADMIN_CREDENTIAL_V2';
const PN_ADMIN_PEPPER_PROPERTY = 'PN_ADMIN_PEPPER_V2';
const PN_ADMIN_BOOTSTRAP_PROPERTY = 'PN_ADMIN_BOOTSTRAP_PASSWORD';
const PN_ADMIN_AUTH_VERSION_PROPERTY = 'PN_ADMIN_AUTH_VERSION_V2';
const PN_ADMIN_LOGIN_STATE_PROPERTY = 'PN_ADMIN_LOGIN_STATE_V2';
const PN_ADMIN_AUDIT_SHEET_NAME = 'Log Keamanan Admin';
const PN_ADMIN_SESSION_CACHE_SECONDS = 21600;
const PN_ADMIN_SESSION_PROPERTY_PREFIX = 'PN_ADMIN_SESSION_V1_';
const PN_ADMIN_KDF_ROUNDS = 4096;
const PN_BACKUP_FOLDER_PROPERTY = 'PN_BACKUP_FOLDER_ID_V1';
const PN_BACKUP_FOLDER_NAME = 'Pagar Nusa - Backup Otomatis';
const PN_BACKUP_RETENTION_DAYS = 30;
const PN_BACKUP_LOG_SHEET_NAME = 'Log Backup Otomatis';
const PN_BIODATA_SHEET_NAME = 'Data Biodata Siswa Anggota';
const PN_BIODATA_LOG_SHEET_NAME = 'Log Perubahan Biodata';
const PN_PORTAL_ACCOUNT_SHEET_NAME = 'Akun Portal Siswa';
const PN_FIREBASE_API_KEY = 'AIzaSyCMWsvVJPem3_5Y-x8Zrjz90LodbNLkxUs';
const PN_CONSENT = 'Saya bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa. Saya Siap dan bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa Rayon SMK Sore Tulungagung, dan Sudah dapat izin dari kedua orang tua.';
const PN_MAJORS = ['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];
const PN_BIODATA_HEADERS = [
  'ID Anggota','Nama Lengkap','L/P','Tempat Lahir','Tanggal Lahir','Kelas','Program Keahlian','Alamat','No. HP Siswa',
  'Nama Orang Tua/Wali','No. HP Wali','Tahun Pengesahan','Tahun Masuk','Tingkat/Sabuk','Status Keanggotaan','Status Siswa',
  'Nomor Sertifikat','Catatan','Tanggal Pengesahan','Koordinator Aspel','Anggota Aspel 1','Anggota Aspel 2'
];
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
  const data = (e && e.parameter) || {};
  const action = String(data.action || 'health');

  if (action === 'health') {
    return json_({
      ok:true,
      service:'Pagar Nusa Registration & Student Biodata API',
      storage:'Google Sheets',
      biodata:true,
      reviews:true,
      reviewVersion:'7',
      content:true,
      contentVersion:'1',
      aspelMonitor:true,
      aspelMonitorVersion:'1',
      adminPassword:true,
      adminPasswordVersion:'4',
      adminPersistentSession:true,
      adminPersistentSessionVersion:'1',
      backupAutomatic:true,
      backupAutomaticVersion:'1',
      backupRetentionDays:PN_BACKUP_RETENTION_DAYS,
      adminPasswordConfigured:adminPasswordConfigured_(),
      adminPasswordRecoveryAvailable:adminPasswordRecoveryAvailable_()
    });
  }

  if (action === 'reviewPublicList') {
    let result;
    try {
      result = reviewPublicList_();
    } catch (err) {
      result = {ok:false, reviews:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) {
      return jsonp_(result, data.callback);
    }
    return json_(result);
  }

  if (action === 'reviewAdminList') {
    let result;
    try {
      result = reviewAdminList_(data);
    } catch (err) {
      result = {ok:false, reviews:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) {
      return jsonp_(result, data.callback);
    }
    return json_(result);
  }

  if (action === 'contentPublicList') {
    let result;
    try {
      result = contentPublicList_();
    } catch (err) {
      result = {ok:false, content:[], gallery:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'contentAdminList') {
    let result;
    try {
      result = contentAdminList_(data);
    } catch (err) {
      result = {ok:false, content:[], gallery:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'aspelMonitorAdminList') {
    let result;
    try {
      result = aspelMonitorAdminList_(data);
    } catch (err) {
      result = {ok:false, coordinators:[], summary:{coordinatorCount:0,memberCount:0,candidateCount:0,unassignedCount:0,ignoredNonCandidateCount:0}, message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'contentResult') {
    let result;
    try {
      result = contentResult_(data);
    } catch (err) {
      result = {ok:false, message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'register') {
    let result;
    try {
      result = saveRegistration_(data);
    } catch (err) {
      result = {ok:false, message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    return iframeResult_(result, 'pn-registration');
  }

  return json_({ok:false, message:'Action tidak dikenal.'});
}

function doPost(e) {
  const data = parseBody_(e);
  const action = String(data.action || '');
  let result;

  try {
    if (action === 'register') {
      return json_(saveRegistration_(data));
    }

    if (action === 'biodataGet') {
      result = getStudentBiodata_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-biodata');
    }

    if (action === 'biodataUpdate') {
      result = updateStudentBiodata_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-biodata');
    }


    if (action === 'reviewSubmit') {
      result = reviewSubmit_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-reviews');
    }

    if (action === 'reviewPublicList') {
      result = reviewPublicList_();
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-reviews');
    }

    if (action === 'reviewAdminLogin') {
      result = reviewAdminLogin_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-reviews');
    }

    if (action === 'reviewAdminList') {
      result = reviewAdminList_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-reviews');
    }

    if (action === 'reviewModerate') {
      result = reviewModerate_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-reviews');
    }


    if (action === 'adminSessionLogout') {
      result = adminSessionLogout_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-reviews');
    }

    if (action === 'adminPasswordRecover') {
      result = adminPasswordRecover_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'adminChangePassword') {
      result = adminChangePassword_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentAdminLogin') {
      result = reviewAdminLogin_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentAdminSave') {
      result = contentAdminSave_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentAdminDelete') {
      result = contentAdminDelete_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentAdminSeed') {
      result = contentAdminSeed_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentUploadImage') {
      result = contentUploadImage_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    return json_({ok:false, message:'Action tidak dikenal.'});
  } catch (err) {
    result = {
      ok:false,
      rid:String(data.rid || ''),
      message:String(err && err.message || err)
    };
    if (action === 'biodataGet' || action === 'biodataUpdate') {
      return iframeResult_(result, 'pn-biodata');
    }
    if (['reviewSubmit','reviewPublicList','reviewAdminLogin','reviewAdminList','reviewModerate'].includes(action)) {
      return iframeResult_(result, 'pn-reviews');
    }
    if (['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword','adminPasswordRecover'].includes(action)) {
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }
    return json_(result);
  }
}

function saveRegistration_(data) {
  const row = validateRegistration_(data);
  registrationThrottle_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID).getSheetByName(PN_SHEET_NAME);
    if (!sheet) throw new Error('Sheet database pendaftaran tidak ditemukan.');
    if (isDuplicate_(sheet, row[0], row[7])) {
      return {ok:false, code:'DUPLICATE', message:'Nama dan nomor WA tersebut sudah terdaftar.'};
    }
    sheet.appendRow(row);
    registrationMarkSubmitted_(data);
  } finally {
    lock.releaseLock();
  }
  return {ok:true, message:'Pendaftaran tersimpan permanen.'};
}

function registrationThrottleKey_(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const wa = String(data.wa || '').replace(/\D/g,'');
  return 'pn-registration:' + sha256Hex_(email + '|' + wa).slice(0,40);
}

function registrationThrottle_(data) {
  const key = registrationThrottleKey_(data);
  if (CacheService.getScriptCache().get(key)) {
    throw new Error('Pendaftaran baru saja dikirim. Tunggu sekitar 90 detik sebelum mencoba lagi.');
  }
}

function registrationMarkSubmitted_(data) {
  CacheService.getScriptCache().put(registrationThrottleKey_(data), '1', 90);
}

function getStudentBiodata_(data) {
  const auth = authorizePortalStudent_(data);
  const found = findBiodataRow_(auth.book, auth.memberId);
  return {
    ok:true,
    message:'Biodata berhasil dimuat.',
    biodata:biodataObject_(found.values),
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
    const sheet = found.sheet;
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
      return {
        ok:true,
        unchanged:true,
        message:'Tidak ada perubahan biodata.',
        biodata:biodataObject_(oldRaw)
      };
    }

    sheet.getRange(found.row, 1, 1, PN_BIODATA_HEADERS.length).setValues([next]);

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
    logSheet.getRange(logSheet.getLastRow() + 1, 1, logRows.length, 8).setValues(logRows);

    return {
      ok:true,
      message:'Perubahan biodata berhasil disimpan.',
      changed:changes.length,
      biodata:biodataObject_(next)
    };
  } finally {
    lock.releaseLock();
  }
}

function authorizePortalStudent_(data) {
  const username = String(data.username || '').trim();
  const memberId = String(data.memberId || '').trim();
  const idToken = String(data.idToken || '').trim();
  if (!username || !memberId || !idToken) {
    throw new Error('Username, ID Anggota, dan sesi login wajib tersedia.');
  }

  const firebaseUser = verifyFirebaseToken_(idToken);
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  const uid = String(firebaseUser.localId || '').trim();
  if (!email || !uid) throw new Error('Akun Firebase tidak valid.');

  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const accountSheet = book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!accountSheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');

  const last = accountSheet.getLastRow();
  if (last < 2) {
    throw new Error('Akun Portal Siswa belum dihubungkan oleh admin.');
  }

  const rows = accountSheet.getRange(2,1,last-1,5).getDisplayValues();
  const u = username.toLowerCase();
  const id = memberId.toLowerCase();
  let rowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const rowUsername = String(rows[i][0] || '').trim().toLowerCase();
    const rowId = String(rows[i][1] || '').trim().toLowerCase();
    const rowEmail = String(rows[i][2] || '').trim().toLowerCase();
    const rowUid = String(rows[i][3] || '').trim();
    const status = String(rows[i][4] || 'AKTIF').trim().toUpperCase();

    if (rowUsername === u && rowId === id && rowEmail === email) {
      if (status && status !== 'AKTIF') throw new Error('Akun portal ini sedang nonaktif.');
      if (rowUid && rowUid !== uid) throw new Error('ID Anggota sudah terhubung dengan akun lain.');
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex < 0) {
    throw new Error('Username / ID Anggota tidak cocok dengan akun yang terdaftar. Hubungi admin.');
  }

  const currentUid = String(accountSheet.getRange(rowIndex,4).getDisplayValue() || '').trim();
  if (!currentUid) accountSheet.getRange(rowIndex,4).setValue(uid);

  return {
    book:book,
    accountSheet:accountSheet,
    accountRow:rowIndex,
    username:username,
    memberId:memberId,
    email:email,
    uid:uid
  };
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
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim().toLowerCase() === target) {
      const row = i + 2;
      return {
        sheet:sheet,
        row:row,
        values:sheet.getRange(row,1,1,PN_BIODATA_HEADERS.length).getValues()[0]
      };
    }
  }
  throw new Error('Biodata untuk ID Anggota tersebut belum ditemukan.');
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
  return values.map((v, i) => {
    if (v instanceof Date && !isNaN(v.getTime())) {
      if (i === 4 || i === 18) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      return Utilities.formatDate(v, tz, 'yyyy-MM-dd HH:mm:ss');
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
  if (out.studentPhone && !/^[0-9+() .-]{8,20}$/.test(out.studentPhone)) throw new Error('No. HP Siswa tidak valid.');
  if (out.parentPhone && !/^[0-9+() .-]{8,20}$/.test(out.parentPhone)) throw new Error('No. HP Wali tidak valid.');
  return out;
}

function parseIsoDate_(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) throw new Error('Format tanggal tidak valid.');
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) {
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

function validateRegistration_(d) {
  const clean = v => sanitize_(String(v == null ? '' : v).trim());
  const name = clean(d.name);
  const place = clean(d.place);
  const date = clean(d.date);
  const kelas = clean(d.kelas);
  const major = clean(d.major);
  const address = clean(d.address);
  const parent = clean(d.parent);
  const wa = clean(d.wa);
  const email = clean(d.email);
  const willing = d.willing === true || String(d.willing).toLowerCase() === 'true' || String(d.willing) === '1';

  if (!name || !place || !date || !kelas || !major || !address || !parent || !wa || !email || !willing) {
    throw new Error('Data pendaftaran belum lengkap.');
  }
  if (!['X','XI','XII'].includes(kelas)) throw new Error('Kelas tidak valid.');
  if (!PN_MAJORS.includes(major)) throw new Error('Jurusan tidak valid.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Alamat email tidak valid.');
  if (!/^[0-9+() .-]{8,20}$/.test(wa)) throw new Error('Nomor WA tidak valid.');

  return [
    name, place, date, kelas, major, address, parent, wa, email,
    'Bersedia dan sudah mendapat izin orang tua',
    PN_CONSENT,
    new Date()
  ];
}

function sanitize_(s) {
  s = String(s == null ? '' : s);
  if (/^[=+\-@]/.test(s)) return "'" + s;
  return s;
}

function isDuplicate_(sheet, name, wa) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const values = sheet.getRange(2,1,last-1,8).getDisplayValues();
  const n = String(name).trim().toLowerCase();
  const w = String(wa).replace(/\D/g,'');
  return values.some(r => String(r[0]).trim().toLowerCase() === n && String(r[7]).replace(/\D/g,'') === w);
}


function reviewSheet_() {
  const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
  let sheet = book.getSheetByName(PN_REVIEW_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(PN_REVIEW_SHEET_NAME);
    sheet.getRange(1,1,1,10).setValues([[
      'ID','Tanggal','Nama','Status Pengirim','Rating','Ulasan','Status Moderasi','Diverifikasi Oleh','Waktu Verifikasi','Catatan Admin'
    ]]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reviewSubmit_(data) {
  const rawName = String(data.name || '').trim().replace(/\s+/g,' ');
  const rawRole = String(data.role || '').trim();
  const rawMessage = String(data.message || '').trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
  const name = sanitize_(rawName);
  const role = sanitize_(rawRole);
  const rating = Number(data.rating || 0);
  const message = sanitize_(rawMessage);
  const allowedRoles = ['Anggota','Alumni','Siswa','Orang Tua/Wali'];
  if (!name || name.length < 2 || name.length > 60) throw new Error('Nama wajib diisi 2-60 karakter.');
  if (!allowedRoles.includes(role)) throw new Error('Status pengirim tidak valid.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating harus 1 sampai 5.');
  if (!message || message.length < 5 || message.length > 500) throw new Error('Ulasan wajib diisi 5-500 karakter.');

  const throttleKey = 'pn-review-submit:' + sha256Hex_((rawName + '|' + rawRole).toLowerCase()).slice(0,32);
  const cache = CacheService.getScriptCache();
  if (cache.get(throttleKey)) throw new Error('Ulasan baru saja dikirim. Tunggu sekitar 1 menit sebelum mengirim lagi.');

  const id = 'RVW-' + new Date().getTime() + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = reviewSheet_();
    const last = sheet.getLastRow();
    if (last >= 2) {
      const start = Math.max(2,last-49);
      const rows = sheet.getRange(start,3,last-start+1,5).getDisplayValues();
      const duplicate = rows.some(r =>
        String(r[0] || '').trim().toLowerCase() === rawName.toLowerCase() &&
        String(r[1] || '').trim() === rawRole &&
        Number(r[2] || 0) === rating &&
        String(r[3] || '').trim().toLowerCase() === rawMessage.toLowerCase() &&
        String(r[4] || '').trim().toUpperCase() !== 'DIHAPUS'
      );
      if (duplicate) throw new Error('Ulasan yang sama sudah pernah dikirim.');
    }
    sheet.appendRow([id,new Date(),name,role,rating,message,'PENDING','','','']);
    cache.put(throttleKey,'1',60);
  } finally {
    lock.releaseLock();
  }
  return {ok:true,id:id,status:'PENDING',message:'Ulasan tersimpan dan menunggu verifikasi admin.'};
}

function reviewPublicList_() {
  const sheet = reviewSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return {ok:true,reviews:[],version:'6'};
  const start = Math.max(2,last-499);
  const rows = sheet.getRange(start,1,last-start+1,10).getValues();
  const reviews = rows
    .filter(r => String(r[6] || '').toUpperCase() === 'DITERBITKAN')
    .map(reviewObject_)
    .reverse()
    .slice(0,100);
  return {ok:true,reviews:reviews,version:'6'};
}

function adminGenerateSecret_() {
  return Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
}

function secureEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function adminPasswordStrong_(password) {
  password = String(password || '');
  if (password.length < 12) throw new Error('Password admin baru minimal 12 karakter.');
  if (password.length > 128) throw new Error('Password admin baru terlalu panjang.');
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Password admin harus mengandung huruf dan angka.');
  }
  return password;
}

function adminCredentialHash_(password, salt, pepper) {
  let digest = String(salt || '') + '|' + String(pepper || '') + '|' + String(password || '');
  for (let i = 0; i < PN_ADMIN_KDF_ROUNDS; i++) {
    digest = sha256Hex_(digest + '|' + i + '|' + salt);
  }
  return digest;
}

function adminStoreCredential_(password) {
  password = adminPasswordStrong_(password);
  const props = PropertiesService.getScriptProperties();
  let pepper = props.getProperty(PN_ADMIN_PEPPER_PROPERTY);
  if (!pepper) {
    pepper = adminGenerateSecret_();
    props.setProperty(PN_ADMIN_PEPPER_PROPERTY, pepper);
  }
  const salt = adminGenerateSecret_();
  const credential = {
    version:2,
    salt:salt,
    rounds:PN_ADMIN_KDF_ROUNDS,
    hash:adminCredentialHash_(password, salt, pepper)
  };
  props.setProperty(PN_ADMIN_CREDENTIAL_PROPERTY, JSON.stringify(credential));
  props.deleteProperty(PN_ADMIN_PASS_PROPERTY);
  return true;
}

function adminVerifyPassword_(password) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(PN_ADMIN_CREDENTIAL_PROPERTY);
  const pepper = props.getProperty(PN_ADMIN_PEPPER_PROPERTY) || '';
  if (raw && pepper) {
    let credential = null;
    try { credential = JSON.parse(raw); } catch (_) {}
    if (!credential || !credential.salt || !credential.hash) return false;
    const actual = adminCredentialHash_(password, credential.salt, pepper);
    return secureEqual_(actual, credential.hash);
  }

  // Migrasi aman dari hash lama HANYA jika hash lama sudah berada di Script Properties.
  // Tidak ada lagi hash/password fallback di source GitHub publik.
  const legacy = props.getProperty(PN_ADMIN_PASS_PROPERTY) || '';
  if (legacy && secureEqual_(sha256Hex_(password), legacy)) {
    adminStoreCredential_(password);
    return true;
  }
  if (!raw && !legacy) {
    throw new Error('Password admin server belum dikonfigurasi. Jalankan initializeAdminSecurity_() dari Apps Script terlebih dahulu.');
  }
  return false;
}

function initializeAdminSecurity_() {
  const props = PropertiesService.getScriptProperties();
  const bootstrap = String(props.getProperty(PN_ADMIN_BOOTSTRAP_PROPERTY) || '');
  if (!bootstrap) {
    throw new Error('Tambahkan Script Property PN_ADMIN_BOOTSTRAP_PASSWORD dengan password baru, lalu jalankan fungsi ini sekali.');
  }
  adminStoreCredential_(bootstrap);
  props.deleteProperty(PN_ADMIN_BOOTSTRAP_PROPERTY);
  props.setProperty(PN_ADMIN_AUTH_VERSION_PROPERTY, adminGenerateSecret_());
  adminClearAllSessions_();
  props.deleteProperty(PN_ADMIN_LOGIN_STATE_PROPERTY);
  adminAudit_('SECURITY_INIT','OK','Credential V2 diaktifkan; bootstrap password sudah dihapus.');
  return 'Keamanan admin V2 aktif. Bootstrap password telah dihapus dari Script Properties.';
}

function adminPasswordConfigured_() {
  const props = PropertiesService.getScriptProperties();
  return !!(props.getProperty(PN_ADMIN_CREDENTIAL_PROPERTY) || props.getProperty(PN_ADMIN_PASS_PROPERTY));
}

function adminPasswordRecoveryAvailable_() {
  return false;
}

function adminAuthVersion_() {
  const props = PropertiesService.getScriptProperties();
  let version = props.getProperty(PN_ADMIN_AUTH_VERSION_PROPERTY);
  if (!version) {
    version = adminGenerateSecret_();
    props.setProperty(PN_ADMIN_AUTH_VERSION_PROPERTY, version);
  }
  return version;
}

function adminLoginState_() {
  const props = PropertiesService.getScriptProperties();
  let state = {count:0, firstAt:0, lockedUntil:0};
  try { state = Object.assign(state, JSON.parse(props.getProperty(PN_ADMIN_LOGIN_STATE_PROPERTY) || '{}')); } catch (_) {}
  const now = Date.now();
  if (state.firstAt && now - Number(state.firstAt || 0) > 1800000) {
    return {count:0, firstAt:0, lockedUntil:0};
  }
  return state;
}

function adminRecordLoginFailure_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const props = PropertiesService.getScriptProperties();
    let state = adminLoginState_();
    const now = Date.now();
    if (!state.firstAt) state.firstAt = now;
    state.count = Number(state.count || 0) + 1;
    let delay = 0;
    if (state.count >= 12) delay = 30 * 60 * 1000;
    else if (state.count >= 8) delay = 15 * 60 * 1000;
    else if (state.count >= 5) delay = 5 * 60 * 1000;
    if (delay) state.lockedUntil = Math.max(Number(state.lockedUntil || 0), now + delay);
    props.setProperty(PN_ADMIN_LOGIN_STATE_PROPERTY, JSON.stringify(state));
    return state;
  } finally {
    lock.releaseLock();
  }
}

function adminClearLoginFailures_() {
  PropertiesService.getScriptProperties().deleteProperty(PN_ADMIN_LOGIN_STATE_PROPERTY);
}

function adminAudit_(eventName, status, detail) {
  try {
    const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
    let sheet = book.getSheetByName(PN_ADMIN_AUDIT_SHEET_NAME);
    if (!sheet) {
      sheet = book.insertSheet(PN_ADMIN_AUDIT_SHEET_NAME);
      sheet.appendRow(['Waktu','Event','Status','Akun','Detail']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(),
      sanitize_(String(eventName || '').slice(0,80)),
      sanitize_(String(status || '').slice(0,30)),
      PN_REVIEW_ADMIN_USER,
      sanitize_(String(detail || '').slice(0,300))
    ]);
  } catch (_) {}
}

function adminSessionPropertyKey_(token) {
  return PN_ADMIN_SESSION_PROPERTY_PREFIX + sha256Hex_('pn-admin-session|' + String(token || ''));
}

function adminSessionCacheKey_(token) {
  return 'pn-review-admin:' + String(token || '');
}

function adminStoreSession_(token, username) {
  const authValue = JSON.stringify({
    username:String(username || ''),
    version:adminAuthVersion_(),
    issuedAt:Date.now()
  });
  PropertiesService.getScriptProperties().setProperty(adminSessionPropertyKey_(token), authValue);
  try {
    CacheService.getScriptCache().put(adminSessionCacheKey_(token), authValue, PN_ADMIN_SESSION_CACHE_SECONDS);
  } catch (_) {}
  return authValue;
}

function adminDeleteSession_(token) {
  token = String(token || '').trim();
  if (!token) return;
  try { CacheService.getScriptCache().remove(adminSessionCacheKey_(token)); } catch (_) {}
  try { PropertiesService.getScriptProperties().deleteProperty(adminSessionPropertyKey_(token)); } catch (_) {}
}

function adminClearAllSessions_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach(function(key){
    if (key.indexOf(PN_ADMIN_SESSION_PROPERTY_PREFIX) === 0) props.deleteProperty(key);
  });
}

function reviewAdminLogin_(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');
  const before = adminLoginState_();
  let valid = false;

  if (username === PN_REVIEW_ADMIN_USER) {
    valid = adminVerifyPassword_(password);
  }

  if (!valid) {
    if (Number(before.lockedUntil || 0) > Date.now()) {
      throw new Error('Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi.');
    }
    const state = adminRecordLoginFailure_();
    if ([1,5,8,12].includes(Number(state.count || 0))) {
      adminAudit_('ADMIN_LOGIN','GAGAL','Percobaan gagal: ' + state.count);
    }
    if (Number(state.lockedUntil || 0) > Date.now()) {
      throw new Error('Terlalu banyak percobaan login. Akses admin dikunci sementara.');
    }
    throw new Error('Login admin verifikasi tidak valid.');
  }

  adminClearLoginFailures_();
  const requestedToken = String(data.token || '').trim();
  const token = /^[A-Fa-f0-9]{64}$/.test(requestedToken) ? requestedToken : adminGenerateSecret_();
  adminStoreSession_(token, username);
  adminAudit_('ADMIN_LOGIN','OK','Akses admin perangkat diaktifkan sampai logout atau password diubah.');
  return {ok:true,token:token,persistent:true,expiresIn:0,version:'9'};
}

function requireReviewAdmin_(token) {
  token = String(token || '').trim();
  if (!/^[A-Fa-f0-9]{64}$/.test(token)) {
    throw new Error('Sesi verifikasi admin tidak valid. Silakan login ulang.');
  }

  const cacheKey = adminSessionCacheKey_(token);
  const propertyKey = adminSessionPropertyKey_(token);
  let raw = '';
  try { raw = CacheService.getScriptCache().get(cacheKey) || ''; } catch (_) {}
  if (!raw) raw = PropertiesService.getScriptProperties().getProperty(propertyKey) || '';
  if (!raw) throw new Error('Sesi admin perangkat tidak ditemukan. Hubungkan akses sekali lagi.');

  const currentVersion = adminAuthVersion_();
  let obj = null;
  try { obj = JSON.parse(raw); } catch (_) {}
  const username = String(obj && obj.username || '');
  const tokenVersion = String(obj && obj.version || '');
  const issuedAt = Number(obj && obj.issuedAt || 0);

  if (username !== PN_REVIEW_ADMIN_USER || !issuedAt) {
    adminDeleteSession_(token);
    throw new Error('Sesi verifikasi admin tidak valid. Silakan login ulang.');
  }
  if (tokenVersion !== currentVersion) {
    adminDeleteSession_(token);
    throw new Error('Sesi admin sudah dinonaktifkan karena keamanan/password berubah. Silakan login ulang.');
  }

  try { CacheService.getScriptCache().put(cacheKey, raw, PN_ADMIN_SESSION_CACHE_SECONDS); } catch (_) {}
  return username;
}

function adminSessionLogout_(data) {
  const token = String(data && data.token || '').trim();
  if (token) adminDeleteSession_(token);
  adminAudit_('ADMIN_LOGOUT','OK','Akses admin perangkat dicabut oleh pengguna.');
  return {ok:true,loggedOut:true,message:'Akses admin perangkat sudah diputus.'};
}

function adminPasswordRecover_(data) {
  throw new Error('Pemulihan password lama dinonaktifkan demi keamanan. Gunakan password server aktif atau bootstrap melalui Apps Script.');
}

function adminChangePassword_(data) {
  const token = String(data.token || '').trim();
  const username = requireReviewAdmin_(token);
  if (username !== PN_REVIEW_ADMIN_USER) throw new Error('Akun admin tidak valid.');

  const currentPassword = String(data.currentPassword || '');
  const newPassword = String(data.newPassword || '');
  if (!adminVerifyPassword_(currentPassword)) {
    adminAudit_('ADMIN_PASSWORD_CHANGE','GAGAL','Password saat ini tidak benar.');
    throw new Error('Password saat ini tidak benar.');
  }
  if (newPassword === currentPassword) throw new Error('Password baru harus berbeda dari password saat ini.');
  adminPasswordStrong_(newPassword);

  const props = PropertiesService.getScriptProperties();
  adminStoreCredential_(newPassword);
  props.setProperty(PN_ADMIN_AUTH_VERSION_PROPERTY, adminGenerateSecret_());
  adminClearAllSessions_();
  adminClearLoginFailures_();
  adminAudit_('ADMIN_PASSWORD_CHANGE','OK','Password dirotasi; seluruh sesi lama dinonaktifkan.');
  return {ok:true,configured:true,message:'Password admin berhasil diubah. Semua sesi lama dinonaktifkan.'};
}

function reviewAdminList_(data) {
  requireReviewAdmin_(data.token);
  const sheet = reviewSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return {ok:true,reviews:[]};
  const start = Math.max(2,last-199);
  const rows = sheet.getRange(start,1,last-start+1,10).getValues();
  return {ok:true,reviews:rows.map(reviewObject_).reverse()};
}

function reviewModerate_(data) {
  const admin = requireReviewAdmin_(data.token);
  const id = String(data.id || '').trim();
  const status = String(data.status || '').trim().toUpperCase();
  const note = sanitize_(String(data.note || '').trim()).slice(0,300);
  if (!id) throw new Error('ID ulasan tidak tersedia.');
  if (!['DITERBITKAN','DITOLAK','DIHAPUS'].includes(status)) throw new Error('Status moderasi tidak valid.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = reviewSheet_();
    const last = sheet.getLastRow();
    if (last < 2) throw new Error('Ulasan tidak ditemukan.');
    const ids = sheet.getRange(2,1,last-1,1).getDisplayValues();
    let row = -1;
    for (let i=0;i<ids.length;i++) {
      if (String(ids[i][0] || '').trim() === id) { row = i + 2; break; }
    }
    if (row < 0) throw new Error('Ulasan tidak ditemukan.');
    sheet.getRange(row,7,1,4).setValues([[status,admin,new Date(),note]]);
  } finally {
    lock.releaseLock();
  }
  return {ok:true,id:id,status:status,message:'Status ulasan berhasil diperbarui.'};
}

function reviewObject_(r) {
  const d = r[1] instanceof Date && !isNaN(r[1].getTime())
    ? Utilities.formatDate(r[1], 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss")
    : String(r[1] || '');
  const verifiedAt = r[8] instanceof Date && !isNaN(r[8].getTime())
    ? Utilities.formatDate(r[8], 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss")
    : String(r[8] || '');
  return {
    id:String(r[0] || ''),date:d,name:String(r[2] || ''),role:String(r[3] || ''),rating:Number(r[4] || 0),
    message:String(r[5] || ''),status:String(r[6] || 'PENDING'),verifiedBy:String(r[7] || ''),verifiedAt:verifiedAt,note:String(r[9] || '')
  };
}


/* =========================================================
   CONTENT MANAGER / CMS V1
========================================================= */
function contentSheets_() {
  const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
  let content = book.getSheetByName(PN_CONTENT_SHEET_NAME);
  let gallery = book.getSheetByName(PN_GALLERY_SHEET_NAME);
  if (!content) {
    content = book.insertSheet(PN_CONTENT_SHEET_NAME);
    content.appendRow(['ID','Jenis','Judul','Ringkasan','Isi / Informasi','Tanggal','Badge','Link','Status','Urutan','Diperbarui Oleh','Waktu Update']);
    content.setFrozenRows(1);
  }
  if (!gallery) {
    gallery = book.insertSheet(PN_GALLERY_SHEET_NAME);
    gallery.appendRow(['ID','Judul / Keterangan','URL Gambar','Drive File ID','Status','Urutan','Diperbarui Oleh','Waktu Update','Alt Text','Catatan']);
    gallery.setFrozenRows(1);
  }
  return {book:book, content:content, gallery:gallery};
}

function contentPublicList_() {
  const sheets = contentSheets_();
  return {
    ok:true,
    content:contentReadContent_(sheets.content, false),
    gallery:contentReadGallery_(sheets.gallery, false),
    version:'1',
    adminPassword:true,
    adminPasswordVersion:'4',
    adminPasswordConfigured:adminPasswordConfigured_(),
    adminPasswordRecoveryAvailable:adminPasswordRecoveryAvailable_()
  };
}

function contentAdminList_(data) {
  const admin = requireReviewAdmin_(data.token);
  const sheets = contentSheets_();
  return {
    ok:true,
    admin:admin,
    content:contentReadContent_(sheets.content, true),
    gallery:contentReadGallery_(sheets.gallery, true),
    version:'1'
  };
}

function contentReadContent_(sheet, includeHidden) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2,1,last-1,12).getValues();
  return rows.map(function(r){
    return {
      id:String(r[0]||''),
      type:String(r[1]||'BERITA'),
      title:String(r[2]||''),
      summary:String(r[3]||''),
      body:String(r[4]||''),
      date:contentDateText_(r[5]),
      badge:String(r[6]||''),
      link:String(r[7]||''),
      status:String(r[8]||'DRAFT').toUpperCase(),
      order:Number(r[9]||999),
      updatedBy:String(r[10]||''),
      updatedAt:contentDateTimeText_(r[11])
    };
  }).filter(function(x){
    if (!x.id || !x.title || x.status === 'DIHAPUS') return false;
    return includeHidden || x.status === 'PUBLIK' || x.status === 'AKTIF';
  }).sort(function(a,b){
    return (a.order-b.order) || String(b.date).localeCompare(String(a.date));
  });
}

function contentReadGallery_(sheet, includeHidden) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2,1,last-1,10).getValues();
  return rows.map(function(r){
    return {
      id:String(r[0]||''),
      title:String(r[1]||''),
      url:String(r[2]||''),
      fileId:String(r[3]||''),
      status:String(r[4]||'DRAFT').toUpperCase(),
      order:Number(r[5]||999),
      updatedBy:String(r[6]||''),
      updatedAt:contentDateTimeText_(r[7]),
      alt:String(r[8]||''),
      note:String(r[9]||'')
    };
  }).filter(function(x){
    if (!x.id || !x.url || x.status === 'DIHAPUS') return false;
    return includeHidden || x.status === 'PUBLIK' || x.status === 'AKTIF';
  }).sort(function(a,b){ return a.order-b.order; });
}

function contentDateText_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v,'Asia/Jakarta','yyyy-MM-dd');
  return String(v||'');
}

function contentDateTimeText_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v,'Asia/Jakarta',"yyyy-MM-dd'T'HH:mm:ss");
  return String(v||'');
}

function contentCleanStatus_(v) {
  const s=String(v||'DRAFT').trim().toUpperCase();
  return ['PUBLIK','AKTIF','DRAFT','DIHAPUS'].includes(s) ? s : 'DRAFT';
}

function contentAdminSave_(data) {
  const admin = requireReviewAdmin_(data.token);
  const section = String(data.section||'').trim().toLowerCase();
  let item;
  try { item = JSON.parse(String(data.itemJson||'{}')); } catch (_) { throw new Error('Data konten tidak valid.'); }
  const saved = contentSaveItem_(section, item, admin);
  return {ok:true, section:section, item:saved, message:'Konten berhasil disimpan.'};
}

function contentSaveItem_(section, item, admin) {
  const sheets = contentSheets_();
  const now = new Date();
  if (section === 'content') {
    let id = String(item.id||'').trim();
    if (!id) id='CNT-'+now.getTime()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
    const title=sanitize_(String(item.title||'').trim()).slice(0,160);
    if (!title) throw new Error('Judul konten wajib diisi.');
    const type=sanitize_(String(item.type||'BERITA').trim().toUpperCase()).slice(0,30);
    const summary=sanitize_(String(item.summary||'').trim()).slice(0,700);
    const body=sanitize_(String(item.body||'').trim()).slice(0,6000);
    const date=sanitize_(String(item.date||'').trim()).slice(0,40);
    const badge=sanitize_(String(item.badge||type).trim()).slice(0,30);
    const link=sanitize_(String(item.link||'').trim()).slice(0,500);
    const status=contentCleanStatus_(item.status);
    const order=Math.max(1,Math.min(999,Number(item.order||999)));
    const row=[id,type,title,summary,body,date,badge,link,status,order,admin,now];
    contentUpsertRow_(sheets.content,id,row,12);
    return {id:id,type:type,title:title,summary:summary,body:body,date:date,badge:badge,link:link,status:status,order:order};
  }
  if (section === 'gallery') {
    let id=String(item.id||'').trim();
    if (!id) id='GAL-'+now.getTime()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
    const title=sanitize_(String(item.title||'Dokumentasi Kegiatan Pagar Nusa').trim()).slice(0,160);
    const url=String(item.url||'').trim().slice(0,1000);
    if (!url) throw new Error('URL foto tidak tersedia.');
    const fileId=String(item.fileId||'').trim().slice(0,200);
    const status=contentCleanStatus_(item.status);
    const order=Math.max(1,Math.min(999,Number(item.order||999)));
    const alt=sanitize_(String(item.alt||title).trim()).slice(0,180);
    const note=sanitize_(String(item.note||'').trim()).slice(0,300);
    const row=[id,title,url,fileId,status,order,admin,now,alt,note];
    contentUpsertRow_(sheets.gallery,id,row,10);
    return {id:id,title:title,url:url,fileId:fileId,status:status,order:order,alt:alt,note:note};
  }
  throw new Error('Bagian konten tidak dikenal.');
}

function contentUpsertRow_(sheet, id, row, width) {
  const last=sheet.getLastRow();
  let target=0;
  if (last>=2) {
    const ids=sheet.getRange(2,1,last-1,1).getDisplayValues();
    for (let i=0;i<ids.length;i++) if (String(ids[i][0]||'').trim()===id) { target=i+2; break; }
  }
  if (target) sheet.getRange(target,1,1,width).setValues([row]);
  else sheet.getRange(last+1,1,1,width).setValues([row]);
}

function contentAdminDelete_(data) {
  const admin=requireReviewAdmin_(data.token);
  const section=String(data.section||'').trim().toLowerCase();
  const id=String(data.id||'').trim();
  if (!id) throw new Error('ID konten tidak tersedia.');
  const sheets=contentSheets_();
  const sheet=section==='content'?sheets.content:section==='gallery'?sheets.gallery:null;
  if (!sheet) throw new Error('Bagian konten tidak dikenal.');
  const last=sheet.getLastRow();
  if (last<2) throw new Error('Data tidak ditemukan.');
  const ids=sheet.getRange(2,1,last-1,1).getDisplayValues();
  let row=0;
  for (let i=0;i<ids.length;i++) if (String(ids[i][0]||'').trim()===id) { row=i+2; break; }
  if (!row) throw new Error('Data tidak ditemukan.');
  const statusCol=section==='content'?9:5;
  const byCol=section==='content'?11:7;
  const timeCol=section==='content'?12:8;
  sheet.getRange(row,statusCol).setValue('DIHAPUS');
  sheet.getRange(row,byCol).setValue(admin);
  sheet.getRange(row,timeCol).setValue(new Date());
  return {ok:true,id:id,section:section,message:'Data dihapus dari tampilan publik.'};
}

function contentAdminSeed_(data) {
  const admin=requireReviewAdmin_(data.token);
  const sheets=contentSheets_();
  if (sheets.content.getLastRow()>=2 || sheets.gallery.getLastRow()>=2) return {ok:true,skipped:true,message:'Database konten sudah berisi data.'};
  let content=[],gallery=[];
  try { content=JSON.parse(String(data.contentJson||'[]')); } catch (_) {}
  try { gallery=JSON.parse(String(data.galleryJson||'[]')); } catch (_) {}
  if (!Array.isArray(content)) content=[];
  if (!Array.isArray(gallery)) gallery=[];
  content.slice(0,30).forEach(function(x){ contentSaveItem_('content',x,admin); });
  gallery.slice(0,30).forEach(function(x){ contentSaveItem_('gallery',x,admin); });
  return {ok:true,seededContent:content.length,seededGallery:gallery.length,message:'Konten awal berhasil diimpor.'};
}

function contentUploadImage_(data) {
  const admin=requireReviewAdmin_(data.token);
  const mime=String(data.mimeType||'').trim().toLowerCase();
  if (!['image/jpeg','image/png','image/webp'].includes(mime)) throw new Error('Format foto harus JPG, PNG, atau WEBP.');
  let raw=String(data.base64||'').trim();
  raw=raw.replace(/^data:image\/[a-z0-9.+-]+;base64,/i,'');
  if (!raw) throw new Error('Data foto tidak tersedia.');
  if (raw.length>5000000) throw new Error('Ukuran foto terlalu besar. Maksimal sekitar 3,5 MB setelah kompresi.');
  const bytes=Utilities.base64Decode(raw);
  if (bytes.length>3800000) throw new Error('Ukuran foto terlalu besar. Maksimal sekitar 3,5 MB.');
  let name=String(data.fileName||'foto.jpg').replace(/[^A-Za-z0-9._ -]/g,'_').slice(0,100);
  if (!name) name='foto-'+new Date().getTime()+'.jpg';
  const blob=Utilities.newBlob(bytes,mime,name);
  const folder=DriveApp.getFolderById(PN_CONTENT_FOLDER_ID);
  const file=folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
  const id=file.getId();
  const url='https://drive.google.com/uc?export=view&id='+encodeURIComponent(id);
  return {ok:true,fileId:id,url:url,name:file.getName(),uploadedBy:admin,message:'Foto berhasil diupload ke Google Drive.'};
}

function contentRememberResult_(rid, result) {
  rid=String(rid||'').trim();
  if (!rid) return;
  try { CacheService.getScriptCache().put('pn-content-result:'+rid,JSON.stringify(result),120); } catch (_) {}
}

function contentResult_(data) {
  const rid=String(data.rid||'').trim();
  if (!rid) return {ok:false,message:'RID tidak tersedia.'};
  const cache=CacheService.getScriptCache();
  const raw=cache.get('pn-content-result:'+rid);
  if (!raw) return {ok:false,pending:true,rid:rid};
  cache.remove('pn-content-result:'+rid);
  try { return JSON.parse(raw); } catch (_) { return {ok:false,message:'Hasil proses tidak valid.',rid:rid}; }
}

/* =========================================================
   ADMIN ASPEL MONITOR V1
   Koordinator -> Anggota Koordinator -> Calon Anggota
========================================================= */
function aspelMonitorNormalize_(value) {
  let s = String(value == null ? '' : value).trim().toUpperCase();
  if (!s) return '';
  try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch (_) {}
  return s.replace(/[^A-Z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

function aspelMonitorPersonFromRow_(row) {
  return {
    memberId:String(row[0] || ''),
    name:String(row[1] || ''),
    className:String(row[5] || ''),
    program:String(row[6] || ''),
    entryYear:String(row[12] || ''),
    belt:String(row[13] || ''),
    membershipStatus:String(row[14] || ''),
    studentStatus:String(row[15] || '')
  };
}

function aspelMonitorProfileOrName_(profiles, name) {
  const key = aspelMonitorNormalize_(name);
  const found = key && profiles[key];
  if (found) return Object.assign({}, found);
  return {
    memberId:'',
    name:String(name || '').trim(),
    className:'',
    program:'',
    entryYear:'',
    belt:'',
    membershipStatus:'',
    studentStatus:''
  };
}

function aspelMonitorAdminList_(data) {
  const admin = requireReviewAdmin_(data.token);
  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const sheet = book.getSheetByName(PN_BIODATA_SHEET_NAME);
  if (!sheet) throw new Error('Sheet Data Biodata Siswa Anggota tidak ditemukan.');

  const last = sheet.getLastRow();
  const emptySummary = {coordinatorCount:0,memberCount:0,candidateCount:0,unassignedCount:0,ignoredNonCandidateCount:0};
  if (last < 2) {
    return {
      ok:true,
      admin:admin,
      source:PN_BIODATA_SHEET_NAME,
      hierarchy:'Koordinator -> Anggota Koordinator -> Calon Anggota yang Didampingi',
      summary:emptySummary,
      coordinators:[],
      version:'1'
    };
  }

  const rows = sheet.getRange(2,1,last-1,PN_BIODATA_HEADERS.length).getDisplayValues();
  const profiles = {};
  rows.forEach(function(row){
    const key = aspelMonitorNormalize_(row[1]);
    if (key && !profiles[key]) profiles[key] = aspelMonitorPersonFromRow_(row);
  });

  const groups = {};
  const uniqueMembers = {};
  const uniqueCandidates = {};
  let unassignedCount = 0;
  let ignoredNonCandidateCount = 0;

  rows.forEach(function(row){
    const candidateName = String(row[1] || '').trim();
    const coordinatorName = String(row[19] || '').trim();
    if (!candidateName || !coordinatorName) return;

    const membershipStatus = aspelMonitorNormalize_(row[14]);
    if (membershipStatus !== 'CALON ANGGOTA') {
      ignoredNonCandidateCount += 1;
      return;
    }

    const coordinatorKey = aspelMonitorNormalize_(coordinatorName);
    if (!coordinatorKey) return;
    if (!groups[coordinatorKey]) {
      const coordinator = aspelMonitorProfileOrName_(profiles, coordinatorName);
      groups[coordinatorKey] = {
        coordinator:coordinator,
        members:{},
        unassignedCandidates:[],
        candidateKeys:{}
      };
    }

    const group = groups[coordinatorKey];
    const candidate = aspelMonitorPersonFromRow_(row);
    candidate.coordinator = coordinatorName;
    candidate.member1 = String(row[20] || '').trim();
    candidate.member2 = String(row[21] || '').trim();

    const candidateKey = String(candidate.memberId || '').trim()
      ? 'ID:' + String(candidate.memberId || '').trim().toUpperCase()
      : 'NM:' + aspelMonitorNormalize_(candidate.name);
    if (candidateKey) {
      group.candidateKeys[candidateKey] = true;
      uniqueCandidates[candidateKey] = true;
    }

    const memberNames = [];
    [row[20],row[21]].forEach(function(value){
      const name = String(value || '').trim();
      const key = aspelMonitorNormalize_(name);
      if (!name || !key) return;
      if (!memberNames.some(function(x){ return x.key === key; })) memberNames.push({name:name,key:key});
    });

    if (!memberNames.length) {
      if (!group.unassignedCandidates.some(function(x){
        const xKey = String(x.memberId || '').trim() ? 'ID:' + String(x.memberId || '').trim().toUpperCase() : 'NM:' + aspelMonitorNormalize_(x.name);
        return xKey === candidateKey;
      })) {
        group.unassignedCandidates.push(candidate);
        unassignedCount += 1;
      }
      return;
    }

    memberNames.forEach(function(item){
      if (!group.members[item.key]) {
        group.members[item.key] = {
          person:aspelMonitorProfileOrName_(profiles,item.name),
          candidates:[],
          candidateKeys:{}
        };
      }
      uniqueMembers[item.key] = true;
      const member = group.members[item.key];
      if (!member.candidateKeys[candidateKey]) {
        member.candidateKeys[candidateKey] = true;
        member.candidates.push(Object.assign({},candidate));
      }
    });
  });

  const coordinators = Object.keys(groups).map(function(key){
    const group = groups[key];
    const members = Object.keys(group.members).map(function(memberKey){
      const item = group.members[memberKey];
      item.candidates.sort(function(a,b){ return String(a.name).localeCompare(String(b.name),'id'); });
      return Object.assign({},item.person,{candidateCount:item.candidates.length,candidates:item.candidates});
    }).sort(function(a,b){ return String(a.name).localeCompare(String(b.name),'id'); });

    group.unassignedCandidates.sort(function(a,b){ return String(a.name).localeCompare(String(b.name),'id'); });
    const coordinator = Object.assign({},group.coordinator);
    coordinator.memberCount = members.length;
    coordinator.candidateCount = Object.keys(group.candidateKeys).length;
    coordinator.members = members;
    coordinator.unassignedCandidates = group.unassignedCandidates;
    return coordinator;
  }).sort(function(a,b){ return String(a.name).localeCompare(String(b.name),'id'); });

  return {
    ok:true,
    admin:admin,
    source:PN_BIODATA_SHEET_NAME,
    hierarchy:'Koordinator -> Anggota Koordinator -> Calon Anggota yang Didampingi',
    summary:{
      coordinatorCount:coordinators.length,
      memberCount:Object.keys(uniqueMembers).length,
      candidateCount:Object.keys(uniqueCandidates).length,
      unassignedCount:unassignedCount,
      ignoredNonCandidateCount:ignoredNonCandidateCount
    },
    coordinators:coordinators,
    version:'1'
  };
}

function sha256Hex_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text || ''), Utilities.Charset.UTF_8);
  return bytes.map(b => {
    const n = b < 0 ? b + 256 : b;
    return n.toString(16).padStart(2,'0');
  }).join('');
}

function iframeResult_(obj, source) {
  const payload = JSON.stringify(Object.assign({source:source || 'pn-registration'}, obj))
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8"><script>' +
    'window.parent.postMessage(' + payload + ',"*");' +
    '<\/script>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function jsonp_(obj, callback) {
  const cb = String(callback || '').trim();
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(cb)) {
    return json_({ok:false, message:'Callback JSONP tidak valid.'});
  }
  const payload = JSON.stringify(obj).replace(/</g,'\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService
    .createTextOutput(cb + '(' + payload + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ===== BACKUP OTOMATIS HARIAN V1 ===== */
function backupFolder_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = String(props.getProperty(PN_BACKUP_FOLDER_PROPERTY) || '').trim();

  if (savedId) {
    try {
      const savedFolder = DriveApp.getFolderById(savedId);
      savedFolder.getName();
      return savedFolder;
    } catch (_) {
      props.deleteProperty(PN_BACKUP_FOLDER_PROPERTY);
    }
  }

  const existing = DriveApp.getFoldersByName(PN_BACKUP_FOLDER_NAME);
  const folder = existing.hasNext() ? existing.next() : DriveApp.createFolder(PN_BACKUP_FOLDER_NAME);
  props.setProperty(PN_BACKUP_FOLDER_PROPERTY, folder.getId());
  return folder;
}

function backupStamp_() {
  return Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd_HH-mm-ss');
}

function backupLog_(status, detail) {
  try {
    const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
    let sheet = book.getSheetByName(PN_BACKUP_LOG_SHEET_NAME);
    if (!sheet) {
      sheet = book.insertSheet(PN_BACKUP_LOG_SHEET_NAME);
      sheet.appendRow(['Waktu', 'Status', 'Detail']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(),
      String(status || '').slice(0, 30),
      String(detail || '').slice(0, 1000)
    ]);
  } catch (_) {}
}

function cleanupOldBackups_(folder) {
  const cutoff = Date.now() - (PN_BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let removed = 0;
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    const name = String(file.getName() || '');
    if (name.indexOf('PN_BACKUP_') !== 0) continue;
    if (file.getDateCreated().getTime() >= cutoff) continue;
    try {
      file.setTrashed(true);
      removed++;
    } catch (_) {}
  }

  return removed;
}

function runDailyDatabaseBackup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const folder = backupFolder_();
    const stamp = backupStamp_();
    const sources = [
      {id: PN_REG_SPREADSHEET_ID, label: 'Database Utama'},
      {id: PN_BIODATA_SPREADSHEET_ID, label: 'Biodata Siswa Anggota'}
    ];
    const created = [];

    sources.forEach(function(source) {
      const safeLabel = source.label.replace(/[^A-Za-z0-9 _-]+/g, '').replace(/\s+/g, '_');
      const backupName = 'PN_BACKUP_' + stamp + '_' + safeLabel;
      const copy = DriveApp.getFileById(source.id).makeCopy(backupName, folder);
      created.push({
        name: copy.getName(),
        id: copy.getId(),
        url: copy.getUrl()
      });
    });

    const removed = cleanupOldBackups_(folder);
    const detail = created.map(function(item){ return item.name + ' [' + item.id + ']'; }).join(' | ') +
      ' | backup lama dibersihkan: ' + removed;
    backupLog_('OK', detail);

    return {
      ok: true,
      folderId: folder.getId(),
      folderName: folder.getName(),
      retentionDays: PN_BACKUP_RETENTION_DAYS,
      removedOldFiles: removed,
      files: created
    };
  } catch (err) {
    backupLog_('GAGAL', String(err && err.message || err));
    throw err;
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function installDailyBackupTrigger() {
  const handler = 'runDailyDatabaseBackup';
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(handler)
    .timeBased()
    .atHour(2)
    .nearMinute(15)
    .everyDays(1)
    .inTimezone('Asia/Jakarta')
    .create();

  const firstBackup = runDailyDatabaseBackup();
  backupLog_('TRIGGER', 'Backup harian aktif sekitar 02:15 WIB. Retensi ' + PN_BACKUP_RETENTION_DAYS + ' hari.');

  return {
    ok: true,
    message: 'Backup otomatis aktif setiap hari sekitar 02:15 WIB.',
    firstBackup: firstBackup
  };
}

function removeDailyBackupTrigger() {
  const handler = 'runDailyDatabaseBackup';
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });
  backupLog_('TRIGGER_OFF', 'Trigger backup harian dihapus: ' + removed);
  return {ok: true, removed: removed};
}

function backupStatus() {
  const active = ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === 'runDailyDatabaseBackup';
  });

  let folderId = '';
  let folderName = '';
  try {
    const folder = backupFolder_();
    folderId = folder.getId();
    folderName = folder.getName();
  } catch (_) {}

  return {
    ok: true,
    active: active,
    schedule: 'Setiap hari sekitar 02:15 WIB',
    retentionDays: PN_BACKUP_RETENTION_DAYS,
    folderId: folderId,
    folderName: folderName
  };
}

