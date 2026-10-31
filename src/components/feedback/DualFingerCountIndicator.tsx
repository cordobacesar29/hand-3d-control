interface HandFingerCount {
  count: number;
  isGrabbing: boolean;
}

interface DualFingerCountIndicatorProps {
  leftHand: HandFingerCount | null;
  rightHand: HandFingerCount | null;
  owningHand: 'left' | 'right' | null;
  isTracking?: boolean;
}

/**
 * Visual indicator showing finger counts for both hands
 * Highlights which hand currently "owns" the object
 */
export function DualFingerCountIndicator({
  leftHand,
  rightHand,
  owningHand,
  isTracking = false,
}: DualFingerCountIndicatorProps) {
  if (!isTracking) return null;

  const hasAnyHand = leftHand !== null || rightHand !== null;
  if (!hasAnyHand) return null;

  return (
    <div
      className="flex flex-col gap-1 px-2 py-1.5 bg-black/60 rounded-lg backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      {/* Left hand */}
      <HandIndicator
        label="L"
        hand={leftHand}
        isOwner={owningHand === 'left'}
      />
      {/* Right hand */}
      <HandIndicator
        label="R"
        hand={rightHand}
        isOwner={owningHand === 'right'}
      />
    </div>
  );
}

function HandIndicator({
  label,
  hand,
  isOwner,
}: {
  label: string;
  hand: HandFingerCount | null;
  isOwner: boolean;
}) {
  const isActive = hand !== null;
  const count = hand?.count ?? 0;
  const isGrabbing = hand?.isGrabbing ?? false;

  return (
    <div
      className={`flex items-center gap-1.5 transition-opacity ${
        isActive ? 'opacity-100' : 'opacity-30'
      }`}
      aria-label={
        isActive
          ? `${label === 'L' ? 'Left' : 'Right'} hand: ${count} finger${count === 1 ? '' : 's'}${isOwner ? ', holding object' : ''}`
          : `${label === 'L' ? 'Left' : 'Right'} hand: not detected`
      }
    >
      {/* Hand label with owner indicator */}
      <span
        className={`text-xs font-bold w-4 ${
          isOwner ? 'text-amber-400' : 'text-gray-400'
        }`}
      >
        {label}
      </span>

      {/* Finger dots */}
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-150 ${
              isActive && index < count
                ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]'
                : 'bg-gray-600'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Grab indicator */}
      {isGrabbing && (
        <div
          className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
