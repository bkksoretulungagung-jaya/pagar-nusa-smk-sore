from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
original = text

old_shortcut = '<script src="js/dashboard-shortcuts-v1.js?v=1"></script>'
new_shortcut = '<script src="js/dashboard-shortcuts-v1.js?v=2"></script>'

if old_shortcut in text:
    text = text.replace(old_shortcut, new_shortcut, 1)
elif new_shortcut not in text:
    marker = '</body>'
    if marker not in text:
        raise SystemExit('Closing body tag not found')
    text = text.replace(marker, new_shortcut + '\n' + marker, 1)

text = text.replace(
    '<script src="js/ui-v9.js?v=44"></script>',
    '<script src="js/ui-v9.js?v=45"></script>',
    1,
)

if text != original:
    p.write_text(text, encoding='utf-8')
    print('Dashboard shortcuts and public portal cache versions updated.')
else:
    print('No index changes needed.')
