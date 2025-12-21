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

// ==================== ROUTES ====================

// Halaman utama
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Beranda',
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

// ==================== MONGODB CONNECTION ====================

const mongoose = require('mongoose');

// Direct connection tanpa caching untuk cold start
const hubungkanBasisData = async () => {
  try {
    // Check jika sudah connected
    if (mongoose.connection.readyState === 1) {
      console.log('♻️ Menggunakan ulang koneksi MongoDB yang sudah ada');
      return mongoose.connection;
    }
    
    let URI_MONGODB = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
    
    if (!URI_MONGODB) {
      throw new Error('Variabel environment MONGODB_URI tidak ditemukan');
    }

    // Jika ada override nama database, ganti atau tambahkan pada URI
    const namaDbOverride = process.env.MONGODB_DB;
    if (namaDbOverride) {
      try {
        const [base, query] = URI_MONGODB.split('?');
        const slashIndex = base.indexOf('/', base.indexOf('://') + 3);
        let newBase;
        if (slashIndex === -1) {
          newBase = base + '/' + namaDbOverride;
        } else {
          const beforePath = base.slice(0, slashIndex + 1);
          newBase = beforePath + namaDbOverride;
        }
        URI_MONGODB = query ? `${newBase}?${query}` : newBase;
        console.log('Menggunakan override nama database dari MONGODB_DB:', namaDbOverride);
      } catch (e) {
        console.warn('Gagal menerapkan MONGODB_DB override, menggunakan URI asli');
      }
    }
    
    console.log('🔄 [Cold Start] Menghubungkan ke MongoDB Atlas...');
    
    // Koneksi langsung tanpa promise caching
    await mongoose.connect(URI_MONGODB, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 5,
      minPoolSize: 1,
      family: 4, // Force IPv4
    });
    
    console.log('✅ [Cold Start] MongoDB terhubung!');
    console.log(`   Basis data: ${mongoose.connection.name}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ [Cold Start] Gagal terhubung:', error.message);
    throw error;
  }
};

// Middleware - koneksi sebelum setiap request (non-blocking)
app.use(async (req, res, next) => {
  try {
    // Ensure connection sebelum proses request
    if (mongoose.connection.readyState !== 1) {
      console.log(`⏳ Menghubungkan... (status saat ini: ${mongoose.connection.readyState})`);
      await hubungkanBasisData();
    }
    next();
  } catch (error) {
    console.error('❌ Error koneksi middleware:', error.message);
    // Tetap lanjutkan ke handler berikutnya - biarkan controller handle error
    next();
  }
});

// Export app sebagai serverless function
module.exports = app;
