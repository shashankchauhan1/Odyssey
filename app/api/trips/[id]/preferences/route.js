import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const { currency, units } = await request.json();

        // Validate
        if (!['INR', 'USD', 'EUR', 'GBP', 'JPY'].includes(currency)) {
            return NextResponse.json({ success: false, error: "Invalid currency" }, { status: 400 });
        }
        if (!['metric', 'imperial'].includes(units)) {
            return NextResponse.json({ success: false, error: "Invalid units" }, { status: 400 });
        }

        const trip = await Trip.findByIdAndUpdate(
            id,
            { 'preferences.currency': currency, 'preferences.units': units },
            { new: true }
        );

        if (!trip) return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: trip });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
