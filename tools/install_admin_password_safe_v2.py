from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
code_path = ROOT / 'backend' / 'Code.gs'
index_path = ROOT / 'index.html'

code = code_path.read_text(encoding='utf-8')
index = index_path.read_text(encoding='utf-8')

# Backend capability marker. This marker is only available after the updated
# Apps Script source is manually deployed, so the browser can safely keep the
# legacy login until the backend is actually ready.
if "adminPasswordVersion:'2'" not in code:
    health_old = "      content:true,\n      contentVersion:'1'"
    health_new = "      content:true,\n      contentVersion:'1',\n      adminPassword:true,\n      adminPasswordVersion:'2'"
    if health_old not in code:
        raise SystemExit('Health block tidak ditemukan')
    code = code.replace(health_old, health_new, 1)

# Expose only a capability flag (no password/hash) through the existing public
# CMS JSONP response. Old deployed backend will not have this flag.
public_old = """  return {\n    ok:true,\n    content:contentReadContent_(sheets.content, false),\n    gallery:contentReadGallery_(sheets.gallery, false),\n    version:'1'\n  };"""
public_new = """  return {\n    ok:true,\n    content:contentReadContent_(sheets.content, false),\n    gallery:contentReadGallery_(sheets.gallery, false),\n    version:'1',\n    adminPassword:true,\n    adminPasswordVersion:'2'\n  };"""
if "adminPasswordVersion:'2'" not in code[code.find('function contentPublicList_()'):code.find('function contentAdminList_')]:
    if public_old not in code:
        raise SystemExit('contentPublicList block tidak ditemukan')
    code = code.replace(public_old, public_new, 1)

code_path.write_text(code, encoding='utf-8')

# Remove previous experimental password scripts from the live page, if any.
index = re.sub(r'\n?<script src="js/admin-password-v1\.js\?v=\d+"></script>', '', index)
index = re.sub(r'\n?<script src="js/admin-login-recovery-v1\.js\?v=\d+"></script>', '', index)

safe_tag = '<script src="js/admin-password-safe-v2.js?v=2"></script>'
if safe_tag not in index:
    anchor = '<script src="js/admin-review-compact-v1.js?v=1"></script>'
    if anchor not in index:
        raise SystemExit('Anchor admin-review-compact tidak ditemukan')
    index = index.replace(anchor, anchor + '\n' + safe_tag, 1)
else:
    index = re.sub(r'<script src="js/admin-password-safe-v2\.js\?v=\d+"></script>', safe_tag, index)

index_path.write_text(index, encoding='utf-8')
print('Admin password safe v2 installed')
