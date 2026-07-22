# Unified Modeling Language (UML) Diagrams

Dokumen ini berisi kumpulan diagram UML (Use Case, Activity, Sequence, dan Class Diagram) untuk **Sistem Informasi Penjadwalan dan Agenda Rapat BAPENDA Kabupaten Tangerang Berbasis Web Terintegrasi Telegram Notification**. Diagram-diagram ini dirancang berdasarkan PRD (Product Requirement Document) dan SDD (System Design Document) yang telah disepakati.

---

## 1. Use Case Diagram

Use Case Diagram menggambarkan interaksi antara aktor dengan sistem. Terdapat dua aktor utama: **Admin / Sekretariat** dan **Pegawai / Kepala Bidang**. Diagram ini menunjukkan batasan sistem dan fungsi-fungsi apa saja yang dapat diakses oleh masing-masing aktor.

```mermaid
flowchart LR
    Admin([Admin/Sekretariat])
    Pegawai([Pegawai/Kepala Bidang])

    subgraph Sistem Penjadwalan Rapat BAPENDA
        UC1(Login)
        UC2(Lihat Kalender Rapat)
        UC3(Konfirmasi Kehadiran / RSVP)
        UC4(Unduh Dokumen Bahan Rapat)
        UC5(Hubungkan Akun Telegram)
        UC6(Kelola Master Data Pegawai)
        UC7(Kelola Data Ruangan)
        UC8(Kelola Jadwal Rapat)
        UC9(Kirim Notifikasi Telegram Otomatis)
        UC10(Unggah Notulensi Rapat)
    end

    %% Relasi Aktor ke Use Case
    Admin --- UC1
    Pegawai --- UC1

    Pegawai --- UC2
    Pegawai --- UC3
    Pegawai --- UC4
    Pegawai --- UC5

    Admin --- UC2
    Admin --- UC5
    Admin --- UC6
    Admin --- UC7
    Admin --- UC8
    Admin --- UC10

    %% Relasi antar Use Case
    UC8 -. "<<include>>" .-> UC9
    
    classDef actorStyle fill:#f9f9f9,stroke:#333,stroke-width:2px;
    class Admin,Pegawai actorStyle;
```

**Penjelasan Singkat:**
- Baik Admin maupun Pegawai wajib melakukan **Login** untuk mengakses sistem.
- Pegawai memiliki hak untuk melihat kalender, RSVP (Hadir/Izin/Absen), mengunduh dokumen rapat, dan menghubungkan akun Telegram mereka.
- Admin memiliki akses manajemen penuh termasuk kelola data pegawai, ruangan, rapat, dan unggah notulensi.
- Setiap kali Admin berhasil melakukan pembuatan/perubahan jadwal rapat (**Kelola Jadwal Rapat**), sistem secara otomatis memicu proses **Kirim Notifikasi Telegram Otomatis** (`<<include>>`).

---

## 2. Activity Diagram

Activity Diagram ini secara khusus memetakan alur proses **Pembuatan Jadwal Rapat & Pengiriman Notifikasi**, mulai dari Admin mengisi formulir hingga sistem mengirimkan pesan Telegram kepada para peserta.

```mermaid
flowchart TD
    subgraph Admin [Admin / Sekretariat]
        A1(Membuka Form Jadwal Rapat) --> A2(Input Data Jadwal & Pilih Peserta)
        A2 --> A3(Klik Tombol Simpan)
        A6(Menerima Pesan Error: Ruangan Bentrok) --> A2
        A8(Menerima Notifikasi: Pembuatan Sukses) --> End1([Selesai])
    end

    subgraph Sistem [Sistem Next.js Server]
        A3 --> S1(Validasi Input & Payload)
        S1 --> S2(Cek Ketersediaan Ruangan)
        S3{Apakah Ruangan Bentrok?}
        S2 --> S3
        S3 -- Ya --> A6
        S3 -- Tidak / Aman --> S4(Simpan Jadwal ke Database)
        S4 --> S5(Ambil Data Chat ID Peserta)
        S5 --> S6(Trigger Route Handler API Telegram)
        S6 --> A8
    end

    subgraph DB [Database Neon Postgres]
        S2 -. Query Cek Jadwal .-> D1[(Tabel meetings)]
        D1 -. Return Count .-> S2
        S4 -. Insert Data .-> D2[(Tabel meetings & participants)]
        S5 -. Select chat_id .-> D3[(Tabel users)]
    end

    subgraph Telegram [Telegram API]
        S6 -. HTTP POST .-> T1(Endpoint /sendMessage)
        T1 -. Response 200 OK .-> S6
    end
    
    style A1 fill:#e1f5fe,stroke:#03a9f4
    style End1 fill:#e8f5e9,stroke:#4caf50
    style S3 fill:#fff3e0,stroke:#ff9800
```

