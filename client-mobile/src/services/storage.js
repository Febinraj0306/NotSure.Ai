import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const KEYS = {
  DEVICE_ID: '@truthcheck/deviceId',
  SETTINGS: '@truthcheck/settings',
  HISTORY: '@truthcheck/history',
  WHITELIST: '@truthcheck/whitelist'
};

// ─── Device ID ───────────────────────────────────────────────────────────────

/** Returns the persisted device UUID, generating one if it doesn't exist yet. */
export async function getDeviceId() {
  try {
    let id = await AsyncStorage.getItem(KEYS.DEVICE_ID);
    if (!id) {
      id = uuidv4();
      await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
    }
    return id;
  } catch {
    // Worst case — generate a session-only id
    return uuidv4();
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  autoScanSms: false,
  pushNotifications: true,
  /** confidence threshold for triggering alerts (0–100) */
  confidenceThreshold: 70,
  /** 'low' | 'medium' | 'high' */
  sensitivity: 'medium'
};

export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.warn('[storage] saveSettings failed:', err.message);
  }
}

// ─── History (offline cache) ─────────────────────────────────────────────────

const MAX_HISTORY = 50;

export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Prepends a new result to the history cache (capped at MAX_HISTORY). */
export async function addToHistory(result) {
  try {
    const existing = await getHistory();
    const updated = [result, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[storage] addToHistory failed:', err.message);
    return [];
  }
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(KEYS.HISTORY);
  } catch (err) {
    console.warn('[storage] clearHistory failed:', err.message);
  }
}

// ─── Offline whitelist cache ──────────────────────────────────────────────────

export async function getCachedWhitelist() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.WHITELIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function cacheWhitelist(list) {
  try {
    await AsyncStorage.setItem(KEYS.WHITELIST, JSON.stringify(list));
  } catch (err) {
    console.warn('[storage] cacheWhitelist failed:', err.message);
  }
}

export async function isWhitelisted(phoneNumber) {
  const list = await getCachedWhitelist();
  return list.some(
    entry => entry.phoneNumber === phoneNumber || entry.phoneNumber === phoneNumber.trim()
  );
}
