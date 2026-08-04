import { useState } from 'react';

const VERDICT_CONFIG = {
  TRUE: {
    label: 'True',
    color: 'text-tc-true',
    bg: 'bg-tc-true/10',
    border: 'border-tc-true/30',
    glow: 'glow-true',
    barColor: 'bg-tc-true',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M5 13l4 4L19 7" />
      </svg>
    ),
    badge: 'bg-tc-true/20 text-tc-true border-tc-true/40',
    emoji: '✅'
  },
  FALSE: {
    label: 'False',
    color: 'text-tc-false',
    bg: 'bg-tc-false/10',
    border: 'border-tc-false/30',
    glow: 'glow-false',
    barColor: 'bg-tc-false',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    badge: 'bg-tc-false/20 text-tc-false border-tc-false/40',
    emoji: '❌'
  },
  MISLEADING: {
    label: 'Misleading',
    color: 'text-tc-mislead',
    bg: 'bg-tc-mislead/10',
    border: 'border-tc-mislead/30',
    glow: 'glow-misleading',
    barColor: 'bg-tc-mislead',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    badge: 'bg-tc-mislead/20 text-tc-mislead border-tc-mislead/40',
    emoji: '⚠️'
  },
  UNVERIFIED: {
    label: 'Unverified',
    color: 'text-tc-unverified',
    bg: 'bg-tc-unverified/10',
    border: 'border-tc-unverified/30',
    glow: 'glow-unverified',
    barColor: 'bg-tc-unverified',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badge: 'bg-tc-unverified/20 text-tc-unverified border-tc-unverified/40',
    emoji: '❓'
  }
};

function ConfidenceBar({ confidence, color }) {
  const width = Math.max(2, Math.min(100, confidence));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Confidence</span>
        <span className="text-white font-bold text-sm font-mono">{confidence}%</span>
      </div>
      <div className="h-2 bg-tc-border rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ShareButton({ result, claimText }) {
  const [copied, setCopied] = useState(false);

  const shareText = `🔍 TruthCheck Result\n\nClaim: "${claimText.substring(0, 100)}${claimText.length > 100 ? '...' : ''}"\n\nVerdict: ${VERDICT_CONFIG[result.verdict]?.emoji} ${result.verdict}\nConfidence: ${result.confidence}%\n\n${result.reasoning}\n\nVerify claims at TruthCheck`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText, title: 'TruthCheck Result' });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled or API unavailable
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tc-border text-gray-400 hover:text-white hover:border-gray-500 transition-all text-xs font-medium"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-tc-true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}

export default function VerdictCard({ result, claimText }) {
  const config = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.UNVERIFIED;

  return (
    <div className={`verdict-card ${config.bg} ${config.border} ${config.glow} border`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          {/* Verdict icon */}
          <div className={`w-12 h-12 rounded-xl ${config.bg} ${config.border} border-2 flex items-center justify-center ${config.color} shrink-0`}>
            {config.icon}
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Verdict</p>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-extrabold ${config.color}`}>{config.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${config.badge}`}>
                {config.emoji}
              </span>
            </div>
          </div>
        </div>
        <ShareButton result={result} claimText={claimText} />
      </div>

      {/* Confidence bar */}
      <div className="mb-5">
        <ConfidenceBar confidence={result.confidence} color={config.barColor} />
      </div>

      {/* Reasoning */}
      <div className="mb-5">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Analysis</p>
        <p className="text-gray-200 text-sm leading-relaxed">{result.reasoning}</p>
      </div>

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2.5">Sources</p>
          <div className="flex flex-wrap gap-2">
            {result.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`source-chip ${config.border} ${config.bg} ${config.color} hover:opacity-90`}
                title={source.url}
              >
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="truncate max-w-[160px]">
                  {source.title || (() => {
                    try { return new URL(source.url).hostname; }
                    catch { return source.url; }
                  })()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {result.createdAt && (
        <div className="mt-4 pt-4 border-t border-tc-border/50">
          <p className="text-gray-600 text-xs">
            Checked on {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
