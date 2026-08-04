import mongoose from 'mongoose';

const whitelistSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate phone numbers per device
whitelistSchema.index({ deviceId: 1, phoneNumber: 1 }, { unique: true });

export default mongoose.model('Whitelist', whitelistSchema);
