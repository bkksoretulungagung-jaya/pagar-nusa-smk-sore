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
code = code.replace("      accountAdminPortalVersion:'1',", "      accountAdminPortalVersion:'2',", 1)

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

# Username akun anggota harus kompatibel dengan data lama: nama lengkap dengan spasi/apostrof diperbolehkan.
username_pattern = re.compile(
    r"function portalAccountUsername_\(value\) \{\n"
    r"  const username = String\(value \|\| ''\)\.trim\(\);\n"
    r"  if \(!/\^\[A-Za-z0-9\._-\]\{3,80\}\$/\.test\(username\)\) throw new Error\('Username minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus\.'\);\n"
    r"  return username;\n"
    r"\}"
)
username_replacement = """function portalAccountUsername_(value) {
  const username = String(value || '').trim();
  if (username.length < 3 || username.length > 100) throw new Error('Username harus 3–100 karakter.');
  if (/[\\u0000-\\u001F\\u007F]/.test(username)) throw new Error('Username mengandung karakter yang tidak diperbolehkan.');
  if (/^[=+@]/.test(username)) throw new Error('Awal username tidak diperbolehkan.');
  return username;
}"""
if "Username harus 3–100 karakter." not in code:
    code, count = username_pattern.subn(username_replacement, code, count=1)
    if count != 1:
        raise SystemExit('Fungsi portalAccountUsername_ lama tidak ditemukan')

# Gabungkan backend V2 ke Code.gs agar pengguna cukup menyalin satu file ke Apps Script.
marker = 'AKUN ANGGOTA ADMIN V2 — BUAT AKUN DARI BIODATA'
if marker not in code:
    code = code.rstrip() + '\n\n' + backend_v2 + '\n'

# Muat enhancer frontend V2 setelah portal akun V1.
if 'admin-account-create-v2.js' not in compact:
    compact += """

/* Akun Anggota V2: nama portal ringkas + buat akun dari biodata. */
(()=>{
  if(document.querySelector('script[data-pn-account-create-v2]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-create-v2.js?v=2';
  script.async=false;
  script.dataset.pnAccountCreateV2='1';
  document.head.appendChild(script);
})();
"""

# Paksa browser mengambil admin loader terbaru.
if 'js/admin-compact-v1.js?v=6' not in index:
    if 'js/admin-compact-v1.js?v=5' not in index:
        raise SystemExit('Anchor cache admin-compact v5 tidak ditemukan')
    index = index.replace('js/admin-compact-v1.js?v=5', 'js/admin-compact-v1.js?v=6', 1)

CODE.write_text(code, encoding='utf-8')
COMPACT.write_text(compact, encoding='utf-8')
INDEX.write_text(index, encoding='utf-8')
print('Akun Anggota V2 aktif pada source website dan backend Code.gs.')

# Perubahan kecil ini sengaja dipertahankan agar workflow V2 terpanggil setelah workflow terdaftar.
