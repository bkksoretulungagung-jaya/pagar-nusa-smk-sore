from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')

text = text.replace('js/reviews-moderation-v2.js?v=2', 'js/reviews-moderation-v2.js?v=4')
text = text.replace('js/reviews-public-refresh-v3.js?v=3', 'js/reviews-public-refresh-v3.js?v=4')

legacy_start = text.find('<script>\n/* REVIEWS SCRIPT V41 */')
modern_marker = '<script src="js/reviews-moderation-v2.js?v=4"></script>'
if legacy_start != -1:
    modern_start = text.find(modern_marker, legacy_start)
    if modern_start == -1:
        raise SystemExit('Modern review script marker not found after legacy block')
    text = text[:legacy_start] + modern_marker + text[modern_start + len(modern_marker):]

p.write_text(text, encoding='utf-8')
print('Review professional v4 activated; legacy WhatsApp review code removed.')
