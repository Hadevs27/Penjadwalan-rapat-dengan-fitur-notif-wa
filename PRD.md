

# PRODUCT REQUIREMENT DOCUMENT (PRD)

**Nama Projek:** Sistem Informasi Penjadwalan dan Agenda Rapat BAPENDA Kabupaten Tangerang Berbasis Web Terintegrasi Telegram Notification

**Stack Teknis:** Next.js (App Router), Neon PostgreSQL, Prisma/Drizzle ORM, Tailwind CSS, Telegram Bot API

**Versi:** 1.0

**Tanggal:** Juli 2026

---

## 1. Latar Belakang & Tujuan

BAPENDA Kabupaten Tangerang memiliki intensitas koordinasi yang tinggi antar-bidang terkait target pendapatan daerah. Proses undangan rapat yang masih bersifat manual atau melalui grup chat umum seringkali terselip, mengakibatkan keterlambatan informasi dan rendahnya tingkat kehadiran.

**Tujuan:** Membangun platform penjadwalan rapat yang proaktif, mampu mengunci ketersediaan ruangan secara real-time, dan mengirimkan notifikasi serta pengingat (*reminder*) otomatis langsung ke Telegram pribadi pegawai yang bersangkutan.

---

## 2. Struktur Pengguna & Hak Akses (User Roles)

* **Super Admin / Sekretariat:** Memiliki hak penuh untuk mengelola master data pegawai, data ruangan, membuat jadwal rapat, memilih peserta, serta mengunggah notulensi.
* **Pegawai / Kepala Bidang:** Hanya dapat melihat kalender rapat, mengonfirmasi kehadiran (RSVP), mengunduh dokumen bahan rapat, dan menautkan akun Telegram mereka sendiri.

---

## 3. Alur Aplikasi (User Flow / Apps Flow)

Alur di bawah ini menjelaskan bagaimana proses dari pendaftaran Telegram oleh Pegawai hingga Admin membuat jadwal rapat dan sistem mengirimkan pengingat otomatis.

```
[ Alur Sinkronisasi Telegram Pegawai ]
Pegawai Login ➔ Buka Halaman Profil ➔ Klik "Hubungkan ke Telegram" 
➔ Diarahkan ke Bot Telegram ➔ Ketik /start ➔ Webhook Next.js menangkap Chat ID 
➔ Chat ID tersimpan di Neon DB ➔ Sinkronisasi Selesai.

[ Alur Manajemen Rapat oleh Admin ]
Admin Input Form Rapat ➔ Sistem cek bentrok Ruangan (Validation) ➔ [Jika Bentrok: Tolak]
➔ [Jika Aman: Simpan ke Neon DB] ➔ Next.js Route Handler trigger API Telegram 
➔ Peserta menerima Undangan Japri di Telegram.

[ Alur Pengingat Otomatis (Cron Job) ]
Vercel Cron / Cron-job.org (Setiap Jam) ➔ Tembak API Route Next.js ➔ Query ke Neon DB 
➔ Cari rapat yang akan mulai 1 jam lagi ➔ Loop kirim Pengingat Japri ke Telegram Peserta.

```

---

## 4. Spesifikasi Fungsional (Fitur)

### M1: Manajemen Autentikasi & Profil (Next-Auth / Auth.js)

* Login berdasarkan NIP (Nomor Induk Pegawai) dan Password.
* Halaman profil untuk melakukan tautan (*deep-linking*) ke Bot Telegram guna mendapatkan `telegram_chat_id`.

### M2: Manajemen Jadwal Rapat (Sisi Admin)

* Form pembuatan rapat: Judul, Deskripsi/Agenda, Tanggal, Jam Mulai, Jam Selesai, Lokasi (Drop-down Ruangan), dan Multi-select Peserta (Pegawai/Bidang).
* Sistem melakukan *server-side validation* pada Next.js untuk memastikan ruangan dan waktu tidak berbenturan dengan rapat lain yang berstatus 'Aktif'.

### M3: Kalender & RSVP (Sisi Pegawai)

* Dashboard utama berupa komponen Kalender Interaktif.
* Pegawai mendapat daftar undangan rapat khusus untuk dirinya dan dapat memilih opsi status kehadiran: **Hadir**, **Izin (Isi Alasan)**, atau **Absen**.

### M4: Integrasi Telegram Bot (Asisten Pengingat Otomatis)

* **Trigger 1 (Instant Notification):** Dikirim sesaat setelah admin menekan tombol simpan rapat.
* **Trigger 2 (Scheduled Reminder):** Dikirim otomatis H-1 Jam sebelum rapat dimulai melalui mekanisme cron-job.

---

