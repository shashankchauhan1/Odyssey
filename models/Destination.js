import mongoose from 'mongoose';

// 🛑 FORCE RESET: Delete the old model from memory
if (mongoose.models.Destination) {
  delete mongoose.models.Destination;
}

const DestinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  history: { type: String, default: '' },
  vibe: { type: String, default: '' },
  best_time: { type: String, default: '' },

  // Essentials (used by UI cards)
  currency: { type: String, default: '' },
  language: { type: String, default: '' },
  timezone: { type: String, default: '' },

  // ✅ "Mixed" prevents CastError if the AI changes structure slightly.
  attractions: { type: mongoose.Schema.Types.Mixed, default: [] },
  accessibility: { type: mongoose.Schema.Types.Mixed, default: {} },
  connectivity: { type: mongoose.Schema.Types.Mixed, default: {} },
  local_rules: { type: mongoose.Schema.Types.Mixed, default: [] },
  emergency: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.models.Destination || mongoose.model('Destination', DestinationSchema);
