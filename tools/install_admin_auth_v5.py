from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Lepas semua loader autentikasi/password admin eksperimen lama.
s = re.sub(r'\n?<script src="js/admin-auth-v4\.js\?v=\d+"></script>', '', s)
s = re.sub(r'\n?<script src="js/admin-auth-v5\.js\?v=\d+"></script>', '', s)
s = re.sub(r'\n?<script src="js/admin-password-[^"]+"></script>', '', s)
s = re.sub(r'\n?<script src="js/admin-login-[^"]+"></script>', '', s)

loader = '<script src="js/admin-auth-v5.js?v=1"></script>'
if '</body>' not in s:
    raise SystemExit('Tag </body> tidak ditemukan.')
s = s.replace('</body>', loader + '\n</body>', 1)
p.write_text(s, encoding='utf-8')
print('admin-auth-v5 installed')
