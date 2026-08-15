from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
text = text.replace('js/reviews-moderation-v2.js?v=2', 'js/reviews-moderation-v2.js?v=4')
text = text.replace('js/reviews-public-refresh-v3.js?v=3', 'js/reviews-public-refresh-v3.js?v=4')
p.write_text(text, encoding='utf-8')
print('Review professional cache version activated.')
