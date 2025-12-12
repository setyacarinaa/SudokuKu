# PANDUAN INSTALASI DAN MENJALANKAN SUDOKUKU

## Prasyarat
Pastikan sudah terinstall:
- Node.js (v14 atau lebih baru)
- NPM (biasanya otomatis dengan Node.js)
- **MongoDB Atlas account (gratis, cloud database)** 
  - Atau MongoDB lokal jika ingin install sendiri

## Langkah-langkah Instalasi

### 1. Masuk ke Directory Proyek
```bash
cd "d:\uas pemjar\sudoku"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
Edit file `.env` dan sesuaikan dengan konfigurasi Anda:
```
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sudokuku?retryWrites=true&w=majority
SESSION_SECRET=rahasia_sudoku_ku_secret_key_12345
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
BASE_URL=http://localhost:3000
```

**Untuk MongoDB:**
- **MongoDB Atlas (Cloud):** 
  - Baca panduan: [MONGODB-ATLAS-SETUP.md](MONGODB-ATLAS-SETUP.md)
  - Gratis, tidak perlu install
- **MongoDB Lokal:**
  - Download dari: https://www.mongodb.com/try/download/community
  - Install dan jalankan

**Catatan untuk Gmail:**
1. Buka pengaturan Google Account
2. Aktifkan "2-Step Verification"
3. Generate "App Password" di Security > App passwords
4. Gunakan App Password tersebut di EMAIL_PASSWORD

### 4. Jalankan MongoDB
Pastikan MongoDB sudah berjalan. Di terminal/command prompt:
```bash
mongod
```

Atau jika menggunakan MongoDB sebagai service:
```bash
net start MongoDB
```

### 5. Jalankan Aplikasi

**Mode Production:**
```bash
npm start
```

**Mode Development (auto-reload):**
```bash
npm run dev
```

### 6. Akses Aplikasi
Buka browser dan kunjungi:
```
http://localhost:3000
```

## Testing Fitur

### 1. Test Koneksi Email
Buka di browser:
```
http://localhost:3000/api/test-email
```

### 2. Test Generator Sudoku
Buka di browser:
```
http://localhost:3000/api/papan?tingkat=sedang
```

### 3. Test Leaderboard
Buka di browser:
```
http://localhost:3000/api/leaderboard
```

## Troubleshooting

### Error: MongoDB connection failed
- Pastikan MongoDB sudah berjalan
- Cek connection string di file `.env`
- Coba restart MongoDB service

### Error: Port already in use
- Ganti PORT di file `.env` ke port lain (misal 3001)
- Atau hentikan aplikasi lain yang menggunakan port tersebut

### Error: Email tidak terkirim
- Pastikan kredensial email benar
- Untuk Gmail, gunakan App Password (bukan password akun)
- Cek koneksi internet

### Error: Cannot find module
- Hapus folder `node_modules`
- Jalankan `npm install` lagi

## Struktur Database MongoDB

Aplikasi akan otomatis membuat collections berikut di MongoDB:

### Collection: penggunas
- Menyimpan data pengguna
- Fields: namaLengkap, email, password (hashed), skorTerbaik, totalPermainan

### Collection: skors
- Menyimpan data skor permainan
- Fields: idPengguna, namaPengguna, tingkatKesulitan, waktuPenyelesaian, skor

## Fitur Utama

### 1. Generator Sudoku
- Menghasilkan puzzle baru setiap kali diminta
- 3 tingkat kesulitan: mudah, sedang, sulit
- Menggunakan algoritma backtracking

### 2. Solver Sudoku
- Menyelesaikan puzzle dengan algoritma backtracking
- Validasi solusi unik
- Digunakan untuk hint dan validasi

### 3. Chatbot Realtime (Socket.IO)
- Hint: dapatkan petunjuk satu sel
- Validasi: cek jawaban saat ini
- Solusi: lihat jawaban lengkap
- Instruksi: cara bermain

### 4. Sistem Skor
- Skor dihitung berdasarkan tingkat kesulitan dan waktu
- Base score + bonus kecepatan
- Otomatis disimpan ke database

### 5. Email Notifikasi
- Email selamat datang saat registrasi
- Email pencapaian skor baru
- Menggunakan Nodemailer

### 6. Leaderboard
- Tampilkan pemain terbaik
- Filter berdasarkan tingkat kesulitan
- Real-time update

## Perintah NPM

```bash
# Install dependencies
npm install

# Jalankan aplikasi (production)
npm start

# Jalankan aplikasi (development dengan auto-reload)
npm run dev
```

## Port yang Digunakan
- **3000**: HTTP Server (Express)
- **27017**: MongoDB (default)

## Tips Penggunaan

1. **Registrasi Akun**: Klik Login/Register di menu
2. **Mulai Bermain**: Pilih tingkat kesulitan dan mulai main
3. **Gunakan Chatbot**: Klik tombol 💬 untuk bantuan
4. **Cek Leaderboard**: Lihat posisi kamu di leaderboard global
5. **Reset Game**: Gunakan tombol Reset untuk mulai ulang

## Keamanan

- Password di-hash menggunakan bcryptjs
- Session management dengan express-session
- Input validation di backend
- CORS enabled untuk keamanan

## Lisensi
MIT License - Bebas digunakan untuk tujuan pendidikan

---

Dibuat dengan ❤️ untuk tugas kuliah Pemrograman Jaringan
