/**
 * smsListener.js — Android SMS auto-scanning service.
 *
 * ⚠️  This module uses react-native-get-sms-android which is a native module.
 *     It requires a custom Expo dev client or EAS Build — it will NOT work
 *     in standard Expo Go.
 *
 * When a new SMS arrives:
 *   1. Check if sender is in whitelist → skip if yes
 *   2. POST message to /api/check
 *   3. If scam detected → show local push notification
 *   4. Return the result for the app to add to its feed
 */

import { Platform, AppState } from 'react-native';
import { isWhitelisted } from './storage';
import { checkText } from './api';
import { showLocalScamAlert } from './notifications';

let SmsAndroid = null;
let isListening = false;
let onNewAlertCallback = null;

// Lazy-load native module so it doesn't crash on iOS/Expo Go
function getSmsAndroid() {
  if (SmsAndroid) return SmsAndroid;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SmsAndroid = require('react-native-get-sms-android').default;
    return SmsAndroid;
  } catch {
    console.warn('[smsListener] react-native-get-sms-android not available (Expo Go or iOS).');
    return null;
  }
}

/**
 * Handle a new incoming SMS message.
 * Exported for unit testing / direct calls.
 */
export async function handleIncomingSms({ originatingAddress, body }, settings = {}) {
  const sender = originatingAddress || 'Unknown';
  const text = body || '';

  // Guard: skip if message is too short
  if (text.trim().split(/\s+/).length < 5) return null;

  // Guard: skip if sender is whitelisted
  const trusted = await isWhitelisted(sender);
  if (trusted) {
    if (__DEV__) {
      console.log('[smsListener] Whitelisted sender — skipping.');
    }
    return null;
  }

  try {
    const result = await checkText(text, {
      phoneNumber: sender,
      confidenceThreshold: settings.confidenceThreshold ?? 70
    });

    const isScam = (result.verdict === 'FALSE' || result.verdict === 'MISLEADING')
      && result.confidence >= (settings.confidenceThreshold ?? 70);

    if (isScam) {
      // Show a local push notification immediately (works even when app is minimized)
      const snippet = text.substring(0, 80) + (text.length > 80 ? '…' : '');
      await showLocalScamAlert({
        title: '⚠️ Scam Detected',
        body: snippet,
        data: {
          verdict: result.verdict,
          confidence: String(result.confidence),
          checkId: String(result.id || '')
        }
      });
    }

    // Notify the app UI
    if (onNewAlertCallback) {
      onNewAlertCallback({ ...result, phoneNumber: sender, text });
    }

    return result;
  } catch (err) {
    console.error('[smsListener] API call failed:', err.message);
    return null;
  }
}

/**
 * Start listening for new SMS messages.
 * Only works on Android with native module available.
 *
 * @param {function} onNewAlert - called with the check result when a scam is detected
 * @param {object} settings - { autoScanSms, confidenceThreshold }
 */
export function startSmsListener(onNewAlert, settings = {}) {
  if (Platform.OS !== 'android') return;
  if (isListening) return;

  const sms = getSmsAndroid();
  if (!sms) return;

  onNewAlertCallback = onNewAlert;
  isListening = true;

  try {
    // SmsAndroid.startWatch listens for new incoming SMS events
    sms.startWatch(
      (err) => {
        if (err) {
          console.error('[smsListener] startWatch error:', err);
          isListening = false;
        }
      },
      (msg) => {
        // msg = { originatingAddress, body, timestamp }
        handleIncomingSms(msg, settings).catch(console.error);
      }
    );
    console.log('[smsListener] ✅ SMS listener started');
  } catch (err) {
    console.error('[smsListener] Could not start:', err.message);
    isListening = false;
  }
}

/**
 * Stop the SMS listener and clean up.
 */
export function stopSmsListener() {
  if (!isListening) return;

  const sms = getSmsAndroid();
  if (sms) {
    try {
      sms.stopWatch(() => console.log('[smsListener] SMS listener stopped'));
    } catch {
      // ignore
    }
  }

  isListening = false;
  onNewAlertCallback = null;
}

export const isSmsListenerRunning = () => isListening;
