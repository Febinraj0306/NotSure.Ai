import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VERDICT_CONFIG = {
  TRUE: { bg: '#10B981', text: '#fff', label: '✅ TRUE' },
  FALSE: { bg: '#EF4444', text: '#fff', label: '❌ FALSE' },
  MISLEADING: { bg: '#F59E0B', text: '#0A0E1A', label: '⚠️ MISLEADING' },
  UNVERIFIED: { bg: '#6B7280', text: '#fff', label: '❓ UNVERIFIED' }
};

/**
 * VerdictBadge — colored chip showing TRUE / FALSE / MISLEADING / UNVERIFIED.
 * @param {string} verdict
 * @param {'sm'|'md'|'lg'} size
 */
export default function VerdictBadge({ verdict, size = 'md' }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.UNVERIFIED;
  const textSize = size === 'sm' ? 10 : size === 'lg' ? 15 : 12;
  const padH = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const padV = size === 'sm' ? 3 : size === 'lg' ? 8 : 5;
  const radius = size === 'sm' ? 8 : 12;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: padH,
          paddingVertical: padV,
          borderRadius: radius
        }
      ]}
    >
      <Text style={[styles.text, { color: config.text, fontSize: textSize }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start'
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5
  }
});
