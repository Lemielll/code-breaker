# 📘 Software Requirements Specification (SRS) — Code Breaker

> **Standar Acuan**: IEEE 830-1998

| Field             | Detail                                  |
|-------------------|-----------------------------------------|
| **Nama Sistem**   | Code Breaker                            |
| **Versi**         | 1.0 — Draft                             |
| **Tanggal**       | 17 April 2026                           |

---

## 1. Pendahuluan

### 1.1 Tujuan
Mendefinisikan kebutuhan fungsional dan non-fungsional untuk Code Breaker — web-based puzzle game menebak kode hex 4-digit.

### 1.2 Lingkup
SPA (React) + REST API (Node.js/Express) + PostgreSQL. Tiga mode game, leaderboard lokal, progres pemain, admin panel puzzle.

### 1.3 Definisi

| Istilah        | Definisi                                                         |
|----------------|------------------------------------------------------------------|
| **Hex Code**   | Kode heksadesimal 4-digit (0000–FFFF), karakter 0-9, A-F.       |
| **Guess**      | Percobaan tebakan kode oleh pemain.                              |
| **Feedback**   | 🟢 posisi & digit benar, 🟡 digit benar posisi salah, ⚫ salah. |
| **UID**        | Unique Identifier (UUIDv4), di-generate server.                  |

---

## 2. Deskripsi Umum

### 2.1 Aktor

| Aktor                | Deskripsi                                                     |
|-----------------------|---------------------------------------------------------------|
| **Guest Player**      | Anonim, masukkan nickname. Skor tidak persisten antar sesi.   |
| **Registered Player** | Username + password. Skor, progres, streak tersimpan permanen. |
| **Admin**             | Pengelola konten puzzle Cipher Crack. Akun via seed/migration. |

