import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  checkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Check',
    default: null
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: 'Unknown'
  },
  messageSnippet: {
    type: String,
    maxlength: 120,
    default: ''
  },
  verdict: {
    type: String,
    enum: ['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIED'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  notifiedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast per-device history queries
alertSchema.index({ deviceId: 1, notifiedAt: -1 });

export default mongoose.model('Alert', alertSchema);
