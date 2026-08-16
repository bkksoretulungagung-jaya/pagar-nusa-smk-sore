from pathlib import Path

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

changed = False
if old_headers in text:
    text = text.replace(old_headers, new_headers, 1)
    changed = True
elif new_headers not in text:
    raise SystemExit('Blok PN_BIODATA_HEADERS tidak ditemukan atau format berubah.')

if old_object in text:
    text = text.replace(old_object, new_object, 1)
    changed = True
elif new_object not in text:
    raise SystemExit('Blok biodataObject_ tidak ditemukan atau format berubah.')

if changed:
    path.write_text(text, encoding='utf-8')
    print('backend/Code.gs disinkronkan ke 22 kolom biodata termasuk Aspel.')
else:
    print('backend/Code.gs sudah sinkron; tidak ada perubahan.')
