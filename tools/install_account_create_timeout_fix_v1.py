from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPACT = ROOT / 'js' / 'admin-compact-v1.js'
INDEX = ROOT / 'index.html'

compact = COMPACT.read_text(encoding='utf-8')
index = INDEX.read_text(encoding='utf-8')

if 'admin-account-create-timeout-fix-v1.js' not in compact:
    compact += """

/* Fix konfirmasi pembuatan akun: verifikasi hasil ke database jika iframe lambat. */
(()=>{
  if(document.querySelector('script[data-pn-account-create-timeout-fix]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-create-timeout-fix-v1.js?v=1';
  script.async=false;
  script.dataset.pnAccountCreateTimeoutFix='1';
  document.head.appendChild(script);
})();
"""

if 'js/admin-compact-v1.js?v=8' not in index:
    if 'js/admin-compact-v1.js?v=7' not in index:
        raise SystemExit('Anchor admin-compact v7 tidak ditemukan')
    index = index.replace('js/admin-compact-v1.js?v=7', 'js/admin-compact-v1.js?v=8', 1)

COMPACT.write_text(compact, encoding='utf-8')
INDEX.write_text(index, encoding='utf-8')
print('Fix timeout pembuatan akun anggota aktif.')

# Trigger workflow setelah workflow terdaftar.
