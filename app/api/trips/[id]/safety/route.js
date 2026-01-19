import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
    const { id } = await params;

    const { message = '', coords = {} } = await request.json();
    const { lat, lng } = coords;

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    const isOwner = trip.userId === userId;
    const isCollaborator =
      trip.collaborators?.some((c) => c.userId === userId || (email && c.email?.toLowerCase() === email));
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const alert = {
      senderId: userId || '',
      message,
      coords: {
        lat: typeof lat === 'number' ? lat : null,
        lng: typeof lng === 'number' ? lng : null,
      },
      timestamp: new Date(),
    };

    trip.safety_alerts = trip.safety_alerts || [];
    trip.safety_alerts.unshift(alert);

    await trip.save();

    return NextResponse.json({ success: true, data: trip.safety_alerts });
  } catch (error) {
    console.error('Safety alert error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
