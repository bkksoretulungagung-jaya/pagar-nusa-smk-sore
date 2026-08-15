from pathlib import Path
import re

p=Path('biodata.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'\s*<script src="js/biodata-date-display-fix-v2\.js\?v=\d+"></script>\s*','\n',s)
tag='<script src="js/biodata-date-display-fix-v2.js?v=2"></script>'
if '</body>' not in s:
    raise SystemExit('Tag </body> tidak ditemukan pada biodata.html')
s=s.replace('</body>',tag+'\n</body>',1)
p.write_text(s,encoding='utf-8')
print('Biodata date display fix v2 installed')
