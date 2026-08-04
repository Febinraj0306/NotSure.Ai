import express from 'express';
import mongoose from 'mongoose';
import Device from '../models/Device.js';

const router = express.Router();

/**
 * POST /api/devices/register
 * Body: { fcmToken, deviceId, platform }
 * Upserts a device record so we can send push notifications later.
 */
router.post('/devices/register', async (req, res) => {
  const { fcmToken, deviceId, platform } = req.body;

  if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length === 0) {
    return res.status(400).json({ error: 'A valid FCM token is required.' });
  }

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return res.status(400).json({ error: 'A valid deviceId is required.' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not available. Please try again later.' });
  }

  const allowedPlatforms = ['android', 'ios', 'web'];
  const safePlatform = allowedPlatforms.includes(platform) ? platform : 'android';

  try {
    const device = await Device.findOneAndUpdate(
      { deviceId: deviceId.trim() },
      {
        fcmToken: fcmToken.trim(),
        platform: safePlatform
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({
      success: true,
      deviceId: device.deviceId,
      platform: device.platform,
      updatedAt: device.updatedAt
    });
  } catch (err) {
    console.error('[/api/devices/register] Error:', err);
    return res.status(500).json({ error: 'Could not register device. Please try again.' });
  }
});

export default router;
