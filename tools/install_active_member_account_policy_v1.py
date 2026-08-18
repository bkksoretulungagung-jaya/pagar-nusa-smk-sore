from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / 'backend' / 'Code.gs'
POLICY = ROOT / 'backend' / 'ActiveMemberAccountPolicyV1.gs'

code = CODE.read_text(encoding='utf-8')
policy = POLICY.read_text(encoding='utf-8').strip()


def replace_between(text, start_marker, end_marker, replacement):
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f'Marker awal tidak ditemukan: {start_marker}')
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit(f'Marker akhir tidak ditemukan: {end_marker}')
    return text[:start] + replacement.rstrip() + '\n\n' + text[end:]

# Versi health backend.
code = re.sub(r"accountAdminPortalVersion:'[0-9]+'", "accountAdminPortalVersion:'4'", code, count=1)

# Helper kebijakan aktif disatukan ke Code.gs agar cukup menyalin satu file.
marker = 'KEBIJAKAN AKUN ANGGOTA AKTIF V1'
if marker not in code:
    code = code.rstrip() + '\n\n' + policy + '\n'

list_function = r'''function portalAccountAdminList_(data) {
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

  const accounts = [];
  const last = biodataSheet.getLastRow();
  const rows = last >= 2 ? biodataSheet.getRange(2,1,last-1,PN_BIODATA_HEADERS.length).getDisplayValues() : [];

  rows.forEach(function(r) {
    if (!portalAccountActiveBiodata_(r[14], r[15])) return;

    const group = portalAccountMembershipGroup_(r[14]);
    const memberId = String(r[0] || '').trim();
    const account = byMemberId[memberId.toLowerCase()] || null;
    const hasFirebaseAccount = !!(account && (String(account.email || '').trim() || String(account.uid || '').trim()));

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
      accountStatus:hasFirebaseAccount ? account.status : 'BELUM ADA',
      hasAccount:hasFirebaseAccount
    });
  });

  accounts.sort(function(a,b) {
    const order = {ANGGOTA:1,CALON:2};
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

  return {
    ok:true,
    admin:admin,
    accounts:accounts,
    summary:summary,
    message:'Hanya Anggota dan Calon Anggota berstatus Aktif pada biodata yang ditampilkan.',
    version:'4'
  };
}'''

code = replace_between(
    code,
    'function portalAccountAdminList_(data) {',
    'function portalAccountFindRow_(book, data) {',
    list_function
)

create_biodata_function = r'''function portalAccountBiodataForCreateV2_(book, memberId) {
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
    if (!portalAccountActiveBiodata_(rows[i][14], rows[i][15])) {
      throw new Error('Akun hanya dapat dibuat untuk Anggota atau Calon Anggota yang masih berstatus Aktif pada biodata.');
    }
    return {
      row:i+2,
      memberId:id,
      name:String(rows[i][1] || '').trim(),
      membershipStatus:String(rows[i][14] || '').trim(),
      membershipGroup:group,
      studentStatus:String(rows[i][15] || '').trim()
    };
  }
  throw new Error('ID Anggota tidak ditemukan pada database biodata.');
}'''

code = replace_between(
    code,
    'function portalAccountBiodataForCreateV2_(book, memberId) {',
    'function portalAccountAdminCreate_(data) {',
    create_biodata_function
)

# Saat login siswa, biodata harus tetap aktif. Akun lama Alumni/Nonaktif tidak dihapus,
# tetapi tidak dapat dipakai login.
login_anchor = "  const savedUid = String(accountSheet.getRange(rowIndex,4).getDisplayValue() || '').trim();\n  if (!savedUid) accountSheet.getRange(rowIndex,4).setValue(uid);\n\n  return {book, accountSheet, accountRow:rowIndex, username, memberId, email, uid};"
login_replacement = "  const savedUid = String(accountSheet.getRange(rowIndex,4).getDisplayValue() || '').trim();\n  if (!savedUid) accountSheet.getRange(rowIndex,4).setValue(uid);\n\n  portalAccountRequireActiveLogin_(book, memberId);\n\n  return {book, accountSheet, accountRow:rowIndex, username, memberId, email, uid};"
if login_anchor in code:
    code = code.replace(login_anchor, login_replacement, 1)
elif 'portalAccountRequireActiveLogin_(book, memberId);' not in code:
    raise SystemExit('Anchor authorizePortalStudent_ tidak ditemukan')

CODE.write_text(code, encoding='utf-8')
print('Kebijakan akun aktif V1 terpasang: hanya Anggota/Calon Anggota aktif yang ditampilkan, dibuatkan akun, dan dapat login.')
