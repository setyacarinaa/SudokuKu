# 📊 PANDUAN LENGKAP MONGODB ATLAS

## Apa itu MongoDB Atlas?

MongoDB Atlas adalah layanan cloud database MongoDB yang gratis untuk development. Anda tidak perlu install MongoDB lokal di komputer.

**Keuntungan:**
- ✅ Gratis (512MB storage per bulan)
- ✅ Tidak perlu install apapun
- ✅ Akses dari mana saja
- ✅ Backup otomatis
- ✅ Dashboard monitoring
- ✅ Production-ready

---

## 📋 LANGKAH-LANGKAH SETUP (15 menit)

### **STEP 1: Buat Akun MongoDB Atlas**

1. **Buka website:**
   ```
   https://www.mongodb.com/cloud/atlas/register
   ```

2. **Pilih metode registrasi:**
   - Gunakan Google (tercepat)
   - Atau email + password

3. **Isi informasi (jika manual):**
   - Nama depan
   - Nama belakang
   - Email
   - Password (minimal 8 karakter, 1 huruf besar, 1 angka)

4. **Setuju Terms dan klik "Sign Up"**

5. **Verifikasi email** (jika diminta)

✅ **Akun sudah dibuat!**

---

### **STEP 2: Buat Cluster Database**

1. **Setelah login, akan muncul dashboard**
   - Klik tombol **"Create"** atau **"Create a Cluster"**

2. **Pilih Plan:**
   - Pilih **"Shared"** (biru, GRATIS)
   - Jangan pilih "Dedicated" (berbayar)

3. **Pilih Cloud Provider & Region:**
   - Cloud Provider: **AWS** (default OK)
   - Region: **Asia Pacific (Singapore)** atau **Southeast Asia (Jakarta)**
   - Jika tidak ada, pilih terdekat

4. **Cluster Name (opsional):**
   - Biarkan default atau ubah ke "sudoku-cluster"

5. **Klik "Create Cluster"**
   - Tunggu 2-3 menit hingga status berubah jadi "Ready"

✅ **Cluster sudah dibuat!**

---

### **STEP 3: Setup Security (User & Network)**

#### **A. Buat Database User**

1. **Di sidebar kiri, klik "Database Access"**

2. **Klik "Add New Database User"**

3. **Isi form:**
   - **Username:** `sudoku_admin` (atau nama Anda)
   - **Password:** `SudokuKu123456` (minimal 8 karakter)
     - PERHATIAN: Ingat password ini!
   - **User Privileges:** Default OK (readWriteAnyDatabase)

4. **Klik "Add User"**

✅ **User database sudah dibuat!**

#### **B. Setup Network Access**

1. **Di sidebar kiri, klik "Network Access"**

2. **Klik "Add IP Address"**

3. **Pilih salah satu:**
   - **"Allow Access from Anywhere"** (mudah, untuk development)
     - IP: `0.0.0.0/0`
   - Atau masukkan IP komputer Anda

4. **Klik "Confirm"**

✅ **Network access sudah disetup!**

---

### **STEP 4: Dapatkan Connection String**

1. **Di sidebar, klik "Clusters"**

2. **Klik tombol "Connect"** (di cluster Anda)

3. **Pilih "Connect your application"**

4. **Pilih:**
   - **Driver:** Node.js
   - **Version:** 4.1 or later

5. **Copy connection string:**
   ```
   mongodb+srv://sudoku_admin:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Ganti `PASSWORD` dengan password yang Anda buat:**
   ```
   mongodb+srv://sudoku_admin:SudokuKu123456@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

✅ **Connection string sudah didapat!**

---

## 🔧 INTEGRASI DENGAN SUDOKUKU

### **Langkah 1: Update file `.env`**

Buka file `d:\uas pemjar\sudoku\.env`:

