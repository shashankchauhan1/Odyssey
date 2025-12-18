import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    await connectDB();
    const { tripId, days, pace, interests } = await request.json();

    const trip = await Trip.findById(tripId).populate('destination');
    if (!trip) return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });

    console.log(`🤖 Groq is planning: ${trip.destination.name}...`);

    const prompt = `
      Generate a ${days}-day itinerary for "${trip.destination.name}".
      Preferences: Pace: ${pace}, Interests: ${interests?.join(", ")}.
      Return ONLY valid JSON. No code.
      {
        "itinerary": [
          {
            "day": 1,
            "theme": "Theme Title",
            "events": [
              {
                "title": "Activity",
                "type": "Sightseeing", 
                "startTime": "09:00",
                "endTime": "11:00",
                "cost": 500,
                "description": "Desc"
              }
            ]
          }
        ]
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const aiData = JSON.parse(completion.choices[0].message.content);
    
    // Safety check
    trip.itinerary = aiData.itinerary || aiData;
    await trip.save();

    return NextResponse.json({ success: true, data: trip });

  } catch (error) {
    console.error("Groq Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}