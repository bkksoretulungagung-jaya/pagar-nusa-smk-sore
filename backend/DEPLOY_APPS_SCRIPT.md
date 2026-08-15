# Deployment sekali saja — Database Pendaftaran Permanen

Database pusat sudah dibuat di Google Sheets:

- Spreadsheet ID: `1WBpDiXDeVCKiAKWze7Dh_J-jG8t8_PAApGkAsBEchtc`
- Sheet: `Data Daftar Siswa Baru`
- Backend source: `backend/Code.gs`

## Langkah deployment

1. Buka https://script.google.com/ menggunakan akun Google yang memiliki spreadsheet di atas.
2. Buat project baru dengan nama `Pagar Nusa Registration API`.
3. Hapus isi default `Code.gs`, lalu salin seluruh isi file `backend/Code.gs` dari repository ini.
4. Klik **Deploy → New deployment**.
5. Pilih **Web app**.
6. **Execute as:** Me.
7. **Who has access:** Anyone.
8. Klik **Deploy**, beri izin Google yang diminta.
9. Salin URL Web App yang berakhiran `/exec`.
10. Masukkan URL `/exec` itu ke konstanta `PN_REG_API_URL` pada frontend pendaftaran. Setelah itu semua pendaftaran dari `www.pagarnusasmksore.com` langsung masuk permanen ke Google Sheet pusat tanpa upload Excel di perangkat pengguna.

## Alur akhir

`Pendaftar → www.pagarnusasmksore.com → Apps Script Web App → Google Sheet Data Daftar Siswa Baru`

Google Sheet tetap private. Hanya Web App yang menerima data pendaftaran publik, sedangkan isi database tetap berada di akun Google pemilik.
