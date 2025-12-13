/**
 * aiHelper.js
 * Helper untuk integrasi AI (OpenAI/Azure OpenAI) untuk SudokuKu
 */

const fetch = require('node-fetch');

const getAiConfig = () => ({
  provider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
  apiKey: process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || process.env.AZURE_OPENAI_ENDPOINT || 'https://api.openai.com/v1',
  model: process.env.OPENAI_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini'
});

/**
 * Bangun prompt untuk strategi Sudoku berdasarkan papan dan pesan user
 */
function buildSudokuPrompt(pesan, papan) {
  const papanText = Array.isArray(papan)
    ? papan.map(r => r.join(' ')).join('\n')
    : 'Papan tidak tersedia';

  return `Anda adalah asisten Sudoku yang membantu pemain menyelesaikan puzzle.
Berikan strategi langkah-langkah yang jelas, hindari memberikan solusi penuh kecuali diminta kata 'solusi'.

Pesan pengguna: "${pesan}"

Papan (0 berarti kosong):
${papanText}

Instruksi:
- Jika diminta 'hint', berikan satu sel yang aman untuk diisi dan alasannya.
- Jika diminta 'cek jawaban', jelaskan apakah ada konflik yang terlihat.
- Jika diminta 'strategi', jelaskan teknik seperti Single Candidate, Hidden Single, atau Scanning Rows/Columns.
- Jawab ringkas, pakai poin-poin dan jangan memberikan jawaban raw 9x9 kecuali diminta 'solusi'.`;
}

async function callOpenAI(prompt) {
  const cfg = getAiConfig();
  if (!cfg.apiKey) {
    return { ok: false, content: 'AI belum dikonfigurasi. Tambahkan OPENAI_API_KEY atau AZURE_OPENAI_API_KEY.' };
  }

  const url = cfg.provider === 'azure'
    ? `${cfg.baseUrl}/openai/deployments/${cfg.model}/chat/completions?api-version=2024-08-01-preview`
    : `${cfg.baseUrl}/chat/completions`;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (cfg.provider === 'azure') {
    headers['api-key'] = cfg.apiKey;
  } else {
    headers['Authorization'] = `Bearer ${cfg.apiKey}`;
  }

  const body = {
    model: cfg.model,
    messages: [
      { role: 'system', content: 'Anda adalah asisten Sudoku yang membantu pemain dengan strategi dan validasi.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    const txt = await resp.text();
    return { ok: false, content: `Gagal memanggil AI: ${resp.status} ${txt}` };
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || 'Tidak ada respons AI.';
  return { ok: true, content };
}

async function getAiAdvice(pesan, papan) {
  const prompt = buildSudokuPrompt(pesan, papan);
  try {
    const res = await callOpenAI(prompt);
    return res;
  } catch (err) {
    return { ok: false, content: `Error AI: ${err.message}` };
  }
}

module.exports = {
  getAiAdvice
};
