import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Destination from '@/models/Destination';
import { generateDestinationProfile } from '@/lib/groqClient';
import {
  defaultDestinationProfile,
  mergeNonEmpty,
  ensureVideoIds,
} from '@/lib/destinationProfile';

// enrich the data , send the data to merge and improve quality
export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;
    const destination = await Destination.findById(id);

    if (!destination) {
      return NextResponse.json({ success: false, error: 'Destination not found' }, { status: 404 });
    }

    const base = mergeNonEmpty(
      defaultDestinationProfile(destination.name),
      destination.toObject()
    );

    const aiData = await generateDestinationProfile(destination.name);

    const mergedWithoutVideos = mergeNonEmpty(base, aiData);
    const video_ids = await ensureVideoIds(destination.name, mergedWithoutVideos.video_ids);
    const merged = { ...mergedWithoutVideos, video_ids };

    destination.set(merged);
    await destination.save();

    return NextResponse.json({ success: true, data: destination });
  } catch (error) {
    console.error('Destination enrich error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
