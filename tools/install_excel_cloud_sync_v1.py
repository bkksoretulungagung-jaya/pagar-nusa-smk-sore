from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
code_path = ROOT / 'backend' / 'Code.gs'
index_path = ROOT / 'index.html'

code = code_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')

CONST_MARK = "const PN_EXCEL_FOLDER_PROPERTY = 'PN_EXCEL_FOLDER_ID_V1';"
if CONST_MARK not in code:
    anchor = "const PN_BACKUP_LOG_SHEET_NAME = 'Log Backup Otomatis';"
    addition = """const PN_EXCEL_FOLDER_PROPERTY = 'PN_EXCEL_FOLDER_ID_V1';
const PN_EXCEL_FILE_PROPERTY = 'PN_EXCEL_MASTER_FILE_ID_V1';
const PN_EXCEL_FOLDER_NAME = 'Pagar Nusa - Database Excel Utama';
const PN_EXCEL_MAX_BYTES = 20 * 1024 * 1024;
const PN_EXCEL_MAX_BASE64_CHARS = 28 * 1024 * 1024;
const PN_EXCEL_BACKUP_PREFIX = 'PN_EXCEL_BACKUP_';
const PN_EXCEL_BACKUP_KEEP = 5;"""
    if anchor not in code:
        raise SystemExit('Anchor konstanta backend tidak ditemukan')
    code = code.replace(anchor, anchor + '\n' + addition, 1)

if 'excelCloudVersion' not in code:
    anchor = "      backupRetentionDays:PN_BACKUP_RETENTION_DAYS,\n      adminNotificationCenter:true,"
    replacement = "      backupRetentionDays:PN_BACKUP_RETENTION_DAYS,\n      excelCloud:true,\n      excelCloudVersion:'1',\n      adminNotificationCenter:true,"
    if anchor not in code:
        raise SystemExit('Anchor health backend tidak ditemukan')
    code = code.replace(anchor, replacement, 1)

if "action === 'databaseGet'" not in code:
    anchor = """    if (action === 'register') {
      return json_(saveRegistration_(data));
    }

    if (action === 'biodataGet') {"""
    replacement = """    if (action === 'register') {
      return json_(saveRegistration_(data));
    }

    if (action === 'databaseGet') {
      result = excelDatabaseGet_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-database');
    }

    if (action === 'databaseSave') {
      result = excelDatabaseSave_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-database');
    }

    if (action === 'biodataGet') {"""
    if anchor not in code:
        raise SystemExit('Anchor doPost backend tidak ditemukan')
    code = code.replace(anchor, replacement, 1)

if "['databaseGet','databaseSave'].includes(action)" not in code:
    anchor = """    if (action === 'biodataGet' || action === 'biodataUpdate') {
      return iframeResult_(result, 'pn-biodata');
    }"""
    replacement = """    if (['databaseGet','databaseSave'].includes(action)) {
      return iframeResult_(result, 'pn-database');
    }
    if (action === 'biodataGet' || action === 'biodataUpdate') {
      return iframeResult_(result, 'pn-biodata');
    }"""
    if anchor not in code:
        raise SystemExit('Anchor catch backend tidak ditemukan')
    code = code.replace(anchor, replacement, 1)

BACKEND_MARK = '/* ===== EXCEL CLOUD DATABASE V1 ===== */'
if BACKEND_MARK not in code:
    block = r'''
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
  return {
    exists:true,
    fileId:file.getId(),
    name:file.getName(),
    mimeType:blob.getContentType() || excelDatabaseMime_(file.getName()),
    size:blob.getBytes().length,
    updatedAt:Utilities.formatDate(file.getLastUpdated(), 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss")
  };
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

'''
    anchor = 'function sha256Hex_(text) {'
    if anchor not in code:
        raise SystemExit('Anchor helper backend tidak ditemukan')
    code = code.replace(anchor, block + anchor, 1)

script_tag = '<script src="js/database-cloud-v1.js?v=1"></script>'
if script_tag not in index:
    anchor = '<script src="js/part7.js?v=28"></script>'
    if anchor not in index:
        raise SystemExit('Anchor script index tidak ditemukan')
    index = index.replace(anchor, anchor + '\n' + script_tag, 1)

old_note = 'Login ini menjaga akses antarmuka admin pada situs statis. Database Excel tetap disimpan pada perangkat/browser dan tidak diunggah ke GitHub.'
new_note = 'Login ini menjaga akses admin. Database Excel utama disimpan privat melalui server Google Apps Script/Google Drive; setelah upload pertama, perangkat lain cukup login admin untuk memakai database yang sama.'
if old_note in index:
    index = index.replace(old_note, new_note, 1)

code_path.write_text(code, encoding='utf-8')
index_path.write_text(index, encoding='utf-8')
print('Excel Cloud Sync V1 terpasang pada backend/Code.gs dan index.html')
