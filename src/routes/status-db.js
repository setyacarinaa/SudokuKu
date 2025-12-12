const express = require('express');
const mongoose = require('mongoose');
const rute = express.Router();

// Endpoint ringkas untuk status database
rute.get('/status-db', async (req, res) => {
  try {
    const siap = mongoose.connection.readyState === 1;
    const info = {
      siap,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || null,
      namaBasisData: mongoose.connection.name || null,
      waktu: new Date().toISOString()
    };

    if (siap) {
      return res.json({ sukses: true, info });
    }
    return res.status(503).json({ sukses: false, info, pesan: 'Database belum terhubung' });
  } catch (error) {
    return res.status(500).json({ sukses: false, pesan: 'Gagal mendapatkan status DB', error: error.message });
  }
});

module.exports = rute;
