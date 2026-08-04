import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import useNotifications from './src/hooks/useNotifications';
import useSmsScanner from './src/hooks/useSmsScanner';
import { getSettings } from './src/services/storage';

const Tab = createBottomTabNavigator();

const COLORS = {
  bg: '#0A0E1A',
  surface: '#111827',
  accent: '#3B82F6',
  border: '#1F2937',
  textSecondary: '#6B7280',
  textActive: '#F9FAFB'
};

// ─── Tab Bar Icons ─────────────────────────────────────────────────────────────
const TAB_ICONS = {
  Home: { active: '🛡️', inactive: '🛡️', label: 'Feed' },
  Scan: { active: '⚡', inactive: '⚡', label: 'Scan' },
  History: { active: '📋', inactive: '📋', label: 'History' },
  Settings: { active: '⚙️', inactive: '⚙️', label: 'Settings' }
};

function TabIcon({ name, focused }) {
  const icons = TAB_ICONS[name];
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {focused ? icons.active : icons.inactive}
    </Text>
  );
}

export default function App() {
  const [liveAlert, setLiveAlert] = useState(null);
  const [settings, setSettings] = useState({ autoScanSms: false, pushNotifications: true });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  // Handle new scam alert (from SMS scan or push notification)
  const handleNewAlert = useCallback((alertData) => {
    setLiveAlert(alertData);
  }, []);

  // FCM / Push notifications hook
  const { deviceId } = useNotifications({
    enabled: settings.pushNotifications,
    onNewNotification: handleNewAlert
  });

  // SMS auto-scanner hook
  useSmsScanner({
    enabled: settings.autoScanSms,
    onNewAlert: handleNewAlert
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: COLORS.accent,
              background: COLORS.bg,
              card: COLORS.surface,
              text: '#F9FAFB',
              border: COLORS.border,
              notification: '#EF4444'
            }
          }}
        >
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: COLORS.textSecondary,
              tabBarLabelStyle: styles.tabLabel,
              tabBarIcon: ({ focused }) => (
                <TabIcon name={route.name} focused={focused} />
              )
            })}
          >
            <Tab.Screen
              name="Home"
              options={{ tabBarLabel: 'Feed' }}
            >
              {(props) => (
                <HomeScreen
                  {...props}
                  liveAlert={liveAlert}
                  onAlertDismiss={() => setLiveAlert(null)}
                />
              )}
            </Tab.Screen>

            <Tab.Screen
              name="Scan"
              options={{ tabBarLabel: 'Scan' }}
              component={ScanScreen}
            />

            <Tab.Screen
              name="History"
              options={{ tabBarLabel: 'History' }}
              component={HistoryScreen}
            />

            <Tab.Screen
              name="Settings"
              options={{ tabBarLabel: 'Settings' }}
              component={SettingsScreen}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2
  }
});
