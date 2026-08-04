import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import VerdictBadge from './VerdictBadge';
import ConfidenceBar from './ConfidenceBar';

const COLORS = {
  bg: '#0A0E1A',
  surface: '#111827',
  border: '#1F2937',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  accent: '#3B82F6'
};

/**
 * MessageCard — single scanned message card in the feed / history list.
 *
 * @param {object} item         check result object
 * @param {function} onPress    called when the card is tapped
 */
export default function MessageCard({ item, onPress }) {
  if (!item) return null;

  const snippet = (item.text || item.messageSnippet || '').substring(0, 100);
  const displaySnippet = snippet + (snippet.length >= 100 ? '…' : '');
  const sender = item.phoneNumber && item.phoneNumber !== 'Unknown'
    ? `From: ${item.phoneNumber}`
    : null;

  const timestamp = item.createdAt || item.notifiedAt
    ? new Date(item.createdAt || item.notifiedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <VerdictBadge verdict={item.verdict} size="sm" />
        {sender && <Text style={styles.sender}>{sender}</Text>}
      </View>

      <Text style={styles.snippet} numberOfLines={3}>
        {displaySnippet || 'No message text available.'}
      </Text>

      <View style={styles.footer}>
        <View style={styles.barWrapper}>
          <Text style={styles.confLabel}>Confidence</Text>
          <ConfidenceBar
            confidence={item.confidence}
            verdict={item.verdict}
            showLabel
          />
        </View>
        {timestamp && <Text style={styles.time}>{timestamp}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sender: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  snippet: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  barWrapper: {
    flex: 1,
    gap: 4
  },
  confLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600'
  },
  time: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'right',
    flexShrink: 0
  }
});
