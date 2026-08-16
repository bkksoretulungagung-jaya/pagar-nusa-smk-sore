from pathlib import Path

changes = []

# 1) Sinkronkan backend gabungan agar membaca 22 kolom biodata.
path = Path('backend/Code.gs')
text = path.read_text(encoding='utf-8')
old_headers = """const PN_BIODATA_HEADERS = [
  'ID Anggota','Nama Lengkap','L/P','Tempat Lahir','Tanggal Lahir','Kelas','Program Keahlian','Alamat','No. HP Siswa',
  'Nama Orang Tua/Wali','No. HP Wali','Tahun Pengesahan','Tahun Masuk','Tingkat/Sabuk','Status Keanggotaan','Status Siswa',
  'Nomor Sertifikat','Catatan','Tanggal Pengesahan'
];"""
new_headers = """const PN_BIODATA_HEADERS = [
  'ID Anggota','Nama Lengkap','L/P','Tempat Lahir','Tanggal Lahir','Kelas','Program Keahlian','Alamat','No. HP Siswa',
  'Nama Orang Tua/Wali','No. HP Wali','Tahun Pengesahan','Tahun Masuk','Tingkat/Sabuk','Status Keanggotaan','Status Siswa',
  'Nomor Sertifikat','Catatan','Tanggal Pengesahan','Koordinator Aspel','Anggota Aspel 1','Anggota Aspel 2'
];"""
old_object = """    certificateNumber:d[16],
    notes:d[17],
    approvalDate:d[18]
  };"""
new_object = """    certificateNumber:d[16],
    notes:d[17],
    approvalDate:d[18],
    aspelCoordinator:d[19],
    aspelMember1:d[20],
    aspelMember2:d[21]
  };"""

before = text
if old_headers in text:
    text = text.replace(old_headers, new_headers, 1)
elif new_headers not in text:
    raise SystemExit('Blok PN_BIODATA_HEADERS tidak ditemukan atau format berubah.')
if old_object in text:
    text = text.replace(old_object, new_object, 1)
elif new_object not in text:
    raise SystemExit('Blok biodataObject_ tidak ditemukan atau format berubah.')
if text != before:
    path.write_text(text, encoding='utf-8')
    changes.append(str(path))

# 2) Naikkan versi tampilan biodata agar browser mengambil HTML terbaru.
bio = Path('biodata.html')
bio_text = bio.read_text(encoding='utf-8')
for old in [
    'Portal Biodata aktif · versi 6.',
    'Portal Biodata aktif · versi 7.'
]:
    if old in bio_text:
        bio_text = bio_text.replace(old, 'Portal Biodata aktif · versi 8.', 1)
        break
required = [
    "['Koordinator Aspel','aspelCoordinator']",
    "['Anggota Aspel 1','aspelMember1']",
    "['Anggota Aspel 2','aspelMember2']",
    "'aspelCoordinator','aspelMember1','aspelMember2'"
]
if not all(token in bio_text for token in required):
    raise SystemExit('Field Aspel pada biodata.html tidak lengkap.')
if bio_text != bio.read_text(encoding='utf-8'):
    bio.write_text(bio_text, encoding='utf-8')
    changes.append(str(bio))

# 3) Bump URL Portal Biodata di menu pintasan untuk memutus cache halaman lama.
dash = Path('js/dashboard-shortcuts-v1.js')
dash_text = dash.read_text(encoding='utf-8')
if "window.location.href='biodata.html?v=7';" in dash_text:
    dash_text = dash_text.replace("window.location.href='biodata.html?v=7';", "window.location.href='biodata.html?v=8';", 1)
elif "window.location.href='biodata.html?v=8';" not in dash_text:
    raise SystemExit('URL Portal Biodata pada dashboard-shortcuts-v1.js tidak ditemukan.')
if dash_text != dash.read_text(encoding='utf-8'):
    dash.write_text(dash_text, encoding='utf-8')
    changes.append(str(dash))

# 4) Bump cache script dashboard pada index.html agar perubahan URL v8 ikut terambil.
index = Path('index.html')
index_text = index.read_text(encoding='utf-8')
import re
new_index, n = re.subn(r'js/dashboard-shortcuts-v1\.js\?v=\d+', 'js/dashboard-shortcuts-v1.js?v=8', index_text)
if n == 0:
    raise SystemExit('Referensi dashboard-shortcuts-v1.js pada index.html tidak ditemukan.')
if new_index != index_text:
    index.write_text(new_index, encoding='utf-8')
    changes.append(str(index))

print('Perubahan:', ', '.join(changes) if changes else 'tidak ada; semua sudah sinkron')
