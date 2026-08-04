import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * AlertBanner — slides down from top when a scam is detected.
 * Red overlay with verdict, confidence, snippet, and dismiss button.
 *
 * @param {object}   alert      the check result that triggered the alert
 * @param {function} onDismiss  called when user taps dismiss or the close button
 * @param {function} onViewFull called when user taps "View Full Result"
 */
export default function AlertBanner({ alert, onDismiss, onViewFull }) {
  const slideAnim = useRef(new Animated.Value(-160)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alert) {
      // Reset values first
      slideAnim.setValue(-160);
      opacityAnim.setValue(0);

      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => dismiss(), 8000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -160,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => onDismiss?.());
  }

  if (!alert) return null;

  const snippet = (alert.text || alert.messageSnippet || '').substring(0, 80);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.title}>Scam Detected</Text>
          <View style={styles.confidencePill}>
            <Text style={styles.confidenceText}>{alert.confidence}%</Text>
          </View>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Snippet */}
      {snippet.length > 0 && (
        <Text style={styles.snippet} numberOfLines={2}>
          "{snippet}{snippet.length >= 80 ? '…' : ''}"
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.viewBtn} onPress={onViewFull}>
          <Text style={styles.viewBtnText}>View Full Result →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={dismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#7F1D1D', // deep red
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
    paddingHorizontal: 16,
    paddingTop: 52, // below status bar
    paddingBottom: 16,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  warningIcon: {
    fontSize: 20
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  confidencePill: {
    backgroundColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  confidenceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },
  closeText: {
    color: '#FECACA',
    fontSize: 16,
    fontWeight: '700'
  },
  snippet: {
    color: '#FECACA',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4
  },
  viewBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  dismissText: {
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '500'
  }
});