```env
# PORT aplikasi
PORT=3000

# MongoDB Connection String - UBAH INI!
MONGODB_URI=mongodb+srv://sudoku_admin:SudokuKu123456@cluster0.xxxxx.mongodb.net/sudokuku?retryWrites=true&w=majority

# Session Secret
SESSION_SECRET=rahasia_sudoku_ku_secret_key_12345

# Email Configuration (Opsional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Base URL aplikasi
BASE_URL=http://localhost:3000
```

**PENTING:**
- Ganti `sudoku_admin` dengan username Anda
- Ganti `SudokuKu123456` dengan password Anda
- Ganti `cluster0.xxxxx` dengan nama cluster Anda
- **Pastikan URL diakhiri dengan `/sudokuku?retryWrites=true&w=majority`**

### **Langkah 2: Jalankan Aplikasi**

Terminal baru (tidak perlu buka MongoDB lokal):

```powershell
cd "d:\uas pemjar\sudoku"
npm start
```

**Output yang benar:**
```
✅ MongoDB berhasil terhubung!
   Database: sudokuku
✅ Server berjalan di: http://localhost:3000
```

### **Langkah 3: Test di Browser**

Buka: `http://localhost:3000`

Jika muncul halaman, berarti berhasil! 🎉

---

## 🧪 VERIFIKASI KONEKSI

### Test 1: Buka API
```
http://localhost:3000/api/papan?tingkat=mudah
```

Jika dapat response JSON, database sudah terhubung!

### Test 2: Register Akun
1. Klik "Login" di menu
2. Klik "Register"
3. Isi data akun
4. Klik "Daftar"

Jika akun berhasil dibuat, MongoDB sudah berfungsi!

### Test 3: Cek di MongoDB Atlas Dashboard
1. Kunjungi https://www.mongodb.com/cloud/atlas
2. Klik cluster Anda
3. Klik "Collections"
4. Seharusnya ada collection `penggunas` (user yang Anda buat)

---

## 🎮 MAIN SUDOKU

Setelah koneksi berhasil:

```powershell
npm start
```

1. Buka `http://localhost:3000`
2. Register akun baru
3. Login
4. Klik "Main"
5. Pilih tingkat kesulitan
6. Mulai bermain!

---

## 📊 MONITOR DATABASE DI ATLAS

### Cek Data yang Disimpan:

1. **Kunjungi MongoDB Atlas**
   ```
   https://www.mongodb.com/cloud/atlas
   ```

2. **Klik cluster "sudoku-cluster"**

3. **Klik "Collections"**

4. **Lihat collections yang ada:**
   - `penggunas` - Data user
   - `skors` - Data skor permainan

5. **Klik collection untuk melihat data detail**

### Cek Usage/Storage:

1. **Di dashboard, lihat "Storage" section**
2. **Menampilkan:**
   - Data size (berapa MB)
   - Index size
   - Total usage

---

## ⚠️ TROUBLESHOOTING

### ❌ Error: "MongoError: getaddrinfo ENOTFOUND"

**Penyebab:** Network Access tidak disetup

**Solusi:**
1. Buka MongoDB Atlas
2. Klik "Network Access"
3. Pastikan ada IP yang di-whitelist
4. Klik "Add IP Address" → "Allow Access from Anywhere"

---

### ❌ Error: "Authentication failed"

**Penyebab:** Username/password salah

**Solusi:**
1. Cek file `.env` - apakah username & password sudah benar?
2. Jika lupa, reset password di Database Access
3. Copy ulang connection string

---

### ❌ Error: "ECONNREFUSED"

**Penyebab:** Connection string salah atau cluster belum ready

**Solusi:**
1. Pastikan cluster status "Ready" di Atlas dashboard
2. Cek `.env` - apakah MONGODB_URI lengkap?
3. Tunggu 1-2 menit, coba lagi

---

### ❌ Halaman blank atau "Cannot GET"

**Penyebab:** Aplikasi tidak start / port sudah dipakai

**Solusi:**
```powershell
# Cek error di console
# Pastikan melihat "✅ MongoDB berhasil terhubung!"

# Jika port 3000 sudah dipakai:
# Ubah di .env: PORT=3001
```

