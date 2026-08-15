from pathlib import Path

INDEX = Path('index.html')
CODE = Path('backend/Code.gs')

index = INDEX.read_text(encoding='utf-8')
script_tag = '<script src="js/reviews-moderation-v2.js?v=2"></script>'
if script_tag not in index:
    if '</body>' not in index:
        raise SystemExit('index.html: </body> tidak ditemukan')
    index = index.replace('</body>', script_tag + '\n</body>', 1)
    INDEX.write_text(index, encoding='utf-8')

code = CODE.read_text(encoding='utf-8')

if "const PN_REVIEW_SHEET_NAME" not in code:
    const_marker = "const PN_SHEET_NAME = 'Data Daftar Siswa Baru';"
    if const_marker not in code:
        raise SystemExit('backend/Code.gs: konstanta marker tidak ditemukan')
    consts = """
const PN_REVIEW_SHEET_NAME = 'Ulasan Website';
const PN_REVIEW_ADMIN_USER = 'admin';
const PN_REVIEW_ADMIN_PASS_HASH = '3b396371ec891e73db1ecb5f70d341c4fe6cc6f52fdea96d55dc3fe786d3a639';
""".strip()
    code = code.replace(const_marker, const_marker + '\n' + consts, 1)

    do_post_pos = code.find('function doPost(e)')
    if do_post_pos < 0:
        raise SystemExit('backend/Code.gs: doPost tidak ditemukan')
    unknown_marker = "    return json_({ok:false, message:'Action tidak dikenal.'});"
    unknown_pos = code.find(unknown_marker, do_post_pos)
    if unknown_pos < 0:
        raise SystemExit('backend/Code.gs: marker action doPost tidak ditemukan')

    routes = r"""
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

"""
    code = code[:unknown_pos] + routes + code[unknown_pos:]

    catch_old = "    if (action === 'biodataGet' || action === 'biodataUpdate') {\n      return iframeResult_(result, 'pn-biodata');\n    }"
    catch_new = """    if (action === 'biodataGet' || action === 'biodataUpdate') {
      return iframeResult_(result, 'pn-biodata');
    }
    if (['reviewSubmit','reviewPublicList','reviewAdminLogin','reviewAdminList','reviewModerate'].includes(action)) {
      return iframeResult_(result, 'pn-reviews');
    }"""
    do_post_pos = code.find('function doPost(e)')
    catch_pos = code.find(catch_old, do_post_pos)
    if catch_pos < 0:
        raise SystemExit('backend/Code.gs: catch doPost tidak ditemukan')
    code = code[:catch_pos] + catch_new + code[catch_pos+len(catch_old):]

    review_backend = r'''
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
  const name = sanitize_(String(data.name || '').trim());
  const role = sanitize_(String(data.role || '').trim());
  const rating = Number(data.rating || 0);
  const message = sanitize_(String(data.message || '').trim());
  const allowedRoles = ['Anggota','Alumni','Siswa','Orang Tua/Wali'];
  if (!name || name.length > 60) throw new Error('Nama wajib diisi dan maksimal 60 karakter.');
  if (!allowedRoles.includes(role)) throw new Error('Status pengirim tidak valid.');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Rating harus 1 sampai 5.');
  if (!message || message.length > 500) throw new Error('Ulasan wajib diisi dan maksimal 500 karakter.');

  const id = 'RVW-' + new Date().getTime() + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    reviewSheet_().appendRow([id,new Date(),name,role,rating,message,'PENDING','','','']);
  } finally {
    lock.releaseLock();
  }
  return {ok:true,id:id,status:'PENDING',message:'Ulasan masuk antrean verifikasi admin.'};
}

function reviewPublicList_() {
  const sheet = reviewSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return {ok:true,reviews:[]};
  const rows = sheet.getRange(2,1,last-1,10).getValues();
  const reviews = rows.filter(r => String(r[6] || '').toUpperCase() === 'DITERBITKAN').map(reviewObject_).reverse();
  return {ok:true,reviews:reviews};
}

function reviewAdminLogin_(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');
  if (username !== PN_REVIEW_ADMIN_USER || sha256Hex_(password) !== PN_REVIEW_ADMIN_PASS_HASH) {
    throw new Error('Login admin verifikasi tidak valid.');
  }
  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('pn-review-admin:' + token, username, 21600);
  return {ok:true,token:token,expiresIn:21600};
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

'''
    iframe_marker = 'function iframeResult_(obj, source) {'
    iframe_pos = code.find(iframe_marker)
    if iframe_pos < 0:
        raise SystemExit('backend/Code.gs: iframeResult marker tidak ditemukan')
    code = code[:iframe_pos] + review_backend + code[iframe_pos:]
    CODE.write_text(code, encoding='utf-8')

print('Review moderation admin installed.')
