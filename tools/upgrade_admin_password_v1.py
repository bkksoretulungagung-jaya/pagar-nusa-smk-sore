from pathlib import Path
import re

# --- Backend Apps Script ---
p = Path('backend/Code.gs')
s = p.read_text(encoding='utf-8')

const_anchor = "const PN_REVIEW_ADMIN_PASS_HASH = '3b396371ec891e73db1ecb5f70d341c4fe6cc6f52fdea96d55dc3fe786d3a639';"
const_extra = const_anchor + "\nconst PN_ADMIN_PASS_PROPERTY = 'PN_ADMIN_PASS_HASH_V1';\nconst PN_ADMIN_AUTH_VERSION_PROPERTY = 'PN_ADMIN_AUTH_VERSION_V1';"
if 'PN_ADMIN_PASS_PROPERTY' not in s:
    if const_anchor not in s:
        raise SystemExit('Konstanta password admin tidak ditemukan')
    s = s.replace(const_anchor, const_extra, 1)

admin_block = r"""function adminPasswordHash_() {
  return PropertiesService.getScriptProperties().getProperty(PN_ADMIN_PASS_PROPERTY) || PN_REVIEW_ADMIN_PASS_HASH;
}

function adminAuthVersion_() {
  return PropertiesService.getScriptProperties().getProperty(PN_ADMIN_AUTH_VERSION_PROPERTY) || 'legacy';
}

function reviewAdminLogin_(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');
  if (username !== PN_REVIEW_ADMIN_USER || sha256Hex_(password) !== adminPasswordHash_()) {
    throw new Error('Login admin verifikasi tidak valid.');
  }

  const requestedToken = String(data.token || '').trim();
  const token = /^[A-Za-z0-9_-]{32,128}$/.test(requestedToken)
    ? requestedToken
    : Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');

  const authValue = JSON.stringify({username:username, version:adminAuthVersion_()});
  CacheService.getScriptCache().put('pn-review-admin:' + token, authValue, 21600);
  return {ok:true,token:token,expiresIn:21600,version:'7'};
}

function requireReviewAdmin_(token) {
  token = String(token || '').trim();
  if (!token) throw new Error('Sesi verifikasi admin tidak tersedia. Silakan login ulang.');
  const raw = CacheService.getScriptCache().get('pn-review-admin:' + token);
  if (!raw) throw new Error('Sesi verifikasi admin sudah berakhir. Silakan login ulang.');

  const currentVersion = adminAuthVersion_();
  let username = '';
  let tokenVersion = 'legacy';
  try {
    const obj = JSON.parse(raw);
    username = String(obj && obj.username || '');
    tokenVersion = String(obj && obj.version || 'legacy');
  } catch (_) {
    username = String(raw || '');
  }
  if (!username) throw new Error('Sesi verifikasi admin tidak valid. Silakan login ulang.');
  if (currentVersion !== 'legacy' && tokenVersion !== currentVersion) {
    throw new Error('Sesi admin sudah dinonaktifkan. Silakan login ulang.');
  }
  return username;
}

function adminChangePassword_(data) {
  const token = String(data.token || '').trim();
  const username = requireReviewAdmin_(token);
  if (username !== PN_REVIEW_ADMIN_USER) throw new Error('Akun admin tidak valid.');

  const currentPassword = String(data.currentPassword || '');
  const newPassword = String(data.newPassword || '');
  if (sha256Hex_(currentPassword) !== adminPasswordHash_()) {
    throw new Error('Password saat ini tidak benar.');
  }
  if (newPassword.length < 8) throw new Error('Password baru minimal 8 karakter.');
  if (newPassword.length > 128) throw new Error('Password baru terlalu panjang.');
  if (newPassword === currentPassword) throw new Error('Password baru harus berbeda dari password saat ini.');

  const props = PropertiesService.getScriptProperties();
  props.setProperty(PN_ADMIN_PASS_PROPERTY, sha256Hex_(newPassword));
  props.setProperty(PN_ADMIN_AUTH_VERSION_PROPERTY, Utilities.getUuid().replace(/-/g,''));
  CacheService.getScriptCache().remove('pn-review-admin:' + token);
  return {ok:true,message:'Password admin berhasil diubah. Semua sesi lama dinonaktifkan.'};
}"""

