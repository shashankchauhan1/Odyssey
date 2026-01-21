import mongoose from 'mongoose';

// Delete the old model from memory because if a trip again searched and already found in DB then it will gonna throw an error

if (mongoose.models.Destination) {
  delete mongoose.models.Destination;
}

const DestinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  history: { type: String, default: '' },
  vibe: { type: String, default: '' },
  best_time: { type: String, default: '' },

  // these keys are gonna used by UI cards
  currency: { type: String, default: '' },
  language: { type: String, default: '' },
  timezone: { type: String, default: '' },

  // if the ai doesn't provide the whole information then it will gonna throw an error, so to solve that issue we use default here
  attractions: { type: mongoose.Schema.Types.Mixed, default: [] },
  accessibility: { type: mongoose.Schema.Types.Mixed, default: {} },
  connectivity: { type: mongoose.Schema.Types.Mixed, default: {} },
  local_rules: { type: mongoose.Schema.Types.Mixed, default: [] },
  emergency: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Media / Language helpers
  video_ids: [{ type: String }],

  essential_phrases: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

export default mongoose.models.Destination || mongoose.model('Destination', DestinationSchema);
