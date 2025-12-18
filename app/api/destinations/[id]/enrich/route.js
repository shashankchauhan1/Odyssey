import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Destination from '@/models/Destination';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  defaultDestinationProfile,
  mergeNonEmpty,
} from '@/lib/destinationProfile';

async function generateWithGroq(name) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
      }
    }
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content);
}

async function generateWithGemini(name) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert local travel guide.
    Generate a travel guide for "${name}".

    CRITICAL INSTRUCTION:
    Return ONLY valid JSON. Do not include markdown formatting.

    Use this exact structure:
    {
      "name": "${name}",
      "description": "A captivating, non-boring summary.",
      "history": "Brief historical significance.",
      "vibe": "Atmosphere and culture description.",
      "best_time": "Best months to visit.",
      "currency": "Local currency + one practical payment tip.",
      "language": "Primary language(s).",
      "timezone": "Timezone name/offset if known.",
      "attractions": [
        { "name": "Place Name", "type": "Nature", "description": "Why visit?" },
        { "name": "Place Name", "type": "Culture", "description": "Why visit?" },
        { "name": "Place Name", "type": "Adventure", "description": "Why visit?" }
      ],
      "accessibility": {
        "nearest_airport": { "name": "Airport Name", "distance_km": 0 },
        "nearest_railway": { "name": "Station Name", "distance_km": 0 },
        "last_mile_connectivity": { "mode": "Taxi/Bus", "avg_cost": 0 }
      },
      "connectivity": {
        "sim": "SIM/eSIM advice",
        "wifi": "Wi‑Fi notes"
      },
      "local_rules": [
        { "title": "Insider Tip", "description": "Useful advice." },
        { "title": "Warning", "description": "Scam or safety warning." },
        { "title": "Permits", "description": "Any permits needed?" }
      ],
      "emergency": {
        "note": "Emergency note (no fake phone numbers)"
      }
    }
  `;

  const result = await model.generateContent(prompt);
  let text = result.response.text();
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const destination = await Destination.findById(id);

    if (!destination) {
      return NextResponse.json({ success: false, error: 'Destination not found' }, { status: 404 });
    }

    const base = mergeNonEmpty(
      defaultDestinationProfile(destination.name),
      destination.toObject()
    );

    let aiData = null;

    if (process.env.GROQ_API_KEY) {
      aiData = await generateWithGroq(destination.name);
    } else if (process.env.GEMINI_API_KEY) {
      aiData = await generateWithGemini(destination.name);
    } else {
      return NextResponse.json(
        { success: false, error: 'No AI API key configured (GROQ_API_KEY or GEMINI_API_KEY)' },
        { status: 500 }
      );
    }

    const merged = mergeNonEmpty(base, aiData);

    destination.set(merged);
    await destination.save();

    return NextResponse.json({ success: true, data: destination });
  } catch (error) {
    console.error('Destination enrich error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
