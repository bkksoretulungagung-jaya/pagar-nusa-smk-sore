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

## Konfigurasi Web App

- **Execute as:** Me
- **Who has access:** Anyone

Akses `Anyone` diperlukan karena endpoint publik menerima pendaftaran, menampilkan konten, dan melayani portal website. Data sensitif tidak boleh dibuka langsung; semua operasi admin tetap wajib melewati autentikasi server pada `Code.gs`.

## Pengamanan Google Drive / Sheets

Spreadsheet pendaftaran dan biodata harus tetap **Restricted** dan hanya akun pengelola yang diberi akses. Jangan mengubah spreadsheet database menjadi `Anyone with link`. Folder gambar publik boleh dibagikan untuk dibaca publik hanya bila isinya memang foto yang ditampilkan di website.

## Alur

`Pengguna → pagarnusasmksore.com → Apps Script Web App → Google Sheets/Drive`

Website publik tidak memegang password admin ataupun credential database. Password admin disimpan sebagai credential ber-salt dengan pepper rahasia di Script Properties setelah aktivasi Keamanan Admin V2.
