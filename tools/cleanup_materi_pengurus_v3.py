from pathlib import Path

path = Path('materi-pengurus.html')
text = path.read_text(encoding='utf-8')

# Rapikan layout Admin menjadi satu kolom.
text = text.replace(
    '.adminGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}',
    '.adminGrid{display:grid;grid-template-columns:1fr;gap:14px}'
)
text = text.replace(
    '.adminGrid{display:grid;grid-template-columns:1fr;gap:14px}.adminGrid .adminPanel:first-child{display:none!important}',
    '.adminGrid{display:grid;grid-template-columns:1fr;gap:14px}'
)

# Ubah seluruh keterangan ke sistem akun pribadi.
text = text.replace(
    '🔒 File disimpan privat. Tombol download mengambil file melalui server setelah kode akses pengurus diverifikasi.',
    '🔒 File disimpan privat. Pengurus hanya dapat membuka dan mengunduh materi setelah login memakai akun email dan password pribadi yang dibuat Admin.'
)
text = text.replace(
    'Muncul otomatis bila halaman dibuka saat sesi admin website masih aktif.',
    'Halaman khusus Admin untuk upload dan mengelola materi. Akun pengurus dikelola melalui menu 👥 AKUN PENGURUS.'
)
text = text.replace(
    "setStatus('adminStatus',r.accessConfigured?'✓ Mode admin aktif. Kode akses pengurus sudah dibuat.':'Mode admin aktif. Buat kode akses pengurus terlebih dahulu.',r.accessConfigured?'ok':'warn');",
    "setStatus('adminStatus','✓ Mode admin aktif. Upload dan kelola materi di halaman ini. Login pengurus memakai akun email + password pribadi.','ok');"
)

# Hapus panel kode akses lama dari DOM, bukan sekadar disembunyikan.
old_panel = '''        <div class="adminPanel">
          <h4>🔑 Kode Akses Pengurus</h4>
          <form id="accessAdminForm">
            <div class="field"><label>Kode akses baru (minimal 8 karakter)</label><input id="newAccessCode" class="input" type="password" minlength="8" maxlength="80" placeholder="Contoh: PN-PENGURUS-2026" required></div>
            <div class="field"><label>Ulangi kode akses</label><input id="confirmAccessCode" class="input" type="password" minlength="8" maxlength="80" required></div>
            <button class="btn primary" type="submit">SIMPAN / GANTI KODE</button>
          </form>
        </div>
'''
text = text.replace(old_panel, '')

# Hapus handler lama supaya tidak ada referensi ke form yang sudah dihapus.
old_save_access = "async function saveAccess(ev){ev.preventDefault();const a=$('newAccessCode').value,b=$('confirmAccessCode').value;if(a.length<8){setStatus('adminStatus','Kode akses minimal 8 karakter.','err');return}if(a!==b){setStatus('adminStatus','Ulangi kode akses belum sama.','err');return}try{setStatus('adminStatus','Menyimpan kode akses pengurus...');const r=await postReliable('materiAdminSetAccess',{token:adminToken,newCode:a},30000);if(!r?.ok)throw new Error(r?.message||'Kode akses gagal disimpan.');$('accessAdminForm').reset();sessionStorage.removeItem(TOKEN_KEY);setStatus('adminStatus','✓ Kode akses pengurus berhasil disimpan. Semua sesi pengurus lama telah dinonaktifkan.','ok')}catch(e){setStatus('adminStatus',String(e.message||e),'err')}}\n"
text = text.replace(old_save_access, '')
text = text.replace("$('accessAdminForm').addEventListener('submit',saveAccess);", '')

# Tambahkan shortcut pengelolaan akun pada panel upload Admin bila belum ada.
marker = '<h4>⬆ Upload Materi Baru</h4>'
shortcut = '<div style="display:flex;justify-content:flex-end;margin:-2px 0 10px"><a href="akun-pengurus.html" style="text-decoration:none;background:#0f766e;color:#fff;border-radius:8px;padding:8px 11px;font-size:10px;font-weight:900">👥 KELOLA AKUN PENGURUS</a></div>'
if shortcut not in text and marker in text:
    text = text.replace(marker, marker + '\n          ' + shortcut, 1)

path.write_text(text, encoding='utf-8')
print('materi-pengurus.html bersih: kode akses bersama dihapus dari tampilan Admin')
# trigger workflow v3.1
