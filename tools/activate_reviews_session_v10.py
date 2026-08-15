from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')

old = '<script src="js/reviews-admin-direct-v8.js?v=9"></script>'
new = '<script src="js/reviews-admin-session-v10.js?v=10"></script>'
if old in text:
    text = text.replace(old, new)
elif new not in text:
    marker = '<script src="js/reviews-public-refresh-v3.js?v=7"></script>'
    if marker not in text:
        raise SystemExit('Public review script marker not found')
    text = text.replace(marker, new + '\n' + marker)

# Remove older session/direct variants if they remain.
for stale in [
    '<script src="js/reviews-admin-recovery-v7.js?v=7"></script>\n',
    '<script src="js/reviews-admin-direct-v8.js?v=8"></script>\n',
    '<script src="js/reviews-admin-direct-v8.js?v=9"></script>\n',
]:
    text = text.replace(stale, '')

p.write_text(text, encoding='utf-8')
print('Admin review session v10 activated in index.html')
