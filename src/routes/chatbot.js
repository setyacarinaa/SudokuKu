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

  const respons = prosesPesanChatbot(pesan || '', dataUntukChatbot);
  return res.json(respons);
});

module.exports = rute;
