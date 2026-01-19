import Groq from 'groq-sdk';

// Singleton Groq client instance
let groqClient = null;

export function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured in environment variables');
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function generateDestinationProfile(name) {
  const groq = getGroqClient();

  const prompt = `
    Create a detailed travel profile for "${name}".
    CRITICAL: Return ONLY valid raw JSON.

    Required Structure:
    {
      "name": "${name}",
      "description": "2 sentence inviting summary",
      "history": "Brief historical significance (2-4 lines)",
      "vibe": "Atmosphere and culture (1-2 lines)",
      "best_time": "Best months to visit",
      "currency": "Local currency + 1 practical tip",
      "language": "Primary language(s)",
      "timezone": "Timezone name/offset if known",
      "attractions": [
        { "name": "Top Place 1", "type": "Nature", "description": "Why visit?" },
        { "name": "Top Place 2", "type": "Culture", "description": "Why visit?" }
      ],
      "accessibility": {
        "nearest_airport": { "name": "Name of Airport", "distance_km": 0 },
        "nearest_railway": { "name": "Name of Railway Stn", "distance_km": 0 },
        "last_mile_connectivity": { "mode": "Taxi/Bus", "avg_cost": 0 }
      },
      "connectivity": {
        "sim": "SIM/eSIM advice",
        "wifi": "Wi‑Fi notes"
      },
      "local_rules": [
        { "title": "Best Time", "description": "Best months to visit" },
        { "title": "Permits", "description": "Any permits needed?" },
        { "title": "Safety", "description": "One realistic safety tip" }
      ],
      "emergency": {
        "note": "Emergency note (no fake phone numbers)"
      },
      "essential_phrases": [
        { "phrase": "Hello", "translation": "Bonjour", "pronunciation": "bohn-zhoor" },
        { "phrase": "Thank you", "translation": "Merci", "pronunciation": "mehr-see" },
        { "phrase": "Yes", "translation": "Oui", "pronunciation": "wee" },
        { "phrase": "No", "translation": "Non", "pronunciation": "noh" },
        { "phrase": "Where is the station?", "translation": "Où est la gare?", "pronunciation": "oo eh lah gahr" }
      ],
      "video_ids": []
    }
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    return JSON.parse(content);
  } catch (error) {
    // Re-throw with more context
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON response from Groq: ${error.message}`);
    }
    throw error;
  }
}

