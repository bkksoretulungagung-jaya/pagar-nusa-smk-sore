function portalAccountMembershipGroup_(value) {
  const text = String(value || '').trim().toUpperCase();
  if (text.indexOf('CALON') >= 0) return 'CALON';
  if (text.indexOf('ANGGOTA') >= 0) return 'ANGGOTA';
  return '';
}

function portalAccountSheet_(book) {
  const sheet = book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!sheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');
  return sheet;
}

function portalAccountRows_(book) {
  const sheet = portalAccountSheet_(book);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2,1,last-1,5).getDisplayValues().map(function(r, i) {
    return {
      row:i + 2,
      username:String(r[0] || '').trim(),
      memberId:String(r[1] || '').trim(),
      email:String(r[2] || '').trim().toLowerCase(),
      uid:String(r[3] || '').trim(),
      status:String(r[4] || 'AKTIF').trim().toUpperCase() || 'AKTIF'
    };
  });
}

function portalAccountAdminList_(data) {
  const admin = requireReviewAdmin_(data.token);
  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const biodataSheet = book.getSheetByName(PN_BIODATA_SHEET_NAME);
  if (!biodataSheet) throw new Error('Sheet Data Biodata Siswa Anggota tidak ditemukan.');

  const accountRows = portalAccountRows_(book);
  const byMemberId = {};
  accountRows.forEach(function(a) {
    const key = String(a.memberId || '').trim().toLowerCase();
    if (key && !byMemberId[key]) byMemberId[key] = a;
  });

  const usedRows = {};
  const accounts = [];
  const last = biodataSheet.getLastRow();
  const rows = last >= 2 ? biodataSheet.getRange(2,1,last-1,PN_BIODATA_HEADERS.length).getDisplayValues() : [];

  rows.forEach(function(r) {
    const group = portalAccountMembershipGroup_(r[14]);
    if (!group) return;
    const memberId = String(r[0] || '').trim();
    const account = byMemberId[memberId.toLowerCase()] || null;
    if (account) usedRows[account.row] = true;
    accounts.push({
      accountRow:account ? account.row : 0,
      memberId:memberId,
      name:String(r[1] || '').trim(),
      className:String(r[5] || '').trim(),
      program:String(r[6] || '').trim(),
      membershipStatus:String(r[14] || '').trim(),
      membershipGroup:group,
      studentStatus:String(r[15] || '').trim(),
      username:account ? account.username : '',
      email:account ? account.email : '',
      uid:account ? account.uid : '',
      accountStatus:account ? account.status : 'BELUM ADA',
      hasAccount:!!account
    });
  });

  accountRows.forEach(function(account) {
    if (usedRows[account.row]) return;
    accounts.push({
      accountRow:account.row,
      memberId:account.memberId,
      name:'(Biodata tidak ditemukan)',
      className:'',
      program:'',
      membershipStatus:'Akun tanpa biodata',
      membershipGroup:'LAINNYA',
      studentStatus:'',
      username:account.username,
      email:account.email,
      uid:account.uid,
      accountStatus:account.status,
      hasAccount:true
    });
  });

  accounts.sort(function(a,b) {
    const order = {ANGGOTA:1,CALON:2,LAINNYA:3};
    const diff = (order[a.membershipGroup] || 9) - (order[b.membershipGroup] || 9);
    if (diff) return diff;
    return String(a.name || a.username || a.memberId).localeCompare(String(b.name || b.username || b.memberId),'id');
  });

  const summary = {
    total:accounts.length,
    anggota:accounts.filter(function(x){ return x.membershipGroup === 'ANGGOTA'; }).length,
    calon:accounts.filter(function(x){ return x.membershipGroup === 'CALON'; }).length,
    activeAccounts:accounts.filter(function(x){ return x.hasAccount && x.accountStatus === 'AKTIF'; }).length,
    missingAccounts:accounts.filter(function(x){ return !x.hasAccount; }).length
  };

  return {ok:true,admin:admin,accounts:accounts,summary:summary,message:'Database akun Anggota dan Calon Anggota berhasil dimuat.',version:'1'};
}

function portalAccountFindRow_(book, data) {
  const sheet = portalAccountSheet_(book);
  const rowNumber = Number(data.accountRow || 0);
  const requestedMemberId = String(data.memberId || '').trim().toLowerCase();

  if (rowNumber >= 2 && rowNumber <= sheet.getLastRow()) {
    const values = sheet.getRange(rowNumber,1,1,5).getDisplayValues()[0];
    const memberId = String(values[1] || '').trim().toLowerCase();
    if (!requestedMemberId || memberId === requestedMemberId) {
      return {
        sheet:sheet,row:rowNumber,
        username:String(values[0] || '').trim(),
        memberId:String(values[1] || '').trim(),
        email:String(values[2] || '').trim().toLowerCase(),
        uid:String(values[3] || '').trim(),
        status:String(values[4] || 'AKTIF').trim().toUpperCase() || 'AKTIF'
      };
    }
  }

  const rows = portalAccountRows_(book);
  for (let i=0; i<rows.length; i++) {
    if (requestedMemberId && rows[i].memberId.toLowerCase() === requestedMemberId) return Object.assign({sheet:sheet}, rows[i]);
  }
  throw new Error('Akun anggota tidak ditemukan pada database Akun Portal Siswa.');
}

function portalAccountEmail_(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Format email akun tidak valid.');
  return email;
}

function portalAccountUsername_(value) {
  const username = String(value || '').trim();
  if (!/^[A-Za-z0-9._-]{3,80}$/.test(username)) throw new Error('Username minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus.');
  return username;
}

function portalAccountAdminUpdate_(data) {
  const admin = requireReviewAdmin_(data.token);
  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const found = portalAccountFindRow_(book, data);
  const username = portalAccountUsername_(data.username);
  const email = portalAccountEmail_(data.email);
  const status = String(data.status || 'AKTIF').trim().toUpperCase();
  if (status !== 'AKTIF' && status !== 'NONAKTIF') throw new Error('Status akun harus AKTIF atau NONAKTIF.');

  const rows = portalAccountRows_(book);
  rows.forEach(function(a) {
    if (a.row === found.row) return;
    if (a.username.toLowerCase() === username.toLowerCase()) throw new Error('Username sudah digunakan akun lain.');
    if (a.email && a.email === email) throw new Error('Email sudah digunakan akun lain.');
  });

  let uid = found.uid;
  if (email !== found.email) {
    uid = portalFirebaseLookupUid_(found.email, found.uid);
    portalFirebaseAdminRequest_('update', {localId:uid,email:email});
  }

  found.sheet.getRange(found.row,1,1,5).setValues([[username,found.memberId,email,uid,status]]);
  try { adminAudit_('PORTAL_ACCOUNT_UPDATE','OK','Admin ' + admin + ' memperbarui akun ' + found.memberId + ' / ' + username + '.'); } catch (_) {}
  return {ok:true,message:'Data akun berhasil diperbarui.',account:{row:found.row,username:username,memberId:found.memberId,email:email,uid:uid,status:status},version:'1'};
}