### 2.2 Arsitektur

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  React SPA   │◄───►│ Node.js API   │◄───►│  PostgreSQL  │
│  (Frontend)  │     │ (REST/Express)│     │  (Database)  │
└──────────────┘     └───────────────┘     └──────────────┘
```

---

## 3. Kebutuhan Fungsional (FR)

### 3.1 Modul Autentikasi

| ID       | Requirement                                                                           | Prioritas  |
|----------|---------------------------------------------------------------------------------------|------------|
| FR-AU-01 | Anonymous Play: masukkan nickname (3–16 alfanumerik), dapat session token sementara.  | Must Have  |
| FR-AU-02 | Registrasi: username (unik, 3–20 alfanumerik) + password (min 8 karakter).            | Must Have  |
| FR-AU-03 | UID (UUIDv4) auto-generate saat registrasi. Tidak diekspos ke client secara plain.    | Must Have  |
| FR-AU-04 | Login menggunakan username + password, return JWT token.                               | Must Have  |
| FR-AU-05 | Logout invalidasi session/token aktif.                                                 | Must Have  |
| FR-AU-06 | Registered Player dapat ubah nickname dan password.                                    | Should Have|

### 3.2 Modul Game — Classic Mode

| ID       | Requirement                                                                           | Prioritas  |
|----------|---------------------------------------------------------------------------------------|------------|
| FR-GM-01 | Generate kode hex 4-digit acak di **server-side**. Kode TIDAK dikirim ke client.      | Must Have  |
| FR-GM-02 | Input tebakan 4 karakter hex (0-9, A-F). Case-insensitive.                            | Must Have  |
| FR-GM-03 | Feedback per digit: 🟢 Correct, 🟡 Misplaced, ⚫ Wrong.                               | Must Have  |
| FR-GM-04 | Maks **8 percobaan**. Jika gagal → Game Over.                                         | Must Have  |
| FR-GM-05 | Skor: `Score = (MaxAttempts - AttemptsUsed + 1) × 100`. Percobaan ke-1 = 800.        | Must Have  |
| FR-GM-06 | Setelah game, tampilkan kode benar, skor, opsi Play Again.                             | Must Have  |
| FR-GM-07 | Riwayat tebakan + feedback ditampilkan kumulatif.                                      | Must Have  |

### 3.3 Modul Game — Daily Challenge

| ID       | Requirement                                                                           | Prioritas  |
|----------|---------------------------------------------------------------------------------------|------------|
| FR-DC-01 | Satu puzzle unik per hari. Semua pemain mendapat kode sama.                            | Must Have  |
| FR-DC-02 | Kode di-generate dari **seed tanggal** (deterministik, konsisten setelah restart).     | Must Have  |
| FR-DC-03 | Registered Player hanya boleh menyelesaikan **1× per hari**.                           | Must Have  |
| FR-DC-04 | Guest boleh main Daily tetapi skor tidak masuk leaderboard Daily.                      | Should Have|

### 3.4 Modul Game — Cipher Crack

| ID       | Requirement                                                                           | Prioritas  |
|----------|---------------------------------------------------------------------------------------|------------|
| FR-CC-01 | Admin membuat puzzle: plaintext hex + Caesar shift (domain 0-F) + hint opsional.       | Must Have  |
| FR-CC-02 | Pemain menerima ciphertext → menebak plaintext hex 4-digit.                            | Must Have  |
| FR-CC-03 | Feedback: match/no-match per digit (tanpa info misplaced).                             | Must Have  |
| FR-CC-04 | Maks **6 percobaan**. Hint mengurangi skor 50%.                                       | Must Have  |
| FR-CC-05 | Puzzle memiliki status: **Draft → Published → Archived**.                              | Must Have  |

### 3.5 Modul Skor & Leaderboard

| ID       | Requirement                                                                           | Prioritas  |
|----------|---------------------------------------------------------------------------------------|------------|
| FR-LB-01 | Simpan skor setiap game yang dimenangkan oleh Registered Player.                       | Must Have  |
| FR-LB-02 | Leaderboard per mode: Top 50, sort Best Score DESC.                                    | Must Have  |
| FR-LB-03 | Guest bisa lihat leaderboard, tapi skor tidak masuk leaderboard permanen.              | Must Have  |

### 3.6 Modul Progres & Achievement

| ID       | Requirement                                                                           | Prioritas  |
|----------|---------------------------------------------------------------------------------------|------------|
| FR-PG-01 | XP per game: `Score × ModeMultiplier` (Classic:1.0, Daily:1.5, Cipher:2.0).           | Must Have  |
| FR-PG-02 | Level: `floor(TotalXP / 1000) + 1`. Maks Level 50.                                    | Must Have  |
| FR-PG-03 | Daily Streak: hari berturut-turut main. Reset jika 1 hari terlewat.                    | Should Have|
| FR-PG-04 | 10 Badge/Achievement (First Blood, Code Master, Streak Lord, dll). Unlock otomatis.    | Should Have|
| FR-PG-05 | Halaman profil: Level, XP, Streak, Badge, Stats per mode.                              | Must Have  |

### 3.7 Modul Admin Panel

| ID       | Requirement                                                                           | Prioritas  |
|----------|---------------------------------------------------------------------------------------|------------|
| FR-AD-01 | Admin login via kredensial khusus. Akun dibuat via seed/migration, **bukan** registrasi publik. | Must Have |
| FR-AD-02 | CRUD puzzle Cipher Crack (create, list, edit, archive).                                 | Must Have  |
| FR-AD-03 | Transisi status: Draft → Published → Archived. Tidak boleh mundur.                     | Must Have  |
| FR-AD-04 | Dashboard ringkasan: jumlah puzzle, pemain terdaftar, game hari ini.                    | Should Have|

---

## 4. Kebutuhan Non-Fungsional (NFR)

| ID        | Kategori       | Requirement                                    | Target          |
|-----------|----------------|------------------------------------------------|-----------------|
| NFR-PE-01 | Performa       | P95 response time API                          | ≤ 500ms         |
| NFR-PE-02 | Performa       | First Contentful Paint                         | ≤ 2 detik       |
| NFR-PE-03 | Performa       | Feedback setelah submit guess                  | ≤ 200ms         |
| NFR-PE-04 | Performa       | Handle 20 concurrent users tanpa degradasi     | 20 CCU          |
| NFR-RE-01 | Keandalan      | Uptime monthly                                 | ≥ 99.0%         |
| NFR-RE-02 | Keandalan      | Error rate (5xx)                               | ≤ 1%            |
| NFR-RE-03 | Keandalan      | RTO                                            | ≤ 2 jam         |
| NFR-RE-04 | Keandalan      | RPO                                            | ≤ 1 jam         |
| NFR-US-01 | Usability      | Intuitif tanpa tutorial                        | —               |
| NFR-US-02 | Usability      | Feedback non-warna (ikon+teks) untuk aksesibilitas | WCAG 2.1 AA |
| NFR-US-03 | Usability      | Responsive 360px – 1920px                      | —               |
| NFR-MA-01 | Maintainability| API terversi `/api/v1/...`                     | —               |
| NFR-MA-02 | Maintainability| DB migration reversible (up/down)              | —               |
| NFR-MA-03 | Maintainability| Structured logging (JSON)                      | —               |

---

## 5. Kebutuhan Keamanan (SR — OWASP Aligned)

### 5.1 Autentikasi & Sesi

| ID       | Requirement                                                                  | OWASP     |
|----------|------------------------------------------------------------------------------|-----------|
| SR-AU-01 | Password di-hash **bcrypt** (cost ≥ 10). TIDAK plaintext.                    | A07:2021  |
| SR-AU-02 | JWT expiry: Access 1h, Refresh 7d. Secret dari **env variable**.             | A07:2021  |
| SR-AU-03 | Rate limiting login: maks 5 percobaan/menit/IP.                              | A07:2021  |

### 5.2 Input & Data

| ID       | Requirement                                                                  | OWASP     |
|----------|------------------------------------------------------------------------------|-----------|
| SR-IN-01 | Semua input client divalidasi & di-sanitize di server.                       | A03:2021  |
| SR-IN-02 | Input guess: tepat 4 karakter `[0-9A-Fa-f]`.                                | A03:2021  |
| SR-IN-03 | Semua query DB: **prepared statements** / ORM. Tanpa string concatenation.   | A03:2021  |
| SR-IN-04 | Response API tidak ekspos stack trace atau detail internal.                   | A05:2021  |

### 5.3 API & Transport

| ID       | Requirement                                                                  | OWASP     |
|----------|------------------------------------------------------------------------------|-----------|
| SR-AP-01 | Endpoint admin dilindungi **RBAC middleware**: hanya role `admin`.            | A01:2021  |
| SR-AP-02 | CORS hanya izinkan origin yang di-whitelist.                                 | A05:2021  |
| SR-AP-03 | Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`.       | A05:2021  |
| SR-AP-04 | Rate limiting global: maks 100 req/menit/IP.                                 | A04:2021  |
| SR-AP-05 | Kode puzzle **TIDAK** dikirim ke client. Validasi 100% di server.            | A04:2021  |