pat = re.compile(r"function reviewAdminLogin_\(data\) \{.*?^\}\n\nfunction requireReviewAdmin_\(token\) \{.*?^\}", re.S | re.M)
if 'function adminChangePassword_' not in s:
    s2, n = pat.subn(admin_block, s, count=1)
    if n != 1:
        raise SystemExit('Blok login admin backend tidak berhasil ditemukan')
    s = s2

if "if (action === 'adminChangePassword')" not in s:
    anchor = "    if (action === 'contentAdminLogin') {"
    block = """    if (action === 'adminChangePassword') {
      result = adminChangePassword_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

"""
    if anchor not in s:
        raise SystemExit('Anchor contentAdminLogin tidak ditemukan')
    s = s.replace(anchor, block + anchor, 1)

old_catch = "['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage'].includes(action)"
new_catch = "['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword'].includes(action)"
if old_catch in s:
    s = s.replace(old_catch, new_catch, 1)
elif new_catch not in s:
    raise SystemExit('Daftar catch action konten tidak ditemukan')

s = s.replace("reviewVersion:'6'", "reviewVersion:'7'", 1)
p.write_text(s, encoding='utf-8')

# --- Login admin browser: fail closed + verifikasi ke backend ---
p = Path('js/ui-v9-core.js')
s = p.read_text(encoding='utf-8')
s = re.sub(r"const PN_ADMIN_PASS_HASH='[0-9a-f]{64}';", "const PN_ADMIN_PASS_HASH=''; // Password diverifikasi oleh backend Apps Script.", s, count=1)

new_submit = r"""async function submitAdminLogin(ev){
  if(ev)ev.preventDefault();
  const u=document.getElementById('adminUser')?.value.trim()||'',p=document.getElementById('adminPass')?.value||'',err=document.getElementById('loginError');
  if(err)err.textContent='Memeriksa login admin...';
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(typeof window.pnSecureAdminLogin!=='function'){
    if(err)err.textContent='Layanan login admin belum siap. Muat ulang halaman lalu coba lagi.';
    return false;
  }
  try{
    const r=await window.pnSecureAdminLogin(u,p);
    if(!r||!r.ok)throw new Error('Login admin gagal.');
    sessionStorage.setItem('pnAdminAuth','1');closeAdminLogin();enterAdmin(true)
  }catch(e){if(err)err.textContent=e?.message||'Username atau password admin salah.'}
  return false
}
"""
pat_submit = re.compile(r"async function submitAdminLogin\(ev\)\{.*?^\}\n(?=function setAdminControls)", re.S | re.M)
s2, n = pat_submit.subn(new_submit, s, count=1)
if n != 1 and 'pnSecureAdminLogin' not in s:
    raise SystemExit('Fungsi submitAdminLogin tidak berhasil diubah')
if n == 1:
    s = s2
p.write_text(s, encoding='utf-8')

# --- Cache loader core ---
p = Path('js/ui-v9.js')
s = p.read_text(encoding='utf-8')
s = re.sub(r'js/ui-v9-core\.js\?v=\d+', 'js/ui-v9-core.js?v=26', s)
p.write_text(s, encoding='utf-8')

# --- Pasang script keamanan di index + bump cache ui ---
p = Path('index.html')
s = p.read_text(encoding='utf-8')
s = re.sub(r'js/ui-v9\.js\?v=\d+', 'js/ui-v9.js?v=48', s)
s = re.sub(r'\s*<script src="js/admin-password-v1\.js\?v=\d+"></script>\s*', '\n', s)
tag = '<script src="js/admin-password-v1.js?v=1"></script>'
if '</body>' not in s:
    raise SystemExit('Tag </body> index.html tidak ditemukan')
s = s.replace('</body>', tag + '\n</body>', 1)
p.write_text(s, encoding='utf-8')

print('Admin password v1 installed: backend dynamic password + secure web login + menu change password')
