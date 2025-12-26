/**
 * appController.js
 * Controller untuk pendaftaran pengguna baru dan pengiriman email selamat datang
 * Menggunakan Resend Email API
 */

const Pengguna = require('../models/Pengguna');
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const { EMAIL, PASSWORD } = require('../../env.js');

// Nodemailer transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL,
    pass: PASSWORD
  }
});

// Mailgen configuration
const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'SudokuKu',
    link: 'http://localhost:3000'
  }
});

/**
 * registerUser
 * POST /api/auth/register
 * Body: { namaLengkap, email, password }
 */
const registerUser = async (req, res) => {
  try {
    const { namaLengkap, email, password } = req.body;

    if (!namaLengkap || !email || !password) {
      return res.status(400).json({ sukses: false, pesan: 'Nama, email, dan password wajib diisi' });
    }

    // Cek apakah email sudah terdaftar
    const existing = await Pengguna.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ sukses: false, pesan: 'Email sudah terdaftar' });
    }

    // Buat instance pengguna baru
    const pengguna = new Pengguna({
      namaLengkap: namaLengkap.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    // Simpan ke database
    await pengguna.save();

    // Auto-login: simpan session agar pengguna langsung masuk setelah registrasi
    try {
      if (req && req.session) {
        req.session.userId = pengguna._id;
        req.session.namaLengkap = pengguna.namaLengkap;
      }
    } catch (sessErr) {
      console.warn('Gagal menyimpan session setelah registrasi:', sessErr);
    }

    // Siapkan konten email menggunakan Mailgen
    const emailBody = {
      body: {
        name: pengguna.namaLengkap,
        intro: 'Selamat datang di SudokuKu! Akun kamu berhasil dibuat.',
        action: {
          instructions: 'Silakan mulai bermain Sudoku dan asah kemampuan logikamu.',
          button: {
            color: '#22BC66',
            text: 'Mulai Bermain',
            link: 'https://sudoku-ku-kelompok1.vercel.app/'
          }
        },
        outro: 'Terima kasih telah bergabung dan selamat bermain 🧩'
      }
    };

    const emailHtml = mailGenerator.generate(emailBody);

    // Kirim email via Nodemailer (SMTP Gmail)
    try {
      await transporter.sendMail({
        from: EMAIL,
        to: pengguna.email,
        subject: 'Selamat Datang di SudokuKu 🎉',
        html: emailHtml
      });

      return res.status(201).json({ sukses: true, pesan: 'Registrasi berhasil dan email sapaan berhasil dikirim', pengguna: pengguna.toJSON() });
    } catch (mailErr) {
      console.error('Error saat mengirim email sapaan:', mailErr);
      return res.status(500).json({ sukses: false, pesan: 'Registrasi berhasil tetapi pengiriman email gagal', error: String(mailErr) });
    }

  } catch (error) {
    console.error('Error registerUser:', error);
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ sukses: false, pesan: error.message });
    }
    return res.status(500).json({ sukses: false, pesan: 'Terjadi kesalahan saat registrasi', error: error.message });
  }
};

module.exports = {
  registerUser
};
