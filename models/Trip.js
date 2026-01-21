import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  
  destination: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Destination',
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

  // We use Mixed here to prevent crashes if the AI changes the format slightly called CaseErrors
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
  total_actual_cost: { type: Number, default: 0 },

  // Collaboration: invited editors on this trip
  collaborators: [{
    userId: { type: String },
    email: { type: String },
    role: { type: String, default: 'editor' },
  }],

  // Safety beacon / SOS check-ins
  safety_alerts: [{
    sender: { 
      id: String,
      name: String
    },
    message: { type: String, default: '' },
    coords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    timestamp: { type: Date, default: Date.now },
  }],

}, { timestamps: true });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);