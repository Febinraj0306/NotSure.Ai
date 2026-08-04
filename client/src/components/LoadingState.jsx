export default function LoadingState({ step, steps }) {
  return (
    <div className="bg-tc-surface border border-tc-border rounded-2xl p-6 animate-fade-in">
      {/* Animated radar graphic */}
      <div className="flex justify-center mb-6">
        <div className="relative w-20 h-20">
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full border-2 border-tc-accent/30 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-2 rounded-full border-2 border-tc-accent/50 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-tc-accent/20 border-2 border-tc-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-tc-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Step label */}
      <div className="text-center mb-6">
        <p className="text-white font-semibold text-base mb-1 transition-all duration-500">
          {steps[step] || steps[0]}
        </p>
        <p className="text-gray-500 text-sm">This usually takes 5–15 seconds</p>
      </div>

      {/* Progress steps */}
      <div className="space-y-2.5 max-w-xs mx-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
              i < step
                ? 'bg-tc-true border-tc-true'
                : i === step
                  ? 'bg-tc-accent/20 border-tc-accent border-2 animate-pulse-slow'
                  : 'bg-tc-border border-tc-border border-2'
            }`}>
              {i < step && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {i === step && (
                <div className="w-2 h-2 rounded-full bg-tc-accent" />
              )}
            </div>
            <span className={`text-sm transition-colors duration-300 ${
              i < step ? 'text-tc-true line-through' : i === step ? 'text-white font-medium' : 'text-gray-600'
            }`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Skeleton preview */}
      <div className="mt-6 space-y-2 opacity-40">
        <div className="h-3 shimmer rounded-full w-3/4 mx-auto" />
        <div className="h-3 shimmer rounded-full w-1/2 mx-auto" />
        <div className="h-3 shimmer rounded-full w-2/3 mx-auto" />
      </div>
    </div>
  );
}
