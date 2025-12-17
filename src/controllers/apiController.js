/**
 * apiController.js
 * Controller untuk API umum dan skor
 */

const Skor = require('../models/Skor');
const Pengguna = require('../models/Pengguna');
const { kirimEmailSkorTerbaik } = require('../services/emailService');

/**
 * Rekam skor permainan
 * POST /api/rekam-skor
 * Body: { waktuPenyelesaian, tingkatKesulitan }
 */
const rekamSkor = async (req, res) => {
  try {
    // Cek apakah user sudah login
    if (!req.session.userId) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Anda harus login terlebih dahulu'
      });
    }

    const { waktuPenyelesaian, tingkatKesulitan } = req.body;

    // Validasi input
    if (!waktuPenyelesaian || !tingkatKesulitan) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Waktu penyelesaian dan tingkat kesulitan wajib diisi'
      });
    }

    // Validasi tingkat kesulitan
    const tingkatValid = ['mudah', 'sedang', 'sulit'];
    if (!tingkatValid.includes(tingkatKesulitan.toLowerCase())) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Tingkat kesulitan tidak valid'
      });
    }

    // Ambil data pengguna
    const pengguna = await Pengguna.findById(req.session.userId);
    if (!pengguna) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengguna tidak ditemukan'
      });
    }

    // Hitung skor
    const skor = Skor.hitungSkor(waktuPenyelesaian, tingkatKesulitan);

    // Simpan skor ke database
    const skorBaru = new Skor({
      idPengguna: pengguna._id,
      namaPengguna: pengguna.namaLengkap,
      tingkatKesulitan: tingkatKesulitan,
      waktuPenyelesaian: waktuPenyelesaian,
      skor: skor,
      apakahSelesai: true
    });

    await skorBaru.save();

    // Update total permainan dan skor terbaik pengguna
    pengguna.totalPermainan += 1;
    if (skor > pengguna.skorTerbaik) {
      const skorSebelumnya = pengguna.skorTerbaik;
      pengguna.skorTerbaik = skor;
      await pengguna.save();

      // Kirim email jika ada rekor baru dan bukan skor pertama
      if (skorSebelumnya > 0) {
        try {
          await kirimEmailSkorTerbaik(
            pengguna.email,
            pengguna.namaLengkap,
            skor,
            waktuPenyelesaian,
            tingkatKesulitan
          );
        } catch (emailError) {
          console.error('Error mengirim email skor terbaik:', emailError);
          // Lanjutkan meskipun email gagal
        }
      }
    } else {
      await pengguna.save();
    }

    console.log(`✅ Skor berhasil direkam: ${pengguna.namaLengkap} - ${skor} poin`);

    res.json({
      sukses: true,
      data: {
        skor: skor,
        waktuPenyelesaian: waktuPenyelesaian,
        tingkatKesulitan: tingkatKesulitan,
        rekorBaru: skor > skorSebelumnya
      },
      pesan: 'Skor berhasil disimpan!'
    });
  } catch (error) {
    console.error('❌ Error saat merekam skor:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat menyimpan skor',
      error: error.message
    });
  }
};

/**
 * Dapatkan leaderboard
 * GET /api/leaderboard?limit=10&tingkat=sedang
 * PUBLIK - Tidak perlu login
 */
