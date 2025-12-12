const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Test koneksi dengan error detail
router.get('/test-connect', async (req, res) => {
  try {
    const uri = process.env.MONGODB_URI;
    
    console.log('=== CONNECTION TEST ===');
    console.log('URI exists:', !!uri);
    console.log('URI length:', uri ? uri.length : 0);
    console.log('Current readyState:', mongoose.connection.readyState);
    
    if (!uri) {
      return res.status(500).json({ 
        error: 'MONGODB_URI not found',
        env_keys: Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB'))
      });
    }
    
    // Try direct connection (bukan reuse)
    console.log('Attempting direct connection...');
    
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      family: 4,
      maxPoolSize: 2,
    });
    
    console.log('✅ Connection successful!');
    
    // Test ping
    const adminDb = conn.connection.db.admin();
    await adminDb.ping();
    console.log('✅ Ping successful!');
    
    res.json({
      success: true,
      message: 'MongoDB Atlas connection successful!',
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState
    });
    
  } catch (error) {
    console.error('❌ Connection error:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    res.status(500).json({
      error: 'Connection failed',
      message: error.message,
      code: error.code,
      name: error.name,
      fullError: error.toString()
    });
  }
});

module.exports = router;
