const express = require('express');
const rute = express.Router();
const { prosesPesanChatbot } = require('../services/chatbotService');

// POST /api/chatbot
// body: { pesan: string, dataPuzzle?: { papan, solusi } }
rute.post('/', (req, res) => {
  const { pesan, dataTekaTeki, dataPuzzle } = req.body || {};
  const dataUntukChatbot = dataTekaTeki || dataPuzzle || null;
  const respons = prosesPesanChatbot(pesan, dataUntukChatbot);
  return res.json(respons);
});

module.exports = rute;
