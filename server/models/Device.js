import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    fcmToken: {
      type: String,
      required: true,
      trim: true
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android'
    }
  },
  {
    timestamps: true // adds createdAt + updatedAt automatically
  }
);

export default mongoose.model('Device', deviceSchema);
