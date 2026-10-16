export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userInput, email } = req.body;
  if (!userInput) return res.status(400).json({ error: 'Missing input' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // ============================================
  // Email capture
  // CUSTOMIZE: Uncomment one of the platforms
  // below and add your API key to Vercel env vars.
  // See Module 4 for full setup instructions.
  // ============================================
  if (email) {
    // await captureEmail(email);
  }

  // ============================================
  // extractText helper
  // Required for claude-sonnet-5 which may return
  // thinking blocks before the text block.
  // Do not remove this.
  // ============================================
  function extractText(data) {
    if (!data.content || !Array.isArray(data.content)) return null;
    const block = data.content.find(function(b) { return b.type === 'text'; });
    return block ? block.text : null;
  }

  const headers = {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        // CUSTOMIZE: You can change the model, but claude-sonnet-5 is recommended
        model: 'claude-sonnet-5',
        max_tokens: 1000,

        // ============================================
        // CUSTOMIZE: This is the system prompt.
        // This is the most important thing to change.
        // Tell the AI exactly how to interpret the
        // inputs and what framework to use.
        //
        // The wellness disclaimer at the end is
        // important -- keep it or adapt it for your
        // specific tool.
        // ============================================
        system: `You are an expert at interpreting Healy frequency scan results using a specific potency framework.

When given a scan result with a topic, relevance percentage, intensity, and homeopathic potency, you interpret it using the following framework:

POTENCY FRAMEWORK:
- D6-D12: Physical plane -- body, physical symptoms, dense matter
- D30: Emotional plane -- feelings, patterns, emotional responses
- D200: Mental plane -- thoughts, beliefs, mental constructs
- D1000 (1M): Spiritual plane -- soul patterns, life themes, higher purpose
- LM potencies: Progressive refinement -- gentle, ongoing clearing
- High potencies (1E24 and above): Very deep soul-level or karmic themes

STAGE INDICATORS:
- Relevance 0-50%: Background awareness, not yet active
- Relevance 51-70%: Emerging, starting to surface
- Relevance 71-85%: Active and seeking resolution
- Relevance 86-100%: Acute, primary focus area

INTENSITY MEANING:
- 1-3: Gentle, peripheral influence
- 4-6: Moderate engagement needed
- 7-9: Strong activation, significant area of work
- 10: Maximum activation, primary focus

Return a JSON object with exactly these fields:
{
  "interpretation": "3-5 sentences explaining the plane, stage, and depth of this result in relation to the actual scan topic. Speak in a warm, supportive wellness tone. Connect the numbers to the human experience described in the topic.",
  "key_finding": "One clear, powerful sentence summarizing the core insight -- what this result is really pointing to for this person.",
  "next_step": "One specific, actionable suggestion within a wellness or energetic framework -- a vibration practice, journaling prompt, Healy program type to explore, or timing for rescanning. Keep it gentle and empowering."
}

IMPORTANT: This is a wellness tool only. Do not make medical claims, diagnoses, or treatment recommendations. Frame everything as energetic exploration and self-awareness.`,

        messages: [{
          role: 'user',
          content: userInput
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const text = extractText(data);
    if (!text) throw new Error('No response from AI');

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      // Fallback if AI returns plain text instead of JSON
      result = {
        interpretation: text,
        key_finding: '',
        next_step: ''
      };
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Checker error:', err.message);
    return res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}

// ============================================
// Email capture function (commented out)
// CUSTOMIZE: Uncomment and configure for your
// email marketing platform. See Module 4.
// ============================================

/*
async function captureEmail(email) {
  // --- BREVO ---
  // Uncomment this block if you use Brevo
  // Add BREVO_API_KEY to Vercel environment variables
  // Add your list ID below
  //
  // try {
  //   await fetch('https://api.brevo.com/v3/contacts', {
  //     method: 'POST',
  //     headers: {
  //       'accept': 'application/json',
  //       'api-key': process.env.BREVO_API_KEY,
  //       'content-type': 'application/json'
  //     },
  //     body: JSON.stringify({
  //       email: email,
  //       listIds: [YOUR_LIST_ID_HERE],  // Replace with your Brevo list ID number
  //       updateEnabled: true
  //     })
  //   });
  // } catch (err) {
  //   console.error('Brevo capture error:', err);
  // }

  // --- SYSTEME.IO ---
  // Uncomment this block if you use Systeme.io
  // Add SYSTEME_API_KEY to Vercel environment variables
  //
  // try {
  //   await fetch('https://api.systeme.io/api/contacts', {
  //     method: 'POST',
  //     headers: {
  //       'X-API-Key': process.env.SYSTEME_API_KEY,
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify({
  //       email: email,
  //       tags: ['healy-tool']  // Replace with your tag name
  //     })
  //   });
  // } catch (err) {
  //   console.error('Systeme.io capture error:', err);
  // }
}
*/
