from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<script src="js/admin-login-dual-recovery-v1.js?v=1"></script>'
new='<script src="js/admin-login-dual-recovery-v2.js?v=2"></script>'
if old in s:
    s=s.replace(old,new)
elif new not in s:
    anchor='<script src="js/admin-password-safe-v3.js?v=3"></script>'
    s=s.replace(anchor,anchor+'\n'+new)
p.write_text(s,encoding='utf-8')
