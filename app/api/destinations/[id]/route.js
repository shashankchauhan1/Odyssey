import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Destination from '@/models/Destination';

export async function GET(request, props) {
  try {
    await connectDB();
    
    const params = await props.params;
    const id = params.id;

    const destination = await Destination.findById(id);

    if (!destination) {
      return NextResponse.json({ success: false, error: "Destination not found in DB" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: destination }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}