import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';
import { auth, currentUser } from '@clerk/nextjs/server';

// add expense
export async function POST(request, { params }) {
  try {
    await connectDB();
    const { userId } = await auth(); // Optional: Check if user owns the trip

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
    
    // --- NEXT.JS 15 FIX ---
    const { id } = await params; 

    const { description, title, amount, category, date } = await request.json();  // fetch fields

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    // Security Check: Ensure only the owner or collaborator can add expenses
    const isOwner = trip.userId === userId;
    const isCollaborator =
      trip.collaborators?.some((c) => c.userId === userId || (email && c.email?.toLowerCase() === email));
    if (!isOwner && !isCollaborator) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!trip.expenses) trip.expenses = [];

    const newExpense = { 
      description: description || title || "Expense", 
      amount: Number(amount), 
      category: category || 'Misc',
      // Allow user date or default to now
      date: date ? new Date(date) : new Date() 
    };
    
    trip.expenses.push(newExpense);

    // Recalculate Total
    trip.total_actual_cost = trip.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    await trip.save();

    return NextResponse.json({ success: true, data: trip }, { status: 200 });

  } catch (error) {
    console.error("Expense API Error:", error); 
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

//  delete expense
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { userId } = await auth();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase?.();
    
    const { id } = await params;
    const { expenseId } = await request.json(); 

    // find the teip and delete it
    const trip = await Trip.findById(id);
    if (!trip) return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });

    // Security Check
    const isOwner = trip.userId === userId;
    const isCollaborator =
      trip.collaborators?.some((c) => c.userId === userId || (email && c.email?.toLowerCase() === email));
    if (!isOwner && !isCollaborator) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Filter out the expense
    trip.expenses = trip.expenses.filter(exp => exp._id.toString() !== expenseId);

    // Recalculate Total
    trip.total_actual_cost = trip.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    await trip.save();

    return NextResponse.json({ success: true, data: trip }, { status: 200 });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
