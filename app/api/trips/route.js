import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import Destination from '@/models/Destination';
import { auth } from '@clerk/nextjs/server';
import Groq from "groq-sdk";
import {
  defaultDestinationProfile,
  mergeNonEmpty,
  destinationNeedsEnrichment,
} from '@/lib/destinationProfile';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateDestinationProfile(destinationName) {
  const prompt = `
          Create a detailed travel profile for "${destinationName}".
          CRITICAL: Return ONLY valid raw JSON. Do NOT write code.

          Required Structure:
          {
            "name": "${destinationName}",
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

  const rawText = completion.choices[0].message.content;
  return JSON.parse(rawText);
}

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

    let { destinationName, destinationId, startDate, travelers, budget } = body;

    // 1) Resolve destination: by ID (if provided) or by name
    let destination = null;

    if (destinationId) {
      destination = await Destination.findById(destinationId);
    }

    if (!destination && destinationName) {
      destination = await Destination.findOne({
        name: { $regex: new RegExp(`^${destinationName}$`, 'i') },
      });
    }

    // 2) If not found, generate + save a destination profile
    if (!destination) {
      if (!destinationName) {
        return NextResponse.json(
          { success: false, error: 'Missing destinationName (or destinationId)' },
          { status: 400 }
        );
      }

      console.log(`🤖 Groq is researching: '${destinationName}'...`);

      // ✅ DEFAULT SKELETON (Used if AI fails)
      let destData = defaultDestinationProfile(destinationName);

      try {
        const parsed = await generateDestinationProfile(destinationName);
        destData = mergeNonEmpty(destData, parsed);
      } catch (e) {
        console.warn('⚠️ AI Data incomplete. Using defaults.');
      }

      destination = await Destination.create(destData);
    } else if (destinationNeedsEnrichment(destination)) {
      // Destination exists but is sparse (often created before schema/prompt improvements)
      try {
        console.log(`🤖 Enriching existing destination: '${destination.name}'...`);

        const base = mergeNonEmpty(
          defaultDestinationProfile(destination.name),
          destination.toObject()
        );

        const parsed = await generateDestinationProfile(destination.name);
        const merged = mergeNonEmpty(base, parsed);

        destination.set(merged);
        await destination.save();
      } catch (e) {
        console.warn('⚠️ Destination enrichment failed. Using existing data + safe defaults.');
        try {
          const base = mergeNonEmpty(
            defaultDestinationProfile(destination.name),
            destination.toObject()
          );
          destination.set(base);
          await destination.save();
        } catch (_) {
          // ignore
        }
      }
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
      total_actual_cost: 0,
    });

    return NextResponse.json({ success: true, data: newTrip }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
