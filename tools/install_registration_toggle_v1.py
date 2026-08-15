from pathlib import Path
import re

cms_path = Path('js/content-manager-v1.js')
index_path = Path('index.html')

cms = cms_path.read_text(encoding='utf-8')

old_public = "function applyPublicNews(items){\n  if(!Array.isArray(items)||!items.length)return;"
new_public = "function applyPublicNews(items){\n  items=Array.isArray(items)?items.filter(item=>String(item?.id||'')!=='CFG-REGISTRATION'&&String(item?.type||'').toUpperCase()!=='PENGATURAN'):[];\n  if(!items.length)return;"
if old_public in cms:
    cms = cms.replace(old_public, new_public, 1)
elif "String(item?.id||'')!=='CFG-REGISTRATION'" not in cms:
    raise SystemExit('Marker applyPublicNews tidak ditemukan')

old_admin = "adminContent=Array.isArray(r.content)?r.content:[];adminGallery=Array.isArray(r.gallery)?r.gallery:[];"
new_admin = "adminContent=Array.isArray(r.content)?r.content.filter(x=>String(x?.id||'')!=='CFG-REGISTRATION'&&String(x?.type||'').toUpperCase()!=='PENGATURAN'):[];adminGallery=Array.isArray(r.gallery)?r.gallery:[];"
if old_admin in cms:
    cms = cms.replace(old_admin, new_admin, 1)

old_seed = "adminContent=r.content||[];adminGallery=r.gallery||[]"
new_seed = "adminContent=Array.isArray(r.content)?r.content.filter(x=>String(x?.id||'')!=='CFG-REGISTRATION'&&String(x?.type||'').toUpperCase()!=='PENGATURAN'):[];adminGallery=r.gallery||[]"
if old_seed in cms:
    cms = cms.replace(old_seed, new_seed, 1)

cms_path.write_text(cms, encoding='utf-8')

html = index_path.read_text(encoding='utf-8')
# Hapus tag lama/duplikat agar urutannya pasti.
html = re.sub(r'\n?<script src="js/dashboard-shortcuts-v1\.js\?v=\d+"></script>', '', html)
html = re.sub(r'\n?<script src="js/content-manager-v1\.js\?v=\d+"></script>', '', html)
html = re.sub(r'\n?<script src="js/registration-toggle-v1\.js\?v=\d+"></script>', '', html)

marker = '<script src="js/drive-image-fix-v2.js?v=2"></script>'
block = (
    '<script src="js/dashboard-shortcuts-v1.js?v=5"></script>\n'
    '<script src="js/content-manager-v1.js?v=2"></script>\n'
    '<script src="js/registration-toggle-v1.js?v=1"></script>\n'
)
if marker in html:
    html = html.replace(marker, block + marker, 1)
elif '</body>' in html:
    html = html.replace('</body>', block + '</body>', 1)
else:
    raise SystemExit('Marker index tidak ditemukan')

index_path.write_text(html, encoding='utf-8')
print('Registration toggle installed')
