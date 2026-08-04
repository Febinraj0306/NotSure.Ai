import axios from 'axios';
import Constants from 'expo-constants';

// Read API URL dynamically from app.config.js extra configuration (populated from environment variables)
const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:5001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// ─── Response interceptor: normalize every error to a friendly string ───────
api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const serverMsg = err.response?.data?.error;

    let friendlyMsg;
    if (!err.response) {
      friendlyMsg = 'Could not reach the server. Check your internet connection.';
    } else if (status === 400) {
      friendlyMsg = serverMsg || 'Invalid request. Please check your input.';
    } else if (status === 429) {
      friendlyMsg = 'Too many requests. Please wait a moment and try again.';
    } else if (status === 504) {
      friendlyMsg = 'The analysis took too long. Please try again.';
    } else if (status >= 500) {
      friendlyMsg = serverMsg || 'Server error. Please try again in a moment.';
    } else {
      friendlyMsg = serverMsg || 'Something went wrong. Please try again.';
    }

    const error = new Error(friendlyMsg);
    error.status = status;
    return Promise.reject(error);
  }
);

// ─── API calls ───────────────────────────────────────────────────────────────

/**
 * Scan a text message / claim for scams.
 * @param {string} text
 * @param {object} options
 * @param {string} [options.deviceId]
 * @param {string} [options.phoneNumber]
 * @param {number} [options.confidenceThreshold]  default 70
 */
export async function checkText(text, { deviceId, phoneNumber, confidenceThreshold } = {}) {
  const { data } = await api.post('/api/check', {
    text,
    deviceId,
    phoneNumber,
    confidenceThreshold
  });
  return data;
}

/**
 * Register device FCM token for push notifications.
 */
export async function registerDevice({ fcmToken, deviceId, platform = 'android' }) {
  const { data } = await api.post('/api/devices/register', { fcmToken, deviceId, platform });
  return data;
}

/**
 * Fetch last 20 scam alerts for this device.
 */
export async function getAlertHistory(deviceId) {
  const { data } = await api.get('/api/alerts/history', { params: { deviceId } });
  return data;
}

/**
 * Add a phone number to the trusted whitelist.
 */
export async function addToWhitelist({ phoneNumber, deviceId, label = '' }) {
  const { data } = await api.post('/api/whitelist', { phoneNumber, deviceId, label });
  return data;
}

/**
 * Get all whitelisted numbers for a device.
 */
export async function getWhitelist(deviceId) {
  const { data } = await api.get('/api/whitelist', { params: { deviceId } });
  return data;
}

/**
 * Remove a whitelist entry by its _id.
 */
export async function removeFromWhitelist(id) {
  const { data } = await api.delete(`/api/whitelist/${id}`);
  return data;
}

/**
 * Health check — also used as API status indicator in Settings.
 */
export async function healthCheck() {
  const { data } = await api.get('/api/health');
  return data;
}

/**
 * Get recent public checks (for HomeScreen feed fallback).
 */
export async function getRecentChecks() {
  const { data } = await api.get('/api/recent');
  return data;
}

export default api;
