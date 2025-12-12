# 🚀 QUICK START GUIDE - SUDOKUKU

## Panduan Cepat Memulai dalam 5 Menit

### 📋 Checklist Prasyarat
- [ ] Node.js terinstall (cek: `node --version`)
- [ ] NPM terinstall (cek: `npm --version`)
- [ ] **MongoDB Atlas account** (gratis, tidak perlu install lokal)
  - 👉 [Buka panduan MongoDB Atlas](MONGODB-ATLAS-SETUP.md)

---

## ⚡ Langkah Cepat

### 1️⃣ Install Dependencies (2 menit)
```bash
cd "d:\uas pemjar\sudoku"
npm install
```

### 2️⃣ Setup MongoDB Atlas (5 menit) - SKIP INI JIKA SUDAH DONE
**Jika MongoDB belum disetup:**
- Baca: [MONGODB-ATLAS-SETUP.md](MONGODB-ATLAS-SETUP.md)
- Setup MongoDB Atlas (cloud database gratis)
- Update file `.env` dengan connection string

**Jika sudah setup:**
- Pastikan `.env` sudah punya `MONGODB_URI` yang benar
- Lanjut ke step berikutnya

### 3️⃣ Konfigurasi Email (1 menit) - OPSIONAL
Edit file `.env` dan pastikan MONGODB_URI sudah benar:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sudokuku?retryWrites=true&w=majority
```

Untuk email (opsional):
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Skip email jika hanya ingin test generator & solver!**

### 4️⃣ Jalankan Aplikasi (10 detik)
```bash
npm start
```

**Expected output:**
```
✅ MongoDB berhasil terhubung!
✅ Server berjalan di: http://localhost:3000
```

### 5️⃣ Buka Browser (10 detik)
Kunjungi:
```
http://localhost:3000
```

---

## 🎯 Test Fitur Utama

### ✅ Test Generator & Solver (TANPA SERVER)
```bash
node test-sudoku.js
```

Output akan tampil di console dengan hasil test:
- Generator Mudah, Sedang, Sulit
- Solver dengan algoritma backtracking
- Validasi solusi

### ✅ Test API Endpoints (DENGAN SERVER)

**1. Test Generator:**
Buka browser:
```
http://localhost:3000/api/papan?tingkat=mudah
```

**2. Test Leaderboard:**
```
http://localhost:3000/api/leaderboard
```

**3. Test Email Connection:**
```
http://localhost:3000/api/test-email
```

---

## 🎮 Cara Bermain

### 1. Register Akun
1. Klik "Login" di menu
2. Switch ke tab "Register"
3. Isi form: Nama, Email, Password
4. Klik "Daftar Akun Baru"

### 2. Main Sudoku
1. Pilih tingkat kesulitan (Mudah/Sedang/Sulit)
2. Klik sel kosong dan ketik angka 1-9
3. Gunakan Arrow Keys untuk navigasi
4. Gunakan chatbot untuk bantuan

### 3. Gunakan Chatbot
1. Klik tombol 💬 di pojok kanan bawah
2. Ketik perintah:
   - `hint` → Dapatkan petunjuk
   - `cek jawaban` → Validasi jawaban
   - `solusi` → Lihat solusi lengkap
   - `cara main` → Instruksi game

---

## 🐛 Troubleshooting Cepat

### ❌ Error: Cannot find module
**Solusi:**
```bash
npm install
```

### ❌ Error: MongoDB connection failed
**Solusi:**
1. **Jika pakai MongoDB lokal:** Cek MongoDB sudah berjalan: `mongod`
2. **Jika pakai MongoDB Atlas:** 
   - Baca [MONGODB-ATLAS-SETUP.md](MONGODB-ATLAS-SETUP.md)
   - Cek connection string di `.env` sudah benar
   - Cek Network Access di Atlas sudah di-setup
3. Restart aplikasi

### ❌ Error: Port 3000 already in use
**Solusi 1:** Ganti port di `.env`:
```env
PORT=3001
```

**Solusi 2:** Hentikan aplikasi lain:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### ❌ Email tidak terkirim
**Solusi:**
- Untuk testing, skip email (tidak wajib)
- Atau gunakan kredensial Gmail yang benar
- Gunakan App Password (bukan password akun)

---

## 📊 Struktur Menu

```
Home (/)
├── Beranda → Info & fitur
├── Main (/sudoku) → Halaman game
├── Leaderboard (/leaderboard) → Skor tertinggi
└── Login (/login) → Login/Register
```

---

## 🔑 Akun Test (Opsional)

Jika ingin langsung test tanpa register:

**Setelah server jalan, buat akun test via cURL:**
```bash
curl -X POST http://localhost:3000/api/register ^
  -H "Content-Type: application/json" ^
  -d "{\"namaLengkap\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"test123\"}"
