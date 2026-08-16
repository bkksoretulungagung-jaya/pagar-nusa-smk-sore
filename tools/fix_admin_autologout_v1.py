from pathlib import Path

p = Path('js/reviews-admin-session-v10.js')
s = p.read_text(encoding='utf-8')
old = """    if(/sesi admin sudah dinonaktifkan|sesi verifikasi admin tidak valid|sesi admin perangkat tidak ditemukan/i.test(msg)){\n      persistentRemove(TOKEN_KEY);persistentRemove(AUTH_KEY);\n      try{if(typeof window.showPublicDashboard==='function')window.showPublicDashboard()}catch(_){}\n    }\n"""
new = """    if(/sesi admin sudah dinonaktifkan|sesi verifikasi admin tidak valid|sesi admin perangkat tidak ditemukan/i.test(msg)){\n      // Sesi server boleh putus, tetapi jangan pernah mengeluarkan admin dari area database otomatis.\n      // AUTH_KEY tetap dipertahankan; admin hanya keluar melalui tombol LOGOUT.\n      persistentRemove(TOKEN_KEY);\n      persistentSet(AUTH_KEY,'1');\n    }\n"""
if old not in s:
    raise SystemExit('target auto-logout block not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

idx = Path('index.html')
h = idx.read_text(encoding='utf-8')
old_tag = 'js/reviews-admin-session-v10.js?v=12'
new_tag = 'js/reviews-admin-session-v10.js?v=13'
if old_tag not in h:
    raise SystemExit('reviews session loader v12 not found')
h = h.replace(old_tag, new_tag, 1)
idx.write_text(h, encoding='utf-8')

print('patched admin auto logout guard v1')
