from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'\s*<script src="js/admin-compact-v1\.js\?v=\d+"></script>\s*','\n',s)
tag='<script src="js/admin-compact-v1.js?v=1"></script>'
if '</body>' not in s:
    raise SystemExit('Tag </body> tidak ditemukan pada index.html')
s=s.replace('</body>',tag+'\n</body>',1)
p.write_text(s,encoding='utf-8')
print('Admin compact v1 installed')
