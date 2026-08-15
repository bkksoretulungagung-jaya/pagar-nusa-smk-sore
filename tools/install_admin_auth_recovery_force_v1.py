from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<script src="js/admin-auth-recovery-force-v1.js?v=1"></script>'
s=s.replace(old,'')
needle='<script src="js/admin-auth-v4.js?v=4"></script>'
insert=needle+'\n<script src="js/admin-auth-recovery-force-v1.js?v=1"></script>'
if needle not in s:
    raise SystemExit('admin-auth-v4 script tag not found')
s=s.replace(needle,insert,1)
p.write_text(s,encoding='utf-8')