---

## 3. Sequence Diagram

Sequence Diagram menunjukkan interaksi antar objek atau komponen sistem (Client, Server Next.js, Database, dan API Telegram) berdasarkan urutan waktu. Diagram ini membedah alur sistem dari Request hingga Response untuk fungsi pembuatan jadwal.

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Client as Web Client (Browser)
    participant Server as Next.js API (Server)
    participant DB as Neon Postgres DB
    participant TG as Telegram API

    Admin->>Client: Submit Form Rapat Baru
    Client->>Server: POST /api/schedule (Payload Data Rapat)
    
    rect rgb(240, 248, 255)
    Note right of Server: Proses Validasi Bentrok
    Server->>DB: SELECT COUNT(*) WHERE ruangan_id, tanggal, jam beririsan
    DB-->>Server: Return Result (Count)
    end

    alt Count > 0 (Bentrok)
        Server-->>Client: 400 Bad Request (Error: Ruangan telah dibooking)
        Client-->>Admin: Tampilkan Pesan Error di UI
    else Count == 0 (Aman)
        rect rgb(230, 255, 230)
        Note right of Server: Proses Penyimpanan
        Server->>DB: INSERT INTO meetings
        Server->>DB: INSERT INTO meeting_participants
        DB-->>Server: Return Success (Data tersimpan)
        end
        
        rect rgb(255, 250, 230)
        Note right of Server: Proses Notifikasi Telegram
        Server->>DB: SELECT telegram_chat_id FROM users WHERE id IN (peserta)
        DB-->>Server: Return List of chat_id
        loop Setiap Peserta yang memiliki chat_id
            Server->>TG: POST /bot{token}/sendMessage
            TG-->>Server: 200 OK
        end
        end

        Server-->>Client: 201 Created (Sukses)
        Client-->>Admin: Tampilkan Notifikasi Sukses
    end
```

---

## 4. Class Diagram

Class Diagram ini merepresentasikan arsitektur basis data relasional (*Entity Relationship*) yang dibangun di atas Neon PostgreSQL. Relasi yang digambarkan di bawah sesuai dengan skema database yang telah dirancang menggunakan ORM Prisma/Drizzle.

```mermaid
classDiagram
    class rooms {
        +int id [PK]
        +varchar nama_ruangan
        +int kapasitas
        +timestamp created_at
    }

    class users {
        +int id [PK]
        +varchar nip
        +varchar nama
        +varchar jabatan
        +varchar bidang
        +varchar role
        +varchar telegram_chat_id
        +varchar password
        +timestamp created_at
    }

    class meetings {
        +int id [PK]
        +varchar judul_rapat
        +text agenda
        +date tanggal
        +time jam_mulai
        +time jam_selesai
        +int ruangan_id [FK]
        +varchar status
        +varchar file_notulensi
        +int created_by [FK]
        +timestamp created_at
    }

    class meeting_participants {
        +int id [PK]
        +int meeting_id [FK]
        +int user_id [FK]
        +varchar status_kehadiran
        +text alasan_izin
        +timestamp updated_at
    }

    %% Relationships
    rooms "1" -- "*" meetings : memiliki
    users "1" -- "*" meetings : membuat (created_by)
    users "1" -- "*" meeting_participants : menjadi peserta
    meetings "1" -- "*" meeting_participants : melibatkan peserta
```

**Penjelasan Relasi antar Tabel / Entitas:**
- **`rooms` (1) ke `meetings` (*):** Hubungan *One-to-Many*. Sebuah ruangan dapat digunakan untuk berbagai jadwal rapat, tetapi satu jadwal rapat pada satu waktu hanya bisa menempati satu ruangan (diikat oleh `ruangan_id`).
- **`users` (1) ke `meetings` (*):** Hubungan *One-to-Many*. Seorang Admin (`users`) dapat membuat banyak jadwal rapat (diikat oleh `created_by`).
- **`users` (*) ke `meetings` (*) via `meeting_participants`:** Hubungan *Many-to-Many*. Satu rapat dihadiri banyak pegawai, dan seorang pegawai dapat menghadiri banyak rapat. Tabel `meeting_participants` bertindak sebagai *Pivot/Junction Table* untuk menyimpan informasi detail peserta di setiap rapat (seperti `status_kehadiran` dan `alasan_izin`).