const dapatkanLeaderboard = async (req, res) => {
  try {
    console.log('🎯 [Leaderboard] Request diterima dari:', req.headers['user-agent']);
    console.log('🎯 [Leaderboard] Session:', req.session ? 'ada' : 'tidak ada');
    console.log('🎯 [Leaderboard] Query params:', req.query);
    
    // Batasi maksimal 10 entri agar tetap global dan ringan
    const batasReq = parseInt(req.query.limit) || 10;
    const batas = Math.min(10, Math.max(1, batasReq));
    const tingkat = req.query.tingkat;

    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ [Leaderboard] MongoDB belum terhubung, mengembalikan data kosong');
      return res.json({
        sukses: true,
        data: [],
        total: 0,
        pesan: 'Leaderboard kosong - database sedang connecting'
      });
    }

    // Build query - hanya ambil skor yang selesai
    let kueri = { apakahSelesai: true };
    if (tingkat && ['mudah', 'sedang', 'sulit'].includes(tingkat.toLowerCase())) {
      kueri.tingkatKesulitan = tingkat.toLowerCase();
    }

    console.log(`🔍 Querying leaderboard dengan kueri:`, kueri);
    console.log(`🔍 Batas data: ${batas}`);

    // Ambil skor terbaik
    const daftarSkor = await Skor.find(kueri)
      .sort({ skor: -1, waktuPenyelesaian: 1 }) // Sort by skor DESC, waktu ASC
      .limit(batas)
      .populate('idPengguna', 'namaLengkap email')
      .lean();

    console.log(`📊 Ditemukan ${daftarSkor.length} skor dari database`);
    
    // Debug: log jika kosong
    if (daftarSkor.length === 0) {
      const totalCount = await Skor.countDocuments({});
      const selesaiCount = await Skor.countDocuments({ apakahSelesai: true });
      console.log(`⚠️ [Leaderboard] Data kosong! Total docs: ${totalCount}, Selesai: ${selesaiCount}`);
    }

    // Jika database terhubung tetapi tidak ada data, coba fallback ke file lokal
    if ((daftarSkor.length === 0) || !daftarSkor) {
      try {
        const fs = require('fs');
        const path = require('path');
        const fallbackPath = path.join(__dirname, '../../public/data/leaderboard.json');
        if (fs.existsSync(fallbackPath)) {
          const raw = fs.readFileSync(fallbackPath, 'utf8');
          const fallback = JSON.parse(raw);
          if (fallback && Array.isArray(fallback) && fallback.length > 0) {
            console.log('🔁 [Leaderboard] Returning fallback JSON data');
            return res.json({ sukses: true, data: fallback.slice(0, batas), total: fallback.length, pesan: 'Fallback leaderboard data' });
          }
        }
      } catch (readErr) {
        console.error('❌ [Leaderboard] Error reading fallback file:', readErr.message);
      }
    }

    // Format response
    const papanPeringkat = daftarSkor.map((entri, indeks) => ({
      peringkat: indeks + 1,
      namaPengguna: entri.namaPengguna,
      skor: entri.skor,
      waktuPenyelesaian: entri.waktuPenyelesaian,
      tingkatKesulitan: entri.tingkatKesulitan,
      tanggalMain: entri.tanggalMain
    }));

    // Set CORS headers explicitly untuk serverless
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.json({
      sukses: true,
      data: papanPeringkat,
      total: papanPeringkat.length,
      pesan: 'Leaderboard berhasil diambil'
    });

    console.log(`✅ [Leaderboard] Berhasil dikirim (${papanPeringkat.length} entri)`);
  } catch (error) {
    console.error('❌ [Leaderboard] Error:', error.message);
    console.error('❌ [Leaderboard] Stack:', error.stack);
    console.error('❌ [Leaderboard] Error name:', error.name);
    
    // Return empty data instead of error for better UX
    res.json({
      sukses: true,
      data: [],
      total: 0,
      pesan: 'Leaderboard tidak tersedia saat ini',
      debug: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

/**
 * Dapatkan statistik pengguna
 * GET /api/statistik
 */
const dapatkanStatistik = async (req, res) => {
  try {
    // Cek apakah user sudah login
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

    // Ambil statistik skor
    const totalPermainan = await Skor.countDocuments({ idPengguna: pengguna._id });
    const rataRataSkor = await Skor.aggregate([
      { $match: { idPengguna: pengguna._id } },
      { $group: { _id: null, avg: { $avg: '$skor' } } }
    ]);

    const skorTerbaik = await Skor.findOne({ idPengguna: pengguna._id })
      .sort({ skor: -1 })
      .lean();

    res.json({
      sukses: true,
      data: {
        namaLengkap: pengguna.namaLengkap,
        email: pengguna.email,
        totalPermainan: totalPermainan,
        skorTerbaik: skorTerbaik ? skorTerbaik.skor : 0,
        rataRataSkor: rataRataSkor.length > 0 ? Math.round(rataRataSkor[0].avg) : 0,
        tanggalDaftar: pengguna.tanggalDaftar
      },
      pesan: 'Statistik berhasil diambil'
    });
  } catch (error) {
    console.error('❌ Error saat mengambil statistik:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat mengambil statistik',
      error: error.message
    });
  }
};

module.exports = {
  rekamSkor,
  dapatkanLeaderboard,
  dapatkanStatistik
};
