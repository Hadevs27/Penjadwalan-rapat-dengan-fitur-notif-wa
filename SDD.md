Berikut adalah **SDD (System Architecture / Design Document)** yang merupakan kelanjutan dari PRD sebelumnya. Dokumen ini berfokus pada detail teknis, arsitektur *full-stack* Next.js, skema database fisik pada Neon PostgreSQL, serta spesifikasi API/Keamanan untuk sistem informasi agenda rapat BAPENDA Kabupaten Tangerang.

---

# SYSTEM DESIGN DOCUMENT (SDD)

**Nama Projek:** Sistem Informasi Penjadwalan Rapat BAPENDA Kabupaten Tangerang

**Arsitektur:** Full-Stack Serverless (Next.js App Router)

**Database:** Serverless PostgreSQL (Neon) via Prisma/Drizzle ORM

**Target Infratruktur:** Vercel (Hosting Web) + Telegram API Server

---

## 1. Arsitektur Sistem (System Architecture)

Aplikasi ini menggunakan arsitektur **Hybrid Server-Client** yang disediakan oleh Next.js App Router. Komponen berat yang berinteraksi dengan database dijalankan di sisi server untuk keamanan dan kecepatan.

```
       [ Client Side / Browser ]
       +-----------------------+
       |   Tailwind CSS UI     |
       |  (React Components)   |
       +-----------------------+
                   │  (Fetch HTTP / Server Actions)
                   ▼
       [ Server Side / Next.js Backend ]
       +-----------------------+
       |  - Route Handlers     |
       |  - Server Actions     |
       |  - Validasi Bentrok   |
       +-----------------------+
         │                 │
         │ (Database SQL)  │ (HTTPS Post)
         ▼                 ▼
  [ Neon Postgres ]   [ Telegram Bot API ]
  (Serverless DB)     (Notifikasi Japri)

```

---

## 2. Perancangan Database Fisik (Database Schema)

Berikut adalah skema tabel dalam sintaks SQL PostgreSQL yang akan di-deploy ke **Neon**. Skema ini sudah dioptimalkan dengan indeks untuk mempercepat pencarian data jadwal.

```sql
-- 1. Tabel Master Ruangan
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    nama_ruangan VARCHAR(100) NOT NULL,
    kapasitas INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Pengguna (Pegawai BAPENDA)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nip VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(150) NOT NULL,
    jabatan VARCHAR(100) NOT NULL,
    bidang VARCHAR(100) NOT NULL, -- Contoh: Pajak Daerah, Retribusi, Sekretariat
    role VARCHAR(20) CHECK (role IN ('admin', 'pegawai')) DEFAULT 'pegawai',
    telegram_chat_id VARCHAR(50) UNIQUE DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Agenda Rapat
CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    judul_rapat VARCHAR(255) NOT NULL,
    agenda TEXT NOT NULL,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    ruangan_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    file_notulensi VARCHAR(255) DEFAULT NULL,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Pivot Peserta Rapat & RSVP (Many-to-Many)
CREATE TABLE meeting_participants (
    id SERIAL PRIMARY KEY,
    meeting_id INT REFERENCES meetings(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    status_kehadiran VARCHAR(20) CHECK (status_kehadiran IN ('pending', 'hadir', 'izin', 'absen')) DEFAULT 'pending',
    alasan_izin TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT unique_meeting_user UNIQUE (meeting_id, user_id)
);

-- Indexing untuk optimasi query validasi bentrok jadwal rapat
CREATE INDEX idx_meetings_check ON meetings (ruangan_id, tanggal, jam_mulai, jam_selesai);

```

---

## 3. Spesifikasi Algoritma Pembuat Jadwal (Anti-Bentrok)

Komponen kritikal pada Next.js API sebelum menyimpan rapat baru adalah mengecek irisan waktu pada ruangan yang sama.

### Logika Query SQL Validasi Irisan Waktu:

