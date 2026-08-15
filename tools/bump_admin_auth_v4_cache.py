from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('js/admin-auth-v4.js?v=4','js/admin-auth-v4.js?v=5')
p.write_text(s,encoding='utf-8')
print('bumped admin auth cache to v5')
