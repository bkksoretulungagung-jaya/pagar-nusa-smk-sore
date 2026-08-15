const PN_REG_SPREADSHEET_ID = '1WBpDiXDeVCKiAKWze7Dh_J-jG8t8_PAApGkAsBEchtc';
const PN_BIODATA_SPREADSHEET_ID = '1t_PLScKuFhFYOSqAAkeVw4rQDzC2mE7iqFyiwYrvV7w';
const PN_SHEET_NAME = 'Data Daftar Siswa Baru';
const PN_REVIEW_SHEET_NAME = 'Ulasan Website';
const PN_REVIEW_ADMIN_USER = 'admin';
const PN_REVIEW_ADMIN_PASS_HASH = '3b396371ec891e73db1ecb5f70d341c4fe6cc6f52fdea96d55dc3fe786d3a639';
const PN_BIODATA_SHEET_NAME = 'Data Biodata Siswa Anggota';
const PN_BIODATA_LOG_SHEET_NAME = 'Log Perubahan Biodata';
const PN_PORTAL_ACCOUNT_SHEET_NAME = 'Akun Portal Siswa';
const PN_FIREBASE_API_KEY = 'AIzaSyCMWsvVJPem3_5Y-x8Zrjz90LodbNLkxUs';
const PN_CONSENT = 'Saya bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa. Saya Siap dan bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa Rayon SMK Sore Tulungagung, dan Sudah dapat izin dari kedua orang tua.';
const PN_MAJORS = ['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];
const PN_BIODATA_HEADERS = [
  'ID Anggota','Nama Lengkap','L/P','Tempat Lahir','Tanggal Lahir','Kelas','Program Keahlian','Alamat','No. HP Siswa',
  'Nama Orang Tua/Wali','No. HP Wali','Tahun Pengesahan','Tahun Masuk','Tingkat/Sabuk','Status Keanggotaan','Status Siswa',
  'Nomor Sertifikat','Catatan','Tanggal Pengesahan'
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
      reviewVersion:'6'
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
    return json_(result);
  }
}

function saveRegistration_(data) {
  const row = validateRegistration_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID).getSheetByName(PN_SHEET_NAME);
    if (!sheet) throw new Error('Sheet database pendaftaran tidak ditemukan.');
    if (isDuplicate_(sheet, row[0], row[7])) {
      return {ok:false, code:'DUPLICATE', message:'Nama dan nomor WA tersebut sudah terdaftar.'};
    }
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return {ok:true, message:'Pendaftaran tersimpan permanen.'};
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
    approvalDate:d[18]
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

function reviewAdminLogin_(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');
  if (username !== PN_REVIEW_ADMIN_USER || sha256Hex_(password) !== PN_REVIEW_ADMIN_PASS_HASH) {
    throw new Error('Login admin verifikasi tidak valid.');
  }

  const requestedToken = String(data.token || '').trim();
  const token = /^[A-Za-z0-9_-]{32,128}$/.test(requestedToken)
    ? requestedToken
    : Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');

  CacheService.getScriptCache().put('pn-review-admin:' + token, username, 21600);
  return {ok:true,token:token,expiresIn:21600,version:'6'};
}

function requireReviewAdmin_(token) {
  token = String(token || '').trim();
  if (!token) throw new Error('Sesi verifikasi admin tidak tersedia. Silakan login ulang.');
  const username = CacheService.getScriptCache().get('pn-review-admin:' + token);
  if (!username) throw new Error('Sesi verifikasi admin sudah berakhir. Silakan login ulang.');
  return username;
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
