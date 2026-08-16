from pathlib import Path

# 1) Content manager tidak boleh menghapus status login admin hanya karena token backend putus.
p = Path('js/content-manager-v1.js')
s = p.read_text(encoding='utf-8')
old = "if(/sesi admin sudah dinonaktifkan|sesi verifikasi admin tidak valid|sesi admin perangkat tidak ditemukan/i.test(msg)){clearToken();try{localStorage.removeItem('pnAdminAuth');sessionStorage.removeItem('pnAdminAuth')}catch(_){}}"
new = "if(/sesi admin sudah dinonaktifkan|sesi verifikasi admin tidak valid|sesi admin perangkat tidak ditemukan/i.test(msg)){clearToken();try{localStorage.setItem('pnAdminAuth','1');sessionStorage.setItem('pnAdminAuth','1')}catch(_){}}"
if old not in s:
    raise SystemExit('content manager auth-clear target not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# 2) Lapisan inti: selama status admin masih aktif, panggilan otomatis tidak boleh melempar ke dashboard publik.
p = Path('js/ui-v9-core.js')
s = p.read_text(encoding='utf-8')
old = """function showPublicDashboard(){
  document.getElementById('adminApp')?.classList.add('hidden');
  document.getElementById('publicHome')?.classList.remove('hidden');
  document.getElementById('topLoginBtn')?.classList.remove('hidden');
  toggleDatabasePanel(false);setAdminControls(false);refreshPublicDashboardV9();window.scrollTo({top:0,behavior:'smooth'})
}
function logoutAdmin(){const token=localStorage.getItem('pnReviewAdminToken')||sessionStorage.getItem('pnReviewAdminToken')||'';try{if(token&&typeof window.pnRevokeAdminSession==='function')window.pnRevokeAdminSession(token)}catch(_){};['pnAdminAuth','pnReviewAdminToken'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){};try{sessionStorage.removeItem(k)}catch(_){}});showPublicDashboard()}
"""
new = """function showPublicDashboard(force=false){
  let authActive=false;
  try{authActive=localStorage.getItem('pnAdminAuth')==='1'||sessionStorage.getItem('pnAdminAuth')==='1'}catch(_){}
  const adminVisible=!document.getElementById('adminApp')?.classList.contains('hidden');
  // Jangan izinkan proses sinkronisasi/token mengeluarkan admin otomatis.
  // Hanya logout eksplisit yang boleh menutup area admin saat sesi masih aktif.
  if(force!==true&&authActive&&adminVisible)return false;
  document.getElementById('adminApp')?.classList.add('hidden');
  document.getElementById('publicHome')?.classList.remove('hidden');
  document.getElementById('topLoginBtn')?.classList.remove('hidden');
  toggleDatabasePanel(false);setAdminControls(false);refreshPublicDashboardV9();window.scrollTo({top:0,behavior:'smooth'});return true
}
function logoutAdmin(){const token=localStorage.getItem('pnReviewAdminToken')||sessionStorage.getItem('pnReviewAdminToken')||'';try{if(token&&typeof window.pnRevokeAdminSession==='function')window.pnRevokeAdminSession(token)}catch(_){};['pnAdminAuth','pnReviewAdminToken'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){};try{sessionStorage.removeItem(k)}catch(_){}});showPublicDashboard(true)}
"""
if old not in s:
    raise SystemExit('ui core showPublicDashboard target not found')
s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

# 3) Paksa browser mengambil file baru.
p = Path('js/ui-v9.js')
s = p.read_text(encoding='utf-8')
if 'js/ui-v9-core.js?v=32' not in s:
    raise SystemExit('ui core loader v32 not found')
s = s.replace('js/ui-v9-core.js?v=32', 'js/ui-v9-core.js?v=33', 1)
p.write_text(s, encoding='utf-8')

p = Path('index.html')
s = p.read_text(encoding='utf-8')
repls = [
    ('js/ui-v9.js?v=55', 'js/ui-v9.js?v=56'),
    ('js/reviews-admin-session-v10.js?v=13', 'js/reviews-admin-session-v10.js?v=14'),
    ('js/content-manager-v1.js?v=8', 'js/content-manager-v1.js?v=9'),
]
for old, new in repls:
    if old not in s:
        raise SystemExit(f'index loader not found: {old}')
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

print('admin stay guard v2 patched')
