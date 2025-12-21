/**
 * app.js
 * Entry point aplikasi SudokuKu
 * Server Express dengan Socket.IO untuk real-time chatbot
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
// Catatan: Socket.IO dinonaktifkan untuk kompatibilitas serverless
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Import utilities
const { hubungkanMongoDB } = require('./utils/koneksiMongo');

// Import routes
const ruteApi = require('./routes/apiRoute');
const rutePengguna = require('./routes/penggunaRoute');

// Router Chatbot via HTTP
const ruteChatbot = require('./routes/chatbot');

// Inisialisasi Express
const app = express();
const serverHttp = http.createServer(app);
// Socket.IO dihapus; gunakan HTTP endpoints

// Port dari environment atau default
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

// CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
const middlewareSesi = session({
  secret: process.env.SESSION_SECRET || 'sudokuku_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 jam
  }
});

app.use(middlewareSesi);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ==================== ROUTES ====================

// Halaman utama
app.get('/', (req, res) => {
  res.render('index', {
    title: 'SudokuKu - Beranda',
    sudahLogin: !!req.session.userId,
    namaLengkap: req.session.namaLengkap || null
  });
});

// Halaman game Sudoku
app.get('/sudoku', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('sudoku', {
    title: 'SudokuKu - Permainan',
    sudahLogin: true,
    namaLengkap: req.session.namaLengkap
  });
});

// Halaman leaderboard
app.get('/leaderboard', (req, res) => {
  res.render('leaderboard', {
    title: 'SudokuKu - Leaderboard',
    sudahLogin: !!req.session.userId,
    namaLengkap: req.session.namaLengkap || null
  });
});

// Halaman profil pengguna
app.get('/profil', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('profil', {
    title: 'SudokuKu - Profil',
    sudahLogin: true,
    namaLengkap: req.session.namaLengkap
  });
});
// Halaman hasil permainan
app.get('/hasil', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  // Extract query params
  const waktuDetik = parseInt(req.query.waktu) || 0;
  const tingkat = req.query.tingkat || 'sedang';
  const menang = req.query.menang === 'true';
  const skor = parseInt(req.query.skor) || 0;

  // Format waktu MM:SS
  const menit = Math.floor(waktuDetik / 60);
  const detik = waktuDetik % 60;
  const waktuFormatted = `${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;

  // Motivasi berdasarkan waktu dan tingkat
  let motivasi = '';
  if (tingkat === 'mudah') {
    if (waktuDetik < 300) motivasi = '⚡ Luar biasa cepat! Waktunya menakjubkan!';
    else if (waktuDetik < 600) motivasi = '👍 Kinerja bagus! Terus tingkatkan!';
    else motivasi = '💪 Selamat menyelesaikan! Latih terus untuk lebih cepat!';
  } else if (tingkat === 'sedang') {
    if (waktuDetik < 600) motivasi = '🔥 Sangat cepat untuk tingkat sedang!';
    else if (waktuDetik < 900) motivasi = '✨ Waktu yang solid! Tingkatkan terus!';
    else motivasi = '🎯 Berhasil menyelesaikan! Tingkatkan kecepatan Anda!';
  } else {
    if (waktuDetik < 900) motivasi = '🏆 Master Sudoku! Waktu luar biasa!';
    else if (waktuDetik < 1800) motivasi = '⭐ Hebat! Tingkat sulit tidak mudah!';
    else motivasi = '💎 Mengesankan! Anda berhasil menyelesaikan puzzle sulit!';
  }

  res.render('hasil', {
    title: 'SudokuKu - Hasil Permainan',
    sudahLogin: true,
    namaLengkap: req.session.namaLengkap,
    waktuFormatted,
    tingkat,
    menang,
    skor,
    motivasi
  });
});

// Halaman login
app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/sudoku');
  }
  res.render('login', {
    title: 'SudokuKu - Login',
    sudahLogin: false
  });
});

// API Routes
app.use('/api', ruteApi);
app.use('/api', rutePengguna);
app.use('/api/chatbot', ruteChatbot);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    sukses: false,
    pesan: 'Endpoint tidak ditemukan'
  });
});

// ==================== CHATBOT VIA HTTP ====================
// Endpoint disediakan melalui router /api/chatbot

// ==================== START SERVER ====================

// Hubungkan ke MongoDB dan start server
const startServer = async () => {
  try {
    // Hubungkan ke MongoDB
    await hubungkanMongoDB();

    // Start server
    serverHttp.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('🎮 SudokuKu Server');
      console.log('='.repeat(50));
      console.log(`✅ Server berjalan di: http://localhost:${PORT}`);
      console.log(`✅ MongoDB: Connected`);
      console.log(`✅ Chatbot: HTTP endpoints ready`);
      console.log('='.repeat(50));
      console.log('');
    });
  } catch (error) {
    console.error('❌ Gagal memulai server:', error);
    process.exit(1);
  }
};

// Jalankan server
startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Sinyal SIGTERM diterima: menutup server HTTP');
  serverHttp.close(() => {
    console.log('Server HTTP ditutup');
  });
});

module.exports = { app, server: serverHttp };
