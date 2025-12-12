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

## Cara Instalasi

### 1. Clone atau Download Proyek
```bash
cd d:\uas pemjar\sudoku
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
copy .env.example .env
```

Edit file `.env` dan isi dengan konfigurasi Anda:
- `MONGODB_URI`: Connection string MongoDB Anda
- `EMAIL_USER` dan `EMAIL_PASSWORD`: Kredensial email untuk Nodemailer
- `SESSION_SECRET`: Kunci rahasia untuk session

### 4. Jalankan MongoDB
Pastikan MongoDB sudah terinstall dan berjalan:
```bash
mongod
```

### 5. Jalankan Aplikasi
```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

### 6. Akses Aplikasi
Buka browser dan kunjungi:
```
http://localhost:3000
```

## Struktur Proyek
```
sudoku-ku/
├── src/
│   ├── app.js                      # Entry point aplikasi
│   ├── routes/                     # Routing API
│   │   ├── apiRoute.js
│   │   └── penggunaRoute.js
│   ├── controllers/                # Logic controller
│   │   ├── sudokuController.js
│   │   ├── apiController.js
│   │   ├── penggunaController.js
│   │   └── emailController.js
│   ├── services/                   # Business logic
│   │   ├── sudokuSolver.js         # Solver backtracking
│   │   ├── sudokuGenerator.js      # Generator puzzle
│   │   ├── chatbotService.js       # Logic chatbot
│   │   └── emailService.js         # Email service
│   ├── models/                     # MongoDB models
│   │   ├── Pengguna.js
│   │   └── Skor.js
│   └── utils/                      # Utilities
│       ├── koneksiMongo.js
│       └── validasiSudoku.js
├── public/                         # Static files
│   ├── css/gaya.css
│   ├── js/sudoku-frontend.js
│   └── js/chatbot-client.js
├── views/                          # EJS templates
│   ├── index.ejs
│   ├── sudoku.ejs
│   ├── leaderboard.ejs
│   └── login.ejs
├── .env.example
├── package.json
└── README.md
```

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

## ChatBot Commands
- **"hint"** - Dapatkan petunjuk untuk satu sel
- **"cek jawaban"** - Validasi jawaban saat ini
- **"solusi"** - Tampilkan solusi lengkap
- **"cara main"** - Instruksi permainan

## Pengaturan Email
Untuk menggunakan Gmail:
1. Aktifkan "2-Step Verification" di akun Google
2. Generate "App Password" di akun Google
3. Gunakan App Password di file `.env`

## Lisensi
MIT

## Kontak
Untuk pertanyaan atau masalah, hubungi tim SudokuKu.
