/**
 * penggunaController.js
 * Controller untuk autentikasi dan manajemen pengguna
 */

const Pengguna = require('../models/Pengguna');
const Skor = require('../models/Skor');
const mongoose = require('mongoose');
const { hubungkanMongoDB } = require('../utils/koneksiMongo');

/**
 * Registrasi pengguna baru
 * POST /api/register
 * Body: { namaLengkap, email, password }
 */
const registerPengguna = async (req, res) => {
  try {
    // Pastikan koneksi DB aktif sebelum operasi
    if (mongoose.connection.readyState !== 1) {
      await hubungkanMongoDB();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          sukses: false,
          pesan: 'Database tidak tersedia. Pastikan variabel environment MongoDB sudah diatur.'
        });
      }
    }
    const { namaLengkap, email, password } = req.body;

    console.log('[Register] Menerima request:', { namaLengkap, email });

    // Validasi input
    if (!namaLengkap || !email || !password) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Semua field wajib diisi (nama lengkap, email, password)'
      });
    }

    // Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Password minimal 6 karakter'
      });
    }

    console.log('[Register] Checking if email exists...');
    
    // Cek apakah email sudah terdaftar
    const penggunaAda = await Pengguna.findOne({ email: email.toLowerCase() }).exec();
    if (penggunaAda) {
      console.log('[Register] Email sudah terdaftar:', email);
      return res.status(400).json({
        sukses: false,
        pesan: 'Email sudah terdaftar. Gunakan email lain atau login.'
      });
    }

    console.log('[Register] Creating new user...');
    
    // Buat pengguna baru
    const penggunaBaru = new Pengguna({
      namaLengkap: namaLengkap,
      email: email.toLowerCase(),
      password: password // Password akan di-hash otomatis oleh pre-save middleware
    });

    await penggunaBaru.save();
    
    console.log('[Register] User saved successfully:', penggunaBaru._id);

    console.log(`✅ Pengguna baru berhasil didaftarkan: ${email}`);

    // Email sending removed per user request; continue without sending email.

    // Simpan user ID di session (auto login setelah register)
    req.session.userId = penggunaBaru._id;
    req.session.namaLengkap = penggunaBaru.namaLengkap;

    res.status(201).json({
      sukses: true,
      data: {
        id: penggunaBaru._id,
        namaLengkap: penggunaBaru.namaLengkap,
        email: penggunaBaru.email
      },
      pesan: 'Registrasi berhasil! Selamat datang di SudokuKu!'
    });
  } catch (error) {
    console.error('❌ Error saat registrasi:', error.message);
    console.error('Stack:', error.stack);

    // Handle duplicate key error dari MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Email sudah terdaftar'
      });
    }

    // Handle connection timeout
    if (error.message && error.message.includes('buffering timed out')) {
      return res.status(503).json({
        sukses: false,
        pesan: 'Database tidak tersedia. Coba lagi dalam beberapa saat.',
        error: 'MongoDB connection timeout'
      });
    }

    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat registrasi: ' + error.message,
      error: error.message,
      code: error.code
    });
  }
};

/**
 * Login pengguna
 * POST /api/login
 * Body: { email, password }
 */
