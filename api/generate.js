// api/generate.js 
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/*
  🔥 UNIVERSAL SYSTEM PROMPT — AUTO DETECTS INTENT
  - Supports full motorcycle renders
  - Supports exploded fairing kits
  - Supports single fairing parts
  - Still uses your product-level styling
*/

const SYSTEM_PREFIX = `
You are a professional motorcycle visualization engine specializing in premium, photorealistic studio renders for sportbikes, superbikes, and aftermarket fairing kits.

You must automatically determine the correct output based on user intent:

-------------------------------------------
INTENT MODES
-------------------------------------------

1) FULL MOTORCYCLE RENDER:
• If the user mentions: "full bike", "complete motorcycle", “side view”, “3/4 angle”, “studio shot”, “track bike”.
• Render the entire motorcycle with accurate proportions.
• Professional catalog-level lighting.
• Clean neutral background.

2) EXPLODED FAIRING KIT:
• If the user mentions: “exploded”, “fairing kit”, “all parts”, "separate pieces".
• Show only the fairing components, no wheels, no frame, no engine.
• Symmetrical exploded layout.
• Studio lighting.

3) SINGLE PART RENDER:
• If the user mentions a single part (e.g., "side panel", "tail", "windscreen").
• Render a single floating product shot.

If the user’s intention is unclear:
→ Choose the interpretation with the highest commercial value and clarity.

-------------------------------------------
GLOBAL STYLE RULES
-------------------------------------------
• Hyper-realistic ABS or carbon fiber surfaces  
• Sharp geometry with clean contours  
• Subtle reflections  
• High-end e-commerce studio lighting  
• Neutral black/white/grey background  
• No text, no watermarks, no artifacts  
• No weird shapes or melted components  
• Respect real motorcycle proportions for the specified model and year  
• Final render must look like a premium commercial product image  
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const {
      prompt,            
      model,             
      yearRange,         
      styleName,         
      primaryColors,     
      accents,           
      finish,            
      brandLogos         
    } = body;

    if (!prompt && !model) {
      return res.status(400).json({
        success: false,
        error: 'Missing prompt or model information'
      });
    }

    const finalPrompt = `
${SYSTEM_PREFIX}

-------------------------------------------
USER-SPECIFIC MOTORCYCLE DETAILS
-------------------------------------------
Motorcycle model: ${model || 'unspecified'}
Year range: ${yearRange || 'unspecified'}
Fairing / Style name: ${styleName || 'Custom Edition'}
Primary colors: ${primaryColors || 'unspecified – follow user input'}
Accent decals: ${accents || 'use as appropriate'}
Material finish: ${finish || 'glossy ABS plastic'}
Brand logos: ${brandLogos || 'use brand markings if appropriate'}

-------------------------------------------
USER DESCRIPTION
-------------------------------------------
${prompt || 'Use best judgment for a clean, attractive commercial render.'}

-------------------------------------------
RENDERING REQUIREMENTS
-------------------------------------------
• Commercial studio-quality image  
• No distortions or unrealistic geometry  
• Respect real motorcycle body shape and proportions  
• Only produce ONE final PNG image  
`;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured'
      });
    }

    // ✅ Updated working model for image generation
    const geminiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
        generationConfig: {
          responseMimeType: 'image/png',
          responseModalities: ['IMAGE']
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({
        success: false,
        error: 'Gemini API failed',
        details: text
      });
    }

    const data = await response.json();

    // Debug: Log the response structure to understand what we're getting
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));

    // Check image response - Gemini may return images in different formats
    const imagePart =
      data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.data);

    if (!imagePart) {
      // Check if we got text instead of image
      const textPart = data?.candidates?.[0]?.content?.parts?.find(p => p.text);
      const textResponse = textPart?.text || null;

      // Log the actual response structure for debugging
      const responseStructure = {
        hasCandidates: !!data?.candidates,
        candidatesLength: data?.candidates?.length || 0,
        firstCandidate: data?.candidates?.[0] ? {
          hasContent: !!data.candidates[0].content,
          hasParts: !!data.candidates[0].content?.parts,
          partsLength: data.candidates[0].content?.parts?.length || 0,
          partsTypes: data.candidates[0].content?.parts?.map(p => Object.keys(p)) || []
        } : null,
        textResponse: textResponse ? textResponse.substring(0, 500) : null, // First 500 chars of text if any
        error: data?.error || null
      };

      // If we got an error from Gemini API, include it
      if (data?.error) {
        return res.status(500).json({
          success: false,
          error: 'Gemini API error',
          details: data.error,
          debug: responseStructure
        });
      }

      return res.status(500).json({
        success: false,
        error: 'No image data returned',
        debug: responseStructure,
        message: textResponse 
          ? 'The Gemini API returned text instead of an image. The model may not support image generation, or the request format may be incorrect.'
          : 'The Gemini API did not return image data in the expected format.'
      });
    }

    const base64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    const dataUrl = `data:${mimeType};base64,${base64}`;

    return res.status(200).json({
      success: true,
      imageDataUrl: dataUrl
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
}
