import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  AppState
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MessageCard from '../components/MessageCard';
import AlertBanner from '../components/AlertBanner';
import { getAlertHistory } from '../services/api';
import { getHistory, getDeviceId } from '../services/storage';

const COLORS = {
  bg: '#0A0E1A',
  surface: '#111827',
  accent: '#3B82F6',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#1F2937'
};

function EmptyState({ onScanPress }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🛡️</Text>
      <Text style={styles.emptyTitle}>All Clear</Text>
      <Text style={styles.emptySubtitle}>
        No scam alerts yet. Your feed will show automatically scanned messages here.
      </Text>
      <TouchableOpacity
        style={styles.scanBtn}
        onPress={onScanPress}
      >
        <Text style={styles.scanBtnText}>Scan a Message Manually →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen({ navigation, liveAlert, onAlertDismiss }) {
  const [feed, setFeed] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  // Load feed: try API, fall back to local cache
  const loadFeed = useCallback(async () => {
    const deviceId = await getDeviceId();
    try {
      const apiAlerts = await getAlertHistory(deviceId);
      if (apiAlerts && apiAlerts.length > 0) {
        setFeed(apiAlerts);
        setOffline(false);
        return;
      }
    } catch {
      setOffline(true);
    }
    // Fallback to local history cache
    const cached = await getHistory();
    setFeed(cached);
    setOffline(cached.length > 0);
  }, []);

  // Refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const renderItem = useCallback(
    ({ item }) => (
      <MessageCard
        item={item}
        onPress={() => navigation.navigate('Scan', { result: item })}
      />
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Live alert banner */}
      {liveAlert && (
        <AlertBanner
          alert={liveAlert}
          onDismiss={onAlertDismiss}
          onViewFull={() => {
            onAlertDismiss?.();
            navigation.navigate('Scan', { result: liveAlert });
          }}
        />
      )}

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Live Feed</Text>
          {offline && (
            <View style={styles.offlinePill}>
              <Text style={styles.offlineText}>Offline Cache</Text>
            </View>
          )}
        </View>

        <FlatList
          data={feed}
          keyExtractor={(item, i) => String(item._id || item.id || i)}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState onScanPress={() => navigation.navigate('Scan')} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
          contentContainerStyle={feed.length === 0 ? styles.listEmpty : styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5
  },
  offlinePill: {
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  offlineText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  list: { paddingBottom: 24 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  },
  scanBtn: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});
