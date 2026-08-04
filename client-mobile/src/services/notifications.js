import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerDevice } from './api';
import { getDeviceId } from './storage';

// ─── Configure how notifications appear when the app is in foreground ────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

/**
 * Request notification permissions and return the Expo push token.
 * Returns null if permissions denied or not a physical device.
 */
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    console.warn('[notifications] Push notifications only work on physical devices.');
    return null;
  }

  if (Platform.OS === 'android') {
    // Android 13+ requires explicit permission
    await Notifications.setNotificationChannelAsync('scam_alerts', {
      name: '⚠️ Scam Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: 'default',
      enableVibrate: true
    });

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250]
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permission not granted.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-eas-project-id'
    });
    return tokenData.data;
  } catch (err) {
    console.warn('[notifications] Could not get push token:', err.message);
    return null;
  }
}

/**
 * Register the device's FCM token with the backend.
 * Call this after requestNotificationPermissions().
 */
export async function registerForPushNotifications() {
  const token = await requestNotificationPermissions();
  if (!token) return null;

  const deviceId = await getDeviceId();
  const platform = Platform.OS;

  try {
    await registerDevice({ fcmToken: token, deviceId, platform });
    console.log('[notifications] Device registered for push notifications');
  } catch (err) {
    console.warn('[notifications] Could not register device:', err.message);
  }

  return token;
}

/**
 * Add a listener that fires when the user taps a notification.
 * `handler` receives the notification response.
 * Returns the subscription (call .remove() to clean up).
 */
export function addNotificationResponseListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Add a listener that fires when a notification arrives while app is in foreground.
 * Returns the subscription.
 */
export function addNotificationReceivedListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Schedule a local notification (used for immediate SMS scam alerts
 * when the app is in the foreground).
 */
export async function showLocalScamAlert({ title, body, data = {} }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#EF4444'
      },
      trigger: null // show immediately
    });
  } catch (err) {
    console.warn('[notifications] Could not show local notification:', err.message);
  }
}

/**
 * Clear all notification badges.
 */
export function clearBadge() {
  Notifications.setBadgeCountAsync(0).catch(() => {});
}
