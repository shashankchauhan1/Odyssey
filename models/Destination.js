import mongoose from 'mongoose';

// 🛑 FORCE RESET: Delete the old model from memory
if (mongoose.models.Destination) {
  delete mongoose.models.Destination;
}

const DestinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  history: String,
  vibe: String,
  best_time: String,

  // ✅ THE UNIVERSAL FIX: "Mixed" accepts Arrays, Objects, or Strings.
  // This prevents the "CastError" completely.
  attractions: { type: mongoose.Schema.Types.Mixed, default: [] },

  accessibility: { type: mongoose.Schema.Types.Mixed, default: {} },
  local_rules: { type: mongoose.Schema.Types.Mixed, default: [] }
});

export default mongoose.models.Destination || mongoose.model('Destination', DestinationSchema);