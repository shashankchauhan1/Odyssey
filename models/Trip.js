import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  
  // ✅ THE FIX IS HERE 👇
  destination: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Destination',  // <--- Changed from 'Destination_V2' back to 'Destination'
    required: true 
  },
  
  startDate: Date,
  endDate: Date,
  travelers: { type: Number, default: 1 },
  budget_limit: { type: Number, default: 0 },
  
  expenses: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: 'Misc' },
    date: { type: Date, default: Date.now }
  }],

  // We use Mixed here to prevent crashes if the AI changes the format slightly
  itinerary: [{
    day: Number,
    events: [{
      type: { type: String }, 
      title: String,
      startTime: String,
      endTime: String,
      cost: Number,
      status: { type: String, default: "Planned" },
      description: String,
      details: mongoose.Schema.Types.Mixed 
    }]
  }],

  packing_list: [{ item: String, is_packed: { type: Boolean, default: false } }],
  total_estimated_cost: { type: Number, default: 0 },
  total_actual_cost: { type: Number, default: 0 } 

}, { timestamps: true });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);