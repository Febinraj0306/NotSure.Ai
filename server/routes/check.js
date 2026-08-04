import express from 'express';
import mongoose from 'mongoose';
import Check from '../models/Check.js';
import Alert from '../models/Alert.js';
import Device from '../models/Device.js';
import { searchWeb } from '../services/searchService.js';
import { analyzeClaimWithGemini } from '../services/geminiService.js';
import { broadcastScamAlert, sendScamAlert } from '../services/fcmService.js';
import { checkLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST /api/check — main fact-check endpoint
router.post('/check', checkLimiter, async (req, res) => {
  const { text, deviceId, phoneNumber, confidenceThreshold } = req.body;

  // Input validation
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Please provide a claim to check.' });
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Your message is empty. Paste a claim or forward to check.' });
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (wordCount < 5) {
    return res.status(400).json({
      error: 'That\'s too short to fact-check. Paste the full message (at least 5 words).'
    });
  }

  if (trimmed.length > 5000) {
    return res.status(400).json({
      error: 'Message is too long. Please trim it to under 5000 characters.'
    });
  }

  // Determine alert confidence threshold (mobile can pass its own, default 70)
  const alertThreshold = typeof confidenceThreshold === 'number'
    ? Math.max(0, Math.min(100, confidenceThreshold))
    : 70;

  try {
    // Step 1: Search for relevant sources
    const searchResults = await searchWeb(trimmed);

    // Step 2: Send to Gemini for analysis
    const analysis = await analyzeClaimWithGemini(trimmed, searchResults);

    // Step 3: Build check document
    const check = new Check({
      text: trimmed,
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      sources: analysis.sources
    });

    // Save to MongoDB only if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await check.save();
      } catch (dbErr) {
        console.warn('⚠️  Could not save check to MongoDB:', dbErr.message);
      }
    } else {
      console.warn('⚠️  MongoDB not connected, skipping save.');
    }

    // Step 4: Trigger FCM push notification if scam detected above threshold
    let alerted = false;
    const isScam = (analysis.verdict === 'FALSE' || analysis.verdict === 'MISLEADING')
      && analysis.confidence >= alertThreshold;

    if (isScam && mongoose.connection.readyState === 1) {
      try {
        const snippet = trimmed.substring(0, 80) + (trimmed.length > 80 ? '…' : '');
        const pushPayload = {
          title: '⚠️ Scam Detected',
          body: snippet,
          data: {
            verdict: analysis.verdict,
            confidence: String(analysis.confidence),
            checkId: String(check._id)
          }
        };

        if (deviceId) {
          // Push to specific device only
          const device = await Device.findOne({ deviceId: deviceId.trim() });
          if (device?.fcmToken) {
            const result = await sendScamAlert(device.fcmToken, pushPayload);
            alerted = result.sent;
            if (result.reason === 'stale_token' && result.staleToken) {
              await Device.deleteOne({ fcmToken: result.staleToken });
            }
          }

          // Save alert record for this device
          const alertDoc = new Alert({
            deviceId: deviceId.trim(),
            checkId: check._id,
            phoneNumber: phoneNumber?.trim() || 'Unknown',
            messageSnippet: snippet,
            verdict: analysis.verdict,
            confidence: analysis.confidence
          });
          await alertDoc.save().catch(err =>
            console.warn('⚠️  Could not save alert:', err.message)
          );
        } else {
          // Broadcast to ALL registered devices
          const devices = await Device.find({});
          if (devices.length > 0) {
            const results = await broadcastScamAlert(devices, pushPayload);
            alerted = results.some(r => r.sent);

            // Clean up any stale tokens found during broadcast
            const staleTokens = results
              .filter(r => r.reason === 'stale_token' && r.staleToken)
              .map(r => r.staleToken);
            if (staleTokens.length > 0) {
              await Device.deleteMany({ fcmToken: { $in: staleTokens } });
            }

            // Save alert records for every device
            const alertDocs = devices.map(d => ({
              deviceId: d.deviceId,
              checkId: check._id,
              phoneNumber: phoneNumber?.trim() || 'Unknown',
              messageSnippet: snippet,
              verdict: analysis.verdict,
              confidence: analysis.confidence
            }));
            await Alert.insertMany(alertDocs, { ordered: false }).catch(err =>
              console.warn('⚠️  Could not bulk-save alerts:', err.message)
            );
          }
        }
      } catch (fcmErr) {
        // FCM failure is non-fatal — still return the analysis result
        console.error('[/api/check] FCM error (non-fatal):', fcmErr.message);
      }
    }

    // Step 5: Return result
    return res.json({
      id: check._id,
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      sources: analysis.sources,
      createdAt: check.createdAt,
      alerted
    });
  } catch (err) {
    console.error('[/api/check] Error:', err);

    // Friendly error messages without stack traces
    if (err.message?.includes('API key') || err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ error: 'AI service configuration error. Please check your GEMINI_API_KEY in .env.' });
    }
    if (err.message?.includes('rate limit') || err.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'The analysis took too long. Please try again.' });
    }

    return res.status(500).json({
      error: 'Something went wrong during analysis. Please try again in a moment.'
    });
  }
});

// GET /api/recent — last 10 public checks
router.get('/recent', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json([]);
  }
  try {
    const checks = await Check.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('text verdict confidence reasoning sources createdAt')
      .lean();

    return res.json(checks);
  } catch (err) {
    console.error('[/api/recent] Error:', err);
    return res.status(500).json({ error: 'Could not load recent checks.' });
  }
});

// GET /api/check/:id — single check by ID
router.get('/check/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid check ID.' });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(404).json({ error: 'Check not found (database disconnected).' });
  }
  try {
    const check = await Check.findById(req.params.id).lean();
    if (!check) return res.status(404).json({ error: 'Check not found.' });
    return res.json(check);
  } catch (err) {
    return res.status(500).json({ error: 'Could not load check.' });
  }
});

export default router;
