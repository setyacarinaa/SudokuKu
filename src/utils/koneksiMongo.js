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
    const uriMongo = process.env.MONGODB_URI;
    
    if (!uriMongo) {
      throw new Error('MONGODB_URI tidak ditemukan di environment variables');
    }
    
    // Skip jika sudah terhubung
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB sudah terhubung (reuse connection)');
      return mongoose.connection;
    }
    
    // Opsi koneksi MongoDB untuk serverless
    const opsiKoneksi = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
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
    throw error; // Jangan exit di serverless
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
