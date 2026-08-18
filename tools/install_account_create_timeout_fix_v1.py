from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPACT = ROOT / 'js' / 'admin-compact-v1.js'
INDEX = ROOT / 'index.html'

compact = COMPACT.read_text(encoding='utf-8')
index = INDEX.read_text(encoding='utf-8')

# Pasang loader fix bila belum ada; bila sudah ada, naikkan versinya agar cache lama tidak dipakai.
if 'admin-account-create-timeout-fix-v1.js' not in compact:
    compact += """

/* Fix konfirmasi pembuatan akun: verifikasi hasil ke database jika iframe lambat. */
(()=>{
  if(document.querySelector('script[data-pn-account-create-timeout-fix]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-create-timeout-fix-v1.js?v=2';
  script.async=false;
  script.dataset.pnAccountCreateTimeoutFix='1';
  document.head.appendChild(script);
})();
"""
else:
    compact = compact.replace('js/admin-account-create-timeout-fix-v1.js?v=1', 'js/admin-account-create-timeout-fix-v1.js?v=2', 1)

# Paksa browser mengambil loader Admin terbaru.
if 'js/admin-compact-v1.js?v=9' not in index:
    if 'js/admin-compact-v1.js?v=8' not in index:
        raise SystemExit('Anchor admin-compact v8 tidak ditemukan')
    index = index.replace('js/admin-compact-v1.js?v=8', 'js/admin-compact-v1.js?v=9', 1)

COMPACT.write_text(compact, encoding='utf-8')
INDEX.write_text(index, encoding='utf-8')
print('Fix cepat pembuatan akun anggota aktif: polling database dimulai hampir seketika.')

# Trigger workflow setelah workflow terdaftar.
