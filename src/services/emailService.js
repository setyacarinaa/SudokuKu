/**
 * emailService.js
 * Service untuk mengirim email menggunakan Nodemailer
 */

const nodemailer = require('nodemailer');

/**
 * Buat transporter email menggunakan konfigurasi dari environment
 * @returns {Object} Nodemailer transporter
 */
const buatTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true untuk port 465, false untuk port lain
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Kirim email selamat datang ke pengguna baru
 * @param {String} emailTujuan - Email penerima
 * @param {String} namaPengguna - Nama pengguna
 * @returns {Promise} Promise hasil pengiriman email
 */
const kirimEmailSelamatDatang = async (emailTujuan, namaPengguna) => {
  try {
    const transporter = buatTransporter();

    const isiEmail = {
      from: `"SudokuKu" <${process.env.EMAIL_USER}>`,
      to: emailTujuan,
      subject: '🎉 Selamat Datang di SudokuKu!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 SudokuKu</h1>
              <p>Platform Permainan Sudoku Terbaik</p>
            </div>
            <div class="content">
              <h2>Selamat Datang, ${namaPengguna}! 👋</h2>
              <p>Terima kasih telah bergabung dengan SudokuKu. Kami senang kamu menjadi bagian dari komunitas pecinta Sudoku kami!</p>
              
              <h3>Apa yang bisa kamu lakukan?</h3>
              <ul>
                <li>🎯 Bermain Sudoku dengan 3 tingkat kesulitan</li>
                <li>💬 Dapatkan bantuan dari chatbot realtime</li>
                <li>🏆 Bersaing di leaderboard global</li>
                <li>⏱️ Pecahkan rekor waktu terbaikmu</li>
              </ul>

              <p>Yuk mulai bermain sekarang!</p>
              <a href="${process.env.BASE_URL || 'http://localhost:3000'}" class="button">Mulai Bermain</a>

              <p>Selamat bermain dan semoga beruntung! 🍀</p>
              
              <p>Salam hangat,<br><strong>Tim SudokuKu</strong></p>
            </div>
            <div class="footer">
              <p>Email ini dikirim otomatis. Jangan balas email ini.</p>
              <p>&copy; 2025 SudokuKu. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(isiEmail);
    console.log('✅ Email selamat datang berhasil dikirim ke:', emailTujuan);
    return { sukses: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error mengirim email selamat datang:', error.message);
    return { sukses: false, error: error.message };
  }
};

/**
 * Kirim email notifikasi skor terbaik
 * @param {String} emailTujuan - Email penerima
 * @param {String} namaPengguna - Nama pengguna
 * @param {Number} skor - Skor yang dicapai
 * @param {Number} waktu - Waktu penyelesaian (detik)
 * @param {String} tingkat - Tingkat kesulitan
 * @returns {Promise} Promise hasil pengiriman email
 */
const kirimEmailSkorTerbaik = async (emailTujuan, namaPengguna, skor, waktu, tingkat) => {
  try {
    const transporter = buatTransporter();

    const menit = Math.floor(waktu / 60);
    const detik = waktu % 60;
    const waktuFormat = `${menit} menit ${detik} detik`;

    const isiEmail = {
      from: `"SudokuKu" <${process.env.EMAIL_USER}>`,
      to: emailTujuan,
      subject: '🏆 Selamat! Kamu Memecahkan Rekor Baru!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .stats { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .stat-label { font-weight: bold; color: #667eea; }
            .trophy { font-size: 60px; text-align: center; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎊 Pencapaian Baru!</h1>
            </div>
            <div class="content">
              <div class="trophy">🏆</div>
              <h2 style="text-align: center;">Selamat, ${namaPengguna}!</h2>
              <p style="text-align: center;">Kamu telah memecahkan rekor pribadi baru!</p>
              
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-label">Tingkat Kesulitan:</span>
                  <span>${tingkat.toUpperCase()}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Waktu Penyelesaian:</span>
                  <span>${waktuFormat}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Skor:</span>
                  <span>${skor} poin</span>
                </div>
              </div>

              <p>Luar biasa! Terus tingkatkan kemampuanmu dan raih posisi teratas di leaderboard!</p>
              
              <center>
                <a href="${process.env.BASE_URL || 'http://localhost:3000'}/leaderboard" class="button">Lihat Leaderboard</a>
              </center>

              <p>Tetap semangat dan tingkatkan terus rekormu! 🚀</p>
              
              <p>Salam bangga,<br><strong>Tim SudokuKu</strong></p>
            </div>
            <div class="footer">
              <p>Email ini dikirim otomatis. Jangan balas email ini.</p>
              <p>&copy; 2025 SudokuKu. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(isiEmail);
    console.log('✅ Email skor terbaik berhasil dikirim ke:', emailTujuan);
    return { sukses: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error mengirim email skor terbaik:', error.message);
    return { sukses: false, error: error.message };
  }
};

/**
 * Test koneksi email
 * @returns {Promise} Promise hasil test koneksi
 */
const testKoneksiEmail = async () => {
  try {
    const transporter = buatTransporter();
    await transporter.verify();
    console.log('✅ Koneksi email server berhasil!');
    return { sukses: true };
  } catch (error) {
    console.error('❌ Koneksi email server gagal:', error.message);
    return { sukses: false, error: error.message };
  }
};

module.exports = {
  kirimEmailSelamatDatang,
  kirimEmailSkorTerbaik,
  testKoneksiEmail
};
