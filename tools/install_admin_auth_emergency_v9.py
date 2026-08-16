#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
index_path = ROOT / 'index.html'
index = index_path.read_text(encoding='utf-8')

# Hapus tag emergency v9 lama bila workflow dijalankan ulang.
index = re.sub(r'\s*<script src="js/admin-auth-emergency-v9\.js\?v=\d+"></script>', '', index)

tag = '<script src="js/admin-auth-emergency-v9.js?v=9"></script>'
if '</body>' not in index:
    raise SystemExit('</body> tidak ditemukan pada index.html')

# Emergency handler harus paling akhir agar menangkap submit sebelum handler lama.
index = index.replace('</body>', tag + '\n</body>', 1)
index_path.write_text(index, encoding='utf-8')
print('admin-auth-emergency-v9 installed as final script')