```

Login dengan:
- Email: `test@test.com`
- Password: `test123`

---

## 💡 Tips Cepat

### Keyboard Shortcuts di Game:
- **Arrow Keys** → Navigasi sel
- **1-9** → Isi angka
- **Delete/Backspace** → Hapus angka

### Chatbot Commands:
- `hint` → Petunjuk satu sel
- `cek` → Validasi jawaban
- `solusi` → Lihat jawaban lengkap
- `cara main` → Instruksi

### Tingkat Kesulitan:
- **Mudah:** ~35 sel kosong
- **Sedang:** ~47 sel kosong
- **Sulit:** ~57 sel kosong

---

## 🎓 Untuk Demo/Presentasi

### 1. Persiapan (5 menit sebelum demo)
```bash
# Jalankan MongoDB
mongod

# Terminal baru - jalankan aplikasi
cd "d:\uas pemjar\sudoku"
npm start
```

### 2. Demo Flow (10 menit)
1. **Tunjukkan Home** → Jelaskan fitur
2. **Register Akun** → Demo email (jika sudah config)
3. **Main Sudoku** → Pilih mudah untuk cepat
4. **Gunakan Chatbot** → Demo hint & validasi
5. **Selesaikan Puzzle** → Tampilkan skor
6. **Leaderboard** → Tunjukkan ranking

### 3. Tunjukkan Kode (5 menit)
```bash
# Buka file penting di editor
- src/services/sudokuSolver.js → Algoritma backtracking
- src/services/sudokuGenerator.js → Generator puzzle
- src/services/chatbotService.js → Logic chatbot
- src/app.js → Socket.IO setup
```

### 4. Test Live (3 menit)
```bash
# Jalankan test
node test-sudoku.js
```

---

## 📸 Screenshot Checklist

Untuk dokumentasi/laporan, screenshot:
- [ ] Halaman Home
- [ ] Halaman Login/Register
- [ ] Halaman Game (papan Sudoku)
- [ ] Chatbot aktif dengan hint
- [ ] Leaderboard dengan data
- [ ] Console output test-sudoku.js
- [ ] MongoDB Compass (database)
- [ ] API response di browser/Postman

---

## 🏁 Quick Commands Reference

```bash
# Install
npm install

# Setup MongoDB (follow MONGODB-ATLAS-SETUP.md)
# (tidak ada command, setup via web)

# Start app
npm start

# Development mode
npm run dev

# Test solver/generator
node test-sudoku.js
```

---

## ✅ Verification Checklist

Setelah setup, verifikasi:
- [ ] Server berjalan di http://localhost:3000
- [ ] Halaman home muncul
- [ ] Bisa register akun baru
- [ ] Bisa login
- [ ] Papan Sudoku bisa dimuat
- [ ] Chatbot bisa diklik dan berfungsi
- [ ] Timer berjalan
- [ ] Leaderboard tampil (kosong OK)
- [ ] MongoDB connection success di console

---

## 🆘 Need Help?

1. **Baca dokumentasi lengkap:**
   - `README.md` → Overview proyek
   - `INSTALASI.md` → Panduan detail
   - `API-DOCS.md` → Dokumentasi API

2. **Cek console log:**
   - Terminal tempat `npm start` → Error backend
   - Browser Console (F12) → Error frontend

3. **Test components:**
   - `node test-sudoku.js` → Test solver/generator
   - `/api/test-email` → Test email
   - `/api/papan` → Test generator API

---

**🚀 Selamat mencoba! Semoga sukses dengan proyeknya!**

---

**Waktu Setup Total: ~5 menit**
- Install: 2 menit
- MongoDB Atlas: 2 menit (atau skip jika sudah done)
- Config: 30 detik
- Start: 10 detik
- Test: 1 menit

**✅ PROJECT READY TO USE!**
