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

// Global connection promise untuk serverless
let cachedConnection = null;

const connectDB = async () => {
  // Reuse existing connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️ Reusing existing MongoDB connection');
    return cachedConnection;
  }
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI tidak ditemukan di environment variables');
    }
    
    console.log('🔄 Connecting to MongoDB...');
    console.log('📍 Connection string preview:', MONGODB_URI.substring(0, 50) + '...');
    
    // Connect dengan timeout settings yang lebih panjang
    cachedConnection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    cachedConnection = null;
    throw error;
  }
};

// Connect immediately on cold start (sebelum request pertama)
let connectionPromise = connectDB().catch(err => {
  console.error('Failed to connect on startup:', err.message);
});

// Middleware untuk ensure DB connection setiap request
app.use(async (req, res, next) => {
  try {
    // Tunggu connection promise sebelumnya
    await connectionPromise;
    
    // Jika belum connect, coba connect lagi
    if (mongoose.connection.readyState !== 1) {
      console.log('Retrying MongoDB connection...');
      connectionPromise = connectDB();
      await connectionPromise;
    }
    
    next();
  } catch (error) {
    console.error('Middleware connection error:', error.message);
    return res.status(503).json({
      sukses: false,
      pesan: 'Database tidak tersedia: ' + error.message
    });
  }
});

// Export app sebagai serverless function
module.exports = app;
