import express from 'express';
import mongoose from 'mongoose';
import Whitelist from '../models/Whitelist.js';

const router = express.Router();

/**
 * POST /api/whitelist
 * Body: { phoneNumber, deviceId, label? }
 * Adds a phone number to the trusted list for a device.
 */
router.post('/whitelist', async (req, res) => {
  const { phoneNumber, deviceId, label } = req.body;

  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
    return res.status(400).json({ error: 'A valid phone number is required.' });
  }

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return res.status(400).json({ error: 'A valid deviceId is required.' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not available. Please try again later.' });
  }

  try {
    const entry = await Whitelist.findOneAndUpdate(
      {
        deviceId: deviceId.trim(),
        phoneNumber: phoneNumber.trim()
      },
      {
        label: label?.trim() || ''
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({
      success: true,
      id: entry._id,
      deviceId: entry.deviceId,
      phoneNumber: entry.phoneNumber,
      label: entry.label,
      createdAt: entry.createdAt
    });
  } catch (err) {
    console.error('[POST /api/whitelist] Error:', err);
    return res.status(500).json({ error: 'Could not add to whitelist. Please try again.' });
  }
});

/**
 * GET /api/whitelist?deviceId=xxx
 * Returns all whitelisted numbers for a device.
 */
router.get('/whitelist', async (req, res) => {
  const { deviceId } = req.query;

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return res.status(400).json({ error: 'deviceId query parameter is required.' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.json([]);
  }

  try {
    const entries = await Whitelist.find({ deviceId: deviceId.trim() })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(entries);
  } catch (err) {
    console.error('[GET /api/whitelist] Error:', err);
    return res.status(500).json({ error: 'Could not load whitelist.' });
  }
});

/**
 * DELETE /api/whitelist/:id
 * Removes a whitelist entry by its MongoDB _id.
 */
router.delete('/whitelist/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid whitelist entry ID.' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database is not available.' });
  }

  try {
    const deleted = await Whitelist.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Whitelist entry not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/whitelist] Error:', err);
    return res.status(500).json({ error: 'Could not remove from whitelist.' });
  }
});

export default router;