Berikut adalah revisi khusus bagian **5. Unified Modeling Language (UML)** untuk dokumen PRD Anda. Bagian ini telah dikembangkan secara detail dan lengkap mencakup **Use Case Diagram, Activity Diagram, Sequence Diagram,** dan **Class Diagram** sesuai standar penulisan skripsi/tugas akhir informatika.

---

## 5. Unified Modeling Language (UML)

### A. Use Case Diagram

Use Case Diagram ini menjelaskan batasan sistem dan interaksi antara dua aktor utama (*Admin/Sekretariat* dan *Pegawai*) terhadap fungsi-fungsi sistem.

* **Deskripsi Hubungan:**
* Aktor **Admin** dan **Pegawai** harus melakukan *Login* terlebih dahulu sebelum bisa mengakses menu utama (`<<include>>`).
* Fungsi *Mengelola Jadwal Rapat* terhubung secara langsung dengan *Kirim Undangan Telegram* secara otomatis (`<<include>>`).

---

### B. Activity Diagram (Alur Pembuatan Jadwal & Notifikasi)

Diagram ini memetakan langkah-langkah aktivitas yang terjadi secara paralel dan sekuensial dari sisi Admin hingga sistem mengirim notifikasi Telegram ke Pegawai.

* **Alur Aktivitas:**
1. **Admin** membuka form dan menginput data jadwal rapat serta memilih peserta.
2. **Sistem (Next.js)** melakukan pengecekan ketersediaan ruangan ke **Database (Neon)**.
3. Jika terjadi bentrok waktu/ruangan, sistem menampilkan pesan error dan admin diminta memperbaiki input.
4. Jika aman, sistem menyimpan data ke database dan secara paralel memicu *Route Handler* untuk melakukan *looping* pengiriman pesan via **Telegram API** ke masing-masing *Chat ID* peserta.

---

### C. Sequence Diagram (Proses Pembuatan Rapat & Notifikasi Otomatis)

Sequence Diagram ini menekankan pada urutan pengiriman pesan (*message*) antar-objek atau komponen teknologi (Client-Side, Next.js Server, Neon DB, dan Telegram API) berdasarkan kronologi waktu.

* **Urutan Kejadian (Chronological Steps):**
1. `Admin Client` mengirimkan data formulir melalui fungsi `POST /api/schedule`.
2. `Next.js API (Server)` mengeksekusi fungsi query cek ketersediaan ruang ke `Neon Postgres DB`.
3. `Neon Postgres DB` mengembalikan hasil pemeriksaan (`Count = 0`).
4. `Next.js API (Server)` memproses perintah *insert data* rapat dan peserta ke `Neon Postgres DB`.
5. Setelah sukses, `Next.js API (Server)` membaca data `telegram_chat_id` peserta lalu menembak endpoint `sendMessage` milik `Telegram API`.
6. `Telegram API` mengirimkan respons balik berupa `status: 200 OK` ke server, dan `Admin Client` menerima notifikasi sukses di layar browser.

---

### D. Class Diagram (Struktur Logika Database Neon PostgreSQL)

Class Diagram ini menggambarkan struktur data, atribut, serta hubungan (*multiplicity/relationship*) antar-tabel yang dikelola di dalam database PostgreSQL melalui ORM Prisma/Drizzle.

* **Penjelasan Relasi Gabungan:**
* **`rooms` ke `meetings` (1 to Many):** Satu ruangan dapat digunakan untuk banyak jadwal rapat yang berbeda, namun satu jadwal rapat hanya boleh bertempat di satu ruangan khusus.
* **`users` ke `meetings` (1 to Many sebagai Pencipta):** Satu orang Admin (`users`) dapat membuat banyak jadwal rapat (`created_by`).
* **`users` ke `meetings` (Many to Many via `meeting_participants`):** Banyak pegawai dapat diundang ke dalam banyak rapat. Hubungan ini dijembatani oleh tabel pivot `meeting_participants` yang sekaligus menyimpan atribut status respon pegawai (`status_kehadiran` dan `alasan_izin`).

---

Semua diagram di atas dibuat sinkron dengan rancangan Next.js dan PostgreSQL via Neon yang telah kita bahas, sehingga struktur bab analisis sistem pada laporan Anda akan menjadi sangat padat dan logis.
---

## 6. Kriteria Penerimaan (Acceptance Criteria)

1. Pesan notifikasi Telegram wajib masuk ke akun pribadi user kurang dari 5 detik setelah admin mengklik tombol simpan (dengan catatan koneksi internet stabil).
2. Sistem harus menolak pembuatan rapat jika `ruangan_id`, `tanggal`, dan rentang `jam_mulai` s.d `jam_selesai` beririsan dengan data rapat yang sudah ada di database.
3. Token API Telegram dilarang keras bocor di sisi client; semua proses penembakan API Telegram harus dijembatani melalui *Server-side environment* Next.js (`process.env`).

