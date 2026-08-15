from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
tag = '<script src="js/dashboard-shortcuts-v1.js?v=1"></script>'

if tag in text:
    print('Dashboard shortcuts already installed.')
else:
    marker = '</body>'
    if marker not in text:
        raise SystemExit('Closing body tag not found')
    text = text.replace(marker, tag + '\n' + marker, 1)
    p.write_text(text, encoding='utf-8')
    print('Dashboard shortcuts installed.')
