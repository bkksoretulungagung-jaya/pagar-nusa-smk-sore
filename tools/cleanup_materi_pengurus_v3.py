from pathlib import Path

path = Path('materi-pengurus.html')
text = path.read_text(encoding='utf-8')

replacements = [
    (
        '.adminGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
        '.adminGrid{display:grid;grid-template-columns:1fr;gap:14px}.adminGrid .adminPanel:first-child{display:none!important}'
    ),
    (
        '🔒 File disimpan privat. Tombol download mengambil file melalui server setelah kode akses pengurus diverifikasi.',
        '🔒 File disimpan privat. Pengurus hanya dapat membuka dan mengunduh materi setelah login memakai akun email dan password pribadi yang dibuat Admin.'
    ),
    (
        'Muncul otomatis bila halaman dibuka saat sesi admin website masih aktif.',
        'Halaman khusus Admin untuk upload dan mengelola materi. Akun pengurus dikelola melalui menu 👥 AKUN PENGURUS.'
    ),
    (
        "setStatus('adminStatus',r.accessConfigured?'✓ Mode admin aktif. Kode akses pengurus sudah dibuat.':'Mode admin aktif. Buat kode akses pengurus terlebih dahulu.',r.accessConfigured?'ok':'warn');",
        "setStatus('adminStatus','✓ Mode admin aktif. Upload dan kelola materi di halaman ini. Login pengurus memakai akun email + password pribadi.','ok');"
    ),
]

for old, new in replacements:
    if old not in text:
        print('WARN: pola tidak ditemukan:', old[:100])
    text = text.replace(old, new)

# Tambahkan shortcut pengelolaan akun pada panel upload Admin bila belum ada.
marker = '<h4>⬆ Upload Materi Baru</h4>'
shortcut = '<div style="display:flex;justify-content:flex-end;margin:-2px 0 10px"><a href="akun-pengurus.html" style="text-decoration:none;background:#0f766e;color:#fff;border-radius:8px;padding:8px 11px;font-size:10px;font-weight:900">👥 KELOLA AKUN PENGURUS</a></div>'
if shortcut not in text and marker in text:
    text = text.replace(marker, marker + '\n          ' + shortcut, 1)

path.write_text(text, encoding='utf-8')
print('materi-pengurus.html dibersihkan ke sistem akun pribadi V3')
# trigger workflow v3
