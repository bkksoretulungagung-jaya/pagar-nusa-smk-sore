const PN_SPREADSHEET_ID = '1WBpDiXDeVCKiAKWze7Dh_J-jG8t8_PAApGkAsBEchtc';
const PN_SHEET_NAME = 'Data Daftar Siswa Baru';
const PN_ALLOWED_ORIGIN = 'https://www.pagarnusasmksore.com';
const PN_CONSENT = 'Saya bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa. Saya Siap dan bersedia mengikuti Ekstrakurikuler Pencak Silat Pagar Nusa Rayon SMK Sore Tulungagung, dan Sudah dapat izin dari kedua orang tua.';
const PN_MAJORS = ['DPIB','TITL','TPM','TKR','TP','TSM','TEI','TKJ'];

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'health');
  if (action === 'health') return json_({ok:true, service:'Pagar Nusa Registration API', storage:'Google Sheets'});
  return json_({ok:false, message:'Action tidak dikenal.'});
}

function doPost(e) {
  try {
    const data = parseBody_(e);
    if (String(data.action || 'register') !== 'register') return json_({ok:false, message:'Action tidak dikenal.'});
    const row = validateRegistration_(data);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = SpreadsheetApp.openById(PN_SPREADSHEET_ID).getSheetByName(PN_SHEET_NAME);
      if (!sheet) throw new Error('Sheet database pendaftaran tidak ditemukan.');
      if (isDuplicate_(sheet, row[0], row[7])) return json_({ok:false, code:'DUPLICATE', message:'Nama dan nomor WA tersebut sudah terdaftar.'});
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return json_({ok:true, message:'Pendaftaran tersimpan permanen.'});
  } catch (err) {
    return json_({ok:false, message:String(err && err.message || err)});
  }
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
  if (!name || !place || !date || !kelas || !major || !address || !parent || !wa || !email || !willing) throw new Error('Data pendaftaran belum lengkap.');
  if (!['X','XI','XII'].includes(kelas)) throw new Error('Kelas tidak valid.');
  if (!PN_MAJORS.includes(major)) throw new Error('Jurusan tidak valid.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Alamat email tidak valid.');
  if (!/^[0-9+() .-]{8,20}$/.test(wa)) throw new Error('Nomor WA tidak valid.');
  return [name, place, date, kelas, major, address, parent, wa, email, 'Bersedia dan sudah mendapat izin orang tua', PN_CONSENT, new Date()];
}

function sanitize_(s) {
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

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
