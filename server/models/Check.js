import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  url: { type: String, default: '' }
}, { _id: false });

const checkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
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
  reasoning: {
    type: String,
    required: true
  },
  sources: [sourceSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast recent-checks queries
checkSchema.index({ createdAt: -1 });

export default mongoose.model('Check', checkSchema);
