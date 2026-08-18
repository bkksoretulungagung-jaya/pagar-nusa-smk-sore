from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / 'backend' / 'Code.gs'
BACKEND_V2 = ROOT / 'backend' / 'AdminAccountCreateV2.gs'
COMPACT = ROOT / 'js' / 'admin-compact-v1.js'
INDEX = ROOT / 'index.html'

code = CODE.read_text(encoding='utf-8')
backend_v2 = BACKEND_V2.read_text(encoding='utf-8').strip()
compact = COMPACT.read_text(encoding='utf-8')
index = INDEX.read_text(encoding='utf-8')

# Tandai versi backend portal akun terbaru.
code = code.replace("      accountAdminPortalVersion:'1',", "      accountAdminPortalVersion:'3',", 1)
code = code.replace("      accountAdminPortalVersion:'2',", "      accountAdminPortalVersion:'3',", 1)

# Routing POST untuk pembuatan akun baru.
if "if (action === 'portalAccountAdminCreate')" not in code:
    anchor = "    if (action === 'portalAccountAdminUpdate') {"
    if anchor not in code:
        raise SystemExit('Anchor portalAccountAdminUpdate tidak ditemukan')
    block = """    if (action === 'portalAccountAdminCreate') {
      result = portalAccountAdminCreate_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-account-admin');
    }

"""
    code = code.replace(anchor, block + anchor, 1)

# Pastikan error create juga kembali ke iframe portal akun.
old_catch = "['portalAccountAdminUpdate','portalAccountAdminResetPassword'].includes(action)"
new_catch = "['portalAccountAdminCreate','portalAccountAdminUpdate','portalAccountAdminResetPassword'].includes(action)"
if old_catch in code:
    code = code.replace(old_catch, new_catch, 1)

# Username akun anggota kompatibel dengan data lama: nama lengkap, spasi, dan apostrof diperbolehkan.
username_pattern = re.compile(
    r"function portalAccountUsername_\(value\) \{.*?\n\}",
    re.DOTALL
)
username_replacement = """function portalAccountUsername_(value) {
  const username = String(value || '').trim();
  if (username.length < 3 || username.length > 100) throw new Error('Username harus 3–100 karakter.');
  if (username.split('').some(function(ch){ const n = ch.charCodeAt(0); return n < 32 || n === 127; })) throw new Error('Username mengandung karakter yang tidak diperbolehkan.');
  if (/^[=+@]/.test(username)) throw new Error('Awal username tidak diperbolehkan.');
  return username;
}"""
current_match = username_pattern.search(code)
if not current_match:
    raise SystemExit('Fungsi portalAccountUsername_ tidak ditemukan')
if "username.split('').some(function(ch)" not in current_match.group(0):
    code = code[:current_match.start()] + username_replacement + code[current_match.end():]

# Baris akun yang hanya punya username + ID, namun email dan UID masih kosong,
# belum dapat dipakai login. Jangan dianggap sebagai akun selesai.
old_ready = """      accountStatus:account ? account.status : 'BELUM ADA',
      hasAccount:!!account"""
new_ready = """      accountStatus:(account && (account.email || account.uid)) ? account.status : 'BELUM ADA',
      hasAccount:!!(account && (account.email || account.uid))"""
if old_ready in code:
    code = code.replace(old_ready, new_ready, 1)

# Selalu sinkronkan blok backend Buat/Lengkapi Akun di bagian akhir Code.gs.
old_module = re.search(
    r"/\* =========================================================\n   AKUN ANGGOTA ADMIN V[23] — .*?\n========================================================= \*/.*\Z",
    code,
    re.DOTALL
)
if old_module:
    code = code[:old_module.start()] + backend_v2 + '\n'
else:
    marker = 'AKUN ANGGOTA ADMIN V3 — BUAT / LENGKAPI AKUN DARI BIODATA'
    if marker not in code:
        code = code.rstrip() + '\n\n' + backend_v2 + '\n'

# Muat enhancer frontend Akun Anggota. V3 menampilkan tombol BUAT AKUN di bagian atas.
if "js/admin-account-create-v2.js?v=2" in compact:
    compact = compact.replace("js/admin-account-create-v2.js?v=2", "js/admin-account-create-v2.js?v=3", 1)
elif 'admin-account-create-v2.js' not in compact:
    compact += """

/* Akun Anggota V3: tombol buat akun selalu terlihat di bagian atas. */
(()=>{
  if(document.querySelector('script[data-pn-account-create-v2]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-create-v2.js?v=3';
  script.async=false;
  script.dataset.pnAccountCreateV2='1';
  document.head.appendChild(script);
})();
"""

# Paksa browser mengambil admin loader terbaru.
if 'js/admin-compact-v1.js?v=7' not in index:
    if 'js/admin-compact-v1.js?v=6' not in index:
        raise SystemExit('Anchor cache admin-compact v6 tidak ditemukan')
    index = index.replace('js/admin-compact-v1.js?v=6', 'js/admin-compact-v1.js?v=7', 1)

CODE.write_text(code, encoding='utf-8')
COMPACT.write_text(compact, encoding='utf-8')
INDEX.write_text(index, encoding='utf-8')
print('Akun Anggota V3 aktif: akun setengah jadi dapat dilengkapi lewat BUAT AKUN.')
