import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  clearBadge
} from '../services/notifications';
import { getDeviceId } from '../services/storage';

/**
 * useNotifications — manages FCM token registration and notification callbacks.
 *
 * - Requests permissions on mount
 * - Registers device with backend
 * - Fires onNewNotification when a notification arrives in foreground
 * - Navigates to result screen when user taps a notification
 */
export default function useNotifications({ onNewNotification, enabled = true }) {
  const [token, setToken] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const receivedSub = useRef(null);
  const responseSub = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    registerForPushNotifications().then(tok => {
      if (tok) setToken(tok);
    });

    // Foreground notification received
    receivedSub.current = addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (onNewNotification) {
        onNewNotification(data);
      }
      clearBadge();
    });

    // User tapped a notification
    responseSub.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      const checkId = data?.checkId;
      if (checkId) {
        // Navigate to Scan tab and show the result
        navigation.navigate('Scan', { checkId });
      }
      clearBadge();
    });

    return () => {
      receivedSub.current?.remove?.();
      responseSub.current?.remove?.();
    };
  }, [enabled, onNewNotification, navigation]);

  return { token, deviceId };
}
