# DOKUMENTASI API SUDOKUKU

## Base URL
```
http://localhost:3000
```

---

## 🎮 SUDOKU API

### 1. Dapatkan Papan Sudoku Baru
Menghasilkan puzzle Sudoku baru dengan tingkat kesulitan tertentu.

**Endpoint:** `GET /api/papan`

**Query Parameters:**
- `tingkat` (string, opsional): Tingkat kesulitan. Nilai: `mudah`, `sedang`, `sulit`. Default: `sedang`

**Contoh Request:**
```bash
curl http://localhost:3000/api/papan?tingkat=sedang
```

**Response Success (200):**
```json
{
  "sukses": true,
  "data": {
    "papan": [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      ...
    ],
    "tingkat": "sedang",
    "selKosong": 45
  },
  "pesan": "Puzzle sedang berhasil dibuat!"
}
```

---

### 2. Selesaikan Puzzle Sudoku
Menyelesaikan puzzle Sudoku menggunakan algoritma backtracking.

**Endpoint:** `POST /api/selesaikan`

**Request Body:**
```json
{
  "papan": [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    ...
  ]
}
```

**Response Success (200):**
```json
{
  "sukses": true,
  "data": {
    "solusi": [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      ...
    ]
  },
  "pesan": "Puzzle berhasil diselesaikan!"
}
```

---

### 3. Dapatkan Solusi Puzzle Aktif
Mendapatkan solusi dari puzzle yang sedang dimainkan (tersimpan di session).

**Endpoint:** `GET /api/solusi`

**Response Success (200):**
```json
{
  "sukses": true,
  "data": {
    "solusi": [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      ...
    ]
  },
  "pesan": "Solusi puzzle aktif"
}
```

---

## 🏆 SKOR & LEADERBOARD API

### 4. Rekam Skor Permainan
Menyimpan skor setelah menyelesaikan puzzle.

**Endpoint:** `POST /api/rekam-skor`

**Headers:**
- Requires: User login (session)

**Request Body:**
```json
{
  "waktuPenyelesaian": 180,
  "tingkatKesulitan": "sedang"
}
```

**Response Success (200):**
```json
{
  "sukses": true,
  "data": {
    "skor": 520,
    "waktuPenyelesaian": 180,
    "tingkatKesulitan": "sedang",
    "rekorBaru": true
  },
  "pesan": "Skor berhasil disimpan!"
}
```

---

### 5. Dapatkan Leaderboard
Mendapatkan daftar pemain dengan skor tertinggi.

**Endpoint:** `GET /api/leaderboard`

**Query Parameters:**
- `limit` (number, opsional): Jumlah data yang ditampilkan. Default: 10
- `tingkat` (string, opsional): Filter berdasarkan tingkat. Nilai: `mudah`, `sedang`, `sulit`

**Contoh Request:**
```bash
curl http://localhost:3000/api/leaderboard?limit=10&tingkat=sedang
```

**Response Success (200):**
```json
{
  "sukses": true,
  "data": [
    {
      "peringkat": 1,
      "namaPengguna": "John Doe",
      "skor": 650,
      "waktuPenyelesaian": 150,
      "tingkatKesulitan": "sedang",
      "tanggalMain": "2025-12-13T10:30:00.000Z"
    },
    ...
  ],
  "total": 10,
  "pesan": "Leaderboard berhasil diambil"
}
```

---

### 6. Dapatkan Statistik Pengguna
Mendapatkan statistik permainan pengguna yang sedang login.

**Endpoint:** `GET /api/statistik`

**Headers:**
- Requires: User login (session)

**Response Success (200):**
```json
{
  "sukses": true,
  "data": {
    "namaLengkap": "John Doe",
    "email": "john@example.com",
    "totalPermainan": 25,
    "skorTerbaik": 650,
    "rataRataSkor": 520,
    "tanggalDaftar": "2025-12-01T08:00:00.000Z"
  },
  "pesan": "Statistik berhasil diambil"
}
```

---

## 👤 AUTENTIKASI API

### 7. Register Pengguna Baru
Mendaftarkan pengguna baru ke sistem.

**Endpoint:** `POST /api/register`

