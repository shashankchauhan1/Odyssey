import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import Destination from '@/models/Destination';
import { auth, currentUser } from '@clerk/nextjs/server';

// GET Single Trip
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.();

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

    // Permission: owner or collaborator can view
    const isOwner = trip.userId === userId;
    const isCollaborator =
      trip.collaborators?.some((c) => c.userId === userId || (email && c.email?.toLowerCase() === email));
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Enrich owner and collaborators with display names/emails from Clerk
    const tripObj = trip.toObject();

    // Get owner display name and email
    let ownerDisplayName = trip.userId;
    let ownerEmail = '';

    try {
      // Fetch user from Clerk API
      const clerkResponse = await fetch(
        `https://api.clerk.com/v1/users/${trip.userId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (clerkResponse.ok) {
        const clerkUser = await clerkResponse.json();
        ownerDisplayName = clerkUser.first_name && clerkUser.last_name
          ? `${clerkUser.first_name} ${clerkUser.last_name}`
          : clerkUser.username || clerkUser.email_addresses?.[0]?.email_address || trip.userId;
        ownerEmail = clerkUser.email_addresses?.[0]?.email_address || '';
      }
    } catch (e) {
      console.error(`Failed to fetch Clerk user ${trip.userId}:`, e.message);
      // Fallback to userId if Clerk API fails
      ownerDisplayName = trip.userId;
      ownerEmail = '';
    }

    tripObj.owner_display_name = ownerDisplayName;
    tripObj.owner_email = ownerEmail;

    const collaborators = Array.isArray(tripObj.collaborators) ? [...tripObj.collaborators] : [];
    const resolvedCollaborators = await Promise.all(
      collaborators.map(async (c) => {
        if (!c?.userId) return c;
        try {
          const clerkResponse = await fetch(
            `https://api.clerk.com/v1/users/${c.userId}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (clerkResponse.ok) {
            const clerkUser = await clerkResponse.json();
            const displayName = clerkUser.first_name && clerkUser.last_name
              ? `${clerkUser.first_name} ${clerkUser.last_name}`
              : clerkUser.username || clerkUser.email_addresses?.[0]?.email_address || c.email || c.userId;
            const email = clerkUser.email_addresses?.[0]?.email_address || c.email || '';

            return {
              ...c,
              display_name: displayName,
              email: email,
            };
          }
        } catch (e) {
          console.error(`Failed to fetch Clerk user ${c.userId}:`, e.message);
        }
        return c;
      })
    );
    tripObj.collaborators = resolvedCollaborators;

    return NextResponse.json({ success: true, data: tripObj });
  } catch (error) {
    console.error("GET Trip Error:", error); // Log the actual error to console
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT (Update) Trip
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { userId } = await auth();
    const { id } = await params;
    const body = await request.json();

    // 1. Geocode if destinationName changes (or just to be safe)
    let countryUpdate = {};
    if (body.destinationName || body.destination) {
      // Note: In a real app, we'd check if it actually changed. 
      // For now, if passed, we try to detect country.
      const nameToSearch = body.destinationName || (typeof body.destination === 'string' ? body.destination : '');

      if (nameToSearch) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nameToSearch)}&format=json&limit=1`, {
            headers: { 'User-Agent': 'Odyssey/1.0' }
          });
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            const parts = geoData[0].display_name.split(', ');
            const country = parts[parts.length - 1];
            countryUpdate.country = country;
          }
        } catch (e) {
          console.error("Geocoding update failed", e);
        }
      }
    }

    // 2. Perform Update
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: id, userId }, // Ensure ownership
      { $set: { ...body, ...countryUpdate } },
      { new: true }
    );

    if (!updatedTrip) {
      return NextResponse.json({ success: false, error: "Trip not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTrip });

  } catch (error) {
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
