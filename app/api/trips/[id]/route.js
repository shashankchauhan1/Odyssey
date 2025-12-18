import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import Destination from '@/models/Destination'; // 👈 CRITICAL MISSING LINE!
import { auth } from '@clerk/nextjs/server';

// GET Single Trip
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    // Valid for Next.js 15
    const { id } = await params;

    // Safety Check: Ensure ID is valid before querying (Prevents CastError)
    if (!id || id.length !== 24) {
       return NextResponse.json({ success: false, error: "Invalid ID format" }, { status: 400 });
    }

    // We need the Destination model imported for this .populate() to work!
    const trip = await Trip.findById(id).populate('destination');
    
    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error("GET Trip Error:", error); // Log the actual error to console
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE Trip
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { userId } = await auth();

    const { id } = await params;

    const deletedTrip = await Trip.findOneAndDelete({ _id: id, userId });

    if (!deletedTrip) {
      return NextResponse.json({ success: false, error: "Trip not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Trip deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}