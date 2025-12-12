const express = require('express');
const router = express.Router();
const { prosesPesanChatbot } = require('../services/chatbotService');

// POST /api/chatbot
// body: { pesan: string, dataPuzzle?: { papan, solusi } }
router.post('/', (req, res) => {
  const { pesan, dataPuzzle } = req.body || {};
  const respons = prosesPesanChatbot(pesan, dataPuzzle || null);
  return res.json(respons);
});

module.exports = router;
