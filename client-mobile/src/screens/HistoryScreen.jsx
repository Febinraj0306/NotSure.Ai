import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MessageCard from '../components/MessageCard';
import { getHistory, clearHistory, getDeviceId } from '../services/storage';
import { getAlertHistory } from '../services/api';

const COLORS = {
  bg: '#0A0E1A',
  surface: '#111827',
  border: '#1F2937',
  accent: '#3B82F6',
  red: '#EF4444',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF'
};

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptySubtitle}>
        Scanned messages will appear here. Try scanning something from the Scan tab.
      </Text>
    </View>
  );
}

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const deviceId = await getDeviceId();
    // Try remote first, fall back to local
    try {
      const remote = await getAlertHistory(deviceId);
      if (remote?.length > 0) {
        setHistory(remote);
        return;
      }
    } catch {}
    const local = await getHistory();
    setHistory(local);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear History',
      'This will remove all locally cached scan history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          }
        }
      ]
    );
  }, []);

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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length > 0 && (
          <Text style={styles.count}>{history.length} scan{history.length !== 1 ? 's' : ''} found</Text>
        )}

        <FlatList
          data={history}
          keyExtractor={(item, i) => String(item._id || item.id || i)}
          renderItem={renderItem}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
          contentContainerStyle={history.length === 0 ? styles.listEmpty : styles.list}
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
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  clearBtn: {
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  clearText: { color: COLORS.red, fontSize: 13, fontWeight: '600' },
  count: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12, fontWeight: '500' },
  list: { paddingBottom: 24 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 }
});
