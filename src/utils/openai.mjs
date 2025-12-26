import OpenAI from "openai";
import url from 'url';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * getGPTResponse
 * Calls OpenAI Responses API using model gpt-5-nano and returns plain text.
 * Throws if OPENAI_API_KEY is not set or request fails.
 */
export async function getGPTResponse(userMessage) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY belum dikonfigurasi di environment');
  }

  const systemPrompt = `Kamu adalah chatbot asisten untuk aplikasi web Sudoku. Berikan jawaban singkat, jelas, dan bantu pengguna menyelesaikan tugas terkait permainan, hint, validasi papan, atau penjelasan langkah.`;

  const response = await client.responses.create({
    model: 'gpt-5-nano',
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: String(userMessage) }
    ],
  });

  // SDK may expose plain text or structured output. Try common locations.
  try {
    if (response.output_text && typeof response.output_text === 'string') {
      return response.output_text;
    }

    if (Array.isArray(response.output) && response.output.length > 0) {
      // Join textual pieces from output[].content which may be array of segments
      const parts = response.output.map(entry => {
        if (!entry) return '';
        const c = entry.content;
        if (!c) return '';
        if (typeof c === 'string') return c;
        if (Array.isArray(c)) return c.map(seg => seg?.text || seg?.content || '').join('');
        return '';
      }).filter(Boolean);

      if (parts.length > 0) return parts.join('\n');
    }
  } catch (e) {
    // parsing fallback
  }

  // Fallback: stringify response object
  try { return JSON.stringify(response); } catch (e) { return String(response); }
}
