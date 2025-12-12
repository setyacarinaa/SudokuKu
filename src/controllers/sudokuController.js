/**
 * sudokuController.js
 * Controller untuk menangani logic permainan Sudoku
 */

const { generateSudoku } = require('../services/sudokuGenerator');
const { selesaikanSudoku } = require('../services/sudokuSolver');

/**
 * Dapatkan papan Sudoku baru
 * GET /api/papan?tingkat=sedang
 */
const dapatkanPapanBaru = async (req, res) => {
  try {
    // Ambil tingkat kesulitan dari query parameter (default: sedang)
    const tingkat = req.query.tingkat || 'sedang';

    // Validasi tingkat kesulitan
    const tingkatValid = ['mudah', 'sedang', 'sulit'];
    if (!tingkatValid.includes(tingkat.toLowerCase())) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Tingkat kesulitan tidak valid. Gunakan: mudah, sedang, atau sulit'
      });
    }

    console.log(`📥 Request papan baru dengan tingkat: ${tingkat}`);

    // Generate puzzle baru
    const puzzle = generateSudoku(tingkat);

    // Simpan puzzle dan solusi di session untuk chatbot
    req.session.puzzleAktif = {
      papan: puzzle.papan,
      solusi: puzzle.solusi,
      tingkat: tingkat,
      waktuMulai: Date.now()
    };

    // Kirim response
    res.json({
      sukses: true,
      data: {
        papan: puzzle.papan,
        tingkat: tingkat,
        selKosong: puzzle.selKosong
        // Catatan: solusi tidak dikirim ke client untuk keamanan
        // Solusi disimpan di session untuk validasi
      },
      pesan: `Puzzle ${tingkat} berhasil dibuat!`
    });

    console.log('✅ Papan baru berhasil dikirim ke client');
  } catch (error) {
    console.error('❌ Error saat membuat papan baru:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat membuat papan baru',
      error: error.message
    });
  }
};

/**
 * Selesaikan puzzle Sudoku (untuk testing/admin)
 * POST /api/selesaikan
 * Body: { papan: [[...], [...], ...] }
 */
const selesaikanPuzzle = async (req, res) => {
  try {
    const { papan } = req.body;

    if (!papan || !Array.isArray(papan) || papan.length !== 9) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Papan tidak valid. Harus array 9x9'
      });
    }

    console.log('📥 Request selesaikan puzzle');

    // Selesaikan puzzle
    const solusi = selesaikanSudoku(papan);

    if (!solusi) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Puzzle tidak memiliki solusi'
      });
    }

    res.json({
      sukses: true,
      data: {
        solusi: solusi
      },
      pesan: 'Puzzle berhasil diselesaikan!'
    });

    console.log('✅ Puzzle berhasil diselesaikan');
  } catch (error) {
    console.error('❌ Error saat menyelesaikan puzzle:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat menyelesaikan puzzle',
      error: error.message
    });
  }
};

/**
 * Dapatkan solusi dari puzzle aktif (untuk hint)
 * GET /api/solusi
 */
const dapatkanSolusi = async (req, res) => {
  try {
    // Cek apakah ada puzzle aktif di session
    if (!req.session.puzzleAktif || !req.session.puzzleAktif.solusi) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Tidak ada puzzle aktif. Mulai game baru terlebih dahulu.'
      });
    }

    res.json({
      sukses: true,
      data: {
        solusi: req.session.puzzleAktif.solusi
      },
      pesan: 'Solusi puzzle aktif'
    });
  } catch (error) {
    console.error('❌ Error saat mengambil solusi:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat mengambil solusi',
      error: error.message
    });
  }
};

module.exports = {
  dapatkanPapanBaru,
  selesaikanPuzzle,
  dapatkanSolusi
};
