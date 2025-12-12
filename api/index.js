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

// Debug routes (hapus di production)
const debugRouter = require('../src/routes/debug');
app.use('/api', debugRouter);

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
const connectDB = async () => {
  try {
    // Check jika sudah connected
    if (mongoose.connection.readyState === 1) {
      console.log('♻️ Reusing existing MongoDB connection');
      return mongoose.connection;
    }
    
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not found');
    }
    
    console.log('🔄 [Cold Start] Connecting to MongoDB Atlas...');
    
    // Koneksi langsung tanpa promise caching
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 20000,
      maxPoolSize: 5,
      minPoolSize: 1,
      family: 4, // Force IPv4
    });
    
    console.log('✅ [Cold Start] MongoDB connected!');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ [Cold Start] Connection failed:', error.message);
    throw error;
  }
};

// Middleware - koneksi sebelum setiap request
app.use(async (req, res, next) => {
  try {
    // Ensure connection sebelum proses request
    if (mongoose.connection.readyState !== 1) {
      console.log(`⏳ Connecting... (current state: ${mongoose.connection.readyState})`);
      await connectDB();
    }
    next();
  } catch (error) {
    console.error('❌ Middleware connection error:', error.message);
    return res.status(503).json({
      sukses: false,
      pesan: 'Database tidak tersedia - ' + error.message
    });
  }
});

// Export app sebagai serverless function
module.exports = app;
