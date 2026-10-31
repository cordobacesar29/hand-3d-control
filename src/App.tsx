import { useEffect, useRef, useState } from 'react';
import { Scene } from './scene';
import { useHandControl } from './hooks/useHandControl';
import { useScene } from './hooks/useScene';
import { LandmarkOverlay, DualFingerCountIndicator } from './components/feedback';

type OwningHand = 'left' | 'right' | null;

function App() {
  const {
    leftHand,
    rightHand,
    isTracking,
    confidence,
    error,
    videoRef,
    hands,
    startTracking,
    stopTracking,
  } = useHandControl();

  const { objects, selectedId, setSelected, updateObjectPosition } = useScene();

  const [showVideo, setShowVideo] = useState(true);
  const [owningHand, setOwningHand] = useState<OwningHand>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Track window resize for LandmarkOverlay dimensions
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Derive combined state for legacy code paths
  const activeHand = owningHand === 'left' ? leftHand : owningHand === 'right' ? rightHand : null;
  const worldPosition = activeHand?.worldPosition ?? null;
  const isGrabbing = activeHand?.isGrabbing ?? false;

  // Track hand detection state for aria-live announcements
  const wasHandDetected = useRef(false);
  const [handStateAnnouncement, setHandStateAnnouncement] = useState('');

  // Announce hand detection state changes
  useEffect(() => {
    const isHandDetected = hands.length > 0;
    if (isHandDetected !== wasHandDetected.current) {
      wasHandDetected.current = isHandDetected;
      setHandStateAnnouncement(isHandDetected ? 'Hand detected' : 'No hand detected');
    }
  }, [hands]);

  // Object handoff logic between hands
  useEffect(() => {
    const leftGrabbing = leftHand?.isGrabbing ?? false;
    const rightGrabbing = rightHand?.isGrabbing ?? false;

    if (owningHand === null) {
      // No owner - first hand to grab gets ownership
      if (leftGrabbing) {
        setOwningHand('left');
      } else if (rightGrabbing) {
        setOwningHand('right');
      }
    } else if (owningHand === 'left') {
      // Left owns - check for handoff
      if (!leftGrabbing && rightGrabbing) {
        // Left released, right is grabbing -> transfer
        setOwningHand('right');
      } else if (!leftGrabbing && !rightGrabbing) {
        // Both released -> keep ownership (object stays in place)
      }
      // If both grabbing -> keep left (no fighting)
    } else if (owningHand === 'right') {
      // Right owns - check for handoff
      if (!rightGrabbing && leftGrabbing) {
        // Right released, left is grabbing -> transfer
        setOwningHand('left');
      } else if (!rightGrabbing && !leftGrabbing) {
        // Both released -> keep ownership (object stays in place)
      }
      // If both grabbing -> keep right (no fighting)
    }
  }, [leftHand?.isGrabbing, rightHand?.isGrabbing, owningHand]);

  // Move selected object when grabbing (with Y offset so object hovers above hand)
  useEffect(() => {
    if (isGrabbing && selectedId && worldPosition) {
      const offsetPosition: [number, number, number] = [
        worldPosition[0],
        worldPosition[1] + 0.5, // Object hovers above hand
        worldPosition[2],
      ];
      updateObjectPosition(selectedId, offsetPosition);
    }
  }, [isGrabbing, selectedId, worldPosition, updateObjectPosition]);

  // Auto-select object when grabbing near it
  useEffect(() => {
    if (isGrabbing && !selectedId && worldPosition) {
      const nearObject = objects.find((obj) => {
        const dx = obj.position[0] - worldPosition[0];
        const dy = obj.position[1] - worldPosition[1];
        const dz = obj.position[2] - worldPosition[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < 1;
      });
      if (nearObject) {
        setSelected(nearObject.id);
      }
    }
  }, [isGrabbing, selectedId, worldPosition, objects, setSelected]);

  // Release object when stop grabbing
  useEffect(() => {
    if (!isGrabbing && selectedId) {
      // Keep selected for visual feedback, or uncomment to auto-release:
      // setSelected(null);
    }
  }, [isGrabbing, selectedId]);

  return (
    <div className="relative w-screen h-screen overflow-hidden text-white">
      {/* Screen reader announcements for hand detection state */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {handStateAnnouncement}
      </div>

      {/* Background: Full-screen webcam video */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity ${
          showVideo && isTracking ? 'opacity-100' : 'opacity-0'
        }`}
        playsInline
        muted
      />

      {/* Hand skeleton overlay (matches video size) */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity ${
          showVideo && isTracking ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <LandmarkOverlay hands={hands} width={windowSize.width} height={windowSize.height} />
      </div>

      {/* 3D Scene (transparent background, floats on top) */}
      <div className="absolute inset-0">
        <Scene
          objects={objects}
          selectedId={selectedId}
          onSelect={setSelected}
          handPosition={worldPosition}
          isGrabbing={isGrabbing}
        />
      </div>

      {/* UI Header */}
      <header className="absolute top-0 left-0 right-0 px-6 py-3 border-b border-gray-800 bg-black/80 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Hand 3D Control</h1>
          <p className="text-xs text-gray-500">
            {isTracking
              ? `Tracking • ${(confidence * 100).toFixed(0)}% confidence`
              : 'Not tracking'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            {showVideo ? 'Hide' : 'Show'} Video
          </button>
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              isTracking
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isTracking ? 'Stop' : 'Start'} Tracking
          </button>
        </div>
      </header>

      {error && (
        <div className="absolute top-16 left-0 right-0 px-6 py-2 bg-red-900/50 text-red-200 text-sm z-20">
          {error}
        </div>
      )}

      {/* Finger count indicator */}
      <div
        className={`absolute bottom-4 left-4 z-20 transition-opacity ${
          isTracking ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <DualFingerCountIndicator
          leftHand={leftHand ? { count: leftHand.extendedFingerCount, isGrabbing: leftHand.isGrabbing } : null}
          rightHand={rightHand ? { count: rightHand.extendedFingerCount, isGrabbing: rightHand.isGrabbing } : null}
          owningHand={owningHand}
          isTracking={isTracking}
        />
      </div>

      {/* Instructions overlay */}
      {!isTracking && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center space-y-4">
            <p className="text-xl">Click "Start Tracking" to begin</p>
            <p className="text-gray-400 text-sm">
              Pinch (thumb + index) to grab and move the object
            </p>
            <p className="text-gray-400 text-sm">
              Swipe with open right hand to rotate the scene
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
