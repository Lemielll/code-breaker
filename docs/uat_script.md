# ✅ UAT Script — Code Breaker

> **Versi**: 1.0 | **Tanggal**: 17 April 2026 | **Ref**: SRS v1.0, Master Test Plan v1.0

---

## 1. Informasi Umum

| Field                | Detail                                        |
|----------------------|-----------------------------------------------|
| **Tester**           | Product Owner / Stakeholder                   |
| **Environment**      | Staging (pre-production)                      |
| **Browser**          | Chrome/Firefox/Edge (versi terbaru)           |
| **Data**             | Pre-seeded: 1 admin, 3 player, 5 puzzle       |
| **Kriteria Lulus**   | ≥95% test case PASS, zero S1/S2 bugs          |

---

## 2. UAT Test Cases

### Modul A: Autentikasi & User

| UAT ID  | Skenario                                | Langkah                                                                                     | Expected Result                                          | Pass/Fail |
|---------|------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------|
| UAT-A01 | Guest Play — Happy Path                 | 1. Buka app 2. Klik "Play as Guest" 3. Masukkan nickname "Tester01" 4. Submit               | Redirect ke Game Menu. Nickname tampil di navbar.        | ☐         |
| UAT-A02 | Guest — Nickname Invalid                | 1. Klik "Play as Guest" 2. Masukkan "AB" (2 char)                                           | Error: "Nickname must be 3-16 characters"                | ☐         |
| UAT-A03 | Register — Happy Path                   | 1. Klik Register 2. Username: "uattester" 3. Password: "Test1234" 4. Nickname: "UATUser"    | Akun dibuat, redirect ke Game Menu.                      | ☐         |
| UAT-A04 | Register — Username Sudah Ada           | 1. Register ulang dengan username "uattester"                                                | Error: "Username already taken"                          | ☐         |
| UAT-A05 | Register — Password Terlalu Pendek      | 1. Register dengan password "abc"                                                            | Error: "Password must be at least 8 characters"          | ☐         |
| UAT-A06 | Login — Happy Path                      | 1. Klik Login 2. Username: "uattester" 3. Password: "Test1234"                              | Login berhasil, redirect ke Game Menu.                   | ☐         |
| UAT-A07 | Login — Credentials Salah               | 1. Login dengan password salah                                                               | Error: "Invalid username or password"                    | ☐         |
| UAT-A08 | Login — Rate Limit                      | 1. Login salah 6× berturut-turut dalam 1 menit                                              | Error: "Too many login attempts" setelah percobaan ke-6  | ☐         |
| UAT-A09 | Logout                                  | 1. Setelah login, klik Logout                                                                | Redirect ke Landing Page. Tidak bisa akses Game Menu.    | ☐         |
| UAT-A10 | Update Profile                          | 1. Login 2. Ke Profile 3. Ubah nickname ke "NewNick" 4. Save                                 | Nickname berubah. Ditampilkan di navbar.                 | ☐         |

### Modul B: Game — Classic Mode

| UAT ID  | Skenario                                | Langkah                                                                                     | Expected Result                                          | Pass/Fail |
|---------|------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------|
| UAT-B01 | Start Classic Game                      | 1. Pilih Classic Mode dari Menu                                                              | Board kosong tampil (8 row × 4 cell). Input aktif.       | ☐         |
| UAT-B02 | Submit Valid Guess                       | 1. Input "A3F1" 2. Submit                                                                    | Feedback muncul: 🟢🟡⚫ per digit. Row terisi.           | ☐         |
| UAT-B03 | Submit Invalid Guess                    | 1. Input "ZZZZ" (bukan hex)                                                                 | Error: "Enter exactly 4 hex characters (0-9, A-F)"      | ☐         |
| UAT-B04 | Win Game                                | 1. Tebak kode yang benar (gunakan hint dari admin/DB jika perlu)                             | 🎉 WIN screen. Skor tampil. Opsi Play Again & LB.       | ☐         |
| UAT-B05 | Lose Game (8 percobaan habis)           | 1. Submit 8 tebakan salah berturut                                                           | 💀 GAME OVER. Kode benar ditampilkan.                    | ☐         |
| UAT-B06 | Skor Benar — Percobaan ke-1            | 1. Tebak benar di percobaan pertama                                                          | Skor = 800                                               | ☐         |
| UAT-B07 | Skor Benar — Percobaan ke-5            | 1. Tebak benar di percobaan ke-5                                                             | Skor = 400                                               | ☐         |
| UAT-B08 | Secret Code Tidak Bocor                 | 1. Buka DevTools → Network 2. Inspect response /games/start                                 | Tidak ada field `secretCode` di response.                | ☐         |

### Modul C: Game — Daily Challenge

| UAT ID  | Skenario                                | Langkah                                                                                     | Expected Result                                          | Pass/Fail |
|---------|------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------|
| UAT-C01 | Start Daily Challenge                   | 1. Login 2. Pilih Daily Challenge                                                            | Game dimulai. Board tampil.                              | ☐         |
| UAT-C02 | Daily — 1× Per Hari (Registered)        | 1. Selesaikan daily 2. Coba mulai daily lagi                                                 | Error: "Already completed today's challenge"             | ☐         |
| UAT-C03 | Daily — Kode Sama untuk Semua           | 1. Login 2 akun berbeda, mulai daily di hari sama                                            | Kedua akun mendapat kode rahasia yang sama.              | ☐         |

### Modul D: Game — Cipher Crack

