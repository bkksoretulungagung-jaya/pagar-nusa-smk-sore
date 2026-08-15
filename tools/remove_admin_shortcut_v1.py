from pathlib import Path

p = Path('js/dashboard-shortcuts-v1.js')
s = p.read_text(encoding='utf-8')
s = s.replace("  {id:'studentBioShortcut',icon:'👤',label:'BIODATA ANGGOTA',action:'biodata'},\n  {id:'topLoginBtn',icon:'🔐',label:'LOGIN ADMIN',action:'admin'}\n", "  {id:'studentBioShortcut',icon:'👤',label:'BIODATA ANGGOTA',action:'biodata'}\n")
p.write_text(s, encoding='utf-8')

idx = Path('index.html')
h = idx.read_text(encoding='utf-8')
h = h.replace('js/dashboard-shortcuts-v1.js?v=5', 'js/dashboard-shortcuts-v1.js?v=6')
idx.write_text(h, encoding='utf-8')
