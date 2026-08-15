from pathlib import Path

root = Path('.')
core_path = root / 'js' / 'ui-v9-core.js'
ui_path = root / 'js' / 'ui-v9.js'
index_path = root / 'index.html'

core = core_path.read_text(encoding='utf-8')
core = core.replace(
    "const PN_ADMIN_PASS_HASH=''; // Password diverifikasi oleh backend Apps Script.",
    "const PN_ADMIN_PASS_HASH='3b396371ec891e73db1ecb5f70d341c4fe6cc6f52fdea96d55dc3fe786d3a639';"
)

secure = """async function submitAdminLogin(ev){
  if(ev)ev.preventDefault();
  const u=document.getElementById('adminUser')?.value.trim()||'',p=document.getElementById('adminPass')?.value||'',err=document.getElementById('loginError');
  if(err)err.textContent='Memeriksa login admin...';
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(typeof window.pnSecureAdminLogin!=='function'){
    if(err)err.textContent='Layanan login admin belum siap. Muat ulang halaman lalu coba lagi.';
    return false;
  }
  try{
    const r=await window.pnSecureAdminLogin(u,p);
    if(!r||!r.ok)throw new Error('Login admin gagal.');
    sessionStorage.setItem('pnAdminAuth','1');closeAdminLogin();enterAdmin(true)
  }catch(e){if(err)err.textContent=e?.message||'Username atau password admin salah.'}
  return false
}"""
legacy = """async function submitAdminLogin(ev){
  if(ev)ev.preventDefault();
  const u=document.getElementById('adminUser')?.value.trim()||'',p=document.getElementById('adminPass')?.value||'',err=document.getElementById('loginError');
  const hash=await sha256Hex(p);
  if(u===PN_ADMIN_USER&&hash===PN_ADMIN_PASS_HASH){
    sessionStorage.setItem('pnAdminAuth','1');closeAdminLogin();enterAdmin(true)
  }else{if(err)err.textContent='Username atau password admin salah.'}
  return false
}"""
if secure in core:
    core = core.replace(secure, legacy)
elif legacy not in core:
    raise SystemExit('Blok submitAdminLogin tidak dikenali; batal agar tidak merusak login.')
core_path.write_text(core, encoding='utf-8')

ui = ui_path.read_text(encoding='utf-8')
ui = ui.replace('js/ui-v9-core.js?v=26', 'js/ui-v9-core.js?v=27')
ui = ui.replace('js/ui-v9-core.js?v=25', 'js/ui-v9-core.js?v=27')
ui_path.write_text(ui, encoding='utf-8')

index = index_path.read_text(encoding='utf-8')
index = index.replace('js/ui-v9.js?v=47', 'js/ui-v9.js?v=48')
index = index.replace('js/ui-v9.js?v=48', 'js/ui-v9.js?v=48')
index = index.replace('<script src="js/admin-password-v1.js?v=1"></script>\n', '')
index = index.replace('<script src="js/admin-login-recovery-v1.js?v=1"></script>\n', '')
index_path.write_text(index, encoding='utf-8')

print('Login admin lama dipulihkan, skrip password sementara dilepas, cache dinaikkan.')