### 5.4 Data Sensitif & Config

| ID       | Requirement                                                                  | OWASP     |
|----------|------------------------------------------------------------------------------|-----------|
| SR-DA-01 | `.env` masuk `.gitignore`. Tidak boleh ter-commit.                           | A05:2021  |
| SR-DA-02 | Log tidak boleh mencatat password/token dalam bentuk plain.                  | A09:2021  |
| SR-DA-03 | Dependencies di-audit berkala (`npm audit`). Critical/high segera update.     | A06:2021  |

---

## 6. Traceability Matrix

| FR ID         | Modul           | Test Type          | Prioritas  |
|---------------|-----------------|--------------------|------------|
| FR-AU-01~06   | Auth & User     | Unit, Integration  | Must Have  |
| FR-GM-01~07   | Game Classic    | Unit, Integration  | Must Have  |
| FR-DC-01~04   | Daily Challenge | Integration, E2E   | Must Have  |
| FR-CC-01~05   | Cipher Crack    | Unit, Integration  | Must Have  |
| FR-LB-01~03   | Leaderboard     | Integration        | Must Have  |
| FR-PG-01~05   | Progression     | Unit, Integration  | Should Have|
| FR-AD-01~04   | Admin Panel     | Integration, E2E   | Must Have  |
| SR-*          | Security (all)  | Security, Pen Test | Must Have  |

> **Status: DRAFT — Menunggu Review & Approval**
