/* =========================================================
   KEBIJAKAN AKUN ANGGOTA AKTIF V1
   Hanya Anggota / Calon Anggota dengan Status Siswa AKTIF
   yang boleh ditampilkan, dibuatkan akun, dan login portal.
========================================================= */

function portalAccountActiveBiodata_(membershipStatus, studentStatus) {
  const membership = String(membershipStatus || '').trim().toUpperCase();
  const student = String(studentStatus || '').trim().toUpperCase();
  const group = portalAccountMembershipGroup_(membershipStatus);

  if (!group) return false;
  if (membership.indexOf('ALUMNI') >= 0) return false;
  if (membership.indexOf('NONAKTIF') >= 0 || membership.indexOf('NON AKTIF') >= 0) return false;
  return student === 'AKTIF';
}

function portalAccountRequireActiveLogin_(book, memberId) {
  const sheet = book.getSheetByName(PN_BIODATA_SHEET_NAME);
  if (!sheet) throw new Error('Sheet Data Biodata Siswa Anggota tidak ditemukan.');

  const wanted = String(memberId || '').trim().toLowerCase();
  const last = sheet.getLastRow();
  if (!wanted || last < 2) throw new Error('Biodata anggota aktif tidak ditemukan.');

  const rows = sheet.getRange(2,1,last-1,PN_BIODATA_HEADERS.length).getDisplayValues();
  for (let i = 0; i < rows.length; i++) {
    const id = String(rows[i][0] || '').trim().toLowerCase();
    if (id !== wanted) continue;
    if (!portalAccountActiveBiodata_(rows[i][14], rows[i][15])) {
      throw new Error('Akun portal hanya dapat digunakan oleh Anggota atau Calon Anggota yang masih berstatus Aktif pada biodata.');
    }
    return true;
  }

  throw new Error('Biodata anggota aktif tidak ditemukan. Hubungi Admin.');
}
