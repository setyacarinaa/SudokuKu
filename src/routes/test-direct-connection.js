/**
 * src/routes/test-direct-connection.js
 * Tes koneksi langsung MongoDB dengan diagnostik rinci
 */

const express = require('express');
const mongoose = require('mongoose');
const rute = express.Router();

rute.get('/test-direct-connect', async (req, res) => {
  try {
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 TES KONEKSI LANGSUNG');
    console.log('═══════════════════════════════════════');
    
    // Cek environment variable
    const uriMongo = process.env.MONGODB_URI;
    console.log('✓ MONGODB_URI ditemukan:', !!uriMongo);
    console.log('✓ Panjang URI:', uriMongo?.length);
    
    // Show partial URI (hide password)
    if (uriMongo) {
      const uriTersembunyi = uriMongo.replace(/:[^:]+@/, ':****@');
      console.log('✓ URI (password disembunyikan):', uriTersembunyi);
    }
    
    // Check current mongoose connection state
    console.log('\n--- Status Mongoose Saat Ini ---');
    console.log('readyState:', mongoose.connection.readyState, '(0=terputus, 1=terhubung)');
    console.log('host:', mongoose.connection.host || 'tidak ada');
    console.log('nama basis data:', mongoose.connection.name || 'tidak ada');
    
    // Attempt fresh connection
    console.log('\n--- Mencoba Koneksi Langsung ---');
    console.log('Timeout: 30000ms, hanya IPv4');
    
    const waktuMulaiKoneksi = Date.now();
    
    const koneksi = await mongoose.connect(uriMongo, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 5,
      family: 4, // Hanya IPv4
      // Explicit connection monitoring
      dbName: 'sudokuku',
    });
    
    const durasiKoneksi = Date.now() - waktuMulaiKoneksi;
    
    console.log('✅ KONEKSI BERHASIL!');
    console.log('Waktu koneksi:', durasiKoneksi + 'ms');
    console.log('Terhubung ke host:', mongoose.connection.host);
    console.log('Basis data:', mongoose.connection.name);
    
    // Test a simple query
    console.log('\n--- Uji Ping ---');
    const kueriTes = await mongoose.connection.db.admin().ping();
    console.log('✅ Ping berhasil:', kueriTes);
    
    // Return success response
    res.json({
      success: true,
      message: 'Koneksi MongoDB berhasil!',
      diagnostics: {
        durasiKoneksi: durasiKoneksi + 'ms',
        mongooseReadyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ KONEKSI GAGAL');
    console.error('Jenis error:', error.name);
    console.error('Kode error:', error.code);
    console.error('Pesan error:', error.message);
    console.error('Detail lengkap:', JSON.stringify(error, null, 2));
    
    // Try to provide more context
    let diagnosis = '';
    if (error.code === 'ENOTFOUND') {
      diagnosis = 'Resolusi DNS gagal - server MongoDB tidak ditemukan';
    } else if (error.code === 'ETIMEDOUT') {
      diagnosis = 'Koneksi timeout - server tidak merespons';
    } else if (error.code === 'ECONNREFUSED') {
      diagnosis = 'Koneksi ditolak - server menolak sambungan';
    } else if (error.message.includes('authentication failed')) {
      diagnosis = 'Autentikasi gagal - periksa username/password';
    } else if (error.message.includes('IP whitelist')) {
      diagnosis = 'IP tidak di-whitelist di MongoDB Atlas - periksa pengaturan whitelist';
    }
    
    res.status(500).json({
      success: false,
      message: 'Koneksi MongoDB gagal',
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
      },
      diagnosis: diagnosis,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = rute;
