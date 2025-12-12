/**
 * src/routes/test-direct-connection.js
 * Direct MongoDB connection test with detailed diagnostics
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/test-direct-connect', async (req, res) => {
  try {
    console.log('\n═══════════════════════════════════════');
    console.log('🔍 DIRECT CONNECTION TEST');
    console.log('═══════════════════════════════════════');
    
    // Cek environment variable
    const mongoUri = process.env.MONGODB_URI;
    console.log('✓ MONGODB_URI found:', !!mongoUri);
    console.log('✓ URI length:', mongoUri?.length);
    
    // Show partial URI (hide password)
    if (mongoUri) {
      const uriParts = mongoUri.split(':');
      const hiddenUri = mongoUri.replace(/:[^:]+@/, ':****@');
      console.log('✓ URI (hidden password):', hiddenUri);
    }
    
    // Check current mongoose connection state
    console.log('\n--- Current Mongoose State ---');
    console.log('readyState:', mongoose.connection.readyState, '(0=disconnected, 1=connected)');
    console.log('host:', mongoose.connection.host || 'none');
    console.log('name:', mongoose.connection.name || 'none');
    
    // Attempt fresh connection
    console.log('\n--- Attempting Direct Connection ---');
    console.log('Timeout: 30000ms, IPv4 only');
    
    const connectionStartTime = Date.now();
    
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 5,
      family: 4, // IPv4 only
      // Explicit connection monitoring
      dbName: 'sudokuku',
    });
    
    const connectionTime = Date.now() - connectionStartTime;
    
    console.log('✅ CONNECTION SUCCESSFUL!');
    console.log('Connection time:', connectionTime + 'ms');
    console.log('Connected to:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    
    // Test a simple query
    console.log('\n--- Testing Query ---');
    const testQuery = await mongoose.connection.db.admin().ping();
    console.log('✅ Ping successful:', testQuery);
    
    // Return success response
    res.json({
      success: true,
      message: 'MongoDB connection successful!',
      diagnostics: {
        connectionTime: connectionTime + 'ms',
        mongooseReadyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ CONNECTION FAILED');
    console.error('Error type:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    // Try to provide more context
    let diagnosis = '';
    if (error.code === 'ENOTFOUND') {
      diagnosis = 'DNS resolution failed - cannot find MongoDB server';
    } else if (error.code === 'ETIMEDOUT') {
      diagnosis = 'Connection timeout - server not responding';
    } else if (error.code === 'ECONNREFUSED') {
      diagnosis = 'Connection refused - server rejected connection';
    } else if (error.message.includes('authentication failed')) {
      diagnosis = 'Authentication failed - check username/password';
    } else if (error.message.includes('IP whitelist')) {
      diagnosis = 'IP not whitelisted in MongoDB Atlas - check whitelist settings';
    }
    
    res.status(500).json({
      success: false,
      message: 'MongoDB connection failed',
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

module.exports = router;
