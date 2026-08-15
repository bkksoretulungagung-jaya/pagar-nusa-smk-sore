from pathlib import Path
import re

path=Path('index.html')
text=path.read_text(encoding='utf-8')
text=re.sub(r'\n?<script src="js/cbt-toggle-v1\.js\?v=\d+"></script>','',text)
needle='<script src="js/registration-toggle-v1.js?v=1"></script>'
insert=needle+'\n<script src="js/cbt-toggle-v1.js?v=1"></script>'
if needle not in text:
    raise SystemExit('registration toggle script marker not found')
text=text.replace(needle,insert,1)
path.write_text(text,encoding='utf-8')
print('CBT toggle v1 installed')
