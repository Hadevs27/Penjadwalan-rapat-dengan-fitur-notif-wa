# 📖 Panduan Penggunaan Sistem Informasi Penjadwalan & Agenda Rapat BAPENDA

Selamat datang di panduan penggunaan aplikasi Sistem Informasi Penjadwalan Rapat. Panduan ini ditujukan bagi pengguna baru untuk memahami cara menjalankan, mengonfigurasi, dan menggunakan sistem ini dengan lancar.

---

## 1. Persiapan & Menjalankan Aplikasi (Lokal)

Pastikan aplikasi sudah memiliki koneksi ke **Database Neon PostgreSQL** dan **Bot Telegram** Anda.

### A. Persiapan Koneksi (File `.env`)
Buka file `.env` di folder proyek dan isi kredensial berikut:
```env
# URL Koneksi Neon Postgres (Contoh: postgresql://username:password@ep-cold-mode.ap-southeast-1.aws.neon.tech/bapenda)
DATABASE_URL="postgresql://..."

# Token dari @BotFather di Telegram
TELEGRAM_BOT_TOKEN="1234567890:AAH_XYZ..."

# Secret key (bisa diisi string acak apa saja)
NEXTAUTH_SECRET="rahasia_bapenda_123"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="cron_rahasia_123"
```

### B. Menerapkan Database & Akun Admin
Buka terminal dan jalankan urutan perintah berikut:
1. `npm run db:push` ➔ (Untuk membuat struktur tabel di Neon DB Anda).
2. `npm run seed` ➔ (Untuk membuat akun **Super Admin** bawaan pertama kali).
3. `npm run dev` ➔ (Untuk menjalankan server aplikasi).

Aplikasi sekarang dapat diakses di browser pada: **http://localhost:3000**

---

## 2. Kredensial Akun (Login)

Gunakan akun berikut untuk pertama kali masuk ke dalam sistem:

* **Role:** Super Admin / Administrator
* **NIP:** `admin`
* **Password:** `admin123`

Setelah masuk dengan akun ini, Anda dapat mulai menambahkan data pegawai, kepala bidang, atau staf lain pada menu **Manajemen Pegawai**.

---

## 3. Cara Menggunakan Fitur (User Guide)

### A. Untuk Admin (Sekretariat)
Admin memiliki hak akses penuh terhadap konfigurasi sistem.
1. **Manajemen Ruangan:**
   - Pergi ke menu `Manajemen Ruangan`.
   - Tambahkan ruang rapat beserta detail kapasitasnya. Ruangan ini akan muncul sebagai opsi saat menjadwalkan rapat.
2. **Manajemen Pegawai:**
   - Pergi ke menu `Manajemen Pegawai`.
   - Tambahkan akun NIP dan sandi untuk pegawai-pegawai BAPENDA lainnya.
   - Anda dapat menunjuk pegawai lain menjadi `Admin` atau sekadar `Pegawai` biasa.
3. **Membuat Jadwal Rapat:**
   - Pergi ke menu `Kalender Rapat` dan klik tombol biru **Buat Rapat Baru**.
   - Isi Formulir Rapat (Judul, Waktu, Ruangan, dan Pilih peserta yang diundang).
   - **Fitur Anti-Bentrok:** Jika waktu dan ruangan yang Anda pilih sudah terpakai oleh jadwal lain, sistem akan otomatis menolaknya!
   - Setelah menekan tombol Simpan, semua pegawai yang terpilih (dan sudah menautkan Telegram-nya) akan **langsung menerima undangan notifikasi japri** di Telegram mereka detik itu juga.

### B. Untuk Pegawai (User Biasa)
Pegawai hanya dapat melihat jadwal dan menautkan akun notifikasi mereka.
1. **Login:** Pegawai masuk menggunakan NIP dan Password yang telah dibuatkan oleh Admin.
2. **Melihat Jadwal:** Di menu Kalender Rapat, Pegawai hanya akan melihat jadwal di mana dirinya diundang sebagai peserta.
3. **Menautkan Telegram (PENTING!):**
   - Pegawai wajib pergi ke menu **Pengaturan Profil**.
   - Klik tombol **Hubungkan ke Telegram**.
   - Aplikasi Telegram akan terbuka secara otomatis di HP/Laptop pegawai (menuju Bot BAPENDA).
   - Pegawai cukup mengklik tombol **START** di chat bot tersebut.
   - Selesai! Sistem sudah berhasil mengunci Chat ID pegawai. Mulai saat itu, mereka akan selalu mendapatkan notifikasi undangan dan *reminder* 1 jam sebelum rapat dimulai.

---

## 4. Simulasi Pengingat (Cron Job) H-1 Jam
Sistem memiliki endpoint rahasia untuk mengirimkan pengingat 1 jam sebelum rapat dimulai.

* Untuk mengetes atau menjalankannya, Anda bisa mengatur layanan gratis seperti *Cron-job.org* atau *Vercel Cron* untuk memanggil URL ini setiap jam:
  `GET http://localhost:3000/api/cron`
* Pastikan memanggil API tersebut dengan Header:
  `Authorization: Bearer cron_rahasia_123`
*(sesuaikan value bearer dengan `CRON_SECRET` di file `.env`)*

Sistem akan mencari rapat yang dimulai persis 1 jam dari waktu pemanggilan dan menyiarkan peringatan persiapan (Reminder) ke Telegram peserta!
