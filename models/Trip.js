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
    date: { type: Date, default: Date.now },
    payer: {
      userId: String,
      name: String
    },
    participants: [{
      userId: String,
      name: String,
    }],
    splitType: { type: String, default: 'equal' } // 'equal'
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



  // Preferences (I18n)
  preferences: {
    currency: { type: String, default: 'INR' },
    units: { type: String, default: 'metric' } // metric, imperial
  },

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

  // Active Safety Beacons (Multi-User Persistent State)
  safetyBeacons: [{
    userId: String,
    userName: String,
    latitude: Number,
    longitude: Number,
    timestamp: Number
  }]

}, { timestamps: true });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);