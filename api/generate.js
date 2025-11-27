// api/generate.js
import 'dotenv/config';
// Using native fetch (available in Node.js 18+)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Simple system prefix – you can tweak this later
const SYSTEM_PREFIX = `
Generate a high-resolution, studio-grade motorcycle fairing kit mockup in the same style as professional product listings. 
Use a clean exploded layout showing all fairing pieces neatly separated and arranged symmetrically from the front view.
The image must look like a premium product photo for an online store such as EuroFairings.
`;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Shopify App Proxy can send data either as JSON or form-encoded.
    // For now we expect JSON: { prompt, model, year, colors, style, decals, finish }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const {
      prompt,          // full free-text from user (optional)
      model,           // e.g. "Yamaha YZF-R1"
      yearRange,       // e.g. "2015–2020"
      styleName,       // e.g. "Blue Racing Edition"
      primaryColors,   // e.g. "metallic Yamaha blue and pure white"
      accents,         // e.g. "R1 logos, Yamaha decals"
      finish,          // e.g. "glossy ABS plastic"
      brandLogos       // e.g. "Yamaha, R1"
    } = body;

    if (!prompt && !model) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt or model information'
      });
    }

    // Build a detailed final prompt
    const finalPrompt = `
${SYSTEM_PREFIX}

Motorcycle model: ${model || 'unspecified'}
Year range: ${yearRange || 'unspecified'}
Fairing style: ${styleName || 'Custom Edition'}
Primary colors: ${primaryColors || 'custom colors requested by user'}
Accent colors or decals: ${accents || 'custom decals as requested'}
Material finish: ${finish || 'glossy ABS plastic'}
Brand logos: ${brandLogos || 'as requested'}

User description:
${prompt || 'Use your best judgment to create an attractive design.'}

Requirements:
• Hyper-realistic ABS motorcycle fairing pieces
• Accurate geometry for the specified motorcycle model
• Exploded layout with all parts arranged symmetrically, front-facing
• Soft studio lighting with subtle reflections on surfaces
• Neutral dark textured background (or white if needed)
• No bike chassis, no engine, no environment, no extra objects
• All major fairing components visible.
`;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured'
      });
    }

    // Call Gemini Image API (using generateContent with image/png)
    const geminiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

    const response = await fetch(`${geminiUrl}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: finalPrompt }]
          }
        ],
        // request an image back
        generationConfig: {
          responseMimeType: 'image/png'
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini API error:', text);
      return res.status(502).json({
        success: false,
        error: 'Gemini API request failed',
        details: text
      });
    }

    const data = await response.json();

    // Gemini returns inlineData with base64 png
    const imagePart =
      data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.data);

    if (!imagePart) {
      console.error('Unexpected Gemini response:', JSON.stringify(data, null, 2));
      return res.status(500).json({
        success: false,
        error: 'No image data returned from Gemini'
      });
    }

    const base64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    // For MVP: return a data URL string the frontend can use directly in <img src="...">
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return res.status(200).json({
      success: true,
      imageDataUrl: dataUrl
    });
  } catch (err) {
    console.error('Error in /api/generate:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
}
