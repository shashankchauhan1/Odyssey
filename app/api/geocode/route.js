// This route helps to find the location in the map

import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');

  if (!city) return NextResponse.json({ error: "City missing" }, { status: 400 });

  try {
    // We call OpenStreetMap from the SERVER, where it is allowed
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`,
      {
        headers: {
          'User-Agent': 'OdysseyTravelApp/1.0' // This header fixes the 403 Error! which is we need to identify ourself that i am odyssey not a spam bot
        }
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch coords" }, { status: 500 });
  }
}