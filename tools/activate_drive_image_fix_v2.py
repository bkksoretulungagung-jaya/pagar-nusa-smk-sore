from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
tag='<script src="js/drive-image-fix-v2.js?v=2"></script>'
if tag not in s:
    s=s.replace('</body>',tag+'\n</body>')
p.write_text(s,encoding='utf-8')
print('Drive image fix v2 active')
