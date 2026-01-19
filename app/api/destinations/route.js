import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Destination from '@/models/Destination';
import { generateDestinationProfile } from '@/lib/groqClient';
import {
  defaultDestinationProfile,
  mergeNonEmpty,
  destinationNeedsEnrichment,
  ensureVideoIds,
} from '@/lib/destinationProfile';

// just for getting the data from DB
export async function GET() {
  try {
    await connectDB();
    const destinations = await Destination.find({});
    return NextResponse.json({ success: true, data: destinations });
  } catch (error) {
    console.error('GET Destinations Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { name } = await request.json();  // get the name of place from user

    if (!name) {
      return NextResponse.json({ success: false, error: 'Missing name' }, { status: 400 });
    }

    // Check DB first , does we already have it ?
    let existing = await Destination.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    // if the data is there and no need some improvements then send it and no need to call AI
    if (existing && !destinationNeedsEnrichment(existing)) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Default data merges with Ai data so improve data quality , fills the empty space
    const base = existing
      ? mergeNonEmpty(defaultDestinationProfile(existing.name), existing.toObject())
      : defaultDestinationProfile(name);

    const aiData = await generateDestinationProfile(name);
    const mergedWithoutVideos = mergeNonEmpty(base, aiData);
    const video_ids = await ensureVideoIds(name, mergedWithoutVideos.video_ids);
    const merged = { ...mergedWithoutVideos, video_ids };

    // save to the database
    const saved = existing
      ? await Destination.findByIdAndUpdate(existing._id, merged, { new: true })
      : await Destination.create(merged);

    return NextResponse.json({ success: true, data: saved });

  } catch (error) {
    console.error("Groq Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
