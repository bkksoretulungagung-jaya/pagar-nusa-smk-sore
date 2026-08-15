from pathlib import Path

p=Path('index.html')
text=p.read_text(encoding='utf-8')
orig=text

tag='<script src="js/content-manager-v1.js?v=1"></script>'
if tag not in text:
    marker='<script src="js/dashboard-shortcuts-v1.js?v=4"></script>'
    if marker in text:
        text=text.replace(marker,marker+'\n'+tag,1)
    else:
        text=text.replace('</body>',tag+'\n</body>',1)

if text!=orig:
    p.write_text(text,encoding='utf-8')
    print('Content manager frontend activated.')
else:
    print('No frontend changes needed.')
