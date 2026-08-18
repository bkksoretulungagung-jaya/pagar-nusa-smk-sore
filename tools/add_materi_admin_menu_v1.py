from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
orig = text

button = '<a href="materi-pengurus.html" class="materiAdminMenuBtn" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;background:#166534;color:#fff;border:0;border-radius:9px;padding:9px 12px;font-size:10px;font-weight:900;white-space:nowrap">📚 MATERI PENGURUS</a>'

if 'class="materiAdminMenuBtn"' not in text:
    marker = '<div class="adminTopActions">'
    pos = text.find(marker)
    if pos < 0:
        raise SystemExit('adminTopActions marker not found')
    insert_at = pos + len(marker)
    text = text[:insert_at] + '\n      ' + button + text[insert_at:]

if text != orig:
    p.write_text(text, encoding='utf-8')
    print('Menu Materi Pengurus ditambahkan ke Area Admin.')
else:
    print('Menu Materi Pengurus sudah ada.')
