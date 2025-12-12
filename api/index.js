/**
 * api/index.js
 * Serverless function entry point untuk Vercel
 */

// Import app dari src tanpa server.listen()
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Import utilities
const { hubungkanMongoDB } = require('../src/utils/koneksiMongo');

// Import routes
const apiRoute = require('../src/routes/apiRoute');
const penggunaRoute = require('../src/routes/penggunaRoute');
const chatbotRouter = require('../src/routes/chatbot');

// Inisialisasi Express
const app = express();

// ==================== MIDDLEWARE ====================

// CORS
app.use(cors());

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

// ==================== MONGODB CONNECTION ====================

// Connect to MongoDB saat cold start
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    await hubungkanMongoDB();
    isConnected = true;
    console.log('✅ MongoDB connected for serverless');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// Middleware untuk ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Export app sebagai serverless function
module.exports = app;
