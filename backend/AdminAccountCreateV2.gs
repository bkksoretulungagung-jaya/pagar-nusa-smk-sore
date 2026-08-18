/* =========================================================
   AKUN ANGGOTA ADMIN V2 — BUAT AKUN DARI BIODATA
   Dipasang ke backend/Code.gs oleh installer V2.
========================================================= */

function portalFirebaseCreateUserV2_(email, password) {
  const url = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + encodeURIComponent(PN_FIREBASE_API_KEY);
  const response = UrlFetchApp.fetch(url, {
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify({
      email:String(email || '').trim().toLowerCase(),
      password:String(password || ''),
      returnSecureToken:true
    }),
    muteHttpExceptions:true
  });
  const code = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (_) {}
  if (code < 200 || code >= 300 || !String(body.localId || '').trim()) {
    const detail = String(body && body.error && body.error.message || ('HTTP ' + code));
    if (detail.indexOf('EMAIL_EXISTS') >= 0) throw new Error('Email tersebut sudah digunakan akun Firebase lain.');
    if (detail.indexOf('OPERATION_NOT_ALLOWED') >= 0) throw new Error('Login Email/Password belum diaktifkan pada Firebase Authentication.');
    if (detail.indexOf('WEAK_PASSWORD') >= 0) throw new Error('Password ditolak Firebase karena terlalu lemah.');
    if (detail.indexOf('TOO_MANY_ATTEMPTS') >= 0) throw new Error('Firebase membatasi pembuatan akun sementara. Coba lagi beberapa saat nanti.');
    throw new Error('Firebase gagal membuat akun: ' + detail);
  }
  return {
    uid:String(body.localId || '').trim(),
    idToken:String(body.idToken || '').trim(),
    email:String(body.email || email || '').trim().toLowerCase()
  };
}

function portalFirebaseRollbackCreatedV2_(idToken) {
  idToken = String(idToken || '').trim();
  if (!idToken) return;
  try {
    UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key=' + encodeURIComponent(PN_FIREBASE_API_KEY), {
      method:'post',
      contentType:'application/json',
      payload:JSON.stringify({idToken:idToken}),
      muteHttpExceptions:true
    });
  } catch (_) {}
}

function portalAccountBiodataForCreateV2_(book, memberId) {
  const sheet = book.getSheetByName(PN_BIODATA_SHEET_NAME);
  if (!sheet) throw new Error('Sheet Data Biodata Siswa Anggota tidak ditemukan.');
  const last = sheet.getLastRow();
  if (last < 2) throw new Error('Database biodata masih kosong.');
  const wanted = String(memberId || '').trim().toLowerCase();
  if (!wanted) throw new Error('ID Anggota wajib dipilih.');
  const rows = sheet.getRange(2,1,last-1,PN_BIODATA_HEADERS.length).getDisplayValues();
  for (let i=0; i<rows.length; i++) {
    const id = String(rows[i][0] || '').trim();
    if (id.toLowerCase() !== wanted) continue;
    const group = portalAccountMembershipGroup_(rows[i][14]);
    if (!group) throw new Error('Data tersebut bukan Anggota atau Calon Anggota yang dapat dibuatkan akun portal.');
    return {
      row:i+2,
      memberId:id,
      name:String(rows[i][1] || '').trim(),
      membershipStatus:String(rows[i][14] || '').trim(),
      membershipGroup:group
    };
  }
  throw new Error('ID Anggota tidak ditemukan pada database biodata.');
}

function portalAccountAdminCreate_(data) {
  const admin = requireReviewAdmin_(data.token);
  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const biodata = portalAccountBiodataForCreateV2_(book, data.memberId);
  const username = portalAccountUsername_(data.username);
  const email = portalAccountEmail_(data.email);
  const password = portalAccountPassword_(data.password);
  const status = String(data.status || 'AKTIF').trim().toUpperCase();
  if (status !== 'AKTIF' && status !== 'NONAKTIF') throw new Error('Status akun harus AKTIF atau NONAKTIF.');

  const accountRows = portalAccountRows_(book);
  accountRows.forEach(function(a) {
    if (String(a.memberId || '').trim().toLowerCase() === biodata.memberId.toLowerCase()) {
      throw new Error('ID Anggota tersebut sudah mempunyai akun portal. Muat ulang daftar akun.');
    }
    if (String(a.username || '').trim().toLowerCase() === username.toLowerCase()) {
      throw new Error('Username sudah digunakan akun lain.');
    }
    if (String(a.email || '').trim().toLowerCase() === email) {
      throw new Error('Email sudah digunakan akun lain.');
    }
  });

  const firebase = portalFirebaseCreateUserV2_(email, password);
  const sheet = portalAccountSheet_(book);
  try {
    sheet.appendRow([username,biodata.memberId,email,firebase.uid,status]);
  } catch (err) {
    portalFirebaseRollbackCreatedV2_(firebase.idToken);
    throw new Error('Akun Firebase sempat dibuat tetapi pencatatan ke database gagal dan dibatalkan. ' + String(err && err.message || err));
  }

  try {
    adminAudit_('PORTAL_ACCOUNT_CREATE','OK','Admin ' + admin + ' membuat akun ' + biodata.memberId + ' / ' + username + '. Password tidak dicatat.');
  } catch (_) {}

  return {
    ok:true,
    message:'Akun berhasil dibuat dan langsung terhubung ke Firebase serta database anggota.',
    account:{
      memberId:biodata.memberId,
      name:biodata.name,
      membershipStatus:biodata.membershipStatus,
      membershipGroup:biodata.membershipGroup,
      username:username,
      email:email,
      uid:firebase.uid,
      status:status
    },
    version:'2'
  };
}