| UAT ID  | Skenario                                | Langkah                                                                                     | Expected Result                                          | Pass/Fail |
|---------|------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------|
| UAT-D01 | Start Cipher Crack                      | 1. Pilih Cipher Crack 2. Pilih puzzle published                                              | Ciphertext tampil. Input aktif. Max 6 attempts.          | ☐         |
| UAT-D02 | Use Hint                                | 1. Klik "Hint"                                                                               | Hint tampil. Info: "Score penalty: -50%"                 | ☐         |
| UAT-D03 | Win Cipher — Tanpa Hint                 | 1. Tebak benar tanpa hint, percobaan ke-2                                                    | Skor = 500 (5×100)                                       | ☐         |
| UAT-D04 | Win Cipher — Dengan Hint                | 1. Pakai hint 2. Tebak benar percobaan ke-2                                                  | Skor = 250 (500 × 50%)                                   | ☐         |

### Modul E: Leaderboard & Progress

| UAT ID  | Skenario                                | Langkah                                                                                     | Expected Result                                          | Pass/Fail |
|---------|------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------|
| UAT-E01 | Leaderboard Tampil                      | 1. Buka Leaderboard 2. Pilih tab "Classic"                                                   | Daftar top 50 tampil, urut skor DESC.                    | ☐         |
| UAT-E02 | Skor Masuk Leaderboard (Registered)     | 1. Login 2. Menangkan game 3. Cek leaderboard                                               | Skor baru muncul di posisi yang benar.                   | ☐         |
| UAT-E03 | Guest Skor TIDAK di Leaderboard         | 1. Main sebagai guest 2. Menangkan game 3. Cek leaderboard                                  | Skor guest TIDAK muncul di leaderboard.                  | ☐         |
| UAT-E04 | XP & Level Bertambah                    | 1. Login 2. Menangkan classic (skor 600) 3. Cek Profile                                     | XP +600, level dihitung benar.                           | ☐         |
| UAT-E05 | Badge Unlock                            | 1. Menangkan game pertama kali 2. Cek Achievements                                          | Badge "First Blood" unlocked.                            | ☐         |
| UAT-E06 | Streak Tracking                         | 1. Main hari ini 2. Cek profile                                                              | Current streak bertambah 1.                              | ☐         |

### Modul F: Admin Panel

| UAT ID  | Skenario                                | Langkah                                                                                     | Expected Result                                          | Pass/Fail |
|---------|------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------|
| UAT-F01 | Admin Login                             | 1. Login dengan akun admin                                                                   | Redirect ke Admin Dashboard.                             | ☐         |
| UAT-F02 | Player Akses Admin — Ditolak            | 1. Login sebagai player 2. Akses /admin via URL                                              | Error 403: "Access denied"                               | ☐         |
| UAT-F03 | Create Puzzle                           | 1. Admin → Create New 2. Title:"Test" Plaintext:"ABCD" Shift:3 3. Submit                    | Puzzle tersimpan. Status: Draft. Ciphertext auto-computed.| ☐         |
| UAT-F04 | Publish Puzzle                          | 1. Klik "Publish" pada puzzle Draft                                                          | Status berubah ke Published.                             | ☐         |
| UAT-F05 | Archive Puzzle                          | 1. Klik "Archive" pada puzzle Published                                                      | Status berubah ke Archived.                              | ☐         |
| UAT-F06 | Reverse Transition Ditolak              | 1. Coba ubah puzzle Archived ke Published                                                    | Error: transisi tidak diizinkan.                         | ☐         |
| UAT-F07 | Dashboard Stats                         | 1. Buka Admin Dashboard                                                                      | Total puzzle, pemain, game hari ini tampil.              | ☐         |

### Modul G: Keamanan (Verifikasi Pengguna Akhir)

| UAT ID  | Skenario                                | Langkah                                                                                     | Expected Result                                          | Pass/Fail |
|---------|------------------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------|-----------|
| UAT-G01 | XSS via Nickname                        | 1. Register dengan nickname `<script>alert(1)</script>`                                      | Ditolak atau di-escape. Tidak ada popup.                 | ☐         |
| UAT-G02 | Akses Tanpa Login                       | 1. Langsung akses /api/v1/auth/profile tanpa token                                          | Error 401: "Authentication required"                     | ☐         |
| UAT-G03 | URL Guessing (Direct Access)            | 1. Masukkan URL /game/classic tanpa sesi                                                     | Redirect ke login/landing.                               | ☐         |

---

## 3. Kriteria Kelulusan UAT

| Kriteria                                    | Target          | Wajib? |
|---------------------------------------------|-----------------|--------|
| Test case PASS rate                         | **≥ 95%** (≥33/35) | ✅   |
| Zero S1 (Critical) bugs                    | **0**           | ✅     |
| Zero S2 (High) bugs                        | **0**           | ✅     |
| S3 (Medium) bugs ≤ 3 with workaround       | **≤ 3**         | ✅     |
| Semua Modul A-G memiliki ≥ 1 PASS          | **Ya**          | ✅     |
| Stakeholder/PO sign-off                     | **Ya**          | ✅     |

### Decision Matrix

| Hasil                           | Keputusan                                    |
|----------------------------------|----------------------------------------------|
| ≥95% PASS, 0 S1/S2             | ✅ **APPROVED** — Lanjut deploy production.  |
| 90-94% PASS, 0 S1/S2           | ⚠️ **CONDITIONAL** — Fix & re-test failed.  |
| <90% PASS atau ada S1/S2       | ❌ **REJECTED** — Fix cycle, re-UAT.        |

---

## 4. UAT Sign-Off

| Role              | Nama       | Tanggal    | Keputusan          | Tanda Tangan |
|-------------------|------------|------------|---------------------|--------------|
| Product Owner     | _________  | __________ | PASS / CONDITIONAL / FAIL | __________ |
| QA Lead           | _________  | __________ | PASS / CONDITIONAL / FAIL | __________ |
| Developer Lead    | _________  | __________ | VERIFIED             | __________ |

> **Status: DRAFT — Siap Dieksekusi**
