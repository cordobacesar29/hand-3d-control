import { useState } from 'react';

interface PhysicsInstructionsProps {
  isGrabbing: boolean;
  isTracking: boolean;
}

/**
 * Instructions panel explaining physics features and grab/throw mechanics
 */
export function PhysicsInstructions({ isGrabbing, isTracking }: PhysicsInstructionsProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || !isTracking) return null;

  return (
    <div className="absolute top-20 left-4 bg-black/80 text-white p-4 rounded-lg shadow-lg max-w-xs z-30 border border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold">🎮 Physics Controls</h3>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-gray-400 hover:text-white transition-colors ml-2"
          aria-label="Dismiss instructions"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg">✋</span>
          <div>
            <div className="font-semibold">Open Hand</div>
            <div className="text-gray-400">Show hand tracking cursor</div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-lg">👌</span>
          <div>
            <div className="font-semibold">Pinch (close fingers)</div>
            <div className="text-gray-400">Grab nearest object</div>
            <div className="text-gray-400">Move hand to drag object</div>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-lg">✋</span>
          <div>
            <div className="font-semibold">Release (open hand)</div>
            <div className="text-gray-400">Throw object with velocity</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="font-semibold mb-1">📦 Physics Active</div>
          <div className="text-gray-400 space-y-1">
            <div>✓ Gravity enabled</div>
            <div>✓ Collisions enabled</div>
            <div>✓ Objects fall and bounce</div>
          </div>
        </div>

        {isGrabbing && (
          <div className="bg-green-900/30 border border-green-600 rounded p-2 mt-3 text-green-400 font-semibold">
            ✓ Grabbing object
          </div>
        )}
      </div>
    </div>
  );
}
