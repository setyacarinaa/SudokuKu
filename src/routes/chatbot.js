const express = require('express');
const rute = express.Router();
const { prosesPesanChatbot } = require('../services/chatbotService');

// POST /api/chatbot
// body: { pesan: string, dataPuzzle?: { papan, solusi } }
rute.post('/', async (req, res) => {
  const { pesan, dataTekaTeki, dataPuzzle } = req.body || {};
  // Gunakan body atau session jika tersedia
  const dariBody = dataTekaTeki || dataPuzzle || null;
  const dariSession = req.session && req.session.tekaTekiAktif ? req.session.tekaTekiAktif : null;
  const dataUntukChatbot = dariBody || dariSession;

  try {
    const hasil = await Promise.resolve(prosesPesanChatbot(pesan || '', dataUntukChatbot));

    // Jika local tidak mengenal perintah, dan OpenAI tersedia, gunakan OpenAI sebagai fallback
    if (hasil && hasil.tipe === 'unknown' && process.env.OPENAI_API_KEY) {
      try {
        const mod = await import('../utils/openai.mjs');
        const aiText = await mod.getGPTResponse(pesan || '');
        return res.json({ tipe: 'ai', pesan: aiText });
      } catch (e) {
        console.error('OpenAI fallback error:', e);
        return res.json({ tipe: 'error', pesan: '❌ AI eksternal gagal merespons.' });
      }
    }

    return res.json(hasil);
  } catch (err) {
    console.error('Chatbot HTTP error:', err);
    return res.json({ tipe: 'error', pesan: `❌ Error chatbot: ${err.message}` });
  }
});

module.exports = rute;
