# Aktivasi Keamanan Backend V2

Source `backend/Code.gs` sudah diperkeras, tetapi Google Apps Script tidak otomatis mengambil perubahan dari GitHub. Lakukan langkah ini pada project Apps Script yang sekarang menjadi Web App website.

1. Buka project Apps Script backend Pagar Nusa.
2. Buka **Project Settings → Script properties**.
3. Tambahkan property sementara `PN_ADMIN_BOOTSTRAP_PASSWORD` dengan password admin BARU yang kuat (minimal 12 karakter, mengandung huruf dan angka). Jangan memakai password lama.
4. Ganti isi `Code.gs` di Apps Script dengan isi terbaru `backend/Code.gs` dari repository ini lalu Save.
5. Dari editor Apps Script pilih fungsi `initializeAdminSecurity_` lalu klik **Run** satu kali.
6. Pastikan property `PN_ADMIN_BOOTSTRAP_PASSWORD` sudah otomatis terhapus. Property `PN_ADMIN_CREDENTIAL_V2`, `PN_ADMIN_PEPPER_V2`, dan `PN_ADMIN_AUTH_VERSION_V2` harus sudah ada.
7. Pilih **Deploy → Manage deployments → Edit → New version → Deploy**. Pertahankan URL `/exec` yang sama.
8. Login admin menggunakan password baru. Password lama tidak boleh dipakai lagi.
9. Pastikan spreadsheet biodata/pendaftaran tetap **Restricted** dan hanya akun pengelola yang punya akses. Folder gambar publik boleh `Anyone with link` hanya jika gambarnya memang untuk website.
10. Aktifkan verifikasi 2 langkah/passkey pada akun Google dan GitHub pemilik.

## Yang diperkeras

- Hash/password fallback admin dihapus dari source publik.
- Password disimpan sebagai credential ber-salt dengan pepper rahasia di Script Properties.
- Login salah dibatasi dan dikunci sementara setelah percobaan berulang.
- Sesi admin dipersingkat menjadi 30 menit.
- Token admin selalu dibuat server dan divalidasi ketat.
- Perubahan password mematikan seluruh sesi lama.
- Login dan perubahan password dicatat ke sheet `Log Keamanan Admin` tanpa menyimpan password atau token.
- Jalur recovery password lama dinonaktifkan.
- Pendaftaran publik diberi throttle 90 detik per kombinasi email+nomor WA.
- Hasil operasi admin di cache hanya 120 detik dan sekali baca.
