from pathlib import Path


def replace_many(path, replacements):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    original = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        p.write_text(text, encoding='utf-8')
        print(f'Updated {path}')
    else:
        print(f'No changes in {path}')


replace_many('biodata.html', [
    ('Portal Biodata Siswa / Anggota - Pagar Nusa SMK Sore Tulungagung', 'Portal Biodata Anggota - Pagar Nusa SMK Sore Tulungagung'),
    ('PORTAL BIODATA SISWA / ANGGOTA', 'PORTAL BIODATA ANGGOTA'),
    ('Masukkan Username, ID Anggota / No. Siswa, email, dan password akun masing-masing.', 'Masukkan Username, ID Anggota, email, dan password akun masing-masing.'),
    ('ID Anggota / No. Siswa', 'ID Anggota'),
    ('placeholder="Contoh: siswa01"', 'placeholder="Contoh: anggota01"'),
    ('placeholder="siswa01@gmail.com"', 'placeholder="anggota01@gmail.com"'),
    ('placeholder="Password siswa"', 'placeholder="Password anggota"'),
    ('>Siswa / Anggota<', '>Anggota<'),
    ("||'Siswa / Anggota'", "||'Anggota'"),
    ("||\"Siswa / Anggota\"", "||\"Anggota\""),
    ("['No. HP Siswa','studentPhone']", "['No. HP Anggota','studentPhone']"),
])

replace_many('siswa.html', [
    ('Portal Siswa CBT - Pagar Nusa SMK Sore Tulungagung', 'Portal Anggota CBT - Pagar Nusa SMK Sore Tulungagung'),
    ('PORTAL SISWA CBT PAGAR NUSA', 'PORTAL ANGGOTA CBT PAGAR NUSA'),
    ('Memuat portal siswa...', 'Memuat portal anggota...'),
    ('placeholder="Contoh: siswa01"', 'placeholder="Contoh: anggota01"'),
    ('placeholder="siswa01@gmail.com"', 'placeholder="anggota01@gmail.com"'),
    ('placeholder="Password siswa"', 'placeholder="Password anggota"'),
    ('sesuai dengan akun siswa.', 'sesuai dengan akun anggota.'),
    ('Portal siswa aktif.', 'Portal anggota aktif.'),
    ("='Siswa';", "='Anggota';"),
    ("||'Siswa'", "||'Anggota'"),
    ("||\"Siswa\"", "||\"Anggota\""),
    ('>Siswa<', '>Anggota<'),
])

replace_many('js/biodata-portal-v1.js', [
    ('PORTAL BIODATA SISWA', 'PORTAL BIODATA ANGGOTA'),
    ('Portal Biodata Siswa', 'Portal Biodata Anggota'),
    ('Siswa / Anggota', 'Anggota'),
    ('No. HP Siswa', 'No. HP Anggota'),
    ('siswa01', 'anggota01'),
    ('Password siswa', 'Password anggota'),
])

replace_many('js/dashboard-shortcuts-v1.js', [
    ('PORTAL BIODATA SISWA', 'PORTAL BIODATA ANGGOTA'),
])

replace_many('index.html', [
    ('🎓 LOGIN SISWA / CBT', '📝 PORTAL CBT ONLINE'),
    ('js/dashboard-shortcuts-v1.js?v=3', 'js/dashboard-shortcuts-v1.js?v=4'),
])
