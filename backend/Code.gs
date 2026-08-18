const PN_REG_SPREADSHEET_ID = '1WBpDiXDeVCKiAKWze7Dh_J-jG8t8_PAApGkAsBEchtc';
const PN_BIODATA_SPREADSHEET_ID = '1t_PLScKuFhFYOSqAAkeVw4rQDzC2mE7iqFyiwYrvV7w';
const PN_SHEET_NAME = 'Data Daftar Siswa Baru';
const PN_REVIEW_SHEET_NAME = 'Ulasan Website';
const PN_CONTENT_SHEET_NAME = 'Konten Website';
const PN_GALLERY_SHEET_NAME = 'Galeri Website';
const PN_MATERI_SHEET_NAME = 'Materi Pengurus';
const PN_MATERI_FOLDER_PROPERTY = 'PN_MATERI_FOLDER_ID_V1';
const PN_MATERI_FOLDER_NAME = 'Pagar Nusa - Materi Pengurus';
const PN_MATERI_ACCESS_PROPERTY = 'PN_MATERI_ACCESS_HASH_V1';
const PN_MATERI_ACCESS_PEPPER_PROPERTY = 'PN_MATERI_ACCESS_PEPPER_V1';
const PN_MATERI_SESSION_PREFIX = 'PN_MATERI_SESSION_V1_';
const PN_MATERI_SESSION_SECONDS = 21600;
const PN_MATERI_MAX_BYTES = 5 * 1024 * 1024;
const PN_MATERI_CHUNK_BYTES = 256 * 1024;
const PN_PENGURUS_ACCOUNT_SHEET_NAME = 'Akun Pengurus';
const PN_PENGURUS_LOG_SHEET_NAME = 'Log Portal Pengurus';
const PN_PENGURUS_PEPPER_PROPERTY = 'PN_PENGURUS_ACCOUNT_PEPPER_V2';
const PN_PENGURUS_SESSION_SECONDS = 21600;

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
const PN_EXCEL_FOLDER_PROPERTY = 'PN_EXCEL_FOLDER_ID_V1';
const PN_EXCEL_FILE_PROPERTY = 'PN_EXCEL_MASTER_FILE_ID_V1';
const PN_EXCEL_FOLDER_NAME = 'Pagar Nusa - Database Excel Utama';
const PN_EXCEL_MAX_BYTES = 20 * 1024 * 1024;
const PN_EXCEL_MAX_BASE64_CHARS = 28 * 1024 * 1024;
const PN_EXCEL_CHUNK_BYTES = 512 * 1024;
const PN_EXCEL_BACKUP_PREFIX = 'PN_EXCEL_BACKUP_';
const PN_EXCEL_BACKUP_KEEP = 5;
const PN_EXCEL_HISTORY_SHEET_NAME = 'Riwayat Perubahan Database Excel';
const PN_EXCEL_HISTORY_KEEP = 2000;
const PN_BIODATA_SHEET_NAME = 'Data Biodata Siswa Anggota';
const PN_BIODATA_LOG_SHEET_NAME = 'Log Perubahan Biodata';
const PN_PORTAL_ACCOUNT_SHEET_NAME = 'Akun Portal Siswa';
const PN_FIREBASE_API_KEY = 'AIzaSyCMWsvVJPem3_5Y-x8Zrjz90LodbNLkxUs';
const PN_CBT_SCHEDULE_SHEET_NAME = 'Jadwal CBT';
const PN_CBT_LOG_SHEET_NAME = 'Log CBT';
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
      cbtSchedule:true,
      cbtScheduleVersion:'1',
      materiPengurus:true,
      materiPengurusVersion:'1',
      pengurusPortal:true,
      pengurusPortalVersion:'2',
      pdfWatermark:true,
      pdfWatermarkVersion:'1',
      aspelMonitor:true,
      aspelMonitorVersion:'1',
      adminPassword:true,
      adminPasswordVersion:'4',
      adminPersistentSession:true,
      adminPersistentSessionVersion:'1',
      backupAutomatic:true,
      backupAutomaticVersion:'1',
      backupRetentionDays:PN_BACKUP_RETENTION_DAYS,
      excelCloud:true,
      excelCloudVersion:'1',
      adminNotificationCenter:true,
      adminNotificationCenterVersion:'1',
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

  if (action === 'adminNotificationCenter') {
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

  if (action === 'databaseHistoryList') {
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

  if (action === 'materiList') {
    let result;
    try { result = materiList_(data); }
    catch (err) { result = {ok:false, items:[], message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'materiAdminList') {
    let result;
    try { result = materiAdminList_(data); }
    catch (err) { result = {ok:false, items:[], message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'materiManifest') {
    let result;
    try { result = materiManifest_(data); }
    catch (err) { result = {ok:false, message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'materiChunk') {
    let result;
    try { result = materiChunk_(data); }
    catch (err) { result = {ok:false, message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }


  if (action === 'pengurusMateriList') {
    let result;
    try { result = pengurusMateriList_(data); }
    catch (err) { result = {ok:false, items:[], message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'pengurusMateriManifest') {
    let result;
    try { result = pengurusMateriManifest_(data); }
    catch (err) { result = {ok:false, message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'pengurusMateriChunk') {
    let result;
    try { result = pengurusMateriChunk_(data); }
    catch (err) { result = {ok:false, message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'pengurusAdminList') {
    let result;
    try { result = pengurusAdminList_(data); }
    catch (err) { result = {ok:false, accounts:[], message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'cbtScheduleAdminList') {
    let result;
    try { result = cbtScheduleAdminList_(data); }
    catch (err) { result = {ok:false, accounts:[], message:String(err && err.message || err)}; }
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

  if (action === 'databaseChunk') {
    let result;
    try {
      result = excelDatabaseChunkByTicket_(data);
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

    if (action === 'databaseHistoryAdd') {
      result = excelDatabaseHistoryAdd_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-database');
    }

    if (action === 'databaseManifest') {
      result = excelDatabaseManifest_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-database');
    }

    if (action === 'databaseChunk') {
      result = excelDatabaseChunk_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-database');
    }

    if (action === 'databaseGet') {
      result = excelDatabaseGet_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-database');
    }

    if (action === 'databaseSave') {
      result = excelDatabaseSave_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-database');
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


    if (action === 'pengurusLogin') {
      result = pengurusLogin_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'pengurusLogout') {
      result = pengurusLogout_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'pengurusAdminSave') {
      result = pengurusAdminSave_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'pengurusAdminSetStatus') {
      result = pengurusAdminSetStatus_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'materiLogin') {
      result = materiLogin_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'materiLogout') {
      result = materiLogout_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'materiAdminSetAccess') {
      result = materiAdminSetAccess_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'materiAdminUpload') {
      result = materiAdminUpload_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'materiAdminDelete') {
      result = materiAdminDelete_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'cbtAccessCheck') {
      result = cbtAccessCheck_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-cbt');
    }

    if (action === 'cbtScheduleAdminSave') {
      result = cbtScheduleAdminSave_(data);
      result.rid = String(data.rid || '');
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
    if (['databaseManifest','databaseChunk','databaseGet','databaseSave','databaseHistoryAdd'].includes(action)) {
      if (['databaseManifest','databaseSave','databaseHistoryAdd'].includes(action)) contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-database');
    }
    if (action === 'biodataGet' || action === 'biodataUpdate') {
      return iframeResult_(result, 'pn-biodata');
    }
    if (action === 'cbtAccessCheck') {
      return iframeResult_(result, 'pn-cbt');
    }
    if (['reviewSubmit','reviewPublicList','reviewAdminLogin','reviewAdminList','reviewModerate'].includes(action)) {
      return iframeResult_(result, 'pn-reviews');
    }
    if (['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword','adminPasswordRecover','materiLogin','materiLogout','materiAdminSetAccess','materiAdminUpload','materiAdminDelete','pengurusLogin','pengurusLogout','pengurusAdminSave','pengurusAdminSetStatus','cbtScheduleAdminSave'].includes(action)) {
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
   JADWAL PESERTA CBT V1
   Link soal hanya dikirim sesudah akun + jadwal diverifikasi server.
========================================================= */
function cbtScheduleSheets_() {
  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  let schedule = book.getSheetByName(PN_CBT_SCHEDULE_SHEET_NAME);
  let log = book.getSheetByName(PN_CBT_LOG_SHEET_NAME);
  if (!schedule) {
    schedule = book.insertSheet(PN_CBT_SCHEDULE_SHEET_NAME);
    schedule.appendRow(['Username','ID Anggota','Email','Mulai','Selesai','Status','Catatan','Diatur Oleh','Waktu Update']);
    schedule.setFrozenRows(1);
  }
  if (!log) {
    log = book.insertSheet(PN_CBT_LOG_SHEET_NAME);
    log.appendRow(['Waktu','Username','ID Anggota','Email','Aksi','Detail']);
    log.setFrozenRows(1);
  }
  return {book:book, schedule:schedule, log:log};
}

function cbtScheduleDateText_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value,'Asia/Jakarta',"yyyy-MM-dd'T'HH:mm:ss") + '+07:00';
  }
  const text = String(value || '').trim();
  if (!text) return '';
  const d = new Date(text);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d,'Asia/Jakarta',"yyyy-MM-dd'T'HH:mm:ss") + '+07:00';
  return text;
}

function cbtScheduleLog_(username, memberId, email, action, detail) {
  try {
    cbtScheduleSheets_().log.appendRow([
      new Date(),
      sanitize_(String(username || '').slice(0,100)),
      sanitize_(String(memberId || '').slice(0,80)),
      sanitize_(String(email || '').slice(0,160)),
      sanitize_(String(action || '').slice(0,40)),
      sanitize_(String(detail || '').slice(0,500))
    ]);
  } catch (_) {}
}

function cbtPortalAccounts_() {
  const sheets = cbtScheduleSheets_();
  const accountSheet = sheets.book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!accountSheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');
  const last = accountSheet.getLastRow();
  if (last < 2) return [];
  return accountSheet.getRange(2,1,last-1,5).getDisplayValues().map(function(r, i){
    return {
      row:i+2,
      username:String(r[0] || '').trim(),
      memberId:String(r[1] || '').trim(),
      email:String(r[2] || '').trim().toLowerCase(),
      uid:String(r[3] || '').trim(),
      status:String(r[4] || 'AKTIF').trim().toUpperCase()
    };
  }).filter(function(x){ return x.username && x.email; });
}

function cbtScheduleObject_(r) {
  return {
    exists:!!String(r[0] || '').trim(),
    username:String(r[0] || '').trim(),
    memberId:String(r[1] || '').trim(),
    email:String(r[2] || '').trim().toLowerCase(),
    startAt:cbtScheduleDateText_(r[3]),
    endAt:cbtScheduleDateText_(r[4]),
    status:String(r[5] || 'NONAKTIF').trim().toUpperCase(),
    note:String(r[6] || ''),
    updatedBy:String(r[7] || ''),
    updatedAt:cbtScheduleDateText_(r[8])
  };
}

function cbtScheduleMap_() {
  const sheet = cbtScheduleSheets_().schedule;
  const last = sheet.getLastRow();
  const out = {};
  if (last < 2) return out;
  const rows = sheet.getRange(2,1,last-1,9).getValues();
  rows.forEach(function(r){
    const obj = cbtScheduleObject_(r);
    if (!obj.username) return;
    out[obj.username.toLowerCase()] = obj;
  });
  return out;
}

function cbtScheduleComputedStatus_(account, schedule) {
  if (String(account.status || '').toUpperCase() !== 'AKTIF') return 'AKUN NONAKTIF';
  if (!schedule || !schedule.exists) return 'BELUM DIJADWALKAN';
  if (String(schedule.status || '').toUpperCase() !== 'AKTIF') return 'NONAKTIF';
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  if (!start || !end) return 'JADWAL TIDAK VALID';
  const now = Date.now();
  if (now < start) return 'MENUNGGU';
  if (now > end) return 'SELESAI';
  return 'SEDANG UJIAN';
}

function cbtScheduleAdminList_(data) {
  const admin = requireReviewAdmin_(data.token);
  const schedules = cbtScheduleMap_();
  const accounts = cbtPortalAccounts_().map(function(account){
    const schedule = schedules[account.username.toLowerCase()] || null;
    if (schedule) schedule.computedStatus = cbtScheduleComputedStatus_(account, schedule);
    return {
      username:account.username,
      memberId:account.memberId,
      email:account.email,
      status:account.status,
      schedule:schedule || {exists:false,computedStatus:'BELUM DIJADWALKAN'}
    };
  }).sort(function(a,b){ return String(a.username).localeCompare(String(b.username),'id'); });
  return {ok:true,admin:admin,accounts:accounts,serverTime:cbtScheduleDateText_(new Date()),version:'1'};
}

function cbtScheduleAdminSave_(data) {
  const admin = requireReviewAdmin_(data.token);
  const username = String(data.username || '').trim();
  const status = String(data.status || 'AKTIF').trim().toUpperCase();
  const note = sanitize_(String(data.note || '').trim()).slice(0,300);
  if (!username) throw new Error('Username akun wajib dipilih.');
  if (!['AKTIF','NONAKTIF'].includes(status)) throw new Error('Status jadwal tidak valid.');
  const accounts = cbtPortalAccounts_();
  const account = accounts.find(function(x){ return x.username.toLowerCase() === username.toLowerCase(); });
  if (!account) throw new Error('Akun Portal Siswa tidak ditemukan.');

  let start = null, end = null;
  const startRaw = String(data.startAt || '').trim();
  const endRaw = String(data.endAt || '').trim();
  if (startRaw) start = new Date(startRaw);
  if (endRaw) end = new Date(endRaw);
  if (status === 'AKTIF') {
    if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) throw new Error('Waktu mulai dan selesai wajib diisi.');
    if (end.getTime() <= start.getTime()) throw new Error('Waktu selesai harus setelah waktu mulai.');
    if (end.getTime() - start.getTime() > 24 * 60 * 60 * 1000) throw new Error('Durasi satu jadwal CBT maksimal 24 jam.');
  }

  const sheet = cbtScheduleSheets_().schedule;
  const last = sheet.getLastRow();
  let row = 0;
  if (last >= 2) {
    const users = sheet.getRange(2,1,last-1,1).getDisplayValues();
    for (let i=0;i<users.length;i++) {
      if (String(users[i][0] || '').trim().toLowerCase() === username.toLowerCase()) { row=i+2; break; }
    }
  }
  const values = [account.username,account.memberId,account.email,start || '',end || '',status,note,admin,new Date()];
  if (row) sheet.getRange(row,1,1,9).setValues([values]);
  else sheet.appendRow(values);
  cbtScheduleLog_(account.username,account.memberId,account.email,'ADMIN_JADWAL',status + ' | ' + cbtScheduleDateText_(start) + ' - ' + cbtScheduleDateText_(end) + (note ? ' | ' + note : ''));
  return {ok:true,username:account.username,status:status,message:status === 'AKTIF' ? 'Jadwal CBT berhasil diaktifkan.' : 'Jadwal CBT berhasil dinonaktifkan.'};
}

function cbtFormSetting_() {
  const sheets = contentSheets_();
  const items = contentReadContent_(sheets.content, true);
  const item = items.find(function(x){ return String(x.id || '') === 'CFG-CBT'; }) ||
    items.find(function(x){ return String(x.type || '').toUpperCase() === 'PENGATURAN' && String(x.title || '').toUpperCase() === 'PORTAL CBT ONLINE'; });
  const state = String(item && (item.body || item.summary) || 'ON').trim().toUpperCase();
  const link = String(item && item.link || '').trim();
  const valid = /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(link);
  return {enabled:state !== 'OFF', link:valid ? link : ''};
}

function cbtAccessCheck_(data) {
  const username = String(data.username || '').trim();
  const idToken = String(data.idToken || '').trim();
  if (!username || !idToken) throw new Error('Username dan sesi login CBT wajib tersedia.');
  const firebaseUser = verifyFirebaseToken_(idToken);
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  const uid = String(firebaseUser.localId || '').trim();
  if (!email || !uid) throw new Error('Akun Firebase tidak valid.');

  const accounts = cbtPortalAccounts_();
  const account = accounts.find(function(x){
    return x.username.toLowerCase() === username.toLowerCase() && x.email === email;
  });
  if (!account) {
    cbtScheduleLog_(username,'',email,'AKSES_DITOLAK','Username/email tidak cocok dengan Akun Portal Siswa.');
    return {ok:true,allowed:false,code:'ACCOUNT_NOT_FOUND',message:'Akun CBT tidak terdaftar. Hubungi admin.'};
  }
  if (account.status !== 'AKTIF') {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Akun portal NONAKTIF.');
    return {ok:true,allowed:false,code:'ACCOUNT_INACTIVE',message:'Akun portal Anda sedang nonaktif.'};
  }
  if (account.uid && account.uid !== uid) {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','UID Firebase tidak cocok.');
    return {ok:true,allowed:false,code:'UID_MISMATCH',message:'Akun ini sudah terhubung dengan pengguna lain. Hubungi admin.'};
  }
  if (!account.uid) {
    try { cbtScheduleSheets_().book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME).getRange(account.row,4).setValue(uid); } catch (_) {}
  }

  const schedule = cbtScheduleMap_()[account.username.toLowerCase()] || null;
  if (!schedule || !schedule.exists || schedule.status !== 'AKTIF') {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Belum memiliki jadwal CBT aktif.');
    return {ok:true,allowed:false,code:'NOT_SCHEDULED',message:'Anda belum dijadwalkan mengikuti CBT. Hubungi admin/pengurus.'};
  }
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  const now = Date.now();
  if (!start || !end) return {ok:true,allowed:false,code:'INVALID_SCHEDULE',message:'Jadwal CBT akun Anda belum valid. Hubungi admin.'};
  if (now < start) {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Belum waktunya ujian.');
    return {ok:true,allowed:false,code:'NOT_STARTED',message:'Jadwal CBT Anda belum dimulai.',startAt:schedule.startAt,endAt:schedule.endAt};
  }
  if (now > end) {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Waktu ujian sudah selesai.');
    return {ok:true,allowed:false,code:'EXPIRED',message:'Waktu CBT Anda sudah selesai.',startAt:schedule.startAt,endAt:schedule.endAt};
  }
  const cfg = cbtFormSetting_();
  if (!cfg.enabled) return {ok:true,allowed:false,code:'PORTAL_OFF',message:'Portal CBT sedang ditutup oleh admin.'};
  if (!cfg.link) return {ok:true,allowed:false,code:'NO_FORM',message:'Link soal CBT belum dipasang oleh admin.'};

  cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DIBERIKAN','Jadwal aktif sampai ' + schedule.endAt);
  return {
    ok:true,
    allowed:true,
    username:account.username,
    memberId:account.memberId,
    email:account.email,
    startAt:schedule.startAt,
    endAt:schedule.endAt,
    formUrl:cfg.link,
    message:'Akses CBT diizinkan sesuai jadwal.',
    version:'1'
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
      link:(!includeHidden && String(r[0]||'').trim()==='CFG-CBT') ? '' : String(r[7]||''),
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


/* ===== RIWAYAT PERUBAHAN DATABASE EXCEL V1 ===== */
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

/* ===== EXCEL CLOUD DATABASE V1 ===== */
function excelDatabaseFolder_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = String(props.getProperty(PN_EXCEL_FOLDER_PROPERTY) || '').trim();
  if (savedId) {
    try {
      const saved = DriveApp.getFolderById(savedId);
      saved.getName();
      return saved;
    } catch (_) {
      props.deleteProperty(PN_EXCEL_FOLDER_PROPERTY);
    }
  }
  const folder = DriveApp.createFolder(PN_EXCEL_FOLDER_NAME);
  props.setProperty(PN_EXCEL_FOLDER_PROPERTY, folder.getId());
  return folder;
}

function excelDatabaseCurrentFile_() {
  const props = PropertiesService.getScriptProperties();
  const id = String(props.getProperty(PN_EXCEL_FILE_PROPERTY) || '').trim();
  if (!id) return null;
  try {
    const file = DriveApp.getFileById(id);
    if (file.isTrashed()) {
      props.deleteProperty(PN_EXCEL_FILE_PROPERTY);
      return null;
    }
    return file;
  } catch (_) {
    props.deleteProperty(PN_EXCEL_FILE_PROPERTY);
    return null;
  }
}

function excelDatabaseSafeName_(value) {
  let name = String(value || 'Database_Pagar_Nusa_BROWSER.xlsm').trim();
  name = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 160);
  if (!/\.(xlsm|xlsx)$/i.test(name)) name += '.xlsm';
  return name || 'Database_Pagar_Nusa_BROWSER.xlsm';
}

function excelDatabaseMime_(name) {
  return /\.xlsx$/i.test(String(name || ''))
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/vnd.ms-excel.sheet.macroEnabled.12';
}

function excelDatabaseMeta_(file) {
  if (!file) return {exists:false};
  const blob = file.getBlob();
  let size = 0;
  try { size = Number(file.getSize()) || 0; } catch (_) {}
  if (!size) size = blob.getBytes().length;
  return {
    exists:true,
    fileId:file.getId(),
    name:file.getName(),
    mimeType:blob.getContentType() || excelDatabaseMime_(file.getName()),
    size:size,
    updatedAt:Utilities.formatDate(file.getLastUpdated(), 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss")
  };
}

function excelDatabaseTicketKey_(ticket) {
  return 'pn-excel-download:' + String(ticket || '');
}

function excelDatabaseCreateTicket_(file) {
  const ticket = adminGenerateSecret_();
  CacheService.getScriptCache().put(excelDatabaseTicketKey_(ticket), file.getId(), 180);
  return ticket;
}

function excelDatabaseManifest_(data) {
  requireReviewAdmin_(data.token);
  const file = excelDatabaseCurrentFile_();
  if (!file) return {ok:true, exists:false, version:'5'};
  const meta = excelDatabaseMeta_(file);
  if (meta.size > PN_EXCEL_MAX_BYTES) throw new Error('Database Excel pusat melebihi batas 20 MB.');
  meta.ok = true;
  meta.version = '5';
  meta.chunkBytes = PN_EXCEL_CHUNK_BYTES;
  meta.chunkCount = Math.ceil(meta.size / PN_EXCEL_CHUNK_BYTES);
  meta.ticket = excelDatabaseCreateTicket_(file);
  return meta;
}

function excelDatabaseChunkForFile_(file, index) {
  if (!file || file.isTrashed()) return {ok:true, exists:false, version:'5'};
  index = Math.floor(Number(index));
  if (!Number.isFinite(index) || index < 0) throw new Error('Index potongan database tidak valid.');
  const bytes = file.getBlob().getBytes();
  if (bytes.length > PN_EXCEL_MAX_BYTES) throw new Error('Database Excel pusat melebihi batas 20 MB.');
  const chunkCount = Math.ceil(bytes.length / PN_EXCEL_CHUNK_BYTES);
  if (index >= chunkCount) throw new Error('Index potongan database di luar batas.');
  const start = index * PN_EXCEL_CHUNK_BYTES;
  const end = Math.min(start + PN_EXCEL_CHUNK_BYTES, bytes.length);
  const part = bytes.slice(start, end);
  return {
    ok:true, exists:true, version:'5', index:index, chunkCount:chunkCount,
    size:bytes.length, name:file.getName(),
    updatedAt:Utilities.formatDate(file.getLastUpdated(), 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss"),
    base64:Utilities.base64Encode(part)
  };
}

function excelDatabaseChunkByTicket_(data) {
  const ticket = String(data.ticket || '').trim();
  if (!/^[A-Fa-f0-9]{64}$/.test(ticket)) throw new Error('Ticket download database tidak valid.');
  const fileId = CacheService.getScriptCache().get(excelDatabaseTicketKey_(ticket)) || '';
  if (!fileId) throw new Error('Ticket download database sudah kedaluwarsa. Muat ulang database.');
  const file = DriveApp.getFileById(fileId);
  return excelDatabaseChunkForFile_(file, data.index);
}

function excelDatabaseChunk_(data) {
  requireReviewAdmin_(data.token);
  const file = excelDatabaseCurrentFile_();
  return excelDatabaseChunkForFile_(file, data.index);
}

function excelDatabaseGet_(data) {
  requireReviewAdmin_(data.token);
  const file = excelDatabaseCurrentFile_();
  if (!file) return {ok:true, exists:false, version:'1'};
  const blob = file.getBlob();
  const bytes = blob.getBytes();
  if (bytes.length > PN_EXCEL_MAX_BYTES) throw new Error('Database Excel pusat melebihi batas 20 MB.');
  const meta = excelDatabaseMeta_(file);
  meta.ok = true;
  meta.version = '1';
  meta.base64 = Utilities.base64Encode(bytes);
  return meta;
}

function excelDatabaseArchiveOld_(folder, file) {
  if (!file) return;
  try {
    const stamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd_HHmmss');
    file.setName(PN_EXCEL_BACKUP_PREFIX + stamp + '_' + excelDatabaseSafeName_(file.getName()));
  } catch (_) {}

  const backups = [];
  try {
    const files = folder.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      if (String(f.getName() || '').indexOf(PN_EXCEL_BACKUP_PREFIX) !== 0) continue;
      backups.push(f);
    }
    backups.sort(function(a,b){ return b.getLastUpdated().getTime() - a.getLastUpdated().getTime(); });
    backups.slice(PN_EXCEL_BACKUP_KEEP).forEach(function(f){
      try { f.setTrashed(true); } catch (_) {}
    });
  } catch (_) {}
}

function excelDatabaseSave_(data) {
  const admin = requireReviewAdmin_(data.token);
  const name = excelDatabaseSafeName_(data.name);
  const initialOnly = String(data.initialOnly || '') === '1';
  let raw = String(data.base64 || '').trim();
  raw = raw.replace(/^data:[^;]+;base64,/i, '');
  if (!raw) throw new Error('Isi database Excel tidak tersedia.');
  if (raw.length > PN_EXCEL_MAX_BASE64_CHARS) throw new Error('Database Excel terlalu besar untuk sinkronisasi. Maksimal 20 MB.');

  let bytes;
  try { bytes = Utilities.base64Decode(raw); }
  catch (_) { throw new Error('Isi database Excel tidak valid.'); }
  if (!bytes || !bytes.length) throw new Error('Database Excel kosong.');
  if (bytes.length > PN_EXCEL_MAX_BYTES) throw new Error('Database Excel terlalu besar. Maksimal 20 MB.');
  if (bytes.length < 4 || bytes[0] !== 80 || bytes[1] !== 75 || bytes[2] !== 3 || bytes[3] !== 4) {
    throw new Error('File bukan XLSM/XLSX yang valid.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const oldFile = excelDatabaseCurrentFile_();
    if (initialOnly && oldFile) {
      const oldMeta = excelDatabaseMeta_(oldFile);
      return {
        ok:false,
        code:'MASTER_EXISTS',
        exists:true,
        name:oldMeta.name,
        size:oldMeta.size,
        updatedAt:oldMeta.updatedAt,
        message:'Database Excel utama sudah tersedia di server. Upload baru tidak diizinkan menimpa master.'
      };
    }

    const folder = excelDatabaseFolder_();
    const blob = Utilities.newBlob(bytes, excelDatabaseMime_(name), name);
    const newFile = folder.createFile(blob);
    newFile.setDescription('Database Excel utama Pagar Nusa. Dikelola melalui pagarnusasmksore.com.');
    PropertiesService.getScriptProperties().setProperty(PN_EXCEL_FILE_PROPERTY, newFile.getId());
    if (oldFile) excelDatabaseArchiveOld_(folder, oldFile);

    const meta = excelDatabaseMeta_(newFile);
    adminAudit_('EXCEL_DATABASE_SAVE','OK','Master Excel disimpan oleh ' + admin + ': ' + meta.name + ' (' + meta.size + ' byte).');
    meta.ok = true;
    meta.version = '1';
    meta.message = oldFile ? 'Database Excel pusat berhasil disinkronkan.' : 'Database Excel utama berhasil dibuat.';
    return meta;
  } finally {
    lock.releaseLock();
  }
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

/* MATERI PENGURUS V1 */
function materiSheets_() {
  const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
  let sheet = book.getSheetByName(PN_MATERI_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(PN_MATERI_SHEET_NAME);
    sheet.appendRow(['ID','Judul','Kategori','Deskripsi','Nama File','MIME','Drive File ID','Ukuran Byte','Status','Urutan','Diupload Oleh','Waktu Upload','Jumlah Unduh','Unduh Terakhir']);
    sheet.setFrozenRows(1);
  }
  return {book:book, sheet:sheet};
}

function materiFolder_() {
  const props = PropertiesService.getScriptProperties();
  const saved = String(props.getProperty(PN_MATERI_FOLDER_PROPERTY) || '').trim();
  if (saved) {
    try { return DriveApp.getFolderById(saved); } catch (_) {}
  }
  const folder = DriveApp.createFolder(PN_MATERI_FOLDER_NAME);
  props.setProperty(PN_MATERI_FOLDER_PROPERTY, folder.getId());
  return folder;
}

function materiSecret_() {
  return Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
}

function materiPepper_() {
  const props = PropertiesService.getScriptProperties();
  let value = String(props.getProperty(PN_MATERI_ACCESS_PEPPER_PROPERTY) || '');
  if (!value) {
    value = materiSecret_();
    props.setProperty(PN_MATERI_ACCESS_PEPPER_PROPERTY, value);
  }
  return value;
}

function materiAccessHash_() {
  return String(PropertiesService.getScriptProperties().getProperty(PN_MATERI_ACCESS_PROPERTY) || '');
}

function materiAccessConfigured_() {
  return /^[A-Fa-f0-9]{64}$/.test(materiAccessHash_());
}

function materiHashCode_(code) {
  return sha256Hex_(materiPepper_() + '|' + String(code || ''));
}

function materiSessionKey_(token) {
  return PN_MATERI_SESSION_PREFIX + sha256Hex_(String(token || '')).slice(0,48);
}

function materiClearSessions_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach(function(key){
    if (key.indexOf(PN_MATERI_SESSION_PREFIX) === 0) props.deleteProperty(key);
  });
}

function materiStoreSession_(token) {
  const accessVersion = materiAccessHash_();
  if (!accessVersion) throw new Error('Kode akses pengurus belum dibuat oleh admin.');
  const obj = {issuedAt:Date.now(), version:accessVersion};
  PropertiesService.getScriptProperties().setProperty(materiSessionKey_(token), JSON.stringify(obj));
  try { CacheService.getScriptCache().put(materiSessionKey_(token), JSON.stringify(obj), PN_MATERI_SESSION_SECONDS); } catch (_) {}
}

function materiDeleteSession_(token) {
  const key = materiSessionKey_(token);
  try { CacheService.getScriptCache().remove(key); } catch (_) {}
  PropertiesService.getScriptProperties().deleteProperty(key);
}

function materiRequireSession_(token) {
  throw new Error('Akses kode bersama dinonaktifkan. Gunakan akun email dan password pengurus.');
}

function materiRequireViewer_(data) {
  const adminToken = String(data && data.adminToken || '').trim();
  if (adminToken) {
    requireReviewAdmin_(adminToken);
    return {admin:true};
  }
  materiRequireSession_(data && data.token);
  return {admin:false};
}

function materiLogin_(data) {
  throw new Error('Akses kode bersama dinonaktifkan. Gunakan Portal Pengurus dengan email dan password.');
}

function materiLogout_(data) {
  const token = String(data.token || '').trim();
  if (token) materiDeleteSession_(token);
  return {ok:true, loggedOut:true};
}

function materiAdminSetAccess_(data) {
  const admin = requireReviewAdmin_(data.token);
  const code = String(data.newCode || '');
  if (code.length < 8 || code.length > 80) throw new Error('Kode akses pengurus harus 8–80 karakter.');
  const hash = materiHashCode_(code);
  PropertiesService.getScriptProperties().setProperty(PN_MATERI_ACCESS_PROPERTY, hash);
  materiClearSessions_();
  try { adminAudit_('MATERI_ACCESS','OK','Kode akses pengurus diganti oleh ' + admin + '.'); } catch (_) {}
  return {ok:true, configured:true, message:'Kode akses pengurus berhasil disimpan. Sesi pengurus lama dinonaktifkan.'};
}

function materiSafeFileName_(name) {
  let value = sanitize_(String(name || '').trim()).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,180);
  if (!value) value = 'materi-' + Date.now() + '.bin';
  return value;
}

function materiAllowedFile_(name) {
  return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|jpg|jpeg|png)$/i.test(String(name || ''));
}

function materiDateTime_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v,'Asia/Jakarta',"yyyy-MM-dd'T'HH:mm:ss");
  return String(v || '');
}

function materiObject_(r) {
  return {
    id:String(r[0] || ''),
    title:String(r[1] || ''),
    category:String(r[2] || ''),
    description:String(r[3] || ''),
    fileName:String(r[4] || ''),
    mime:String(r[5] || ''),
    size:Number(r[7] || 0),
    status:String(r[8] || 'AKTIF').toUpperCase(),
    order:Number(r[9] || 999),
    uploadedBy:String(r[10] || ''),
    uploadedAt:materiDateTime_(r[11]),
    downloads:Number(r[12] || 0),
    lastDownload:materiDateTime_(r[13])
  };
}

function materiRead_(includeHidden) {
  const sheet = materiSheets_().sheet;
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2,1,last-1,14).getValues();
  return rows.map(materiObject_).filter(function(x){
    if (!x.id || !x.title || x.status === 'DIHAPUS') return false;
    return includeHidden || x.status === 'AKTIF';
  }).sort(function(a,b){
    return (a.order - b.order) || String(b.uploadedAt).localeCompare(String(a.uploadedAt));
  });
}

function materiList_(data) {
  materiRequireSession_(data.token);
  return {ok:true, items:materiRead_(false), version:'1'};
}

function materiAdminList_(data) {
  const admin = requireReviewAdmin_(data.token);
  return {ok:true, admin:admin, accessConfigured:materiAccessConfigured_(), items:materiRead_(true), version:'1'};
}

function materiFindRow_(id) {
  id = String(id || '').trim();
  if (!id) throw new Error('ID materi tidak tersedia.');
  const sheet = materiSheets_().sheet;
  const last = sheet.getLastRow();
  if (last < 2) throw new Error('Materi tidak ditemukan.');
  const ids = sheet.getRange(2,1,last-1,1).getDisplayValues();
  for (let i=0;i<ids.length;i++) {
    if (String(ids[i][0] || '').trim() === id) {
      const row = i + 2;
      const values = sheet.getRange(row,1,1,14).getValues()[0];
      return {sheet:sheet, row:row, values:values};
    }
  }
  throw new Error('Materi tidak ditemukan.');
}

function materiAdminUpload_(data) {
  const admin = requireReviewAdmin_(data.token);
  const title = sanitize_(String(data.title || '').trim()).slice(0,140);
  const category = sanitize_(String(data.category || '').trim()).slice(0,50);
  const description = sanitize_(String(data.description || '').trim()).slice(0,700);
  const filename = materiSafeFileName_(data.filename);
  const mime = sanitize_(String(data.mime || 'application/octet-stream')).slice(0,120);
  const base64 = String(data.base64 || '').replace(/\s/g,'');
  if (!title) throw new Error('Judul materi wajib diisi.');
  if (!category) throw new Error('Kategori materi wajib diisi.');
  if (!materiAllowedFile_(filename)) throw new Error('Jenis file tidak diizinkan. Gunakan PDF, Word, Excel, PowerPoint, ZIP, JPG, atau PNG.');
  if (!base64) throw new Error('Isi file tidak tersedia.');
  if (base64.length > Math.ceil(PN_MATERI_MAX_BYTES * 4 / 3) + 8192) throw new Error('Ukuran file maksimal 5 MB.');
  let bytes;
  try { bytes = Utilities.base64Decode(base64); } catch (_) { throw new Error('File upload tidak valid.'); }
  if (!bytes || !bytes.length) throw new Error('File upload kosong.');
  if (bytes.length > PN_MATERI_MAX_BYTES) throw new Error('Ukuran file maksimal 5 MB.');

  const folder = materiFolder_();
  const blob = Utilities.newBlob(bytes, mime || 'application/octet-stream', filename);
  const file = folder.createFile(blob);
  try { file.setDescription('Materi khusus pengurus Pagar Nusa SMK Sore: ' + title); } catch (_) {}

  const now = new Date();
  const id = 'MTR-' + now.getTime() + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
  const sheet = materiSheets_().sheet;
  const order = Math.max(1, sheet.getLastRow());
  sheet.appendRow([id,title,category,description,filename,mime,file.getId(),bytes.length,'AKTIF',order,admin,now,0,'']);
  try { adminAudit_('MATERI_UPLOAD','OK',title + ' (' + filename + ')'); } catch (_) {}
  return {ok:true, id:id, title:title, fileName:filename, size:bytes.length, message:'Materi berhasil diupload.'};
}

function materiAdminDelete_(data) {
  const admin = requireReviewAdmin_(data.token);
  const found = materiFindRow_(data.id);
  const fileId = String(found.values[6] || '').trim();
  found.sheet.getRange(found.row,9).setValue('DIHAPUS');
  if (fileId) {
    try { DriveApp.getFileById(fileId).setTrashed(true); } catch (_) {}
  }
  try { adminAudit_('MATERI_DELETE','OK',String(found.values[1] || '') + ' oleh ' + admin); } catch (_) {}
  return {ok:true, id:String(data.id || ''), message:'Materi berhasil dihapus.'};
}

function materiManifest_(data) {
  const viewer = materiRequireViewer_(data);
  const found = materiFindRow_(data.id);
  const obj = materiObject_(found.values);
  if (obj.status === 'DIHAPUS' || (!viewer.admin && obj.status !== 'AKTIF')) throw new Error('Materi tidak tersedia.');
  const fileId = String(found.values[6] || '').trim();
  if (!fileId) throw new Error('File materi tidak ditemukan.');
  const file = DriveApp.getFileById(fileId);
  const size = Number(file.getSize() || obj.size || 0);
  const totalChunks = Math.max(1, Math.ceil(size / PN_MATERI_CHUNK_BYTES));
  const currentDownloads = Number(found.values[12] || 0);
  found.sheet.getRange(found.row,13,1,2).setValues([[currentDownloads + 1,new Date()]]);
  return {ok:true, id:obj.id, fileName:obj.fileName || file.getName(), mime:obj.mime || file.getMimeType(), size:size, totalChunks:totalChunks, chunkBytes:PN_MATERI_CHUNK_BYTES};
}

function materiChunk_(data) {
  const viewer = materiRequireViewer_(data);
  const found = materiFindRow_(data.id);
  const obj = materiObject_(found.values);
  if (obj.status === 'DIHAPUS' || (!viewer.admin && obj.status !== 'AKTIF')) throw new Error('Materi tidak tersedia.');
  const index = Number(data.index);
  if (!Number.isInteger(index) || index < 0) throw new Error('Nomor potongan file tidak valid.');
  const fileId = String(found.values[6] || '').trim();
  if (!fileId) throw new Error('File materi tidak ditemukan.');
  const bytes = DriveApp.getFileById(fileId).getBlob().getBytes();
  const total = Math.max(1, Math.ceil(bytes.length / PN_MATERI_CHUNK_BYTES));
  if (index >= total) throw new Error('Potongan file di luar batas.');
  const start = index * PN_MATERI_CHUNK_BYTES;
  const end = Math.min(bytes.length, start + PN_MATERI_CHUNK_BYTES);
  const part = bytes.slice(start,end);
  return {ok:true, index:index, totalChunks:total, base64:Utilities.base64Encode(part)};
}



/* =========================================================
   PORTAL AKUN PENGURUS V2 — EMAIL + PASSWORD PRIBADI
========================================================= */
function pengurusSheets_() {
  const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
  let accounts = book.getSheetByName(PN_PENGURUS_ACCOUNT_SHEET_NAME);
  let log = book.getSheetByName(PN_PENGURUS_LOG_SHEET_NAME);
  if (!accounts) {
    accounts = book.insertSheet(PN_PENGURUS_ACCOUNT_SHEET_NAME);
    accounts.appendRow(['ID','Nama','Email','Password Salt','Password Hash','Status','Session Hash','Session Issued','Login Terakhir','Dibuat Oleh','Waktu Dibuat','Waktu Update']);
    accounts.setFrozenRows(1);
  }
  if (!log) {
    log = book.insertSheet(PN_PENGURUS_LOG_SHEET_NAME);
    log.appendRow(['Waktu','ID Pengurus','Nama','Email','Aksi','Detail']);
    log.setFrozenRows(1);
  }
  return {book:book, accounts:accounts, log:log};
}

function pengurusPepper_() {
  const props = PropertiesService.getScriptProperties();
  let value = String(props.getProperty(PN_PENGURUS_PEPPER_PROPERTY) || '');
  if (!value) {
    value = materiSecret_();
    props.setProperty(PN_PENGURUS_PEPPER_PROPERTY, value);
  }
  return value;
}

function pengurusNormalizeEmail_(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 160) throw new Error('Format email pengurus tidak valid.');
  return value;
}

function pengurusPasswordHash_(salt, password) {
  return sha256Hex_(pengurusPepper_() + '|' + String(salt || '') + '|' + String(password || ''));
}

function pengurusAccountObject_(r) {
  return {
    id:String(r[0] || ''), name:String(r[1] || ''), email:String(r[2] || ''),
    status:String(r[5] || 'NONAKTIF').toUpperCase(),
    sessionIssued:materiDateTime_(r[7]), lastLogin:materiDateTime_(r[8]),
    createdBy:String(r[9] || ''), createdAt:materiDateTime_(r[10]), updatedAt:materiDateTime_(r[11])
  };
}

function pengurusFindByEmail_(email) {
  const sheet = pengurusSheets_().accounts;
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const emails = sheet.getRange(2,3,last-1,1).getDisplayValues();
  for (let i=0;i<emails.length;i++) {
    if (String(emails[i][0] || '').trim().toLowerCase() === email) {
      const row=i+2;
      return {sheet:sheet,row:row,values:sheet.getRange(row,1,1,12).getValues()[0]};
    }
  }
  return null;
}

function pengurusFindById_(id) {
  id=String(id || '').trim();
  const sheet=pengurusSheets_().accounts;
  const last=sheet.getLastRow();
  if (last < 2) return null;
  const ids=sheet.getRange(2,1,last-1,1).getDisplayValues();
  for (let i=0;i<ids.length;i++) {
    if (String(ids[i][0] || '').trim() === id) {
      const row=i+2;
      return {sheet:sheet,row:row,values:sheet.getRange(row,1,1,12).getValues()[0]};
    }
  }
  return null;
}

function pengurusLog_(account, action, detail) {
  try {
    const log=pengurusSheets_().log;
    log.appendRow([new Date(),String(account.id||''),String(account.name||''),String(account.email||''),String(action||'').slice(0,40),String(detail||'').slice(0,500)]);
  } catch (_) {}
}

function pengurusLoginFailureKey_(email) {
  return 'pn-pengurus-login:' + sha256Hex_(String(email || '')).slice(0,40);
}

function pengurusLogin_(data) {
  const email=pengurusNormalizeEmail_(data.email);
  const password=String(data.password || '');
  if (password.length < 12) throw new Error('Email atau password tidak benar.');
  const cache=CacheService.getScriptCache();
  const failKey=pengurusLoginFailureKey_(email);
  const failures=Number(cache.get(failKey) || 0);
  if (failures >= 8) throw new Error('Terlalu banyak percobaan login. Tunggu sekitar 15 menit.');
  const found=pengurusFindByEmail_(email);
  let valid=false;
  if (found) {
    const status=String(found.values[5] || '').toUpperCase();
    const salt=String(found.values[3] || '');
    const expected=String(found.values[4] || '');
    valid=status === 'AKTIF' && salt && expected && pengurusPasswordHash_(salt,password) === expected;
  }
  if (!valid) {
    cache.put(failKey,String(failures+1),900);
    Utilities.sleep(300);
    throw new Error('Email atau password tidak benar, atau akun sedang nonaktif.');
  }
  try { cache.remove(failKey); } catch (_) {}
  const requested=String(data.token || '').trim();
  const token=/^[A-Fa-f0-9]{64}$/.test(requested) ? requested : materiSecret_();
  const tokenHash=sha256Hex_(token);
  const now=new Date();
  found.sheet.getRange(found.row,7,1,3).setValues([[tokenHash,now,now]]);
  const account=pengurusAccountObject_(found.sheet.getRange(found.row,1,1,12).getValues()[0]);
  pengurusLog_(account,'LOGIN','Login berhasil; sesi sebelumnya akun ini digantikan.');
  return {ok:true,token:token,expiresIn:PN_PENGURUS_SESSION_SECONDS,account:account,version:'2'};
}

function pengurusRequireSession_(token) {
  token=String(token || '').trim();
  if (!/^[A-Fa-f0-9]{64}$/.test(token)) throw new Error('Sesi pengurus tidak valid. Silakan login kembali.');
  const tokenHash=sha256Hex_(token);
  const sheet=pengurusSheets_().accounts;
  const last=sheet.getLastRow();
  if (last < 2) throw new Error('Sesi pengurus tidak ditemukan.');
  const hashes=sheet.getRange(2,7,last-1,1).getDisplayValues();
  for (let i=0;i<hashes.length;i++) {
    if (String(hashes[i][0] || '').trim() !== tokenHash) continue;
    const row=i+2;
    const values=sheet.getRange(row,1,1,12).getValues()[0];
    const status=String(values[5] || '').toUpperCase();
    const issued=values[7] instanceof Date ? values[7].getTime() : new Date(values[7]).getTime();
    if (status !== 'AKTIF' || !issued || Date.now()-issued > PN_PENGURUS_SESSION_SECONDS*1000) {
      sheet.getRange(row,7,1,2).clearContent();
      throw new Error('Sesi pengurus sudah berakhir atau akun telah dinonaktifkan.');
    }
    return {found:{sheet:sheet,row:row,values:values},account:pengurusAccountObject_(values)};
  }
  throw new Error('Sesi pengurus sudah berakhir. Silakan login kembali.');
}

function pengurusLogout_(data) {
  try {
    const auth=pengurusRequireSession_(data.token);
    auth.found.sheet.getRange(auth.found.row,7,1,2).clearContent();
    pengurusLog_(auth.account,'LOGOUT','Keluar dari Portal Pengurus.');
  } catch (_) {}
  return {ok:true,loggedOut:true};
}

function pengurusAdminList_(data) {
  requireReviewAdmin_(data.token);
  const sheet=pengurusSheets_().accounts;
  const last=sheet.getLastRow();
  if (last < 2) return {ok:true,accounts:[],version:'2'};
  const rows=sheet.getRange(2,1,last-1,12).getValues();
  const accounts=rows.map(pengurusAccountObject_).filter(x=>x.id && x.email).sort((a,b)=>String(a.name).localeCompare(String(b.name),'id'));
  return {ok:true,accounts:accounts,version:'2'};
}

function pengurusAdminSave_(data) {
  const admin=requireReviewAdmin_(data.token);
  const id=String(data.id || '').trim();
  const name=sanitize_(String(data.name || '').trim()).slice(0,100);
  const password=String(data.password || '');
  const status=String(data.status || 'AKTIF').trim().toUpperCase();
  if (!name) throw new Error('Nama pengurus wajib diisi.');
  if (!['AKTIF','NONAKTIF'].includes(status)) throw new Error('Status akun tidak valid.');
  const now=new Date();
  let found=id ? pengurusFindById_(id) : null;
  if (id && !found) throw new Error('Akun pengurus tidak ditemukan.');
  if (found) {
    const values=found.values.slice();
    values[1]=name;
    values[5]=status;
    values[11]=now;
    if (password) {
      if (password.length < 12 || password.length > 100) throw new Error('Password harus 12–100 karakter.');
      const salt=materiSecret_();
      values[3]=salt;
      values[4]=pengurusPasswordHash_(salt,password);
      values[6]=''; values[7]='';
    }
    if (status !== 'AKTIF') { values[6]=''; values[7]=''; }
    found.sheet.getRange(found.row,1,1,12).setValues([values]);
    const obj=pengurusAccountObject_(values);
    pengurusLog_(obj,'ADMIN_UPDATE','Akun diperbarui oleh '+admin+'.');
    return {ok:true,account:obj,message:'Akun pengurus berhasil diperbarui.'};
  }
  const email=pengurusNormalizeEmail_(data.email);
  if (pengurusFindByEmail_(email)) throw new Error('Email tersebut sudah digunakan akun pengurus lain.');
  if (password.length < 12 || password.length > 100) throw new Error('Akun baru wajib memakai password 12–100 karakter.');
  const salt=materiSecret_();
  const accountId='PGR-'+now.getTime()+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  const row=[accountId,name,email,salt,pengurusPasswordHash_(salt,password),status,'','', '',admin,now,now];
  const sheet=pengurusSheets_().accounts;
  sheet.appendRow(row);
  const obj=pengurusAccountObject_(row);
  pengurusLog_(obj,'ADMIN_CREATE','Akun dibuat oleh '+admin+'.');
  return {ok:true,account:obj,message:'Akun pengurus berhasil dibuat.'};
}

function pengurusAdminSetStatus_(data) {
  const admin=requireReviewAdmin_(data.token);
  const id=String(data.id || '').trim();
  const status=String(data.status || '').trim().toUpperCase();
  if (!['AKTIF','NONAKTIF'].includes(status)) throw new Error('Status akun tidak valid.');
  const found=pengurusFindById_(id);
  if (!found) throw new Error('Akun pengurus tidak ditemukan.');
  found.sheet.getRange(found.row,6).setValue(status);
  if (status !== 'AKTIF') found.sheet.getRange(found.row,7,1,2).clearContent();
  found.sheet.getRange(found.row,12).setValue(new Date());
  const values=found.sheet.getRange(found.row,1,1,12).getValues()[0];
  const obj=pengurusAccountObject_(values);
  pengurusLog_(obj,'ADMIN_STATUS','Status menjadi '+status+' oleh '+admin+'.');
  return {ok:true,account:obj,message:'Status akun berhasil diperbarui.'};
}

function pengurusMateriList_(data) {
  const auth=pengurusRequireSession_(data.token);
  return {ok:true,account:auth.account,items:materiRead_(false),version:'2'};
}

function pengurusMateriManifest_(data) {
  const auth=pengurusRequireSession_(data.token);
  const found=materiFindRow_(data.id);
  const obj=materiObject_(found.values);
  if (obj.status !== 'AKTIF') throw new Error('Materi tidak tersedia.');
  const fileId=String(found.values[6] || '').trim();
  if (!fileId) throw new Error('File materi tidak ditemukan.');
  const file=DriveApp.getFileById(fileId);
  const size=Number(file.getSize() || obj.size || 0);
  const totalChunks=Math.max(1,Math.ceil(size/PN_MATERI_CHUNK_BYTES));
  const downloadedAt=new Date();
  const traceId='PN-'+Utilities.formatDate(downloadedAt,'Asia/Jakarta','yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();
  const downloads=Number(found.values[12] || 0);
  found.sheet.getRange(found.row,13,1,2).setValues([[downloads+1,downloadedAt]]);
  const resolvedName=obj.fileName||file.getName();
  const resolvedMime=obj.mime||file.getMimeType();
  const pdf=/pdf/i.test(String(resolvedMime||'')) || /\.pdf$/i.test(String(resolvedName||''));
  pengurusLog_(auth.account,pdf?'DOWNLOAD_PDF_WM':'DOWNLOAD','TRACE '+traceId+' | '+obj.title+' | '+resolvedName);
  return {
    ok:true,
    id:obj.id,
    fileName:resolvedName,
    mime:resolvedMime,
    size:size,
    totalChunks:totalChunks,
    chunkBytes:PN_MATERI_CHUNK_BYTES,
    watermark:{
      enabled:pdf,
      name:String(auth.account.name||''),
      email:String(auth.account.email||''),
      downloadedAt:downloadedAt.toISOString(),
      traceId:traceId
    }
  };
}

function pengurusMateriChunk_(data) {
  pengurusRequireSession_(data.token);
  const found=materiFindRow_(data.id);
  const obj=materiObject_(found.values);
  if (obj.status !== 'AKTIF') throw new Error('Materi tidak tersedia.');
  const index=Number(data.index);
  if (!Number.isInteger(index) || index < 0) throw new Error('Nomor potongan file tidak valid.');
  const fileId=String(found.values[6] || '').trim();
  if (!fileId) throw new Error('File materi tidak ditemukan.');
  const bytes=DriveApp.getFileById(fileId).getBlob().getBytes();
  const total=Math.max(1,Math.ceil(bytes.length/PN_MATERI_CHUNK_BYTES));
  if (index >= total) throw new Error('Potongan file di luar batas.');
  const start=index*PN_MATERI_CHUNK_BYTES;
  const end=Math.min(bytes.length,start+PN_MATERI_CHUNK_BYTES);
  return {ok:true,index:index,totalChunks:total,base64:Utilities.base64Encode(bytes.slice(start,end))};
}
