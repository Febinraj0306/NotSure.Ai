import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, saveSettings, getDeviceId, clearHistory } from '../services/storage';
import { getWhitelist, addToWhitelist, removeFromWhitelist, healthCheck } from '../services/api';

const COLORS = {
  bg: '#0A0E1A',
  surface: '#111827',
  accent: '#3B82F6',
  border: '#1F2937',
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF'
};

const SENSITIVITY_LEVELS = {
  low: { label: 'Low (85%)', value: 85, desc: 'Only very high confidence scams' },
  medium: { label: 'Medium (70%)', value: 70, desc: 'Recommended — balanced detection' },
  high: { label: 'High (55%)', value: 55, desc: 'Catches more — may have false positives' }
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    autoScanSms: false,
    pushNotifications: true,
    confidenceThreshold: 70,
    sensitivity: 'medium'
  });
  const [whitelist, setWhitelist] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [apiStatus, setApiStatus] = useState(null); // null | 'ok' | 'error'
  const [checkingApi, setCheckingApi] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  async function loadAll() {
    const [s, id] = await Promise.all([getSettings(), getDeviceId()]);
    setSettings(s);
    setDeviceId(id);
    loadWhitelist(id);
    checkApi();
  }

  async function loadWhitelist(id) {
    try {
      const list = await getWhitelist(id || deviceId);
      setWhitelist(list);
    } catch {}
  }

  async function checkApi() {
    setCheckingApi(true);
    try {
      await healthCheck();
      setApiStatus('ok');
    } catch {
      setApiStatus('error');
    } finally {
      setCheckingApi(false);
    }
  }

  async function updateSetting(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings(updated);
  }

  async function setSensitivity(level) {
    const threshold = SENSITIVITY_LEVELS[level].value;
    const updated = { ...settings, sensitivity: level, confidenceThreshold: threshold };
    setSettings(updated);
    await saveSettings(updated);
  }

  async function handleAddWhitelist() {
    if (!newNumber.trim()) return;
    try {
      await addToWhitelist({ phoneNumber: newNumber.trim(), deviceId, label: newLabel.trim() });
      setNewNumber('');
      setNewLabel('');
      await loadWhitelist(deviceId);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add number.');
    }
  }

  async function handleRemoveWhitelist(id) {
    Alert.alert('Remove?', 'Remove this number from whitelist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFromWhitelist(id);
            await loadWhitelist(deviceId);
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        }
      }
    ]);
  }

  async function handleClearHistory() {
    Alert.alert('Clear History', 'Remove all locally cached scan history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => { await clearHistory(); Alert.alert('Done', 'History cleared.'); }
      }
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* ── Scanning ─────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>SCANNING</Text>
        <View style={styles.card}>
          <SettingRow
            label="Auto-scan SMS"
            desc="Automatically check incoming SMS messages"
            value={settings.autoScanSms}
            onToggle={v => updateSetting('autoScanSms', v)}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Push Notifications"
            desc="Get alerted when a scam is detected"
            value={settings.pushNotifications}
            onToggle={v => updateSetting('pushNotifications', v)}
          />
        </View>

        {/* ── Sensitivity ───────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>SENSITIVITY</Text>
        <View style={styles.card}>
          <Text style={styles.settingDesc}>
            Minimum confidence to trigger a scam alert: <Text style={styles.thresholdNum}>{settings.confidenceThreshold}%</Text>
          </Text>
          {Object.entries(SENSITIVITY_LEVELS).map(([key, level]) => (
            <TouchableOpacity
              key={key}
              style={[styles.sensitivityRow, settings.sensitivity === key && styles.sensitivityActive]}
              onPress={() => setSensitivity(key)}
            >
              <View style={styles.sensitivityLeft}>
                <Text style={[styles.sensitivityLabel, settings.sensitivity === key && { color: COLORS.accent }]}>
                  {level.label}
                </Text>
                <Text style={styles.sensitivityDesc}>{level.desc}</Text>
              </View>
              {settings.sensitivity === key && (
                <Text style={{ color: COLORS.accent, fontSize: 18 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Whitelist ─────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>WHITELIST — TRUSTED NUMBERS</Text>
        <View style={styles.card}>
          <Text style={styles.settingDesc}>
            Messages from these numbers are skipped automatically.
          </Text>

          {/* Add number */}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="+91 98765 43210"
              placeholderTextColor={COLORS.textSecondary}
              value={newNumber}
              onChangeText={setNewNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Label (optional)"
              placeholderTextColor={COLORS.textSecondary}
              value={newLabel}
              onChangeText={setNewLabel}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddWhitelist}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Whitelist entries */}
          {whitelist.length === 0 ? (
            <Text style={styles.emptyText}>No trusted numbers added yet.</Text>
          ) : (
            whitelist.map(entry => (
              <View key={entry._id} style={styles.whitelistRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.whitelistNumber}>{entry.phoneNumber}</Text>
                  {entry.label ? <Text style={styles.whitelistLabel}>{entry.label}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => handleRemoveWhitelist(entry._id)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── Data ─────────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleClearHistory}>
            <Text style={styles.dangerText}>🗑  Clear Scan History</Text>
          </TouchableOpacity>
        </View>

        {/* ── About ────────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Device ID</Text>
            <Text style={styles.aboutValue} numberOfLines={1} ellipsizeMode="middle">
              {deviceId || 'Loading…'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>API Status</Text>
            <View style={styles.statusRow}>
              {checkingApi && <ActivityIndicator size="small" color={COLORS.accent} />}
              {!checkingApi && apiStatus === 'ok' && (
                <View style={[styles.statusDot, { backgroundColor: COLORS.green }]} />
              )}
              {!checkingApi && apiStatus === 'error' && (
                <View style={[styles.statusDot, { backgroundColor: COLORS.red }]} />
              )}
              <Text style={styles.aboutValue}>
                {checkingApi ? 'Checking…' : apiStatus === 'ok' ? 'Online' : apiStatus === 'error' ? 'Offline' : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.aboutRow} onPress={checkApi}>
            <Text style={[styles.aboutLabel, { color: COLORS.accent }]}>Refresh Status</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, desc, value, onToggle }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: COLORS.accent }}
        thumbColor={value ? '#fff' : '#9CA3AF'}
        ios_backgroundColor="#374151"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    paddingVertical: 16
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
    paddingHorizontal: 4
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden'
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12
  },
  settingLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  settingDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 16, padding: 16 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  thresholdNum: { color: COLORS.accent, fontWeight: '700' },
  sensitivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  sensitivityActive: { backgroundColor: '#1E3A5F' },
  sensitivityLeft: { flex: 1, gap: 2 },
  sensitivityLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  sensitivityDesc: { fontSize: 11, color: COLORS.textSecondary },
  addRow: { flexDirection: 'row', gap: 8, padding: 12, paddingTop: 0 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13
  },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center'
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  whitelistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  whitelistNumber: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  whitelistLabel: { fontSize: 11, color: COLORS.textSecondary },
  removeText: { color: COLORS.red, fontSize: 16, fontWeight: '700', paddingHorizontal: 4 },
  emptyText: { color: COLORS.textSecondary, fontSize: 13, padding: 16, paddingTop: 0, fontStyle: 'italic' },
  dangerRow: { padding: 16 },
  dangerText: { color: COLORS.red, fontSize: 15, fontWeight: '600' },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingHorizontal: 16
  },
  aboutLabel: { fontSize: 14, color: COLORS.textSecondary },
  aboutValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500', maxWidth: 160 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 }
});
