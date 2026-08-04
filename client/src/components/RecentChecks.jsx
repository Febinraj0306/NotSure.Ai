const VERDICT_STYLES = {
  TRUE: { dot: 'bg-tc-true', label: 'text-tc-true', text: 'TRUE' },
  FALSE: { dot: 'bg-tc-false', label: 'text-tc-false', text: 'FALSE' },
  MISLEADING: { dot: 'bg-tc-mislead', label: 'text-tc-mislead', text: 'MISLEADING' },
  UNVERIFIED: { dot: 'bg-tc-unverified', label: 'text-tc-unverified', text: 'UNVERIFIED' }
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <div className="w-2.5 h-2.5 rounded-full shimmer shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 shimmer rounded-full w-3/4" />
        <div className="h-2 shimmer rounded-full w-1/3" />
      </div>
      <div className="h-4 w-16 shimmer rounded-full shrink-0" />
    </div>
  );
}

export default function RecentChecks({ checks, loading, onSelect }) {
  if (!loading && checks.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
          Recent Checks
        </h3>
        <div className="bg-tc-surface border border-tc-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-tc-border flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No checks yet. Be the first to verify a claim!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
          Recent Checks
        </h3>
        <span className="text-gray-600 text-xs">Last 10 · Public</span>
      </div>

      <div className="bg-tc-surface border border-tc-border rounded-2xl overflow-hidden divide-y divide-tc-border">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <SkeletonRow />
            </div>
          ))
        ) : (
          checks.map((check) => {
            const style = VERDICT_STYLES[check.verdict] || VERDICT_STYLES.UNVERIFIED;
            return (
              <button
                key={check._id}
                onClick={() => onSelect(check)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-tc-border/30 transition-colors text-left group"
              >
                <div className={`w-2 h-2 rounded-full ${style.dot} mt-2 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
                    {check.text}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">{timeAgo(check.createdAt)}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold font-mono ${style.label}`}>
                    {style.text}
                  </span>
                  <span className="text-gray-600 text-xs">{check.confidence}%</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
