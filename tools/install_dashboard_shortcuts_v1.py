from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
original = text

for old in [
    '<script src="js/dashboard-shortcuts-v1.js?v=1"></script>',
    '<script src="js/dashboard-shortcuts-v1.js?v=2"></script>',
]:
    if old in text:
        text = text.replace(old, '<script src="js/dashboard-shortcuts-v1.js?v=3"></script>', 1)
        break
else:
    if '<script src="js/dashboard-shortcuts-v1.js?v=3"></script>' not in text:
        marker = '</body>'
        if marker not in text:
            raise SystemExit('Closing body tag not found')
        text = text.replace(marker, '<script src="js/dashboard-shortcuts-v1.js?v=3"></script>\n' + marker, 1)

for old_ui in [
    '<script src="js/ui-v9.js?v=44"></script>',
    '<script src="js/ui-v9.js?v=45"></script>',
    '<script src="js/ui-v9.js?v=46"></script>',
]:
    if old_ui in text:
        text = text.replace(old_ui, '<script src="js/ui-v9.js?v=47"></script>', 1)
        break

if text != original:
    p.write_text(text, encoding='utf-8')
    print('Top Biodata/Admin shortcut cache versions updated.')
else:
    print('No index changes needed.')
