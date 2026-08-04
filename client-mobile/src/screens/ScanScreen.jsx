import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Linking,
  Share,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import VerdictBadge from '../components/VerdictBadge';
import ConfidenceBar from '../components/ConfidenceBar';
import AlertBanner from '../components/AlertBanner';
import { checkText } from '../services/api';
import { getDeviceId, getSettings, addToHistory } from '../services/storage';

const COLORS = {
  bg: '#0A0E1A',
  surface: '#111827',
  accent: '#3B82F6',
  border: '#1F2937',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B'
};

const LOADING_STEPS = [
  { icon: '🔍', text: 'Extracting key claims…' },
  { icon: '🌐', text: 'Searching live sources…' },
  { icon: '🤖', text: 'AI analysing content…' },
  { icon: '✅', text: 'Generating verdict…' }
];

export default function ScanScreen({ navigation, route }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [settings, setSettings] = useState({ confidenceThreshold: 70 });
  const stepInterval = useRef(null);

  // Handle navigation params (from notification tap or HomeScreen)
  useEffect(() => {
    if (route.params?.result) {
      setResult(route.params.result);
    }
  }, [route.params]);

  const handleScanRef = useRef(handleScan);
  useEffect(() => {
    handleScanRef.current = handleScan;
  }, [handleScan]);

  // Handle shared text from other apps (WhatsApp / share sheet)
  useEffect(() => {
    const handleUrl = ({ url }) => {
      if (url) {
        const parsed = decodeURIComponent(url.replace(/^truthcheck:\/\/\?text=/, ''));
        setInputText(parsed);
        // Auto-submit shared text
        setTimeout(() => handleScanRef.current(parsed), 300);
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const startLoadingSteps = useCallback(() => {
    setLoadingStep(0);
    let step = 0;
    stepInterval.current = setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setLoadingStep(step);
    }, 900);
  }, []);

  const stopLoadingSteps = useCallback(() => {
    if (stepInterval.current) {
      clearInterval(stepInterval.current);
      stepInterval.current = null;
    }
  }, []);

  const handleScan = useCallback(async (textOverride) => {
    const text = textOverride || inputText;
    if (!text.trim()) return;

    setError(null);
    setResult(null);
    setLoading(true);
    setActiveAlert(null);
    startLoadingSteps();

    try {
      const deviceId = await getDeviceId();
      const response = await checkText(text, {
        deviceId,
        confidenceThreshold: settings.confidenceThreshold
      });

      setResult(response);
      await addToHistory({ ...response, text });

      // Show alert banner if scam detected
      const isScam = (response.verdict === 'FALSE' || response.verdict === 'MISLEADING')
        && response.confidence >= settings.confidenceThreshold;
      if (isScam) {
        setActiveAlert({ ...response, text });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      stopLoadingSteps();
    }
  }, [inputText, settings, startLoadingSteps, stopLoadingSteps]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    const emoji = { TRUE: '✅', FALSE: '❌', MISLEADING: '⚠️', UNVERIFIED: '❓' };
    const msg = `${emoji[result.verdict] || '❓'} *TruthCheck Result: ${result.verdict}* (${result.confidence}% confidence)\n\n${result.reasoning}\n\nChecked with TruthCheck AI`;
    try {
      await Share.share({ message: msg });
    } catch {}
  }, [result]);

  const isScam = result
    && (result.verdict === 'FALSE' || result.verdict === 'MISLEADING')
    && result.confidence >= settings.confidenceThreshold;

  return (
    <SafeAreaView style={styles.safeArea}>
      {activeAlert && (
        <AlertBanner
          alert={activeAlert}
          onDismiss={() => setActiveAlert(null)}
          onViewFull={() => setActiveAlert(null)}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Scan Message</Text>
            <Text style={styles.subtitle}>
              Paste a suspicious message, forward, or WhatsApp text below
            </Text>
          </View>

          {/* Input area */}
          <View style={[styles.inputCard, isScam && styles.inputCardScam]}>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={6}
              placeholder="Paste message here… e.g. 'Congratulations! You have won a prize. Click here to claim.'"
              placeholderTextColor={COLORS.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
              autoCapitalize="sentences"
              editable={!loading}
            />
          </View>

          {/* Scan button */}
          <TouchableOpacity
            style={[styles.scanBtn, loading && styles.scanBtnDisabled]}
            onPress={() => handleScan()}
            disabled={loading || !inputText.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.scanBtnText}>
                  {LOADING_STEPS[loadingStep].icon} {LOADING_STEPS[loadingStep].text}
                </Text>
              </View>
            ) : (
              <Text style={styles.scanBtnText}>⚡ Scan Now</Text>
            )}
          </TouchableOpacity>

          {/* Error state */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Result card */}
          {result && !loading && (
            <View style={[styles.resultCard, isScam && styles.resultCardScam]}>
              {/* Verdict header */}
              <View style={styles.resultHeader}>
                <VerdictBadge verdict={result.verdict} size="lg" />
                <View style={styles.confWrapper}>
                  <Text style={styles.confTitle}>Confidence</Text>
                  <ConfidenceBar
                    confidence={result.confidence}
                    verdict={result.verdict}
                    showLabel
                  />
                </View>
              </View>

              {/* Reasoning */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ANALYSIS</Text>
                <Text style={styles.reasoning}>{result.reasoning}</Text>
              </View>

              {/* Sources */}
              {result.sources && result.sources.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>SOURCES</Text>
                  {result.sources.map((src, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => src.url && Linking.openURL(src.url)}
                    >
                      <Text style={styles.sourceLink} numberOfLines={1}>
                        🔗 {src.title || src.url}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Text style={styles.shareBtnText}>↗ Share Result</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => { setResult(null); setInputText(''); setActiveAlert(null); }}
                >
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  header: { paddingVertical: 20, gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    minHeight: 130
  },
  inputCardScam: { borderColor: COLORS.red },
  input: {
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 110
  },
  scanBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  scanBtnDisabled: { backgroundColor: '#374151' },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  loadingRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  errorCard: {
    marginTop: 12,
    backgroundColor: '#1C0A0A',
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 12,
    padding: 14
  },
  errorText: { color: '#FCA5A5', fontSize: 14, lineHeight: 20 },
  resultCard: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 16
  },
  resultCardScam: { borderColor: COLORS.red, borderWidth: 2 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  confWrapper: { flex: 1, gap: 6 },
  confTitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600'
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700'
  },
  reasoning: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 22 },
  sourceLink: { color: COLORS.accent, fontSize: 13, lineHeight: 22, textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  shareBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center'
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  clearBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  clearBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 }
});
