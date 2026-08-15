#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
code_path = ROOT / 'backend' / 'Code.gs'
index_path = ROOT / 'index.html'

code = code_path.read_text(encoding='utf-8')

if "const PN_ADMIN_RECOVERY_USED_PROPERTY" not in code:
    code = code.replace(
        "const PN_ADMIN_AUTH_VERSION_PROPERTY = 'PN_ADMIN_AUTH_VERSION_V1';",
        "const PN_ADMIN_AUTH_VERSION_PROPERTY = 'PN_ADMIN_AUTH_VERSION_V1';\n"
        "const PN_ADMIN_RECOVERY_USED_PROPERTY = 'PN_ADMIN_RECOVERY_USED_V1';"
    )

code = code.replace(
    "adminPasswordVersion:'3',\n      adminPasswordConfigured:adminPasswordConfigured_()",
    "adminPasswordVersion:'4',\n"
    "      adminPasswordConfigured:adminPasswordConfigured_(),\n"
    "      adminPasswordRecoveryAvailable:adminPasswordRecoveryAvailable_()"
)
code = code.replace(
    "adminPasswordVersion:'3',\n    adminPasswordConfigured:adminPasswordConfigured_()",
    "adminPasswordVersion:'4',\n"
    "    adminPasswordConfigured:adminPasswordConfigured_(),\n"
    "    adminPasswordRecoveryAvailable:adminPasswordRecoveryAvailable_()"
)

if "if (action === 'adminPasswordRecover')" not in code:
    marker = """    if (action === 'adminChangePassword') {
      result = adminChangePassword_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }
"""
    block = """    if (action === 'adminPasswordRecover') {
      result = adminPasswordRecover_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

""" + marker
    if marker not in code:
        raise SystemExit('Marker adminChangePassword doPost tidak ditemukan.')
    code = code.replace(marker, block, 1)

code = code.replace(
    "['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword']",
    "['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword','adminPasswordRecover']"
)

if "function adminPasswordRecoveryAvailable_()" not in code:
    marker = """function adminPasswordConfigured_() {
  return !!PropertiesService.getScriptProperties().getProperty(PN_ADMIN_PASS_PROPERTY);
}

function adminAuthVersion_() {
"""
    block = """function adminPasswordConfigured_() {
  return !!PropertiesService.getScriptProperties().getProperty(PN_ADMIN_PASS_PROPERTY);
}

function adminPasswordRecoveryAvailable_() {
  return !PropertiesService.getScriptProperties().getProperty(PN_ADMIN_RECOVERY_USED_PROPERTY);
}

function adminAuthVersion_() {
"""
    if marker not in code:
        raise SystemExit('Marker adminPasswordConfigured_ tidak ditemukan.')
    code = code.replace(marker, block, 1)

if "function adminPasswordRecover_(data)" not in code:
    marker = "function adminChangePassword_(data) {\n"
    block = """function adminPasswordRecover_(data) {
  const username = String(data.username || '').trim();
  const currentPassword = String(data.currentPassword || data.password || '');
  const newPassword = String(data.newPassword || '');

  if (username !== PN_REVIEW_ADMIN_USER) throw new Error('Akun admin tidak valid.');
  if (!adminPasswordRecoveryAvailable_()) {
    throw new Error('Jalur pemulihan password sudah pernah digunakan. Gunakan password server yang aktif.');
  }
  if (sha256Hex_(currentPassword) !== PN_REVIEW_ADMIN_PASS_HASH) {
    throw new Error('Password admin lama tidak benar.');
  }
  if (newPassword.length < 8) throw new Error('Password baru minimal 8 karakter.');
  if (newPassword.length > 128) throw new Error('Password baru terlalu panjang.');
  if (newPassword === currentPassword) throw new Error('Password baru harus berbeda dari password saat ini.');

  const props = PropertiesService.getScriptProperties();
  props.setProperty(PN_ADMIN_PASS_PROPERTY, sha256Hex_(newPassword));
  props.setProperty(PN_ADMIN_AUTH_VERSION_PROPERTY, Utilities.getUuid().replace(/-/g,''));
  props.setProperty(PN_ADMIN_RECOVERY_USED_PROPERTY, '1');
  return {
    ok:true,
    configured:true,
    recovered:true,
    message:'Password admin berhasil dipulihkan dan diganti. Password lama tidak berlaku lagi.'
  };
}

""" + marker
    if marker not in code:
        raise SystemExit('Marker adminChangePassword_ tidak ditemukan.')
    code = code.replace(marker, block, 1)

code_path.write_text(code, encoding='utf-8')

index = index_path.read_text(encoding='utf-8')
index = re.sub(r'\s*<script src="js/admin-password-safe-v\d+\.js\?v=\d+"></script>', '', index)
index = re.sub(r'\s*<script src="js/admin-login-dual-recovery-v\d+\.js\?v=\d+"></script>', '', index)
index = re.sub(r'\s*<script src="js/admin-password-save-fix-v\d+\.js\?v=\d+"></script>', '', index)
index = re.sub(r'\s*<script src="js/admin-auth-v4\.js\?v=\d+"></script>', '', index)
tag = '<script src="js/admin-auth-v4.js?v=4"></script>'
if '</body>' not in index:
    raise SystemExit('</body> tidak ditemukan.')
index = index.replace('</body>', tag + '\n</body>', 1)
index_path.write_text(index, encoding='utf-8')
print('Admin auth v4 installed.')
