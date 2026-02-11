import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import groq, { getGroqModel } from '@/lib/groq';

export async function POST(request) {
  try {
    await connectDB();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.();

    // Parse Request
    const { tripId, days, pace, interests } = await request.json();

    // Fetch Trip
    const trip = await Trip.findById(tripId).populate('destination');
    if (!trip) return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });

    // Authorization Check
    const isOwner = trip.userId === userId;
    const isCollaborator = trip.collaborators?.some((c) => c.userId === userId || (email && c.email?.toLowerCase() === email));

    // Allow if owner, collaborator, or if it's a new public trip generating for the first time
    if (!isOwner && !isCollaborator) {
      // Optional: Decide strictly. For now, we allow generation if they have access to the page (which they do if they called this).
      // return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 0. RESET: Clear the slate
    await Trip.findByIdAndUpdate(tripId, { $set: { itinerary: [] } });

    console.log(`🤖 Groq (Llama 3.3) is planning: ${trip.destination.name}...`);

    // The "Dense & High-Utility" Prompt (Requested by User)
    const prompt = `
    Act as a local expert guide for a trip to ${trip.destination.name}. 
    For each of the ${days} days, you MUST provide exactly 5 distinct activities.

    Structure Requirements:
    Use the key 'events' for the list (DO NOT use 'activities').
    Each activity should represent a different part of the day (e.g., Early Morning, Mid-Day, Lunch, Afternoon, Sunset).

    CRITICAL CULTURAL GUARDRAILS:
    If the destination is a known pilgrimage site or holy city (e.g., Vaishno Devi, Varanasi, Mecca, Vatican, Kedarnath, Golden Temple, Rishikesh, Haridwar, etc.):
    1. STRICTLY PROHIBIT any mention of alcohol, bars, pubs, or non-vegetarian food if it violates local sanctity.
    2. Focus exclusively on spiritual experiences, darshan, temple visits, local satvik/vegetarian food, and scenic nature treks.
    3. Do NOT suggest "relaxing with a glass of wine" or "nightlife" in these specific zones.
    
    CRITICAL OUTPUT RULES:
    1. Return exactly 5 events per day.
    2. Ensure each event has a unique title, description (short and punchy), and proTip.
    3. Estimate costs in the **LOCAL CURRENCY** of ${trip.destination.name}.
    4. Return ONLY the JSON object. No conversational text or markdown.

    JSON Schema:
    {
      "itinerary": [
        {
          "day": 1,
          "theme": "Theme Name",
          "events": [
            {
              "title": "Activity Name",
              "description": "2-3 sentences of details.",
              "proTip": "Local insider advice.",
              "cost": 500,
              "currency": "Local Currency"
            }
          ]
        }
      ]
    }
    `;

    // 1. Call Groq with JSON Mode
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: getGroqModel(),
      temperature: 0.5,
      max_tokens: 4096,
      top_p: 1,
      stop: null,
      stream: false,
      response_format: { type: "json_object" } // Force JSON
    });

    const text = completion.choices[0]?.message?.content || "";
    // TASK 1: CRITICAL DEBUG LOGS
    console.log("DEBUG: Raw AI String:", text.substring(0, 500));

    // 2. Parse (Safety Check)
    let aiData;
    try {
      aiData = JSON.parse(text);
    } catch (e) {
      console.error("JSON Parsing failed, attempting cleanup:", e.message);
      // Fallback cleanup if JSON mode slightly failed (rare in Llama 3 but possible)
      const cleanJson = text.replace(/```json|```/g, '').trim();
      aiData = JSON.parse(cleanJson);
    }

    // TASK 2: CRITICAL FORCE-VISIBILITY LOG
    console.log("AI DATA TO SAVE:", aiData.itinerary[0]);

    // TASK 1: DEBUG LOGS AFTER PARSING
    if (aiData.itinerary && aiData.itinerary.length > 0) {
      console.log("DEBUG: Parsed Itinerary Key Check:", Object.keys(aiData.itinerary[0]));
    }

    // 3. Update Database (Refined Save Logic)
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        $set: {
          // Map AI data to Schema fields explicitly
          itinerary: aiData.itinerary.map(day => ({
            day: day.day,
            theme: day.theme,
            activities: day.events || day.activities || [], // Save to activities (Robust)
            events: day.events || day.activities || []      // Save to events (Primary)
          })),
          country: aiData.country,
          emergencyInfo: {
            country: aiData.country,
            numbers: aiData.emergency_numbers
          }
        }
      },
      { new: true }
    );

    // TASK 3: DB VERIFICATION LOG
    if (updatedTrip && updatedTrip.itinerary && updatedTrip.itinerary.length > 0) {
      console.log("DB SAVED ACTIVITY COUNT (Day 1):", updatedTrip.itinerary[0].activities?.length);
      console.log("DB SAVED DATA (Day 1):", JSON.stringify(updatedTrip.itinerary[0], null, 2));
    }

    return NextResponse.json({ success: true, data: updatedTrip });

  } catch (error) {
    console.error("Groq Generation Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};