const loginPengguna = async (req, res) => {
  try {
    // Pastikan koneksi DB aktif sebelum operasi
    if (mongoose.connection.readyState !== 1) {
      await hubungkanMongoDB();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          sukses: false,
          pesan: 'Database tidak tersedia. Pastikan variabel environment MongoDB sudah diatur.'
        });
      }
    }
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Email dan password wajib diisi'
      });
    }

    // Cari pengguna berdasarkan email
    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() });
    if (!pengguna) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Email atau password salah'
      });
    }

    // Verifikasi password
    const passwordBenar = await pengguna.bandingkanPassword(password);
    if (!passwordBenar) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Email atau password salah'
      });
    }

    // Update waktu login terakhir
    await pengguna.updateLoginTerakhir();

    // Simpan user ID di session
    req.session.userId = pengguna._id;
    req.session.namaLengkap = pengguna.namaLengkap;

    console.log(`✅ Login berhasil: ${email}`);

    // Hitung total permainan terkini dari koleksi Skor
    let totalPermainanCount = 0;
    try {
      totalPermainanCount = await Skor.countDocuments({ idPengguna: pengguna._id });
    } catch (errCount) {
      totalPermainanCount = pengguna.totalPermainan || 0;
    }

    // Sinkronisasi (upaya terbaik) untuk menjaga konsistensi
    if (typeof pengguna.totalPermainan !== 'number' || pengguna.totalPermainan !== totalPermainanCount) {
      pengguna.totalPermainan = totalPermainanCount;
      pengguna.save().catch(() => {});
    }

    // Hitung skor terbaik terbaru dari koleksi Skor
    let skorTerbaikCount = pengguna.skorTerbaik || 0;
    try {
      const top = await Skor.findOne({ idPengguna: pengguna._id }).sort({ skor: -1 }).select('skor').lean();
      if (top && typeof top.skor === 'number') skorTerbaikCount = top.skor;
    } catch (errBest) {
      skorTerbaikCount = pengguna.skorTerbaik || 0;
    }

    // Sinkronkan skorTerbaik pada dokumen pengguna jika berbeda (non-blocking)
    try {
      if (typeof pengguna.skorTerbaik !== 'number' || pengguna.skorTerbaik !== skorTerbaikCount) {
        pengguna.skorTerbaik = skorTerbaikCount;
        pengguna.save().catch(() => {});
      }
    } catch (e) {}

    res.json({
      sukses: true,
      data: {
        id: pengguna._id,
        namaLengkap: pengguna.namaLengkap,
        email: pengguna.email,
        skorTerbaik: skorTerbaikCount,
        totalPermainan: totalPermainanCount
      },
      pesan: 'Login berhasil!'
    });
  } catch (error) {
    console.error('❌ Error saat login:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat login',
      error: error.message
    });
  }
};

/**
 * Logout pengguna
 * GET /api/logout
 */
const logoutPengguna = async (req, res) => {
  try {
    // Jika tidak ada session, kembalikan sukses sederhana
    if (!req.session) {
      return res.json({ sukses: true, pesan: 'Logout berhasil' });
    }

    // Hapus session dan kirim respons
    req.session.destroy((err) => {
      if (err) {
        console.error('Gagal menghancurkan session saat logout:', err);
        return res.status(500).json({ sukses: false, pesan: 'Gagal logout' });
      }

      // Beri tahu client bahwa logout berhasil
      return res.json({ sukses: true, pesan: 'Logout berhasil' });
    });
  } catch (error) {
    console.error('❌ Error saat logout:', error);
    res.status(500).send('Terjadi kesalahan server');
  }
};
/**
 * Cek status login
 * GET /api/cek-login
 */
const cekStatusLogin = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        sudahLogin: false
      });
    }

    const pengguna = await Pengguna.findById(req.session.userId);
    if (!pengguna) {
      req.session.destroy();
      return res.json({
        sudahLogin: false
      });
    }

    // Compute latest totalPermainan
    let totalPermainanCount = pengguna.totalPermainan || 0;
    try {
      totalPermainanCount = await Skor.countDocuments({ idPengguna: pengguna._id });
      if (pengguna.totalPermainan !== totalPermainanCount) {
        pengguna.totalPermainan = totalPermainanCount;
        pengguna.save().catch(() => {});
      }
    } catch (errCount) {
      // ignore and use stored value
    }

    res.json({
      sudahLogin: true,
      data: {
        id: pengguna._id,
        namaLengkap: pengguna.namaLengkap,
        email: pengguna.email,
        skorTerbaik: pengguna.skorTerbaik,
        totalPermainan: totalPermainanCount
      }
    });
  } catch (error) {
    console.error('❌ Error saat cek status login:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat cek status login',
      error: error.message
    });
  }
};

/**
 * Dapatkan profil pengguna
 * GET /api/profil
 */
