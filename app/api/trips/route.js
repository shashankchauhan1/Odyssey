import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import Destination from '@/models/Destination';
import { auth } from '@clerk/nextjs/server';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  await connectDB();
  const { userId } = await auth();
  const trips = await Trip.find({ userId }).populate('destination').sort({ startDate: -1 });
  return NextResponse.json({ success: true, data: trips });
}

export async function POST(request) {
  try {
    await connectDB();
    const { userId } = await auth();
    const body = await request.json();
    let { destinationName, startDate, travelers, budget } = body;

    // 1. Check DB first
    let destination = await Destination.findOne({ 
      name: { $regex: new RegExp(`^${destinationName}$`, 'i') } 
    });

    // 2. IF NOT FOUND -> ASK GROQ
    if (!destination) {
      console.log(`🤖 Groq is researching: '${destinationName}'...`);
      
      // ✅ DEFAULT SKELETON (Used if AI fails)
      // This ensures the UI always has structure to render
      let destData = {
        name: destinationName,
        description: "A wonderful place to visit.",
        attractions: [],
        accessibility: {
             nearest_airport: { name: "Local Airport", distance_km: 0 },
             nearest_railway: { name: "Nearest Station", distance_km: 0 },
             last_mile_connectivity: { mode: "Taxi or Bus", avg_cost: 0 }
        },
        local_rules: [
            { title: "General Info", description: "Check local weather before visiting." }
        ]
      };

      try {
        // ✅ RICH PROMPT: Explicitly asks for logistics details
        const prompt = `
          Create a detailed travel profile for "${destinationName}".
          CRITICAL: Return ONLY valid raw JSON. Do NOT write code.
          
          Required Structure:
          {
            "name": "${destinationName}",
            "description": "2 sentence inviting summary",
            "attractions": [
               { "name": "Top Place 1", "type": "Nature", "description": "Why visit?" },
               { "name": "Top Place 2", "type": "Culture", "description": "Why visit?" }
            ],
            "accessibility": {
               "nearest_airport": { "name": "Name of Airport", "distance_km": 0 },
               "nearest_railway": { "name": "Name of Railway Stn", "distance_km": 0 },
               "last_mile_connectivity": { "mode": "Taxi/Bus", "avg_cost": 0 }
            },
            "local_rules": [
               { "title": "Best Time", "description": "Best months to visit" },
               { "title": "Permits", "description": "Any permits needed?" }
            ]
          }
        `;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" }
        });

        const rawText = completion.choices[0].message.content;
        const parsed = JSON.parse(rawText);
        
        // Merge AI data into our safe skeleton
        if (parsed) destData = { ...destData, ...parsed };

      } catch (e) {
        console.warn("⚠️ AI Data incomplete. Using defaults.");
      }

      // Create Destination
      destination = await Destination.create(destData);
    }

    // 3. Create Trip
    const newTrip = await Trip.create({
      userId: userId,
      destination: destination._id,
      startDate: new Date(startDate || Date.now()),
      budget_limit: budget || 10000, 
      travelers: travelers || 1,
      itinerary: [], 
      expenses: [], 
      total_estimated_cost: 0, 
      total_actual_cost: 0
    });

    return NextResponse.json({ success: true, data: newTrip }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}