from pathlib import Path

index = Path('index.html')
text = index.read_text(encoding='utf-8')

for old in [
    'js/reviews-moderation-v2.js?v=2',
    'js/reviews-moderation-v2.js?v=4',
    'js/reviews-moderation-v2.js?v=5',
]:
    text = text.replace(old, 'js/reviews-moderation-v2.js?v=6')
for old in [
    'js/reviews-public-refresh-v3.js?v=3',
    'js/reviews-public-refresh-v3.js?v=4',
    'js/reviews-public-refresh-v3.js?v=5',
    'js/reviews-public-refresh-v3.js?v=6',
]:
    text = text.replace(old, 'js/reviews-public-refresh-v3.js?v=7')

legacy_start = text.find('<script>\n/* REVIEWS SCRIPT V41 */')
modern_marker = '<script src="js/reviews-moderation-v2.js?v=6"></script>'
if legacy_start != -1:
    modern_start = text.find(modern_marker, legacy_start)
    if modern_start == -1:
        raise SystemExit('Modern review script marker not found after legacy block')
    text = text[:legacy_start] + modern_marker + text[modern_start + len(modern_marker):]

# Login admin cepat v9: recovery v7 tidak diperlukan lagi.
text = text.replace('<script src="js/reviews-admin-recovery-v7.js?v=7"></script>\n', '')
text = text.replace('<script src="js/reviews-admin-direct-v8.js?v=8"></script>', '<script src="js/reviews-admin-direct-v8.js?v=9"></script>')

fast_marker = '<script src="js/reviews-admin-direct-v8.js?v=9"></script>'
public_marker = '<script src="js/reviews-public-refresh-v3.js?v=7"></script>'
if fast_marker not in text:
    if public_marker not in text:
        raise SystemExit('Public review script marker not found')
    text = text.replace(public_marker, fast_marker + '\n' + public_marker)

index.write_text(text, encoding='utf-8')

js_path = Path('js/reviews-moderation-v2.js')
js = js_path.read_text(encoding='utf-8')
marker = "  const note=form.querySelector('.reviewFormNote');\n  if(note)note.textContent='Ulasan disimpan ke database pusat dan tidak langsung tampil. Admin akan memeriksa lalu memilih Terbitkan, Tolak, atau Hapus.';\n"
insert = marker + "\n  const openBtn=$('reviewOpenBtn');\n  const closeBtn=$('reviewCloseBtn');\n  const wrap=$('reviewFormWrap');\n  if(openBtn&&!openBtn.dataset.reviewProBound){\n    openBtn.dataset.reviewProBound='1';\n    openBtn.addEventListener('click',()=>{wrap?.classList.add('open');setTimeout(()=>wrap?.scrollIntoView({behavior:'smooth',block:'nearest'}),50);});\n  }\n  if(closeBtn&&!closeBtn.dataset.reviewProBound){\n    closeBtn.dataset.reviewProBound='1';\n    closeBtn.addEventListener('click',()=>wrap?.classList.remove('open'));\n  }\n"
if "openBtn.dataset.reviewProBound='1'" not in js:
    if marker not in js:
        raise SystemExit('Review form marker not found')
    js = js.replace(marker, insert)
    js_path.write_text(js, encoding='utf-8')

print('Review professional controls v6, fast admin login v9, and public GET reader v7 activated.')
