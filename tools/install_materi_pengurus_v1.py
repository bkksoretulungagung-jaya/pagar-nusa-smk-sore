from pathlib import Path

code_path = Path('backend/Code.gs')
index_path = Path('index.html')
code = code_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')

# ---------- Backend constants ----------
const_anchor = "const PN_GALLERY_SHEET_NAME = 'Galeri Website';\n"
const_block = """const PN_MATERI_SHEET_NAME = 'Materi Pengurus';
const PN_MATERI_FOLDER_PROPERTY = 'PN_MATERI_FOLDER_ID_V1';
const PN_MATERI_FOLDER_NAME = 'Pagar Nusa - Materi Pengurus';
const PN_MATERI_ACCESS_PROPERTY = 'PN_MATERI_ACCESS_HASH_V1';
const PN_MATERI_ACCESS_PEPPER_PROPERTY = 'PN_MATERI_ACCESS_PEPPER_V1';
const PN_MATERI_SESSION_PREFIX = 'PN_MATERI_SESSION_V1_';
const PN_MATERI_SESSION_SECONDS = 21600;
const PN_MATERI_MAX_BYTES = 5 * 1024 * 1024;
const PN_MATERI_CHUNK_BYTES = 256 * 1024;
"""
if "const PN_MATERI_SHEET_NAME" not in code:
    if const_anchor not in code:
        raise SystemExit('Backend constant anchor not found')
    code = code.replace(const_anchor, const_anchor + const_block, 1)

# ---------- Health capability ----------
health_anchor = "      contentVersion:'1',\n"
health_block = "      materiPengurus:true,\n      materiPengurusVersion:'1',\n"
if "materiPengurusVersion:'1'" not in code and health_anchor in code:
    code = code.replace(health_anchor, health_anchor + health_block, 1)

# ---------- doGet routes ----------
get_anchor = "  if (action === 'contentResult') {\n"
get_block = """  if (action === 'materiList') {
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

"""
if "action === 'materiList'" not in code:
    if get_anchor not in code:
        raise SystemExit('doGet contentResult anchor not found')
    code = code.replace(get_anchor, get_block + get_anchor, 1)

# ---------- doPost routes ----------
post_anchor = "    if (action === 'contentAdminLogin') {\n"
post_block = """    if (action === 'materiLogin') {
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

"""
if "action === 'materiAdminUpload'" not in code:
    if post_anchor not in code:
        raise SystemExit('doPost contentAdminLogin anchor not found')
    code = code.replace(post_anchor, post_block + post_anchor, 1)

catch_old = "if (['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword','adminPasswordRecover'].includes(action)) {"
catch_new = "if (['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword','adminPasswordRecover','materiLogin','materiLogout','materiAdminSetAccess','materiAdminUpload','materiAdminDelete'].includes(action)) {"
if catch_old in code:
    code = code.replace(catch_old, catch_new, 1)

# ---------- Backend implementation ----------
backend_marker = '/* MATERI PENGURUS V1 */'
backend_block = r'''

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
  token = String(token || '').trim();
  if (!/^[A-Fa-f0-9]{64}$/.test(token)) throw new Error('Sesi pengurus tidak valid. Silakan masuk kembali.');
  const key = materiSessionKey_(token);
  let raw = '';
  try { raw = CacheService.getScriptCache().get(key) || ''; } catch (_) {}
  if (!raw) raw = String(PropertiesService.getScriptProperties().getProperty(key) || '');
  if (!raw) throw new Error('Sesi pengurus sudah berakhir. Silakan masuk kembali.');
  let obj = null;
  try { obj = JSON.parse(raw); } catch (_) {}
  const issuedAt = Number(obj && obj.issuedAt || 0);
  const version = String(obj && obj.version || '');
  if (!issuedAt || Date.now() - issuedAt > PN_MATERI_SESSION_SECONDS * 1000 || version !== materiAccessHash_()) {
    materiDeleteSession_(token);
    throw new Error('Sesi pengurus sudah berakhir atau kode akses telah diganti.');
  }
  try { CacheService.getScriptCache().put(key, raw, PN_MATERI_SESSION_SECONDS); } catch (_) {}
  return true;
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
  if (!materiAccessConfigured_()) throw new Error('Kode akses pengurus belum dibuat oleh admin.');
  const code = String(data.code || '');
  if (code.length < 8 || materiHashCode_(code) !== materiAccessHash_()) {
    Utilities.sleep(250);
    throw new Error('Kode akses pengurus tidak benar.');
  }
  const requested = String(data.token || '').trim();
  const token = /^[A-Fa-f0-9]{64}$/.test(requested) ? requested : materiSecret_();
  materiStoreSession_(token);
  return {ok:true, token:token, expiresIn:PN_MATERI_SESSION_SECONDS, version:'1'};
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
'''
if backend_marker not in code:
    code = code.rstrip() + backend_block + '\n'

# ---------- Homepage promo ----------
style_marker = '/* MATERI PENGURUS PROMO V1 */'
promo_style = """
<style>
/* MATERI PENGURUS PROMO V1 */
.materiPengurusPromo{max-width:1180px;margin:18px auto;padding:16px 18px;background:linear-gradient(135deg,#14532d,#166534);border:1px solid #1d6b3f;border-radius:14px;box-shadow:0 7px 20px rgba(20,83,45,.15);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px}
.materiPengurusPromo h2{margin:0 0 4px;font-size:16px;color:#fff}.materiPengurusPromo p{margin:0;color:#dcfce7;font-size:11px;line-height:1.55}.materiPengurusPromo a{flex:0 0 auto;text-decoration:none;background:#fff;color:#14532d;border-radius:9px;padding:10px 13px;font-size:10px;font-weight:1000;box-shadow:0 3px 10px rgba(0,0,0,.12)}
@media(max-width:680px){.materiPengurusPromo{margin:14px 10px;display:block}.materiPengurusPromo a{display:inline-flex;margin-top:11px}}
</style>
"""
if style_marker not in index:
    if '</head>' not in index:
        raise SystemExit('index head end not found')
    index = index.replace('</head>', promo_style + '</head>', 1)

promo_marker = 'id="materiPengurusPromo"'
promo_html = """
  <section id="materiPengurusPromo" class="materiPengurusPromo" aria-label="Materi khusus pengurus">
    <div><h2>📚 MATERI EKSTRA KHUSUS PENGURUS</h2><p>Download modul latihan, administrasi, dan materi organisasi. Akses dilindungi kode pengurus dan file tersimpan privat.</p></div>
    <a href="materi-pengurus.html">BUKA MATERI PENGURUS →</a>
  </section>
"""
news_anchor = '  <section id="newsSection" class="newsSection" aria-label="Kabar dan informasi terbaru">\n'
if promo_marker not in index:
    if news_anchor not in index:
        raise SystemExit('index news section anchor not found')
    index = index.replace(news_anchor, promo_html + '\n' + news_anchor, 1)

code_path.write_text(code, encoding='utf-8')
index_path.write_text(index, encoding='utf-8')
print('Materi Pengurus v1 backend + homepage promo installed.')
