from pathlib import Path

path = Path('backend/Code.gs')
s = path.read_text(encoding='utf-8')

if 'PN_BACKUP_FOLDER_PROPERTY' not in s:
    anchor = "const PN_ADMIN_KDF_ROUNDS = 4096;"
    insert = """const PN_ADMIN_KDF_ROUNDS = 4096;
const PN_BACKUP_FOLDER_PROPERTY = 'PN_BACKUP_FOLDER_ID_V1';
const PN_BACKUP_FOLDER_NAME = 'Pagar Nusa - Backup Otomatis';
const PN_BACKUP_RETENTION_DAYS = 30;
const PN_BACKUP_LOG_SHEET_NAME = 'Log Backup Otomatis';"""
    if anchor not in s:
        raise SystemExit('Anchor konstanta backup tidak ditemukan')
    s = s.replace(anchor, insert, 1)

if "backupAutomatic:true" not in s:
    anchor = "      adminPersistentSessionVersion:'1',"
    insert = """      adminPersistentSessionVersion:'1',
      backupAutomatic:true,
      backupAutomaticVersion:'1',
      backupRetentionDays:PN_BACKUP_RETENTION_DAYS,"""
    if anchor not in s:
        raise SystemExit('Anchor health backup tidak ditemukan')
    s = s.replace(anchor, insert, 1)

marker = '/* ===== BACKUP OTOMATIS HARIAN V1 ===== */'
if marker not in s:
    block = r'''

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
'''
    s = s.rstrip() + block + '\n'

path.write_text(s, encoding='utf-8')
print('Patch backup otomatis harian siap.')
