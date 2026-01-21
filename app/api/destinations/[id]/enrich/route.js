import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Destination from '@/models/Destination';
import { generateDestinationProfile } from '@/lib/groqClient';
import { fetchTravelVideos } from '@/lib/youtube'; 
import {
  defaultDestinationProfile,
  mergeNonEmpty,
} from '@/lib/destinationProfile';

export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const destination = await Destination.findById(id);

    if (!destination) {
      return NextResponse.json({ success: false, error: 'Destination not found' }, { status: 404 });
    }

    // --- STEP 1: AI TEXT ENRICHMENT ---
    // Convert to object but ensure we don't carry over weird BSON types later
    const existingData = destination.toObject();
    
    const base = mergeNonEmpty(
      defaultDestinationProfile(destination.name),
      existingData
    );

    const aiData = await generateDestinationProfile(destination.name);
    
    // Merge AI text data
    let merged = mergeNonEmpty(base, aiData);

    // --- STEP 2: YOUTUBE VIDEO ENRICHMENT ---
    let currentVideoIds = merged.video_ids || [];

    // Only fetch if we have fewer than 3 videos to save API quota
    if (currentVideoIds.length < 3) {
      console.log(`🎥 Fetching videos for ${destination.name}...`);
      
      const newIds = await fetchTravelVideos(destination.name);
      const uniqueIds = new Set([...currentVideoIds, ...newIds]);
      currentVideoIds = Array.from(uniqueIds).slice(0, 3);
    }

    merged.video_ids = currentVideoIds;

    // --- STEP 3: SANITIZE (THE FIX) ---
    // ⚠️ Remove system fields so Mongoose doesn't try to "update" the ID
    delete merged._id;
    delete merged.id;
    delete merged.createdAt;
    delete merged.updatedAt;
    delete merged.__v;

    // --- STEP 4: SAVE ---
    destination.set(merged);
    await destination.save();

    return NextResponse.json({ success: true, data: destination });

  } catch (error) {
    console.error('Destination enrich error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}