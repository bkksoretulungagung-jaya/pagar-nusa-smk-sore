from pathlib import Path

p=Path('backend/Code.gs')
text=p.read_text(encoding='utf-8')
orig=text

const_marker="const PN_MATERI_CHUNK_BYTES = 256 * 1024;"
const_add="""
const PN_PENGURUS_ACCOUNT_SHEET_NAME = 'Akun Pengurus';
const PN_PENGURUS_LOG_SHEET_NAME = 'Log Portal Pengurus';
const PN_PENGURUS_PEPPER_PROPERTY = 'PN_PENGURUS_ACCOUNT_PEPPER_V2';
const PN_PENGURUS_SESSION_SECONDS = 21600;
"""
if 'PN_PENGURUS_ACCOUNT_SHEET_NAME' not in text:
    if const_marker not in text: raise SystemExit('materi const marker not found')
    text=text.replace(const_marker,const_marker+const_add,1)

if "pengurusPortal:true" not in text:
    marker="      materiPengurusVersion:'1',"
    if marker not in text: raise SystemExit('health marker not found')
    text=text.replace(marker,marker+"\n      pengurusPortal:true,\n      pengurusPortalVersion:'2',",1)

get_block="""
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

"""
if "action === 'pengurusMateriList'" not in text:
    marker="  if (action === 'contentResult') {"
    if marker not in text: raise SystemExit('doGet contentResult marker not found')
    text=text.replace(marker,get_block+marker,1)

post_block="""
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

"""
if "action === 'pengurusLogin'" not in text:
    marker="    if (action === 'materiLogin') {"
    if marker not in text: raise SystemExit('doPost materiLogin marker not found')
    text=text.replace(marker,post_block+marker,1)

old="'materiAdminDelete'].includes(action)"
new="'materiAdminDelete','pengurusLogin','pengurusLogout','pengurusAdminSave','pengurusAdminSetStatus'].includes(action)"
if old in text:
    text=text.replace(old,new,1)

# Nonaktifkan autentikasi kode bersama lama sepenuhnya.
def replace_between(src,start_marker,end_marker,replacement):
    a=src.find(start_marker)
    if a<0: raise SystemExit('start marker not found: '+start_marker)
    b=src.find(end_marker,a)
    if b<0: raise SystemExit('end marker not found: '+end_marker)
    return src[:a]+replacement+src[b:]

if "Akses kode bersama dinonaktifkan" not in text:
    text=replace_between(text,"function materiRequireSession_(token) {","\nfunction materiRequireViewer_(data) {","""function materiRequireSession_(token) {
  throw new Error('Akses kode bersama dinonaktifkan. Gunakan akun email dan password pengurus.');
}
""")
    text=replace_between(text,"function materiLogin_(data) {","\nfunction materiLogout_(data) {","""function materiLogin_(data) {
  throw new Error('Akses kode bersama dinonaktifkan. Gunakan Portal Pengurus dengan email dan password.');
}
""")

backend=r'''

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
  const downloads=Number(found.values[12] || 0);
  found.sheet.getRange(found.row,13,1,2).setValues([[downloads+1,new Date()]]);
  pengurusLog_(auth.account,'DOWNLOAD',obj.title+' | '+(obj.fileName || file.getName()));
  return {ok:true,id:obj.id,fileName:obj.fileName||file.getName(),mime:obj.mime||file.getMimeType(),size:size,totalChunks:totalChunks,chunkBytes:PN_MATERI_CHUNK_BYTES};
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
'''
if 'PORTAL AKUN PENGURUS V2' not in text:
    text += backend

p.write_text(text,encoding='utf-8')

# Dashboard / admin navigation.
ip=Path('index.html')
idx=ip.read_text(encoding='utf-8')
if 'akun-pengurus.html' not in idx:
    marker='      <a href="materi-pengurus.html" class="materiAdminMenuBtn"'
    pos=idx.find(marker)
    if pos<0: raise SystemExit('admin materi button marker not found')
    button='      <a href="akun-pengurus.html" class="akunPengurusAdminBtn" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#0f766e;color:#fff;border:0;border-radius:9px;padding:9px 12px;font-size:10px;font-weight:900;white-space:nowrap">👥 AKUN PENGURUS</a>\n'
    idx=idx[:pos]+button+idx[pos:]
if 'portalPengurusEntry' not in idx:
    marker='<section id="siteContacts" class="siteContacts"'
    pos=idx.find(marker)
    if pos<0: raise SystemExit('siteContacts marker not found')
    portal='''<div id="portalPengurusEntry" style="display:flex;justify-content:center;padding:18px 14px;background:#f8faf9;border-top:1px solid #d7e4dc"><a href="portal-pengurus.html" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#166534;color:#fff;border-radius:10px;padding:11px 20px;font-size:11px;font-weight:900;box-shadow:0 4px 14px rgba(22,101,52,.16)">🔐 PORTAL PENGURUS</a></div>\n\n'''
    idx=idx[:pos]+portal+idx[pos:]
ip.write_text(idx,encoding='utf-8')

# Halaman kelola materi sekarang admin-only; kode bersama tidak lagi tampil.
mp=Path('materi-pengurus.html')
mt=mp.read_text(encoding='utf-8')
if 'pnMateriAdminOnlyV2' not in mt:
    marker='<body>'
    guard='''<body>\n<style id="pnMateriAdminOnlyV2">#loginCard{display:none!important}</style>\n<script>if(!/^[A-Fa-f0-9]{64}$/.test(String(sessionStorage.getItem('pnReviewAdminToken')||''))){location.replace('portal-pengurus.html');}</script>'''
    if marker not in mt: raise SystemExit('materi body marker not found')
    mt=mt.replace(marker,guard,1)
mp.write_text(mt,encoding='utf-8')

print('Pengurus account portal v2 installed.', 'Code.gs changed=' + str(text!=orig))
