import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

const VERDICT_COLORS = {
  TRUE: '#10B981',
  FALSE: '#EF4444',
  MISLEADING: '#F59E0B',
  UNVERIFIED: '#6B7280'
};

/**
 * ConfidenceBar — animated horizontal progress bar.
 * @param {number} confidence   0–100
 * @param {string} verdict      used to pick bar color
 * @param {boolean} showLabel   whether to show the "72%" text
 */
export default function ConfidenceBar({ confidence = 0, verdict = 'UNVERIFIED', showLabel = true }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const clampedConf = Math.max(0, Math.min(100, confidence));
  const color = VERDICT_COLORS[verdict] || VERDICT_COLORS.UNVERIFIED;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clampedConf,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [clampedConf]);

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: widthInterpolated, backgroundColor: color }]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>{clampedConf}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: '#1F2937',
    borderRadius: 3,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 3
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right'
  }
});
