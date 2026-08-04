import express from 'express';
import mongoose from 'mongoose';
import Alert from '../models/Alert.js';

const router = express.Router();

/**
 * GET /api/alerts/history?deviceId=xxx
 * Returns the last 20 scam alerts for a device, newest first.
 */
router.get('/alerts/history', async (req, res) => {
  const { deviceId } = req.query;

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return res.status(400).json({ error: 'deviceId query parameter is required.' });
  }

  if (mongoose.connection.readyState !== 1) {
    // Offline-friendly — return empty array so app can serve local cache
    return res.json([]);
  }

  try {
    const alerts = await Alert.find({ deviceId: deviceId.trim() })
      .sort({ notifiedAt: -1 })
      .limit(20)
      .populate('checkId', 'text reasoning sources')
      .lean();

    return res.json(alerts);
  } catch (err) {
    console.error('[/api/alerts/history] Error:', err);
    return res.status(500).json({ error: 'Could not load alert history.' });
  }
});

export default router;
