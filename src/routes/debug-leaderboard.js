/**
 * debug-leaderboard.js
 * Routes untuk debug leaderboard data
 */

const express = require('express');
const rute = express.Router();
const Skor = require('../models/Skor');

// Debug: Cek semua data skor
rute.get('/debug-skor', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    console.log('🔍 [Debug] MongoDB status:', mongoose.connection.readyState);
    console.log('🔍 [Debug] Database name:', mongoose.connection.name);
    
    // Count total documents
    const totalCount = await Skor.countDocuments({});
    console.log('🔍 [Debug] Total skor documents:', totalCount);
    
    // Count by apakahSelesai
    const selesaiCount = await Skor.countDocuments({ apakahSelesai: true });
    const belumSelesaiCount = await Skor.countDocuments({ apakahSelesai: false });
    
    console.log('🔍 [Debug] Selesai:', selesaiCount, 'Belum:', belumSelesaiCount);
    
    // Get sample data
    const sampleData = await Skor.find({})
      .limit(5)
      .sort({ skor: -1 })
      .lean();
    
    console.log('🔍 [Debug] Sample data:', JSON.stringify(sampleData, null, 2));
    
    // Get data with apakahSelesai: true
    const selesaiData = await Skor.find({ apakahSelesai: true })
      .limit(10)
      .sort({ skor: -1 })
      .lean();
    
    res.json({
      sukses: true,
      debug: {
        mongoStatus: mongoose.connection.readyState,
        databaseName: mongoose.connection.name,
        collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections) : [],
        totalDocuments: totalCount,
        selesaiCount: selesaiCount,
        belumSelesaiCount: belumSelesaiCount,
        sampleData: sampleData,
        selesaiData: selesaiData
      }
    });
  } catch (error) {
    console.error('❌ [Debug] Error:', error);
    res.status(500).json({
      sukses: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = rute;
