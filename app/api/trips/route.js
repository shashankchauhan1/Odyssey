import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import Destination from '@/models/Destination';
import { auth, currentUser } from '@clerk/nextjs/server';
import { generateDestinationProfile } from '@/lib/groqClient';
import {
  defaultDestinationProfile,
  mergeNonEmpty,
  destinationNeedsEnrichment,
} from '@/lib/destinationProfile';

export async function GET() {
  try {
    await connectDB();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.();

    const query = [
      { userId },
      { 'collaborators.userId': userId },
    ];
    if (email) {
      query.push({ 'collaborators.email': email });
    }

    const trips = await Trip.find({ $or: query })
      .populate('destination')
      .sort({ startDate: -1 });
    return NextResponse.json({ success: true, data: trips });
  } catch (error) {
    console.error('GET Trips Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
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
