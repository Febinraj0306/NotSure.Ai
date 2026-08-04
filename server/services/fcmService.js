/**
 * fcmService.js — Firebase Cloud Messaging push notification sender.
 *
 * Initialises firebase-admin lazily so the server still boots and works
 * without Firebase credentials. If credentials are missing or invalid,
 * every send call resolves with { sent: false, reason: 'not_configured' }.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let initialized = false;
let initError = null;

function initFirebase() {
  if (initialized || initError) return;

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    initError = 'Firebase env vars not set (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). Push notifications disabled.';
    console.warn(`⚠️  [fcmService] ${initError}`);
    return;
  }

  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          // .env stores \n as literal \\n — restore real newlines
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    }
    initialized = true;
    console.log('🔥 Firebase Admin SDK initialized');
  } catch (err) {
    initError = err.message;
    console.error('[fcmService] Firebase init failed:', err.message);
  }
}

// Run init immediately (non-blocking)
initFirebase();

/**
 * Send a scam-alert push notification to a single device.
 *
 * @param {string} fcmToken   — the device's FCM registration token
 * @param {object} payload
 * @param {string} payload.title
 * @param {string} payload.body
 * @param {object} payload.data  — arbitrary string key-value pairs
 * @returns {Promise<{ sent: boolean, messageId?: string, reason?: string }>}
 */
export async function sendScamAlert(fcmToken, { title, body, data = {} }) {
  if (!initialized) {
    return { sent: false, reason: initError || 'not_configured' };
  }

  if (!fcmToken) {
    return { sent: false, reason: 'no_token' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        // All data values must be strings for FCM
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        )
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'scam_alerts',
          color: '#EF4444'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const messageId = await getMessaging().send(message);
    return { sent: true, messageId };
  } catch (err) {
    // Token stale / unregistered — not a fatal server error
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      console.warn(`[fcmService] Stale token detected: ${fcmToken.slice(0, 20)}...`);
      return { sent: false, reason: 'stale_token', staleToken: fcmToken };
    }
    console.error('[fcmService] Send error:', err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Send scam alert to ALL registered devices (broadcast).
 * Returns array of individual results.
 */
export async function broadcastScamAlert(devices, payload) {
  if (!devices || devices.length === 0) return [];
  const results = await Promise.allSettled(
    devices.map(d => sendScamAlert(d.fcmToken, payload))
  );
  return results.map(r => (r.status === 'fulfilled' ? r.value : { sent: false, reason: r.reason }));
}

export const isFirebaseReady = () => initialized;
