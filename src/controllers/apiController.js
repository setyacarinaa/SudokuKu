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
 */
const dapatkanLeaderboard = async (req, res) => {
  try {
    const batas = parseInt(req.query.limit) || 10;
    const tingkat = req.query.tingkat;

    // Build query
    let kueri = {};
    if (tingkat && ['mudah', 'sedang', 'sulit'].includes(tingkat.toLowerCase())) {
      kueri.tingkatKesulitan = tingkat.toLowerCase();
    }

    // Ambil skor terbaik
    const daftarSkor = await Skor.find(kueri)
      .sort({ skor: -1, waktuPenyelesaian: 1 }) // Sort by skor DESC, waktu ASC
      .limit(batas)
      .populate('idPengguna', 'namaLengkap email')
      .lean();

    // Format response
    const papanPeringkat = daftarSkor.map((entri, indeks) => ({
      peringkat: indeks + 1,
      namaPengguna: entri.namaPengguna,
      skor: entri.skor,
      waktuPenyelesaian: entri.waktuPenyelesaian,
      tingkatKesulitan: entri.tingkatKesulitan,
      tanggalMain: entri.tanggalMain
    }));

    res.json({
      sukses: true,
      data: papanPeringkat,
      total: papanPeringkat.length,
      pesan: 'Leaderboard berhasil diambil'
    });

    console.log(`✅ Leaderboard berhasil dikirim (${papanPeringkat.length} entri)`);
  } catch (error) {
    console.error('❌ Error saat mengambil leaderboard:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat mengambil leaderboard',
      error: error.message
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
