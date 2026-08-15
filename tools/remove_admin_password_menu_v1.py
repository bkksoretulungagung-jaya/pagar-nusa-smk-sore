#!/usr/bin/env python3
from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Hapus seluruh pemanggil fitur ganti password / auth tambahan.
s = re.sub(r'\s*<script src="js/admin-auth-v5\.js\?v=\d+"></script>\s*', '\n', s)
s = re.sub(r'\s*<script src="js/admin-auth-v4\.js\?v=\d+"></script>\s*', '\n', s)
s = re.sub(r'\s*<script src="js/admin-password[^\"]*\.js\?v=\d+"></script>\s*', '\n', s)
s = re.sub(r'\s*<script src="js/admin-login-dual-recovery[^\"]*\.js\?v=\d+"></script>\s*', '\n', s)

# Paksa browser memuat ulang loader UI. Tanpa admin-auth-v5, ui-v9-core otomatis memakai login lama lokal.
s = re.sub(r'js/ui-v9\.js\?v=\d+', 'js/ui-v9.js?v=51', s)

p.write_text(s, encoding='utf-8')
print('Menu ganti password dihapus; login kembali ke mode lama lokal.')
