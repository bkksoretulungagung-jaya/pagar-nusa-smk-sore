from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')
script = '<script src="js/dashboard-persist-v1.js?v=1"></script>'

if script in text:
    print('dashboard-persist-v1 sudah terpasang')
    raise SystemExit(0)

anchor = '<script src="js/database-cloud-v1.js?v=7"></script>'
if anchor not in text:
    # Toleran jika versi cache database-cloud berubah.
    import re
    m = re.search(r'<script\s+src="js/database-cloud-v1\.js\?v=[^"]+"\s*></script>', text)
    if not m:
        raise SystemExit('Anchor database-cloud-v1.js tidak ditemukan')
    anchor = m.group(0)

text = text.replace(anchor, anchor + '\n' + script, 1)
path.write_text(text, encoding='utf-8')
print('dashboard-persist-v1 berhasil dipasang ke index.html')