---

## 🔒 KEAMANAN

### Best Practices:

1. **Password yang kuat:**
   - Minimal 8 karakter
   - Gabungan huruf, angka, simbol
   - Jangan gunakan password dictionary

2. **IP Whitelist:**
   - Untuk production: masukkan IP server saja
   - Untuk development: bisa "Allow Anywhere"

3. **Database User Permission:**
   - Jangan gunakan admin account untuk app
   - Buat user dengan permission minimal

4. **Jangan share connection string:**
   - Jangan commit `.env` ke git
   - Jangan share username/password

---

## 🚀 SCALE UP (Jika Diperlukan)

Jika data > 512MB atau ingin lebih features:

**Upgrade ke Dedicated Cluster:**
1. Di MongoDB Atlas, klik cluster
2. Klik "Modify Cluster"
3. Pilih "M0" → "M2" atau lebih
4. Bayar ~$57/bulan (atau gunakan free tier lebih dulu)

Untuk development, shared cluster (free) sudah cukup!

---

## 📈 MONITORING & ANALYTICS

### Lihat Performance:

1. **Klik cluster Anda**
2. **Tab "Metrics":**
   - Document count
   - Queries per second
   - Network I/O
   - Disk usage

3. **Tab "Logs":**
   - Error logs
   - Query logs

Berguna untuk debugging dan optimization!

---

## 🔄 BACKUP DATA

MongoDB Atlas otomatis backup:

**Cek backup:**
1. **Klik cluster**
2. **Tab "Backup"**
3. **Lihat backup history**

**Restore dari backup:**
1. **Klik "..." next to backup**
2. **Klik "Restore"**
3. **Pilih waktu restore**
4. **Confirm**

---

## 📚 KOMENTAR DI KODE

File `src/utils/koneksiMongo.js` sudah siap untuk MongoDB Atlas!

Tidak perlu ubah code, hanya ubah `.env`:

```javascript
// CONNECTION STRING dari .env akan digunakan otomatis
const uriMongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/sudokuku';
```

---

## ✅ CHECKLIST SETUP MONGODB ATLAS

- [ ] Daftar akun MongoDB Atlas
- [ ] Buat cluster (pilih Shared/Free)
- [ ] Buat database user (username & password)
- [ ] Setup network access (Allow anywhere)
- [ ] Copy connection string
- [ ] Update file `.env` dengan connection string
- [ ] Jalankan `npm start`
- [ ] Test di `http://localhost:3000`
- [ ] Register akun baru
- [ ] Lihat data di Collections di Atlas

✅ **SELESAI! MongoDB sudah siap!**

---

## 🎓 TIPS & TRIK

### 1. Connection String Format:
```
mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/[DATABASE]?retryWrites=true&w=majority
```

### 2. Database Name:
- Tidak perlu buat database di Atlas
- Mongoose akan auto-create saat pertama kali ada data
- Disarankan: `sudokuku`

### 3. Test Connection:
```powershell
# Sebelum jalankan aplikasi, test connection:
npm start

# Lihat console untuk pesan:
# ✅ MongoDB berhasil terhubung!
```

### 4. Monitor Real-time:
- Buka MongoDB Atlas dashboard
- Lihat data real-time saat bermain
- Refresh untuk melihat skor terbaru

---

## 📞 BANTUAN LEBIH LANJUT

### Dokumentasi Official:
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Mongoose: https://mongoosejs.com/

### Common Issues:
- https://docs.atlas.mongodb.com/reference/error-messages/

---

## 🎉 SELESAI!

Sekarang MongoDB Atlas sudah setup dan aplikasi SudokuKu siap berjalan!

```powershell
npm start
```

Buka browser: `http://localhost:3000` 🎮

---

**Dibuat dengan ❤️ untuk SudokuKu Project**

**Kalo ada pertanyaan, baca ulang bagian Troubleshooting ya! 😊**
