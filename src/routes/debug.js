const express = require('express');
const rute = express.Router();
const mongoose = require('mongoose');

// Debug endpoint untuk cek environment dan koneksi
rute.get('/debug', async (req, res) => {
  const diagnostik = {
    timestamp: new Date().toISOString(),
    env_check: {
      MONGODB_URI_exists: !!process.env.MONGODB_URI,
      MONGODB_URI_length: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
      MONGODB_URI_preview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'NOT FOUND',
      SESSION_SECRET_exists: !!process.env.SESSION_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'not set'
    },
    mongoose_status: {
      readyState: mongoose.connection.readyState,
      readyState_text: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
      host: mongoose.connection.host || 'not connected',
      name: mongoose.connection.name || 'not connected'
    }
  };
  
  res.json(diagnostik);
});

// Test koneksi langsung
rute.get('/test-connect', async (req, res) => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return res.status(500).json({ error: 'MONGODB_URI tidak ditemukan' });
    }
    
    // Test ping
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return res.json({ 
        success: true, 
        message: 'MongoDB connected and responding',
        db: mongoose.connection.name
      });
    } else {
      return res.status(503).json({ 
        error: 'MongoDB not connected', 
        readyState: mongoose.connection.readyState 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = rute;
