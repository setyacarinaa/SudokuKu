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
    // Ambil connection string dari environment variable (coba beberapa nama umum)
    const envCandidates = [
      'MONGODB_URI',
      'MONGODB_ATLAS_URI',
      'MONGODB_ATLAS',
      'MONGO_URI',
      'MONGO_URL',
      'MONGODB_LOCAL',
      'DATABASE_URL'
    ];

    let uriMongo = null;
    let detectedVar = null;
    for (const name of envCandidates) {
      if (process.env[name]) {
        uriMongo = process.env[name];
        detectedVar = name;
        break;
      }
    }

    if (!uriMongo) {
      throw new Error('Tidak menemukan connection string MongoDB. Set salah satu env vars: ' + envCandidates.join(', '));
    }
    console.log('Menggunakan env var untuk MongoDB:', detectedVar);

    // Jika user ingin memaksa nama database yang sama untuk semua environment,
    // mereka bisa set env var `MONGODB_DB`. Kita akan mengganti/menambahkan nama DB pada URI.
    const namaDbOverride = process.env.MONGODB_DB;
    if (namaDbOverride) {
      try {
        // Pisahkan query string jika ada
        const [base, query] = uriMongo.split('?');
        // Jika base belum memiliki nama database (endsWith host/port) atau memiliki nama 'test', ganti atau tambahkan
        const slashIndex = base.indexOf('/', base.indexOf('://') + 3);
        let newBase;
        if (slashIndex === -1) {
          // Tidak ada slash setelah host; tambahkan
          newBase = base + '/' + namaDbOverride;
        } else {
          // Ganti path (nama DB) dengan namaDbOverride
          const beforePath = base.slice(0, slashIndex + 1); // termasuk '/'
          newBase = beforePath + namaDbOverride;
        }
        uriMongo = query ? `${newBase}?${query}` : newBase;
        console.log('Menggunakan override nama database dari MONGODB_DB:', namaDbOverride);
      } catch (e) {
        console.warn('Gagal menerapkan MONGODB_DB override, menggunakan URI asli');
      }
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
