import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Trip from '@/models/Trip';

// 1. ADD EXPENSE
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    // --- CRITICAL FIX FOR NEXT.JS 15 ---
    const { id } = await params; // <--- You MUST await this!
    // -----------------------------------

    // Read data from Frontend
    // We look for 'description' (new standard) OR 'title' (old standard) to be safe
    const { description, title, amount, category } = await request.json();

    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    // Safety check: Create array if it's missing
    if (!trip.expenses) trip.expenses = [];

    // Create the expense object matching your new Model
    const newExpense = { 
      description: description || title || "Expense", // Fallback if both are empty
      amount: Number(amount), 
      category: category || 'Misc',
      date: new Date()
    };
    
    trip.expenses.push(newExpense);

    // Recalculate Total
    trip.total_actual_cost = trip.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

    await trip.save();

    return NextResponse.json({ success: true, data: trip }, { status: 200 });

  } catch (error) {
    console.error("Expense API Error:", error); // Check your VS Code terminal for this!
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. DELETE EXPENSE
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params; // <--- await params here too!
    const { expenseId } = await request.json(); 

    const trip = await Trip.findById(id);
    if (!trip) return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });

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