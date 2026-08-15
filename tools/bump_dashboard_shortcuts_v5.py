from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')
new, n = re.subn(r'js/dashboard-shortcuts-v1\.js\?v=\d+', 'js/dashboard-shortcuts-v1.js?v=5', s)
if n == 0:
    raise SystemExit('Referensi dashboard-shortcuts-v1.js tidak ditemukan')
p.write_text(new, encoding='utf-8')
print('dashboard shortcuts cache -> v5')
