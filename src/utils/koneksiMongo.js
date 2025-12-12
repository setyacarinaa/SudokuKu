/**
 * koneksiMongo.js
 * Utility untuk menghubungkan aplikasi ke MongoDB menggunakan Mongoose
 */

const mongoose = require('mongoose');

/**
 * Fungsi untuk menghubungkan ke MongoDB
 * @returns {Promise} Promise yang resolve ketika koneksi berhasil
 */
const hubungkanMongoDB = async () => {
  try {
    // Ambil connection string dari environment variable
    const uriMongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/sudokuku';
    
    // Opsi koneksi MongoDB
    const opsiKoneksi = {
      // useNewUrlParser dan useUnifiedTopology sudah default di Mongoose 6+
      // Tidak perlu ditambahkan lagi
    };

    // Hubungkan ke MongoDB
    await mongoose.connect(uriMongo, opsiKoneksi);
    
    console.log('✅ MongoDB berhasil terhubung!');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    // Event listener untuk error koneksi
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error koneksi MongoDB:', err);
    });

    // Event listener untuk disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB terputus!');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ Gagal terhubung ke MongoDB:', error.message);
    // Keluar dari proses jika koneksi gagal
    process.exit(1);
  }
};

/**
 * Fungsi untuk menutup koneksi MongoDB
 * @returns {Promise} Promise yang resolve ketika koneksi ditutup
 */
const tutupKoneksi = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB koneksi ditutup');
  } catch (error) {
    console.error('Error saat menutup koneksi MongoDB:', error);
  }
};

module.exports = {
  hubungkanMongoDB,
  tutupKoneksi
};