Jika Admin memilih `ruangan_id = X`, `tanggal = Y`, `jam_mulai = input_mulai`, dan `jam_selesai = input_selesai`, maka query ini akan mengecek apakah ada baris data yang tumpang tindih:

```sql
SELECT COUNT(*) FROM meetings 
WHERE ruangan_id = :ruangan_id 
  AND tanggal = :tanggal
  AND status = 'scheduled'
  AND (
       (:input_mulai >= jam_mulai AND :input_mulai < jam_selesai) -- Kasus 1: Waktu mulai baru ada di dalam rapat lama
    OR (:input_selesai > jam_mulai AND :input_selesai <= jam_selesai) -- Kasus 2: Waktu selesai baru ada di dalam rapat lama
    OR (jam_mulai >= :input_mulai AND jam_mulai < :input_selesai) -- Kasus 3: Rapat lama berada di dalam rentang rapat baru
  );

```

*Jika hasil `COUNT` > 0, Next.js akan melempar error `400 Bad Request` dengan pesan "Ruangan telah dibooking pada jam tersebut."*

---

## 4. Desain Integrasi API Telegram (Telegram Interface Design)

### A. Mekanisme Registrasi Bot (Deep-Linking)

Untuk mendapatkan `telegram_chat_id` tanpa *user* mengetik manual:

1. Web Next.js men-generate tombol: `https://t.me/BapendaMeetingBot?start=REG-[user_id]`
2. Saat user klik, Telegram membuka chat bot dan otomatis mengirim teks: `/start REG-12`
3. Bot Telegram (lewat Webhook ke Next.js) memecah teks tersebut, mengambil `user_id = 12`, mengambil `chat_id` si pengirim, lalu meng-update kolom `telegram_chat_id` di database Neon.

### B. Format Payload Notifikasi Undangan (Payload Structure)

Eksekusi dari server Next.js dikirim sebagai metode `POST` JSON terenkripsi ke endpoint Telegram:

* **Endpoint:** `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
* **Header:** `Content-Type: application/json`
* **Contoh Payload Data:**

```json
{
  "chat_id": "88732199",
  "text": "📢 *UNDANGAN RAPAT BAPENDA*\n\nKepada Yth. Bapak/Ibu,\nAnda diundang dalam rapat koordinasi internal:\n\n📌 *Agenda:* Evaluasi Realisasi Pajak Triwulan II\n📅 *Waktu:* Kamis, 9 Juli 2026\n⏰ *Pukul:* 10:00 s.d 12:00 WIB\n🏢 *Tempat:* Ruang Rapat Lt. 2 BAPENDA\n\nSilakan lakukan konfirmasi kehadiran melalui tautan berikut:\n🔗 [Konfirmasi Kehadiran Disini](https://bapenda-rapat.tangerangkab.go.id/dashboard)",
  "parse_mode": "Markdown"
}

```

---

## 5. Keamanan Sistem (Security Design)

1. **Environment Variables Separation:** Token API Telegram (`TELEGRAM_BOT_TOKEN`) dan URL database Neon (`DATABASE_URL`) hanya disimpan di `.env.local` Vercel. Variabel ini bersifat *server-only* dan tidak akan bisa diinspeksi oleh pengguna lewat DevTools browser (tidak menggunakan prefix `NEXT_PUBLIC_`).
2. **Password Hashing:** Semua password akun pegawai wajib di-hash menggunakan algoritma **Bcrypt** sebelum masuk ke database Neon.
3. **API Rate Limiting:** Endpoint kirim notifikasi dibatasi menggunakan *middleware* Next.js guna menghindari serangan DDoS yang bisa menghabiskan kuota *rate limit* dari API Telegram.

---

Dengan dokumen SDD ini, arsitektur aplikasi Anda sudah sangat matang secara rancangan backend, logika database, dan keamanan, sehingga proses implementasi *coding* menggunakan Next.js dan Neon PostgreSQL dapat berjalan terarah.