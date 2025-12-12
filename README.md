# SudokuKu - Aplikasi Permainan Sudoku

## Deskripsi
SudokuKu adalah aplikasi web permainan Sudoku yang dibangun dengan Node.js, Express, MongoDB, Socket.IO, dan Nodemailer. Aplikasi ini menyediakan fitur generator Sudoku otomatis, solver menggunakan backtracking, chatbot realtime untuk bantuan, dan sistem leaderboard.

## Fitur Utama
1. **Generator Sudoku** - Menghasilkan puzzle Sudoku dengan berbagai tingkat kesulitan (mudah, sedang, sulit)
2. **Solver Sudoku** - Algoritma backtracking untuk menyelesaikan puzzle Sudoku
3. **ChatBot Realtime** - Bantuan via Socket.IO untuk hint, validasi, dan solusi
4. **Sistem Skor** - Menyimpan dan menampilkan leaderboard berdasarkan waktu penyelesaian
5. **Email Notifikasi** - Kirim email selamat datang dan pencapaian skor
6. **Autentikasi Pengguna** - Registrasi dan login pengguna

## Teknologi yang Digunakan
- **Backend**: Node.js, Express.js
- **Database**: MongoDB dengan Mongoose
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Template Engine**: EJS

## API Endpoints

### Sudoku API
- `GET /api/papan?tingkat=sedang` - Dapatkan papan Sudoku baru
- `POST /api/rekam-skor` - Simpan skor pemain
- `GET /api/leaderboard?limit=10` - Dapatkan leaderboard

### User API
- `POST /api/register` - Registrasi pengguna baru
- `POST /api/login` - Login pengguna
- `GET /api/logout` - Logout pengguna

## Cara Bermain
1. Kunjungi halaman utama
2. Login atau register akun baru
3. Pilih tingkat kesulitan (mudah, sedang, sulit)
4. Isi sel kosong dengan angka 1-9
5. Gunakan chatbot untuk bantuan (hint, validasi, solusi)
6. Selesaikan puzzle untuk menyimpan skor

## Lisensi
© 2025 Setya, Radhia, dan Syahid - All Rights Reserved
