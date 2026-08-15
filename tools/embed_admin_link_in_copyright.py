from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old = '''<div class="footer">© 2026 Database Pagar Nusa Rayon SMK Sore Tulungagung</div>\n<button id="topLoginBtn" class="footerAdminDisguise" type="button" onclick="openAdminLogin()" aria-label="Pagar Nusa Rayon SMK Sore Tulungagung">Pagar Nusa Rayon SMK Sore Tulungagung</button>'''
new = '''<div class="footer">© 2026 Database <button id="topLoginBtn" type="button" onclick="openAdminLogin()" aria-label="Pagar Nusa Rayon SMK Sore Tulungagung" style="all:unset;color:inherit;font:inherit;letter-spacing:inherit;cursor:default;display:inline">Pagar Nusa Rayon SMK Sore Tulungagung</button></div>'''

if old not in s:
    # fallback in case spacing/class changed
    import re
    pattern = re.compile(
        r'<div class="footer">© 2026 Database Pagar Nusa Rayon SMK Sore Tulungagung</div>\s*'
        r'<button id="topLoginBtn"[^>]*>Pagar Nusa Rayon SMK Sore Tulungagung</button>'
    )
    s2, n = pattern.subn(new, s, count=1)
    if n != 1:
        raise SystemExit('Target copyright/admin link tidak ditemukan')
    s = s2
else:
    s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('Admin link sudah menyatu pada teks copyright.')
