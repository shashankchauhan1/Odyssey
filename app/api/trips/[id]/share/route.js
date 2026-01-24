import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import Destination from '@/models/Destination'; // ✅ Ensure this is imported for populate to work
import Trip from '@/models/Trip';
import { sendInviteEmail } from '@/lib/mailer';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { userId } = await auth();
    const user = await currentUser();
    const inviterEmail = user?.primaryEmailAddress?.emailAddress || '';
    
    if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { email, role = 'editor', collaboratorUserId } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Add .populate('destination') here
    // This tells Mongoose: "Don't just give me the ID, go get the full Destination object (name, etc)."
    const trip = await Trip.findById(id).populate('destination');
    
    if (!trip) return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });

    // Only owner can share
    const isOwner = trip.userId === userId;
    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Only the trip owner can share' }, { status: 401 });
    }

    const emailLower = email.toLowerCase();
    const exists = Array.isArray(trip.collaborators) && trip.collaborators.some(
      (c) => c.email?.toLowerCase() === emailLower
    );

    if (!exists) {
      trip.collaborators = trip.collaborators || [];
      trip.collaborators.push({
        email,
        userId: collaboratorUserId || '',
        role,
      });
      await trip.save();

      // Attempt to send an invite email.
      try {
        const inviter = { email: inviterEmail };
        
        // Access .name instead of converting to string
        // Since we populated it, trip.destination is now an object, so we can access .name
        const destinationName = trip.destination?.name || 'Unknown Destination';
        
        await sendInviteEmail(email, { tripId: id, title: destinationName }, inviter);
        
      } catch (mailErr) {
        console.error('Invite email failed:', mailErr);
      }
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error('Share trip error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}