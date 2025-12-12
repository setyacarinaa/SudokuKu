const express = require('express');
const rute = express.Router();
const mongoose = require('mongoose');

// Test koneksi dengan error detail
rute.get('/test-connect', async (req, res) => {
  try {
    const uriKoneksi = process.env.MONGODB_URI;
    
    console.log('=== UJI KONEKSI ===');
    console.log('URI ada:', !!uriKoneksi);
    console.log('Panjang URI:', uriKoneksi ? uriKoneksi.length : 0);
    console.log('Status readyState saat ini:', mongoose.connection.readyState);
    
    if (!uriKoneksi) {
      return res.status(500).json({ 
        error: 'MONGODB_URI tidak ditemukan',
        env_keys: Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB'))
      });
    }
    
    // Coba koneksi langsung (tanpa reuse koneksi lama)
    console.log('Mencoba koneksi langsung...');
    
    const koneksi = await mongoose.connect(uriKoneksi, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      family: 4,
      maxPoolSize: 2,
    });
    
    console.log('✅ Koneksi berhasil!');
    
    // Test ping
    const adminDb = koneksi.connection.db.admin();
    await adminDb.ping();
    console.log('✅ Ping berhasil!');
    
    res.json({
      success: true,
      message: 'Koneksi MongoDB Atlas berhasil!',
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState
    });
    
  } catch (error) {
    console.error('❌ Error koneksi:', error);
    console.error('Jenis error:', error.constructor.name);
    console.error('Kode error:', error.code);
    console.error('Pesan error:', error.message);
    
    res.status(500).json({
      error: 'Koneksi gagal',
      message: error.message,
      code: error.code,
      name: error.name,
      fullError: error.toString()
    });
  }
});

module.exports = rute;
