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
    const opsi = { fromQuick: !!(req.body && req.body.quick) };

    // Hint usage limit (HTTP fallback)
    const pesanLower = (pesan || '').toLowerCase();
    const isMetaSelain = /\b(selain|kecuali|apa selain|apa lagi|lainnya|selain ngasih)\b/.test(pesanLower);
    const menyebutHint = /\b(hint|petunjuk|bantuan)\b/.test(pesanLower);
    const isHint = (menyebutHint && (!isMetaSelain || opsi.fromQuick));

    if (isHint) {
      req.session.hintsUsed = req.session.hintsUsed || 0;
      if (req.session.hintsUsed >= 3) {
        return res.json({ tipe: 'error', pesan: '⚠️ Batas penggunaan hint (3x) telah tercapai.' });
      }
      req.session.hintsUsed += 1;
      try { req.session.save(() => {}); } catch (e) { /* ignore */ }
    }

    const hasil = await Promise.resolve(prosesPesanChatbot(pesan || '', dataUntukChatbot, opsi));

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

    // Jika local mengembalikan solusi, tandai session agar tidak bisa submit skor
    if (hasil && hasil.tipe === 'solusi') {
      req.session.solutionShown = true;
      try { req.session.save(() => {}); } catch (e) { /* ignore */ }
    }

    return res.json(hasil);
  } catch (err) {
    console.error('Chatbot HTTP error:', err);
    return res.json({ tipe: 'error', pesan: `❌ Error chatbot: ${err.message}` });
  }
});

module.exports = rute;
