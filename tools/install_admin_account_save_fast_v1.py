from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
COMPACT = ROOT / 'js' / 'admin-compact-v1.js'
INDEX = ROOT / 'index.html'

compact = COMPACT.read_text(encoding='utf-8')
index = INDEX.read_text(encoding='utf-8')

if 'admin-account-save-fast-v1.js' not in compact:
    compact += """

/* Simpan perubahan akun cepat: verifikasi hasil langsung ke database. */
(()=>{
  if(document.querySelector('script[data-pn-account-save-fast]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-save-fast-v1.js?v=1';
  script.async=false;
  script.dataset.pnAccountSaveFast='1';
  document.head.appendChild(script);
})();
"""

m = re.search(r'js/admin-compact-v1\.js\?v=(\d+)', index)
if not m:
    raise SystemExit('Loader admin-compact tidak ditemukan')
current = int(m.group(1))
next_version = max(current + 1, 10)
index = index[:m.start(1)] + str(next_version) + index[m.end(1):]

COMPACT.write_text(compact, encoding='utf-8')
INDEX.write_text(index, encoding='utf-8')
print(f'Simpan perubahan akun cepat aktif. Cache admin-compact v{next_version}.')
