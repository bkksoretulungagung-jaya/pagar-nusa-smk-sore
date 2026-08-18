from pathlib import Path
import re

root = Path('.')
index_path = root / 'index.html'
v1_path = root / 'js' / 'dashboard-shortcuts-v1.js'
v2_path = root / 'js' / 'dashboard-shortcuts-v2.js'

index = index_path.read_text(encoding='utf-8')
js = v1_path.read_text(encoding='utf-8')

# 1) Tambahkan Pedoman Pengurus ke menu pintasan publik.
needle = "  {id:'studentCbtShortcut',icon:'📝',label:'CBT ONLINE',action:'cbt'}\n];"
replacement = "  {id:'studentCbtShortcut',icon:'📝',label:'CBT ONLINE',action:'cbt'},\n  {id:'pengurusGuideShortcut',icon:'📚',label:'PEDOMAN PENGURUS',action:'pengurus'}\n];"
if needle not in js:
    raise SystemExit('Pola ITEMS dashboard shortcut tidak ditemukan')
js = js.replace(needle, replacement, 1)

# 2) Styling tombol Pedoman Pengurus.
style_needle = "    .pnDashShortcutBtn.cbtShortcut:hover,.pnDashShortcutBtn.cbtShortcut:focus-visible{background:#14532d;border-color:#14532d;color:#fff}\n"
style_add = style_needle + "    .pnDashShortcutBtn.pengurusShortcut{background:#14532d;border-color:#14532d;color:#fff}\n    .pnDashShortcutBtn.pengurusShortcut:hover,.pnDashShortcutBtn.pengurusShortcut:focus-visible{background:#0f3d24;border-color:#0f3d24;color:#fff}\n"
if style_needle not in js:
    raise SystemExit('Pola styling CBT tidak ditemukan')
js = js.replace(style_needle, style_add, 1)

# 3) Fungsi buka Portal Pengurus.
fn_needle = "function openCbtFromShortcut(btn){\n  pulse(btn);\n  window.location.href='siswa.html';\n}\n"
fn_add = fn_needle + "\nfunction openPengurusFromShortcut(btn){\n  pulse(btn);\n  window.location.href='portal-pengurus.html';\n}\n"
if fn_needle not in js:
    raise SystemExit('Pola fungsi CBT tidak ditemukan')
js = js.replace(fn_needle, fn_add, 1)

# 4) Anggap action pengurus selalu tersedia.
old_available = "const available=ITEMS.filter(item=>['admin','biodata','registration','cbt'].includes(item.action)||document.getElementById(item.id));"
new_available = "const available=ITEMS.filter(item=>['admin','biodata','registration','cbt','pengurus'].includes(item.action)||document.getElementById(item.id));"
if old_available not in js:
    raise SystemExit('Pola available dashboard shortcut tidak ditemukan')
js = js.replace(old_available, new_available, 1)

# 5) Beri class khusus pada tombol.
old_class = "${item.action==='admin'?' adminShortcut':''}${item.action==='biodata'?' bioShortcut':''}${item.action==='registration'?' registrationShortcut':''}${item.action==='cbt'?' cbtShortcut':''}"
new_class = old_class + "${item.action==='pengurus'?' pengurusShortcut':''}"
if old_class not in js:
    raise SystemExit('Pola class dashboard shortcut tidak ditemukan')
js = js.replace(old_class, new_class, 1)

# 6) Routing klik.
old_click = "else if(btn.dataset.action==='cbt')openCbtFromShortcut(btn);\n      else goTo(btn.dataset.target);"
new_click = "else if(btn.dataset.action==='cbt')openCbtFromShortcut(btn);\n      else if(btn.dataset.action==='pengurus')openPengurusFromShortcut(btn);\n      else goTo(btn.dataset.target);"
if old_click not in js:
    raise SystemExit('Pola handler klik dashboard shortcut tidak ditemukan')
js = js.replace(old_click, new_click, 1)

v2_path.write_text(js, encoding='utf-8')

# 7) Hapus kartu besar Materi Ekstra Khusus Pengurus dari dashboard publik.
index, n1 = re.subn(
    r'\n\s*<section id="materiPengurusPromo" class="materiPengurusPromo".*?</section>\s*\n',
    '\n',
    index,
    count=1,
    flags=re.S,
)
if n1 != 1:
    raise SystemExit('Blok materiPengurusPromo tidak ditemukan')

# 8) Hapus tombol Portal Pengurus lama di bagian bawah publik.
index, n2 = re.subn(
    r'\n\s*<div id="portalPengurusEntry".*?</div>\s*\n',
    '\n',
    index,
    count=1,
    flags=re.S,
)
if n2 != 1:
    raise SystemExit('Blok portalPengurusEntry tidak ditemukan')

# 9) Hapus CSS promo lama supaya source tetap bersih.
index = re.sub(
    r'\n<style>\s*/\* MATERI PENGURUS PROMO V1 \*/.*?</style>\s*\n',
    '\n',
    index,
    count=1,
    flags=re.S,
)

# 10) Pakai file JS versi baru agar browser tidak memakai cache lama.
index, n3 = re.subn(
    r'js/dashboard-shortcuts-v1\.js(?:\?[^"\']*)?',
    'js/dashboard-shortcuts-v2.js?v=20260818-1037',
    index,
    count=1,
)
if n3 != 1:
    raise SystemExit('Referensi dashboard-shortcuts-v1.js tidak ditemukan di index.html')

index_path.write_text(index, encoding='utf-8')
print('PEDOMAN PENGURUS dipindah ke menu bar; promo dan portal bawah dihapus.')
