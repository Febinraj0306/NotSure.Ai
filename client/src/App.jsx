import { useState, useEffect, useRef, useCallback } from 'react';
import VerdictCard from './components/VerdictCard.jsx';
import RecentChecks from './components/RecentChecks.jsx';
import LoadingState from './components/LoadingState.jsx';
import ImageUpload from './components/ImageUpload.jsx';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recentChecks, setRecentChecks] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const resultRef = useRef(null);
  const textareaRef = useRef(null);

  // Loading steps for demo effect
  const loadingSteps = [
    'Searching for sources...',
    'Cross-referencing claims...',
    'Analyzing with AI...',
    'Compiling verdict...'
  ];

  // Fetch recent checks on mount
  useEffect(() => {
    fetchRecentChecks();
  }, []);

  // Auto-scroll to result
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  // Advance loading steps
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    setLoadingStep(0);
    const timings = [0, 2000, 4500, 7000];
    const timers = timings.map((delay, i) =>
      setTimeout(() => setLoadingStep(i), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const fetchRecentChecks = async () => {
    setRecentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/recent`);
      if (res.ok) {
        const data = await res.json();
        setRecentChecks(data);
      }
    } catch {
      // silent fail — recent checks are non-critical
    } finally {
      setRecentLoading(false);
    }
  };

  const handleCheck = useCallback(async (textToCheck) => {
    const text = (textToCheck || inputText).trim();

    setError('');
    setResult(null);

    if (!text) {
      setError('Please paste a message or claim to check.');
      textareaRef.current?.focus();
      return;
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 5) {
      setError('Too short to fact-check. Please paste the complete message (at least 5 words).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setResult(data);
      // Refresh recent checks after successful check
      fetchRecentChecks();
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('Could not reach the server. Make sure the backend is running on port 5001.');
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleCheck();
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= 5000) {
      setInputText(val);
      setCharCount(val.length);
      if (error) setError('');
    }
  };

  const handleOcrText = (extractedText) => {
    setInputText(extractedText);
    setCharCount(extractedText.length);
    setError('');
    textareaRef.current?.focus();
  };

  const handleRecentSelect = (check) => {
    setInputText(check.text);
    setCharCount(check.text.length);
    setResult(check);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setInputText('');
    setCharCount(0);
    setResult(null);
    setError('');
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-tc-bg">
      {/* Header */}
      <header className="border-b border-tc-border bg-tc-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-tc-accent flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">TruthCheck</h1>
              <p className="text-gray-500 text-xs">AI-powered fact verifier</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tc-accent/10 text-tc-accent text-xs font-medium border border-tc-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-tc-accent animate-pulse-slow"></span>
              Live AI Analysis
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 pt-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Verify before you&nbsp;
            <span className="text-tc-accent">share.</span>
          </h2>
          <p className="text-gray-400 text-base max-w-lg mx-auto">
            Paste any WhatsApp forward or social media claim. AI searches real sources and gives you a verdict in seconds.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-tc-surface border border-tc-border rounded-2xl p-5 space-y-4">
          {/* Image Upload (OCR stretch feature) */}
          <ImageUpload onTextExtracted={handleOcrText} />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-tc-border"></div>
            <span className="text-gray-600 text-xs font-medium uppercase tracking-widest">or paste text</span>
            <div className="flex-1 h-px bg-tc-border"></div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              rows={5}
              placeholder={`Paste a forwarded message here…\n\ne.g. "Scientists have discovered that drinking hot water cures cancer. Share this with everyone you know!" `}
              className="textarea-main"
              disabled={loading}
              aria-label="Claim to fact-check"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {inputText && (
                <button
                  onClick={handleReset}
                  className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded"
                  title="Clear"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <span className={`text-xs font-mono ${charCount > 4500 ? 'text-red-400' : 'text-gray-600'}`}>
                {charCount}/5000
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-900/20 border border-red-900/40 animate-fade-in">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-xs hidden sm:block">
              <kbd className="px-1.5 py-0.5 rounded bg-tc-border text-gray-500 font-mono text-xs">⌘</kbd>
              {' '}+{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-tc-border text-gray-500 font-mono text-xs">↵</kbd>
              {' '}to check
            </p>
            <button
              onClick={() => handleCheck()}
              disabled={loading || !inputText.trim()}
              className="btn-primary ml-auto flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Check This Claim
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <LoadingState step={loadingStep} steps={loadingSteps} />
        )}

        {/* Result */}
        {result && !loading && (
          <div ref={resultRef}>
            <VerdictCard result={result} claimText={inputText} />
          </div>
        )}

        {/* Recent Checks */}
        <RecentChecks
          checks={recentChecks}
          loading={recentLoading}
          onSelect={handleRecentSelect}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-tc-border mt-16 py-8">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-sm">
            TruthCheck uses AI + live web search. Always verify critical information from authoritative sources.
          </p>
          <p className="text-gray-700 text-xs font-mono">Powered by Gemini · gemini-2.0-flash</p>
        </div>
      </footer>
    </div>
  );
}
