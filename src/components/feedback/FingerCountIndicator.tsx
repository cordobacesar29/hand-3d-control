interface FingerCountIndicatorProps {
  count: number;
  isTracking?: boolean;
}

/**
 * Visual indicator showing the number of extended fingers (0-5)
 * Uses 5 dots that light up based on count
 */
export function FingerCountIndicator({
  count,
  isTracking = false,
}: FingerCountIndicatorProps) {
  if (!isTracking) return null;

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1.5 bg-black/60 rounded-lg backdrop-blur-sm"
      aria-label={`${count} finger${count === 1 ? '' : 's'} extended`}
      role="status"
      aria-live="polite"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className={`w-2.5 h-2.5 rounded-full transition-colors duration-150 ${
            index < count
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
              : 'bg-gray-600'
          }`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-xs font-medium text-gray-300 tabular-nums">
        {count}
      </span>
    </div>
  );
}
