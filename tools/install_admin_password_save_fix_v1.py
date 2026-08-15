from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'\s*<script src="js/admin-password-save-fix-v1\.js\?v=1"></script>\s*','\n',s)
tag='<script src="js/admin-password-save-fix-v1.js?v=1"></script>'
anchor='<script src="js/admin-login-dual-recovery-v2.js?v=2"></script>'
if anchor in s:
    s=s.replace(anchor,anchor+'\n'+tag)
else:
    s=s.replace('</body>',tag+'\n</body>')
p.write_text(s,encoding='utf-8')
print('installed admin password save fix v1')
