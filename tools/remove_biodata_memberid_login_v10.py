from pathlib import Path

# --- Frontend biodata.html ---
path = Path('biodata.html')
text = path.read_text(encoding='utf-8')

text = text.replace(
    'Masukkan Username, ID Anggota, email, dan password akun masing-masing.',
    'Masukkan Username, email, dan password akun masing-masing.'
)

member_row = '      <div class="formRow"><label for="memberId">ID Anggota</label><input id="memberId" type="text" autocomplete="off" placeholder="Contoh: PN-2026-001" required></div>\n'
text = text.replace(member_row, '')

old_load = "async function loadBio(loginUsername=currentUsername,loginMemberId=currentMemberId,loginUser=user){if(!loginUser)throw new Error('Sesi Firebase belum tersedia.');const token=await loginUser.getIdToken(true);if(!loginUsername||!loginMemberId||!token)throw new Error('Data login lokal belum lengkap.');const r=await request('biodataGet',{username:loginUsername,memberId:loginMemberId,idToken:token});currentUsername=loginUsername;currentMemberId=loginMemberId;user=loginUser;render(r.biodata);renderUkt(r.ukt);$('studentName').textContent=r.biodata?.name||'Anggota';$('studentIdentity').textContent=(r.account?.memberId||loginMemberId)+' · '+(r.account?.email||loginUser.email||'');$('loginView').classList.add('hidden');$('portalView').classList.remove('hidden')}"
new_load = "async function loadBio(loginUsername=currentUsername,loginUser=user){if(!loginUser)throw new Error('Sesi Firebase belum tersedia.');const token=await loginUser.getIdToken(true);if(!loginUsername||!token)throw new Error('Data login lokal belum lengkap.');const r=await request('biodataGet',{username:loginUsername,idToken:token});currentUsername=loginUsername;currentMemberId=String(r.account?.memberId||r.biodata?.memberId||'').trim();if(!currentMemberId)throw new Error('ID Anggota untuk akun ini belum terhubung. Hubungi admin.');user=loginUser;render(r.biodata);renderUkt(r.ukt);$('studentName').textContent=r.biodata?.name||'Anggota';$('studentIdentity').textContent=currentMemberId+' · '+(r.account?.email||loginUser.email||'');$('loginView').classList.add('hidden');$('portalView').classList.remove('hidden')}"
if old_load not in text:
    raise SystemExit('Pola loadBio lama tidak ditemukan')
text = text.replace(old_load, new_load)

old_submit = "$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';if(!endpointReady()){ $('loginError').textContent='Web App biodata belum diaktifkan.';return}const loginUsername=$('username').value.trim();const loginMemberId=$('memberId').value.trim();const loginEmail=$('email').value.trim();if(!loginUsername||!loginMemberId||!loginEmail){$('loginError').textContent='Username, ID Anggota, dan email wajib diisi.';return}loginInFlight=true;try{$('loginBtn').disabled=true;const cred=await signInWithEmailAndPassword(auth,loginEmail,$('password').value);await loadBio(loginUsername,loginMemberId,cred.user);sessionStorage.setItem('pnBioUsername',loginUsername);sessionStorage.setItem('pnBioMemberId',loginMemberId)}catch(err){sessionStorage.removeItem('pnBioUsername');sessionStorage.removeItem('pnBioMemberId');$('loginError').textContent=loginErrorText(err);try{await signOut(auth)}catch(_){}}finally{loginInFlight=false;$('loginBtn').disabled=false}});"
new_submit = "$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';if(!endpointReady()){ $('loginError').textContent='Web App biodata belum diaktifkan.';return}const loginUsername=$('username').value.trim();const loginEmail=$('email').value.trim();if(!loginUsername||!loginEmail){$('loginError').textContent='Username dan email wajib diisi.';return}loginInFlight=true;try{$('loginBtn').disabled=true;const cred=await signInWithEmailAndPassword(auth,loginEmail,$('password').value);await loadBio(loginUsername,cred.user);sessionStorage.setItem('pnBioUsername',loginUsername);sessionStorage.setItem('pnBioMemberId',currentMemberId)}catch(err){sessionStorage.removeItem('pnBioUsername');sessionStorage.removeItem('pnBioMemberId');$('loginError').textContent=loginErrorText(err);try{await signOut(auth)}catch(_){}}finally{loginInFlight=false;$('loginBtn').disabled=false}});"
if old_submit not in text:
    raise SystemExit('Pola submit login lama tidak ditemukan')
text = text.replace(old_submit, new_submit)
text = text.replace('Portal Biodata aktif · UKT 1–5 + ASPEL · versi 9.', 'Portal Biodata aktif · UKT 1–5 + ASPEL · versi 10.')

path.write_text(text, encoding='utf-8')

# --- Backend backend/Biodata.gs ---
path = Path('backend/Biodata.gs')
text = path.read_text(encoding='utf-8')

