from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
tag='<script src="js/admin-login-dual-recovery-v1.js?v=1"></script>'
# remove duplicates first
s=s.replace('\n'+tag,'').replace(tag+'\n','')
anchor='<script src="js/admin-password-safe-v3.js?v=3"></script>'
if anchor in s:
    s=s.replace(anchor, anchor+'\n'+tag)
else:
    s=s.replace('</body>', tag+'\n</body>')
p.write_text(s,encoding='utf-8')
print('installed admin-login-dual-recovery-v1')
