/**
 * api/index.js
 * Serverless function entry point untuk Vercel
 */

// Import app dari src tanpa server.listen()
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Import routes
const ruteApi = require('../src/routes/apiRoute');
const rutePengguna = require('../src/routes/penggunaRoute');
const ruteChatbot = require('../src/routes/chatbot');
const { hubungkanMongoDB } = require('../src/utils/koneksiMongo');

// Inisialisasi Express
const app = express();

// ==================== MIDDLEWARE ====================

// CORS
// Allow credentials so session cookie can be sent from browser to API on deploy
app.use(cors({ origin: true, credentials: true }));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'sudokuku_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 jam
  }
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ==================== MONGODB CONNECTION MIDDLEWARE ====================
// Ensure we attempt to connect before routes are handled in serverless
const mongoose = require('mongoose');
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log(`⏳ [Serverless] mencoba menghubungkan ke MongoDB (status saat ini: ${mongoose.connection.readyState})`);
      await hubungkanMongoDB();
      if (mongoose.connection.readyState === 1) {
        console.log('✅ [Serverless] MongoDB berhasil terhubung');
      } else {
        console.warn('⚠️ [Serverless] MongoDB tidak dikonfigurasi atau gagal terhubung. Fitur yang membutuhkan DB akan mengembalikan 503.');
      }
    }
    next();
  } catch (error) {
    console.error('❌ Error koneksi middleware:', error && error.message ? error.message : error);
    next();
  }
});

// ==================== ROUTES ====================

// Halaman utama
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Beranda',
    sudahLogin: !!req.session.userId,
    namaLengkap: req.session.namaLengkap || null
  });
});

// Debug endpoint: cek status koneksi dan env vars penting (tidak menampilkan secrets)
app.get('/api/debug-conn', (req, res) => {
  try {
    const ready = mongoose.connection.readyState; // 0 disconnected,1 connected
    const envCandidates = ['MONGODB_URI','MONGODB_ATLAS_URI','MONGODB_ATLAS','MONGO_URI','MONGO_URL','DATABASE_URL','MONGODB_LOCAL'];
    let detectedVar = null;
    for (const n of envCandidates) {
      if (process.env[n]) { detectedVar = n; break; }
    }
    const hasUri = !!detectedVar;
    const hasDbOverride = !!process.env.MONGODB_DB;
    res.json({
      sukses: true,
      readyState: ready,
      siapTerhubung: hasUri,
      envVarDetected: detectedVar,
      menggunakanOverrideDb: hasDbOverride,
      databaseName: mongoose.connection && mongoose.connection.name ? mongoose.connection.name : null,
      pesan: ready === 1 ? 'Connected' : (hasUri ? `Env var ${detectedVar} present but not connected` : 'No MongoDB env var set')
    });
  } catch (e) {
    res.status(500).json({ sukses: false, pesan: e.message });
  }
});

// Halaman game Sudoku
app.get('/sudoku', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('sudoku', {
    title: 'Permainan',
    sudahLogin: true,
    namaLengkap: req.session.namaLengkap
  });
});

// Halaman leaderboard
app.get('/leaderboard', (req, res) => {
  res.render('leaderboard', {
    title: 'Leaderboard',
    sudahLogin: !!req.session.userId,
    namaLengkap: req.session.namaLengkap || null
  });
});

// Halaman profil (ditambahkan juga untuk environment serverless seperti Vercel)
app.get('/profil', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('profil', {
    title: 'Profil',
    sudahLogin: true,
    namaLengkap: req.session.namaLengkap
  });
});

// Halaman login
app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/sudoku');
  }
  res.render('login', {
    title: 'Login',
    sudahLogin: false
  });
});

// API Routes
app.use('/api', ruteApi);
app.use('/api', rutePengguna);
app.use('/api/chatbot', ruteChatbot);

// Debug routes (hapus di production)
const ruteDebug = require('../src/routes/debug');
app.use('/api', ruteDebug);

// Debug leaderboard
const ruteDebugLeaderboard = require('../src/routes/debug-leaderboard');
app.use('/api', ruteDebugLeaderboard);

// Test connection routes
const ruteTesKoneksi = require('../src/routes/test-connection');
const ruteTesKoneksiLangsung = require('../src/routes/test-direct-connection');
const ruteStatusDB = require('../src/routes/status-db');
app.use('/api', ruteTesKoneksi);
app.use('/api', ruteTesKoneksiLangsung);
app.use('/api', ruteStatusDB);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    sukses: false,
    pesan: 'Endpoint tidak ditemukan'
  });
});

// (moved earlier in file)

// Export app sebagai serverless function
module.exports = app;
