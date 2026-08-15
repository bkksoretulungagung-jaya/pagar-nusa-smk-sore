from pathlib import Path

p = Path('backend/Code.gs')
text = p.read_text(encoding='utf-8')

text = text.replace(
"""      storage:'Google Sheets',
      biodata:true
""",
"""      storage:'Google Sheets',
      biodata:true,
      reviews:true,
      reviewVersion:'5'
"""
)
text = text.replace("reviewVersion:'4'", "reviewVersion:'5'")

# Public review reads use GET/JSONP. This avoids cross-origin POST/iframe
# timeouts on the public dashboard while keeping write/admin actions on POST.
get_marker = """  if (action === 'register') {
"""
get_block = """  if (action === 'reviewPublicList') {
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

"""
if get_block not in text:
    if get_marker not in text:
        raise SystemExit('doGet register marker not found')
    text = text.replace(get_marker, get_block + get_marker, 1)

old_submit = """function reviewSubmit_(data) {
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
"""

new_submit = """function reviewSubmit_(data) {
  const rawName = String(data.name || '').trim().replace(/\\s+/g,' ');
  const rawRole = String(data.role || '').trim();
  const rawMessage = String(data.message || '').trim().replace(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]/g,'');
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
"""

if old_submit in text:
    text = text.replace(old_submit, new_submit)
elif "const rawName = String(data.name || '').trim().replace" not in text:
    raise SystemExit('reviewSubmit_ block not found; backend source changed unexpectedly')

old_public = """function reviewPublicList_() {
  const sheet = reviewSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return {ok:true,reviews:[]};
  const rows = sheet.getRange(2,1,last-1,10).getValues();
  const reviews = rows.filter(r => String(r[6] || '').toUpperCase() === 'DITERBITKAN').map(reviewObject_).reverse();
  return {ok:true,reviews:reviews};
}
"""
new_public = """function reviewPublicList_() {
  const sheet = reviewSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return {ok:true,reviews:[],version:'5'};
  const start = Math.max(2,last-499);
  const rows = sheet.getRange(start,1,last-start+1,10).getValues();
  const reviews = rows
    .filter(r => String(r[6] || '').toUpperCase() === 'DITERBITKAN')
    .map(reviewObject_)
    .reverse()
    .slice(0,100);
  return {ok:true,reviews:reviews,version:'5'};
}
"""
if old_public in text:
    text = text.replace(old_public, new_public)
else:
    text = text.replace("return {ok:true,reviews:[],version:'4'};", "return {ok:true,reviews:[],version:'5'};")
    text = text.replace("return {ok:true,reviews:reviews,version:'4'};", "return {ok:true,reviews:reviews,version:'5'};")

jsonp_helper = """
function jsonp_(obj, callback) {
  const cb = String(callback || '').trim();
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(cb)) {
    return json_({ok:false, message:'Callback JSONP tidak valid.'});
  }
  const payload = JSON.stringify(obj).replace(/</g,'\\u003c').replace(/\\u2028/g,'\\\\u2028').replace(/\\u2029/g,'\\\\u2029');
  return ContentService
    .createTextOutput(cb + '(' + payload + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
"""
if 'function jsonp_(obj, callback)' not in text:
    json_marker = "function json_(obj) {"
    if json_marker not in text:
        raise SystemExit('json_ helper marker not found')
    text = text.replace(json_marker, jsonp_helper + "\n" + json_marker, 1)

p.write_text(text, encoding='utf-8')
print('Backend review v5 GET/JSONP ready.')
