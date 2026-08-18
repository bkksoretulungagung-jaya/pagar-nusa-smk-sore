from pathlib import Path
import re

p = Path('index.html')
text = p.read_text(encoding='utf-8')
orig = text

pattern = re.compile(r'\n\s*<section\s+id="materiPengurusPromo"\b.*?</section>\s*\n', re.S)
text, count = pattern.subn('\n', text, count=1)

if count == 0:
    print('Blok Materi Pengurus di dashboard sudah tidak ada.')
elif text != orig:
    p.write_text(text, encoding='utf-8')
    print('Blok Materi Pengurus di dashboard dihapus. Tombol Area Admin tetap dipertahankan.')
