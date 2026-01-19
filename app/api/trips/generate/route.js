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

<<<<<<< HEAD
=======
    const isOwner = trip.userId === userId;
    const isCollaborator =
      trip.collaborators?.some((c) => c.userId === userId || (email && c.email?.toLowerCase() === email));
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🤖 Groq is planning: ${trip.destination.name}...`);

>>>>>>> 5a9b8bb565a9867f698f3e37c70cc82658f196dc
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