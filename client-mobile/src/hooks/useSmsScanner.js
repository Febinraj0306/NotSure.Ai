import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { startSmsListener, stopSmsListener, isSmsListenerRunning } from '../services/smsListener';
import { getSettings } from '../services/storage';

/**
 * useSmsScanner — manages READ_SMS / RECEIVE_SMS permissions and the SMS listener lifecycle.
 *
 * @param {object} params
 * @param {boolean} params.enabled        whether auto-scan is toggled on in Settings
 * @param {function} params.onNewAlert    called with check result when a new SMS scam is found
 */
export default function useSmsScanner({ enabled, onNewAlert }) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const settingsRef = useRef({});

  // Request SMS permissions on Android
  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return false;

    try {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
      ]);

      const granted =
        grants[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
        grants[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;

      if (!granted) {
        Alert.alert(
          'SMS Permission Required',
          'TruthCheck needs SMS access to automatically scan incoming messages for scams. You can still use manual scanning.',
          [{ text: 'OK' }]
        );
      }

      setPermissionGranted(granted);
      return granted;
    } catch (err) {
      console.error('[useSmsScanner] Permission error:', err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    // Load current settings for the listener
    getSettings().then(s => {
      settingsRef.current = s;
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (isSmsListenerRunning()) {
        stopSmsListener();
        setIsRunning(false);
      }
      return;
    }

    // Start listener (will request permissions if not yet granted)
    async function start() {
      let hasPermission = permissionGranted;
      if (!hasPermission) {
        hasPermission = await requestPermissions();
      }

      if (hasPermission && !isSmsListenerRunning()) {
        startSmsListener(onNewAlert, settingsRef.current);
        setIsRunning(true);
      }
    }

    start();

    return () => {
      // Clean up when hook unmounts or enabled changes to false
      stopSmsListener();
      setIsRunning(false);
    };
  }, [enabled, permissionGranted, onNewAlert, requestPermissions]);

  return { permissionGranted, isRunning, requestPermissions };
}
