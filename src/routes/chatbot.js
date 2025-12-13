const express = require('express');
const rute = express.Router();
const { prosesPesanChatbot } = require('../services/chatbotService');

// POST /api/chatbot
// body: { pesan: string, dataPuzzle?: { papan, solusi } }
rute.post('/', (req, res) => {
  const { pesan, dataTekaTeki, dataPuzzle } = req.body || {};
  // Gunakan body atau session jika tersedia
  const dariBody = dataTekaTeki || dataPuzzle || null;
  const dariSession = req.session && req.session.tekaTekiAktif ? req.session.tekaTekiAktif : null;
  const dataUntukChatbot = dariBody || dariSession;

  const hasil = prosesPesanChatbot(pesan || '', dataUntukChatbot);
  if (hasil && typeof hasil.then === 'function') {
    hasil.then(r => res.json(r)).catch(err => {
      res.json({ tipe: 'error', pesan: `❌ Error AI: ${err.message}` });
    });
  } else {
    return res.json(hasil);
  }
});

module.exports = rute;
