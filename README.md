# SudokuKu

Dokumentasi singkat dan mudah dipahami untuk mempresentasikan aplikasi web SudokuKu.

## Ringkasan
- **Jenis aplikasi**: Web game Sudoku dengan pencatatan skor & leaderboard.
- **Teknologi utama**: Node.js (Express), EJS (server-side render), CSS/JS vanilla, MongoDB Atlas.
- **Fitur utama**: generator & solver Sudoku otomatis, permainan interaktif dengan timer dan validasi, batas 3 kesalahan, submit akhir dengan overlay sukses & halaman hasil, rekam skor dan leaderboard publik (guest bisa lihat), autentikasi berbasis sesi, dan chatbot/endpoint bantuan (opsional).

## Arsitektur & Komponen
- **Frontend**: EJS untuk templating (`views`), CSS di `public/css/gaya.css`, logika UI di `public/js/sudoku-frontend.js`.
- **Backend**: Express (`src/app.js`), routes di `src/routes`, controller di `src/controllers`.
- **Layanan Sudoku**: generator di `src/services/sudokuGenerator.js`, solver/backtracking di `src/services/sudokuSolver.js`.
- **Data**: MongoDB Atlas via Mongoose; session memakai `express-session` (cookie-based) untuk simpan teka-teki aktif dan user.

## Alur Kerja Permainan
1. Pengguna pilih tingkat (mudah/sedang/sulit).
2. Frontend memanggil `GET /api/papan?tingkat=<tingkat>` → backend generate puzzle & solusi, simpan di session, kirim papan ke client.
3. Pengguna mengisi grid (keyboard atau keypad). Timer berjalan.
4. **Cek Jawaban**: highlight sel salah, counter kesalahan naik. Jika >3, permainan di-reset (game over).
5. **Submit Jawaban Final**: validasi penuh. Jika benar → overlay sukses → halaman hasil (skor, waktu, tingkat). Jika salah → highlight + counter kesalahan.
6. Skor direkam via `POST /api/rekam-skor` (jika login) dan muncul di leaderboard.

## Perhitungan Skor (ringkas)
- Base skor: mudah 100, sedang 200, sulit 300.
- Bonus kecepatan: `max(0, 500 - waktuDetik)`.
- Total dibulatkan saat submit sukses.

## Validasi & Batas Kesalahan
- Counter kesalahan maks 3 untuk cek/submit; sel salah diberi highlight merah + animasi shake.
- Bila melewati batas, status game over dan papan di-reset.

## Halaman & Navigasi
- `/` beranda.
- `/sudoku` halaman game (butuh login untuk menyimpan skor, tapi bermain tetap di sini).
- `/leaderboard` publik, guest boleh lihat.
- `/hasil?waktu=&tingkat=&menang=&skor=` tampilan hasil setelah menang.
- `/login`, `/register` untuk autentikasi.

## API Utama
- `GET /api/papan?tingkat=<mudah|sedang|sulit>` — generate papan & solusi (solusi penuh disimpan di session; client hanya pakai untuk validasi lokal saat cek/submit).
- `POST /api/rekam-skor` — simpan skor (butuh login); body `{ waktuPenyelesaian, tingkatKesulitan }`.
- `GET /api/leaderboard?limit=50&tingkat=<opsional>` — ambil skor terbaik; publik/guest boleh akses.
- `GET /api/solusi` — ambil solusi teka-teki aktif (lihat solusi).
- `POST /api/selesaikan` — selesaikan puzzle (debug/testing).
- Autentikasi: `POST /api/register`, `POST /api/login`, `GET /api/logout`, `GET /api/cek-login`, `GET /api/profil`.
- Chatbot (opsional): endpoint di `/api/chatbot/*` jika diaktifkan.

## Basis Data
- **MongoDB Atlas** dengan Mongoose.
- Koleksi utama:
  - `penggunas`: email, namaLengkap, password hash, skorTerbaik, totalPermainan.
  - `skors`: idPengguna, namaPengguna, tingkatKesulitan, waktuPenyelesaian, skor, tanggalMain, apakahSelesai.
- Indeks umum: skor desc, kombinasi tingkatKesulitan+skor, idPengguna+tanggalMain untuk query leaderboard cepat.

## Teknologi & Framework
- Node.js 18+, Express.js, Mongoose.
- EJS untuk templating server-side.
- CSS/JS vanilla untuk interaksi UI.
- Session berbasis cookie (`express-session`).
- (Opsional) Socket.IO & Nodemailer tersedia jika ingin chatbot realtime atau notifikasi email, namun jalur utama memakai HTTP biasa.

## Cara Menjalankan (Lokal)
1. Pastikan Node.js 18+ & npm terpasang.
2. Clone repo lalu masuk folder:
	```bash
	git clone <repo-url>
	cd sudoku
	```
3. Install dependensi:
	```bash
	npm install
	```
4. Siapkan `.env`:
	```env
	PORT=3000
	MONGODB_URI=<string MongoDB Atlas>
	SESSION_SECRET=<secret>
	```
5. Jalankan dev server:
	```bash
	npm start
	```
6. Buka `http://localhost:3000`.

## Folder Penting
- `src/app.js` — entry Express & middleware.
- `src/routes/*.js` — definisi rute API & auth.
- `src/controllers/*.js` — logika bisnis (sudoku, api, pengguna, chatbot).
- `src/services/sudokuGenerator.js` — generator puzzle.
- `src/services/sudokuSolver.js` — solver/backtracking.
- `public/js/sudoku-frontend.js` — logika UI game (timer, input, cek/submit, overlay, error counter).
- `public/css/gaya.css` — styling & animasi.
- `views/*.ejs` — template halaman (sudoku, leaderboard, hasil, login, index).

## Catatan Deployment
- Set `MONGODB_URI` dan `SESSION_SECRET` di environment server.
- Static assets dilayani Express dari `public`.
- Leaderboard publik: pastikan `/api/leaderboard` tidak dilindungi middleware auth.

## Pitch Singkat Saat Presentasi
- Tunjukkan alur: pilih tingkat → bermain dengan timer & validasi → submit → overlay sukses → halaman hasil (skor, waktu, tingkat).
- Sorot batas 3 kesalahan dengan highlight merah & animasi.
- Tampilkan leaderboard (guest bisa lihat) dan bagaimana skor tercatat setelah login.

Selamat mempresentasikan SudokuKu! 🎮🏆
