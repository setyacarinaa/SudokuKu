/**
 * app.js
 * Entry point aplikasi SudokuKu
 * Server Express dengan Socket.IO untuk real-time chatbot
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Socket.IO helper
const { Server } = require('socket.io');
const chatbotService = require('./services/chatbotService');

// Import utilities and routes
const { hubungkanMongoDB } = require('./utils/koneksiMongo');
const ruteApi = require('./routes/apiRoute');
const rutePengguna = require('./routes/penggunaRoute');
const ruteChatbot = require('./routes/chatbot');

// Inisialisasi Express + HTTP server
const app = express();
const serverHttp = http.createServer(app);

// Attach Socket.IO for realtime chatbot
const io = new Server(serverHttp, {
  path: process.env.SOCKET_PATH || '/socket.io',
  cors: { origin: '*' }
});

// We'll attach the session middleware to sockets after it's declared

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

// Attach session middleware to Socket.IO requests
io.use((socket, next) => {
  middlewareSesi(socket.request, socket.request.res || {}, next);
});

// Socket.IO connection handler for realtime chatbot
io.on('connection', (socket) => {
  console.log('🔌 Socket.IO: client connected', socket.id);

  socket.emit('respons_chatbot', { tipe: 'status', pesan: '✅ Chatbot terhubung (realtime)' });

  socket.on('pesan_chatbot', async (payload) => {
    try {
      const pesan = (payload && payload.pesan) ? String(payload.pesan) : '';
      const sessionData = socket.request.session || {};
      const sessionTeka = sessionData.tekaTekiAktif || null;

      // If client provided a board (to validate current player entries), prefer it
      // but pair it with the session's solution so server can validate.
      let dataUntukChatbot = sessionTeka;
      if (payload && payload.papan) {
        dataUntukChatbot = {
          papan: payload.papan,
          solusi: sessionTeka ? sessionTeka.solusi : null
        };
      }

      // First try local handlers (logika lokal)
      let hasil = chatbotService.prosesPesanChatbot(pesan || '', dataUntukChatbot);
      if (hasil && typeof hasil.then === 'function') hasil = await hasil;

      // If the local chatbot doesn't recognize the command, delegate to OpenAI
      if (hasil && hasil.tipe && hasil.tipe !== 'unknown') {
        socket.emit('respons_chatbot', hasil);
        return;
      }

      // If unknown, and OPENAI_API_KEY is configured, call OpenAI Responses API
      if (process.env.OPENAI_API_KEY) {
        try {
          // Dynamically import ES module helper
          const { getGPTResponse } = await import('./utils/openai.mjs');
          const aiText = await getGPTResponse(pesan || '');
          socket.emit('respons_chatbot', { tipe: 'ai', pesan: aiText });
          return;
        } catch (e) {
          console.error('OpenAI call failed:', e);
          socket.emit('respons_chatbot', { tipe: 'error', pesan: '❌ AI eksternal gagal merespons.' });
          return;
        }
      }

      // No external AI configured — return the unknown response
      socket.emit('respons_chatbot', hasil);
    } catch (err) {
      console.error('Chatbot socket error:', err);
      socket.emit('respons_chatbot', { tipe: 'error', pesan: `❌ Kesalahan chatbot: ${err.message}` });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket.IO: client disconnected', socket.id, reason);
  });
});

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
      console.log(`✅ Chatbot: Socket.IO ready at path ${io.path()}`);
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
