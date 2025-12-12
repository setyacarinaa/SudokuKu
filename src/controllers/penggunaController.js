/**
 * penggunaController.js
 * Controller untuk autentikasi dan manajemen pengguna
 */

const Pengguna = require('../models/Pengguna');
const { kirimEmailSelamatDatang } = require('../services/emailService');

/**
 * Registrasi pengguna baru
 * POST /api/register
 * Body: { namaLengkap, email, password }
 */
const registerPengguna = async (req, res) => {
  try {
    const { namaLengkap, email, password } = req.body;

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

    // Cek apakah email sudah terdaftar
    const penggunaAda = await Pengguna.findOne({ email: email.toLowerCase() });
    if (penggunaAda) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Email sudah terdaftar. Gunakan email lain atau login.'
      });
    }

    // Buat pengguna baru
    const penggunaBaru = new Pengguna({
      namaLengkap: namaLengkap,
      email: email.toLowerCase(),
      password: password // Password akan di-hash otomatis oleh pre-save middleware
    });

    await penggunaBaru.save();

    console.log(`✅ Pengguna baru berhasil didaftarkan: ${email}`);

    // Kirim email selamat datang (async, tidak menunggu)
    try {
      await kirimEmailSelamatDatang(email, namaLengkap);
    } catch (emailError) {
      console.error('Error mengirim email selamat datang:', emailError);
      // Lanjutkan meskipun email gagal
    }

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
    console.error('❌ Error saat registrasi:', error);

    // Handle duplicate key error dari MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Email sudah terdaftar'
      });
    }

    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat registrasi',
      error: error.message
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

    res.json({
      sukses: true,
      data: {
        id: pengguna._id,
        namaLengkap: pengguna.namaLengkap,
        email: pengguna.email,
        skorTerbaik: pengguna.skorTerbaik,
        totalPermainan: pengguna.totalPermainan
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
    // Hapus session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error saat logout:', err);
        return res.status(500).json({
          sukses: false,
          pesan: 'Terjadi kesalahan saat logout'
        });
      }

      res.json({
        sukses: true,
        pesan: 'Logout berhasil'
      });
    });
  } catch (error) {
    console.error('❌ Error saat logout:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat logout',
      error: error.message
    });
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

    res.json({
      sudahLogin: true,
      data: {
        id: pengguna._id,
        namaLengkap: pengguna.namaLengkap,
        email: pengguna.email,
        skorTerbaik: pengguna.skorTerbaik,
        totalPermainan: pengguna.totalPermainan
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

    const pengguna = await Pengguna.findById(req.session.userId);
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan'
      });
    }

    res.json({
      sukses: true,
      data: {
        id: pengguna._id,
        namaLengkap: pengguna.namaLengkap,
        email: pengguna.email,
        skorTerbaik: pengguna.skorTerbaik,
        totalPermainan: pengguna.totalPermainan,
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

module.exports = {
  registerPengguna,
  loginPengguna,
  logoutPengguna,
  cekStatusLogin,
  dapatkanProfil
};
