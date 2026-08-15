#!/usr/bin/env python3
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

# 1) Tandai handler login server v5 agar skrip lain tidak menimpanya.
p = root / 'js' / 'admin-auth-v5.js'
s = p.read_text(encoding='utf-8')
marker = "  return false;\n};\n\nfunction ensureStyles()"
replacement = "  return false;\n};\nwindow.submitAdminLogin.__serverAuthV5=true;\n\nfunction ensureStyles()"
if '__serverAuthV5' not in s:
    if marker not in s:
        raise SystemExit('Marker admin-auth-v5 tidak ditemukan')
    s = s.replace(marker, replacement, 1)
p.write_text(s, encoding='utf-8')

# 2) Jangan biarkan moderasi ulasan memasang kembali login lokal lama.
p = root / 'js' / 'reviews-admin-session-v10.js'
s = p.read_text(encoding='utf-8')
old = "function installFastLogin(){\n  window.submitAdminLogin=async function(ev){"
new = "function installFastLogin(){\n  if(window.submitAdminLogin&&window.submitAdminLogin.__serverAuthV5)return;\n  window.submitAdminLogin=async function(ev){"
if '__serverAuthV5' not in s:
    if old not in s:
        raise SystemExit('Marker reviews-admin-session-v10 tidak ditemukan')
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# 3) Paksa browser mengambil versi baru kedua script.
p = root / 'index.html'
s = p.read_text(encoding='utf-8')
s = re.sub(r'js/reviews-admin-session-v10\.js\?v=\d+', 'js/reviews-admin-session-v10.js?v=11', s)
s = re.sub(r'js/admin-auth-v5\.js\?v=\d+', 'js/admin-auth-v5.js?v=2', s)
p.write_text(s, encoding='utf-8')

print('Admin login override fixed: server auth v5 now has priority over legacy moderation login.')