const dapatkanProfil = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Anda harus login terlebih dahulu'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      await hubungkanMongoDB();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ sukses: false, pesan: 'Database tidak tersedia. Pastikan variabel environment MongoDB sudah diatur.' });
      }
    }

    const pengguna = await Pengguna.findById(req.session.userId);
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan'
      });
    }

    // Hitung total permainan berdasarkan entri skor di koleksi Skor agar selalu konsisten
    let totalPermainanCount = 0;
    try {
      totalPermainanCount = await Skor.countDocuments({ idPengguna: pengguna._id });
    } catch (errCount) {
      console.warn('⚠️ Gagal menghitung total permainan dari koleksi Skor:', errCount && errCount.message);
      // kembali ke nilai yang tersimpan di dokumen pengguna jika perhitungan gagal
      totalPermainanCount = pengguna.totalPermainan || 0;
    }

    // Jika ada ketidaksesuaian, sinkronkan nilai pada dokumen pengguna (upaya terbaik)
    try {
      if (typeof pengguna.totalPermainan !== 'number' || pengguna.totalPermainan !== totalPermainanCount) {
        pengguna.totalPermainan = totalPermainanCount;
        // simpan perubahan secara asinkron, tapi jangan blokir respons ke client jika gagal
        pengguna.save().catch(err => console.warn('⚠️ Gagal memperbarui totalPermainan pada dokumen pengguna:', err && err.message));
      }
    } catch (e) {
      // ignore save errors
    }

    // Hitung skor terbaik terbaru dari koleksi Skor agar akurat terhadap riwayat
    let skorTerbaikCount = pengguna.skorTerbaik || 0;
    try {
      const top = await Skor.findOne({ idPengguna: pengguna._id }).sort({ skor: -1 }).select('skor').lean();
      if (top && typeof top.skor === 'number') skorTerbaikCount = top.skor;
    } catch (errBest) {
      console.warn('⚠️ Gagal menghitung skor terbaik dari koleksi Skor:', errBest && errBest.message);
      skorTerbaikCount = pengguna.skorTerbaik || 0;
    }

    // Sinkronkan dokumen pengguna jika berbeda (upaya terbaik, non-blocking)
    try {
      if (typeof pengguna.skorTerbaik !== 'number' || pengguna.skorTerbaik !== skorTerbaikCount) {
        pengguna.skorTerbaik = skorTerbaikCount;
        pengguna.save().catch(err => console.warn('⚠️ Gagal memperbarui skorTerbaik pada dokumen pengguna:', err && err.message));
      }
    } catch (e) {
      // ignore
    }

    res.json({
      sukses: true,
      data: {
        id: pengguna._id,
        namaLengkap: pengguna.namaLengkap,
        email: pengguna.email,
        skorTerbaik: skorTerbaikCount,
        totalPermainan: totalPermainanCount,
        tanggalDaftar: pengguna.tanggalDaftar,
        terakhirLogin: pengguna.terakhirLogin
      }
    });
  } catch (error) {
    console.error('❌ Error saat mengambil profil:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat mengambil profil',
      error: error.message
    });
  }
};

/**
 * Dapatkan riwayat skor pengguna
 * GET /api/riwayat-skor
 */
const dapatkanRiwayatSkor = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Anda harus login terlebih dahulu'
      });
    }

    const dbStatus = mongoose.connection.readyState;
    if (dbStatus !== 1) {
      await hubungkanMongoDB();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ sukses: false, pesan: 'Database tidak tersedia. Pastikan variabel environment MongoDB sudah diatur.' });
      }
    }

    const riwayat = await Skor.find({ idPengguna: req.session.userId })
      .sort({ tanggalMain: -1 })
      .limit(200)
      .select('tingkatKesulitan waktuPenyelesaian skor tanggalMain apakahSelesai')
      .lean();

    // Pastikan selalu mengembalikan array (bukan null)
    res.json({ sukses: true, data: riwayat || [] });
  } catch (error) {
    console.error('❌ Error saat mengambil riwayat skor:', error);
    const payload = {
      sukses: false,
      pesan: 'Terjadi kesalahan saat mengambil riwayat skor',
      error: error.message
    };
    if (process.env.NODE_ENV !== 'production') {
      payload.stack = error.stack;
    }
    res.status(500).json(payload);
  }
};

// Debug: cek jumlah skor pengguna (untuk verifikasi di deploy)
const debugRiwayat = async (req, res) => {
  try {
    if (!req.session.userId) return res.json({ sukses: false, pesan: 'Tidak ada session' });
    const dbStatus = mongoose.connection.readyState;
    if (dbStatus !== 1) {
      await hubungkanMongoDB();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ sukses: false, pesan: 'Database tidak tersedia. Pastikan variabel environment MongoDB sudah diatur.' });
      }
    }
    const total = await Skor.countDocuments({ idPengguna: req.session.userId });
    res.json({ sukses: true, total });
  } catch (e) {
    res.status(500).json({ sukses: false, pesan: e.message });
  }
};

module.exports = {
  registerPengguna,
  loginPengguna,
  logoutPengguna,
  cekStatusLogin,
  dapatkanProfil,
  dapatkanRiwayatSkor
  ,debugRiwayat
};
