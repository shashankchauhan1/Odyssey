import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Destination from '@/models/Destination';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET() {
  await connectDB();
  const destinations = await Destination.find({});
  return NextResponse.json({ success: true, data: destinations });
}

export async function POST(request) {
  try {
    await connectDB();
    const { name } = await request.json();

    // 1. Check DB first (Save credits)
    let existing = await Destination.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) return NextResponse.json({ success: true, data: existing });

    console.log(`✨ Gemini is researching: ${name}...`);

    // 2. The Gemini Model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. The Strict Prompt
    const prompt = `
      You are an expert local travel guide.
      Generate a travel guide for "${name}".
      
      CRITICAL INSTRUCTION:
      Return ONLY valid JSON. Do not include markdown formatting (like \`\`\`json).
      Do not add comments. Do not add trailing commas.
      
      Use this exact structure:
      {
        "name": "${name}",
        "description": "A captivating, non-boring summary.",
        "history": "Brief historical significance.",
        "vibe": "Atmosphere and culture description.",
        "best_time": "Best months to visit.",
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
        "local_rules": [
          { "title": "Insider Tip", "description": "Useful advice." },
          { "title": "Warning", "description": "Scam or safety warning." }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // 4. Clean the output (Gemini is usually clean, but we double-check)
    // Remove markdown code blocks if they exist
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const aiData = JSON.parse(text);

    // 5. Save to DB
    // (Note: We use your new V2 model logic automatically if you renamed the file content correctly)
    const newDestination = await Destination.create(aiData);

    return NextResponse.json({ success: true, data: newDestination });

  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}