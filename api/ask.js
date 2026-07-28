// Serverless function (Vercel-style) that answers visitor questions about a
// case study using Claude, grounded ONLY in the page content sent from the client.
//
// Deploy on Vercel (or Netlify — see note at bottom). Set the environment
// variable ANTHROPIC_API_KEY in your host's dashboard. Never commit the key.

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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

    const system = [
      {
        type: 'text',
        text:
          "You are a warm, concise assistant embedded on Alok Kachhap's UX and product design portfolio. " +
          'Visitors ask you about the case study for the project "' + project + '". ' +
          'Explain things in the clearest, friendliest, most approachable way possible: short paragraphs, plain language, no jargon dumps. ' +
          'Ground every answer ONLY in the case-study context provided below. ' +
          "If the answer isn't in the context, say you don't have that detail and suggest they reach out to Alok at alok.kac@gmail.com. " +
          'Never invent metrics, dates, names, or facts. Speak about Alok in the third person. ' +
          'Keep answers under ~120 words unless the visitor asks for more depth.'
      },
      {
        type: 'text',
        text: 'CASE STUDY CONTEXT (the full text of the page the visitor is reading):\n\n' + context,
        cache_control: { type: 'ephemeral' } // cache the context across a visitor's questions
      }
    ];

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system,
      messages: messages.slice(-10) // keep the last few turns for follow-ups
    });

    const answer = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

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
//     ... (same Claude call) ...
//     return { statusCode: 200, body: JSON.stringify({ answer }) };
//   };
//
// and point the client ENDPOINT to '/.netlify/functions/ask'.
