// Serverless function (Vercel-style) that answers visitor questions about a
// case study using Google Gemini, grounded ONLY in the page content sent from
// the client.
//
// Deploy on Vercel (or Netlify — see note at bottom). Set the environment
// variable GEMINI_API_KEY in your host's dashboard. Never commit the key.
// Get a free key at https://aistudio.google.com/app/apikey
//
// Uses the Gemini REST API via global fetch (Node 18+), so no npm SDK is needed.

const MODEL = 'gemini-2.0-flash';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const project = body.project || 'this project';
    const context = (body.context || '').slice(0, 12000);
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
      res.status(400).json({ error: 'No question provided' });
      return;
    }

    const systemText =
      "You are a warm, concise assistant embedded on Alok Kachhap's UX and product design portfolio. " +
      'Visitors ask you about the case study for the project "' + project + '". ' +
      'Explain things in the clearest, friendliest, most approachable way possible: short paragraphs, plain language, no jargon dumps. ' +
      'Ground every answer ONLY in the case-study context provided below. ' +
      "If the answer isn't in the context, say you don't have that detail and suggest they reach out to Alok at alok.kac@gmail.com. " +
      'Never invent metrics, dates, names, or facts. Speak about Alok in the third person. ' +
      'Keep answers under ~120 words unless the visitor asks for more depth.\n\n' +
      'CASE STUDY CONTEXT (the full text of the page the visitor is reading):\n\n' + context;

    // Map the client's history to Gemini's format (assistant -> model).
    const contents = messages.slice(-10).map(function (m) {
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }]
      };
    });

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      MODEL + ':generateContent?key=' + encodeURIComponent(key);

    const gRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemText }] },
        contents: contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.6 }
      })
    });

    const data = await gRes.json();

    if (!gRes.ok) {
      const msg = (data && data.error && data.error.message) || 'Gemini request failed';
      res.status(502).json({ error: msg });
      return;
    }

    const answer = (((data.candidates || [])[0] || {}).content || {}).parts
      ? data.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('').trim()
      : '';

    if (!answer) {
      res.status(200).json({ answer: "I don't have that detail. You can reach Alok at alok.kac@gmail.com." });
      return;
    }

    res.status(200).json({ answer });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || 'Server error' });
  }
};

// --- Netlify variant ---------------------------------------------------------
// If deploying on Netlify instead, put this file at netlify/functions/ask.js and
// replace `module.exports = async (req, res) => {...}` with:
//
//   exports.handler = async (event) => {
//     if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
//     const { project, context, messages } = JSON.parse(event.body || '{}');
//     ... (same Gemini fetch call, return the answer) ...
//     return { statusCode: 200, body: JSON.stringify({ answer }) };
//   };
//
// and point the client ENDPOINT to '/.netlify/functions/ask'.
