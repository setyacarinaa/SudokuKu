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
const apiRoute = require('./routes/apiRoute');
const penggunaRoute = require('./routes/penggunaRoute');

// Router Chatbot via HTTP
const chatbotRouter = require('./routes/chatbot');

// Inisialisasi Express
const app = express();
const server = http.createServer(app);
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
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'sudokuku_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 jam
  }
});

app.use(sessionMiddleware);

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
app.use('/api', apiRoute);
app.use('/api', penggunaRoute);
app.use('/api/chatbot', chatbotRouter);

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
    server.listen(PORT, () => {
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
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server };