**Request Body:**
```json
{
  "namaLengkap": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (201):**
```json
{
  "sukses": true,
  "data": {
    "id": "65abc123def456789",
    "namaLengkap": "John Doe",
    "email": "john@example.com"
  },
  "pesan": "Registrasi berhasil! Selamat datang di SudokuKu!"
}
```

**Note:** Email selamat datang akan dikirim otomatis ke alamat email yang didaftarkan.

---

### 8. Login Pengguna
Login ke sistem untuk mulai bermain.

**Endpoint:** `POST /api/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "sukses": true,
  "data": {
    "id": "65abc123def456789",
    "namaLengkap": "John Doe",
    "email": "john@example.com",
    "skorTerbaik": 650,
    "totalPermainan": 25
  },
  "pesan": "Login berhasil!"
}
```

---

### 9. Logout Pengguna
Logout dari sistem.

**Endpoint:** `GET /api/logout`

**Response Success (200):**
```json
{
  "sukses": true,
  "pesan": "Logout berhasil"
}
```

---

### 10. Cek Status Login
Mengecek apakah pengguna sudah login.

**Endpoint:** `GET /api/cek-login`

**Response Success (200):**
```json
{
  "sudahLogin": true,
  "data": {
    "id": "65abc123def456789",
    "namaLengkap": "John Doe",
    "email": "john@example.com",
    "skorTerbaik": 650,
    "totalPermainan": 25
  }
}
```

---

### 11. Dapatkan Profil Pengguna
Mendapatkan profil lengkap pengguna yang login.

**Endpoint:** `GET /api/profil`

**Headers:**
- Requires: User login (session)

**Response Success (200):**
```json
{
  "sukses": true,
  "data": {
    "id": "65abc123def456789",
    "namaLengkap": "John Doe",
    "email": "john@example.com",
    "skorTerbaik": 650,
    "totalPermainan": 25,
    "tanggalDaftar": "2025-12-01T08:00:00.000Z",
    "terakhirLogin": "2025-12-13T10:30:00.000Z"
  }
}
```

---

## 📧 EMAIL API (Testing)

### 12. Test Koneksi Email
Mengecek apakah koneksi email berfungsi.

**Endpoint:** `GET /api/test-email`

**Response Success (200):**
```json
{
  "sukses": true,
  "pesan": "Koneksi email berhasil!"
}
```

---

### 13. Kirim Email Test
Mengirim email test ke alamat tertentu.

**Endpoint:** `POST /api/kirim-email-test`

**Request Body:**
```json
{
  "email": "test@example.com",
  "nama": "Test User"
}
```

**Response Success (200):**
```json
{
  "sukses": true,
  "pesan": "Email test berhasil dikirim!",
  "messageId": "<unique-message-id>"
}
```

---

## 💬 SOCKET.IO EVENTS

### Event: pesan_chatbot
Mengirim pesan ke chatbot.

**Emit:**
```javascript
socket.emit('pesan_chatbot', {
  pesan: "hint",
  papan: [[5,3,0,...], [...], ...]
});
```

**Listen: respons_chatbot**
```javascript
socket.on('respons_chatbot', (data) => {
  // data.tipe: 'hint', 'validasi', 'solusi', 'error', dll
  // data.pesan: String pesan
  // data.data: Object data tambahan
});
```

### Event: minta_hint
Request hint secara langsung.

**Emit:**
```javascript
socket.emit('minta_hint', {
  papan: [[5,3,0,...], [...], ...]
});
```

**Listen: respons_chatbot**
Sama dengan respons untuk pesan_chatbot.

---

## 📊 RESPONSE CODES

| Code | Keterangan |
|------|-----------|
| 200 | Success |
| 201 | Created (untuk register) |
| 400 | Bad Request (validasi gagal) |
| 401 | Unauthorized (belum login) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔐 AUTENTIKASI

Aplikasi menggunakan **express-session** untuk autentikasi. Session disimpan di server dan cookie dikirim ke client. Tidak perlu menambahkan header Authorization secara manual.

Cookie akan otomatis dikirim oleh browser untuk setiap request ke endpoint yang memerlukan autentikasi.

---

## 🧪 TESTING API

### Menggunakan cURL

**Dapatkan papan baru:**
```bash
curl http://localhost:3000/api/papan?tingkat=mudah
```

**Register:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"namaLengkap":"Test User","email":"test@example.com","password":"test123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -c cookies.txt
```

**Dapatkan leaderboard:**
```bash
curl http://localhost:3000/api/leaderboard?limit=5
```

### Menggunakan Postman
1. Import endpoint ke Postman
2. Untuk endpoint yang memerlukan login, pastikan cookies diaktifkan
3. Test setiap endpoint sesuai dokumentasi

---

## 💡 TIPS

1. **Session Management**: Cookie session valid selama 24 jam
2. **Solver Performance**: Puzzle sulit mungkin memerlukan waktu lebih lama untuk diselesaikan
3. **Email**: Gunakan App Password untuk Gmail, bukan password akun biasa
4. **MongoDB**: Pastikan MongoDB berjalan sebelum start server
5. **Error Handling**: Semua error akan dikembalikan dalam format JSON dengan `sukses: false`

---

Dibuat dengan ❤️ untuk SudokuKu Project
