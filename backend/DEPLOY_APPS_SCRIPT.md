# Deployment Backend — Database Pagar Nusa

Database pusat menggunakan Google Sheets dan backend Google Apps Script.

- Backend source: `backend/Code.gs`
- Panduan keamanan wajib: `backend/SECURITY_DEPLOY.md`

## Penting sebelum deploy

Backend sekarang memakai **Keamanan Admin V2**. Jangan langsung mengganti `Code.gs` lalu deploy tanpa melakukan inisialisasi keamanan, karena login admin memang akan ditolak bila credential server belum dibuat.

Ikuti `backend/SECURITY_DEPLOY.md` untuk:

1. Membuat password admin baru melalui Script Property sementara `PN_ADMIN_BOOTSTRAP_PASSWORD`.
2. Menyalin `backend/Code.gs` terbaru ke project Apps Script yang sudah digunakan website.
3. Menjalankan `initializeAdminSecurity_()` satu kali.
4. Memastikan bootstrap password otomatis terhapus dan credential/pepper V2 tersimpan di Script Properties.
5. Membuat **New version** pada deployment Web App yang sudah ada agar URL `/exec` tetap sama.

## Aktivasi Database Excel Cloud V1

Fitur lintas perangkat memakai file Excel master privat di Google Drive melalui endpoint backend yang sama. Tidak diperlukan ID folder atau file manual; backend membuat folder `Pagar Nusa - Database Excel Utama` dan Script Properties yang dibutuhkan saat upload pertama.

Urutan aktivasi yang aman:

1. Buka project Google Apps Script yang saat ini melayani URL Web App `/exec` milik website.
2. Ganti isi `Code.gs` dengan `backend/Code.gs` terbaru dari branch/PR fitur Excel Cloud.
3. Simpan project. Tidak perlu mengubah password admin atau menjalankan ulang `initializeAdminSecurity_()` jika Keamanan Admin V2 sudah aktif.
4. Buka **Deploy → Manage deployments → Edit**, pilih **New version**, lalu deploy dengan konfigurasi Web App yang sama. Jangan membuat URL `/exec` baru.
5. Uji endpoint `?action=health`; respons versi baru harus memuat `excelCloud: true` dan `excelCloudVersion: "1"`.
6. Setelah backend versi baru aktif, merge/publikasikan perubahan frontend.
7. Login admin di perangkat utama, pilih database Excel sekali. Setelah status `DATABASE CLOUD` muncul, perangkat lain cukup login admin untuk memuat database yang sama.

Upload Excel dari perangkat lain tidak akan mengganti master yang sudah ada. Simpan/Ubah/Hapus akan membuat master terbaru dan menyimpan maksimal 5 salinan master sebelumnya di folder Drive privat.

## Konfigurasi Web App

- **Execute as:** Me
- **Who has access:** Anyone

Akses `Anyone` diperlukan karena endpoint publik menerima pendaftaran, menampilkan konten, dan melayani portal website. Data sensitif tidak boleh dibuka langsung; semua operasi admin tetap wajib melewati autentikasi server pada `Code.gs`.

## Pengamanan Google Drive / Sheets

Spreadsheet pendaftaran dan biodata harus tetap **Restricted** dan hanya akun pengelola yang diberi akses. Jangan mengubah spreadsheet database menjadi `Anyone with link`. Folder gambar publik boleh dibagikan untuk dibaca publik hanya bila isinya memang foto yang ditampilkan di website.

Folder `Pagar Nusa - Database Excel Utama` harus tetap **Restricted**. Backend tidak mengaktifkan `Anyone with link` untuk file Excel master maupun backup-nya.

## Alur

`Pengguna → pagarnusasmksore.com → Apps Script Web App → Google Sheets/Drive`

Website publik tidak memegang password admin ataupun credential database. Password admin disimpan sebagai credential ber-salt dengan pepper rahasia di Script Properties setelah aktivasi Keamanan Admin V2.
