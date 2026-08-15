from pathlib import Path
import re

ROOT=Path('.')
index=ROOT/'index.html'
backend=ROOT/'backend'/'Code.gs'

html=index.read_text(encoding='utf-8')
html=re.sub(r'\s*<script src="js/admin-password[^\"]*\.js(?:\?v=\d+)?"></script>\s*','\n',html)
insert='\n<script src="js/admin-password-safe-v3.js?v=3"></script>\n'
html=html.replace('</body>',insert+'</body>')
index.write_text(html,encoding='utf-8')

code=backend.read_text(encoding='utf-8')
code=code.replace("adminPassword:true,\n      adminPasswordVersion:'2'", "adminPassword:true,\n      adminPasswordVersion:'3',\n      adminPasswordConfigured:adminPasswordConfigured_()")
code=code.replace("adminPassword:true,\n    adminPasswordVersion:'2'", "adminPassword:true,\n    adminPasswordVersion:'3',\n    adminPasswordConfigured:adminPasswordConfigured_()")

if 'function adminPasswordConfigured_()' not in code:
    needle="function adminPasswordHash_() {\n  return PropertiesService.getScriptProperties().getProperty(PN_ADMIN_PASS_PROPERTY) || PN_REVIEW_ADMIN_PASS_HASH;\n}\n"
    add=needle+"\nfunction adminPasswordConfigured_() {\n  return !!PropertiesService.getScriptProperties().getProperty(PN_ADMIN_PASS_PROPERTY);\n}\n"
    if needle not in code:
        raise SystemExit('adminPasswordHash_ block not found')
    code=code.replace(needle,add,1)

code=code.replace("return {ok:true,message:'Password admin berhasil diubah. Semua sesi lama dinonaktifkan.'};", "return {ok:true,configured:true,message:'Password admin berhasil diubah. Semua sesi lama dinonaktifkan.'};")

backend.write_text(code,encoding='utf-8')