old_auth = """function authorizePortalStudent_(data) {
  const username = String(data.username || '').trim();
  const memberId = String(data.memberId || '').trim();
  const idToken = String(data.idToken || '').trim();

  if (!username || !memberId || !idToken) {
    throw new Error('Username, ID Anggota, dan sesi login wajib tersedia.');
  }

  const firebaseUser = verifyFirebaseToken_(idToken);
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  const uid = String(firebaseUser.localId || '').trim();
  if (!email || !uid) throw new Error('Akun Firebase tidak valid.');

  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const accountSheet = book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!accountSheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');

  const last = accountSheet.getLastRow();
  if (last < 2) throw new Error('Akun Portal Siswa belum dihubungkan oleh admin.');

  const rows = accountSheet.getRange(2,1,last-1,5).getDisplayValues();
  const targetUsername = username.toLowerCase();
  const targetId = memberId.toLowerCase();
  let rowIndex = -1;

  for (let i=0; i<rows.length; i++) {
    const rowUsername = String(rows[i][0] || '').trim().toLowerCase();
    const rowId = String(rows[i][1] || '').trim().toLowerCase();
    const rowEmail = String(rows[i][2] || '').trim().toLowerCase();
    const rowUid = String(rows[i][3] || '').trim();
    const status = String(rows[i][4] || 'AKTIF').trim().toUpperCase();

    if (rowUsername === targetUsername && rowId === targetId && rowEmail === email) {
      if (status && status !== 'AKTIF') throw new Error('Akun portal ini sedang nonaktif.');
      if (rowUid && rowUid !== uid) throw new Error('ID Anggota sudah terhubung dengan akun lain.');
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex < 0) {
    throw new Error('Username / ID Anggota tidak cocok dengan akun yang terdaftar. Hubungi admin.');
  }

  const savedUid = String(accountSheet.getRange(rowIndex,4).getDisplayValue() || '').trim();
  if (!savedUid) accountSheet.getRange(rowIndex,4).setValue(uid);

  return {book, accountSheet, accountRow:rowIndex, username, memberId, email, uid};
}
"""

new_auth = """function authorizePortalStudent_(data) {
  const username = String(data.username || '').trim();
  const requestedMemberId = String(data.memberId || '').trim().toLowerCase();
  const idToken = String(data.idToken || '').trim();

  if (!username || !idToken) {
    throw new Error('Username dan sesi login wajib tersedia.');
  }

  const firebaseUser = verifyFirebaseToken_(idToken);
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  const uid = String(firebaseUser.localId || '').trim();
  if (!email || !uid) throw new Error('Akun Firebase tidak valid.');

  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  const accountSheet = book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!accountSheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');

  const last = accountSheet.getLastRow();
  if (last < 2) throw new Error('Akun Portal Siswa belum dihubungkan oleh admin.');

  const rows = accountSheet.getRange(2,1,last-1,5).getDisplayValues();
  const targetUsername = username.toLowerCase();
  let rowIndex = -1;
  let memberId = '';

  for (let i=0; i<rows.length; i++) {
    const rowUsername = String(rows[i][0] || '').trim().toLowerCase();
    const rowIdRaw = String(rows[i][1] || '').trim();
    const rowId = rowIdRaw.toLowerCase();
    const rowEmail = String(rows[i][2] || '').trim().toLowerCase();
    const rowUid = String(rows[i][3] || '').trim();
    const status = String(rows[i][4] || 'AKTIF').trim().toUpperCase();

    if (rowUsername === targetUsername && rowEmail === email && (!requestedMemberId || rowId === requestedMemberId)) {
      if (status && status !== 'AKTIF') throw new Error('Akun portal ini sedang nonaktif.');
      if (rowUid && rowUid !== uid) throw new Error('Akun ini sudah terhubung dengan pengguna lain.');
      if (!rowIdRaw) throw new Error('ID Anggota akun ini belum dihubungkan oleh admin.');
      rowIndex = i + 2;
      memberId = rowIdRaw;
      break;
    }
  }

  if (rowIndex < 0) {
    throw new Error('Username atau email tidak cocok dengan akun yang terdaftar. Hubungi admin.');
  }

  const savedUid = String(accountSheet.getRange(rowIndex,4).getDisplayValue() || '').trim();
  if (!savedUid) accountSheet.getRange(rowIndex,4).setValue(uid);

  return {book, accountSheet, accountRow:rowIndex, username, memberId, email, uid};
}
"""

if old_auth not in text:
    raise SystemExit('Pola authorizePortalStudent_ lama tidak ditemukan')
text = text.replace(old_auth, new_auth)
text = text.replace("version:'9'", "version:'10'", 1)
path.write_text(text, encoding='utf-8')

print('Portal Biodata V10: login Username + Email + Password, ID Anggota otomatis dari akun.')
