import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import { getGroqClient } from '@/lib/groqClient';
import { auth, currentUser } from '@clerk/nextjs/server';

// getting the fields and sending as a prompt to groq

export async function POST(request) {
  try {
    await connectDB();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
    const { tripId, days, pace, interests } = await request.json();

    const trip = await Trip.findById(tripId).populate('destination');
    if (!trip) return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });

    const isOwner = trip.userId === userId;
    const isCollaborator =
      trip.collaborators?.some((c) => c.userId === userId || (email && c.email?.toLowerCase() === email));
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🤖 Groq is planning: ${trip.destination.name}...`);

    // app/api/trips/generate/route.js

    const prompt = `
      Generate a ${days}-day ${pace} itinerary for a trip to ${trip.destination.name} based on these interests: ${interests.join(", ")}.

      CRITICAL RULES FOR COSTS:
      1. Estimate costs in the **LOCAL CURRENCY** of ${trip.destination.name} (e.g., CHF for Switzerland, JPY for Japan, EUR for France).
      2. Do NOT convert to INR. Keep it local.
      3. Provide the ISO currency code (e.g., "CHF", "USD", "EUR").

      Return a JSON object strictly following this schema:
      {
        "itinerary": [
          {
            "day": 1,
            "theme": "Arrival & Exploration",
            "events": [
              {
                "title": "Activity Name",
                "description": "Brief description",
                "startTime": "09:00",
                "endTime": "11:00",
                "cost": 30,          // Just the number
                "currency": "CHF",   //
                "type": "Adventure"
              }
            ]
          }
        ]
      }
    `;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    // getting the output from ai
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    const aiData = JSON.parse(content);
    
    // Safety check
    trip.itinerary = aiData.itinerary || aiData;
    await trip.save();

    return NextResponse.json({ success: true, data: trip });

  } catch (error) {
    console.error("Groq Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
