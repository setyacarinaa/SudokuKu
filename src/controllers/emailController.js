/**
 * emailController.js
 * Controller untuk testing email
 */

const { testKoneksiEmail, kirimEmailSelamatDatang } = require('../services/emailService');

/**
 * Test koneksi email
 * GET /api/test-email
 */
const testEmail = async (req, res) => {
  try {
    const hasil = await testKoneksiEmail();

    if (hasil.sukses) {
      res.json({
        sukses: true,
        pesan: 'Koneksi email berhasil!'
      });
    } else {
      res.status(500).json({
        sukses: false,
        pesan: 'Koneksi email gagal',
        error: hasil.error
      });
    }
  } catch (error) {
    console.error('❌ Error test email:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat test email',
      error: error.message
    });
  }
};

/**
 * Kirim email test
 * POST /api/kirim-email-test
 * Body: { email, nama }
 */
const kirimEmailTest = async (req, res) => {
  try {
    const { email, nama } = req.body;

    if (!email || !nama) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Email dan nama wajib diisi'
      });
    }

    const hasil = await kirimEmailSelamatDatang(email, nama);

    if (hasil.sukses) {
      res.json({
        sukses: true,
        pesan: 'Email test berhasil dikirim!',
        messageId: hasil.messageId
      });
    } else {
      res.status(500).json({
        sukses: false,
        pesan: 'Gagal mengirim email test',
        error: hasil.error
      });
    }
  } catch (error) {
    console.error('❌ Error kirim email test:', error);
    res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan saat kirim email test',
      error: error.message
    });
  }
};

module.exports = {
  testEmail,
  kirimEmailTest
};
