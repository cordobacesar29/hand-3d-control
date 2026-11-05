import { useEffect, useRef, useState } from 'react';
import { Scene } from './scene';
import { useHandControl } from './hooks/useHandControl';
import { useScene } from './hooks/useScene';
import { useGrab, getBodyId } from './physics/useGrab';
import { LandmarkOverlay, DualFingerCountIndicator, PhysicsInstructions } from './components/feedback';
import { SignGame } from './components/game';

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

  const {
    objects,
    selectedId,
    setSelected,
  } = useScene();

  const [showVideo, setShowVideo] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [grabbableId, setGrabbableId] = useState<string | null>(null);

  // Grab/throw mechanics (for primary hand) - improved grab distance
  const { grab, release, updateGrabbedPosition, getGrabInfo } = useGrab({
    maxGrabDistance: 5.0,      // Increased from 2.0 - easier to grab
    previewDistance: 6.0,       // Show feedback slightly beyond grab range
    throwForce: 5.0,
    releaseHysteresis: 0.1,     // Prevent accidental release on hand jitter
  });

  // Track grab preview state for visual feedback
  const [grabPreview, setGrabPreview] = useState<{
    canGrab: boolean;
    distance: number | null;
  }>({ canGrab: false, distance: null });

  // Track previous grab state for edge detection
  const wasGrabbing = useRef(false);

  // Track window resize for LandmarkOverlay dimensions
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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


  // Handle grab/throw mechanics (using primary hand)
  useEffect(() => {
    const primaryHand = leftHand ?? rightHand;
    if (!primaryHand || !primaryHand.worldPosition) {
      wasGrabbing.current = false;
      setGrabPreview({ canGrab: false, distance: null });
      setGrabbableId(null);
      return;
    }

    const isCurrentlyGrabbing = primaryHand.isGrabbing;

    // Update grab preview for visual feedback (even when not grabbing)
    if (!isCurrentlyGrabbing) {
      const info = getGrabInfo(primaryHand.worldPosition);
      const bodyId = getBodyId(info.nearestBody);
      setGrabPreview({
        canGrab: info.canGrab,
        distance: info.distanceToNearest,
      });
      // Store the grabbable object ID separately for Scene
      setGrabbableId(info.canGrab && bodyId ? bodyId : null);
    }

    // Detect grab start (edge: not grabbing -> grabbing)
    if (isCurrentlyGrabbing && !wasGrabbing.current) {
      grab(primaryHand.worldPosition);
      setGrabPreview({ canGrab: false, distance: null });
      setGrabbableId(null); // Clear grabbable highlight when grabbed
    }
    // Detect grab release (edge: grabbing -> not grabbing)
    else if (!isCurrentlyGrabbing && wasGrabbing.current) {
      release(primaryHand.velocity);
    }
    // While grabbing: update grabbed object position
    else if (isCurrentlyGrabbing) {
      updateGrabbedPosition(primaryHand.worldPosition);
    }

    wasGrabbing.current = isCurrentlyGrabbing;
  }, [leftHand, rightHand, grab, release, updateGrabbedPosition, getGrabInfo]);

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
          grabbableObjectId={grabbableId}
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
            onClick={() => setShowGame(!showGame)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              showGame
                ? 'bg-purple-600 hover:bg-purple-500'
                : 'bg-purple-700 hover:bg-purple-600'
            }`}
          >
            {showGame ? 'Close' : 'Play'} Sign Game
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

      {/* Physics instructions panel */}
      <PhysicsInstructions
        isGrabbing={(leftHand?.isGrabbing || rightHand?.isGrabbing) ?? false}
        isTracking={isTracking}
      />

      {/* Grab preview indicator - shows when object is grabbable */}
      {isTracking && grabPreview.canGrab && (
        <div className="absolute bottom-20 left-4 z-20 px-3 py-2 bg-green-600/90 text-white text-sm rounded-lg shadow-lg animate-pulse">
          Object in range - pinch to grab
          {grabPreview.distance && (
            <span className="ml-2 text-green-200">
              ({grabPreview.distance.toFixed(1)}m)
            </span>
          )}
        </div>
      )}

      {/* Finger count indicator */}
      <div
        className={`absolute bottom-4 left-4 z-20 transition-opacity ${
          isTracking && !showGame ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <DualFingerCountIndicator
          leftHand={leftHand ? { count: leftHand.extendedFingerCount, isGrabbing: leftHand.isGrabbing } : null}
          rightHand={rightHand ? { count: rightHand.extendedFingerCount, isGrabbing: rightHand.isGrabbing } : null}
          owningHand={null}
          isTracking={isTracking}
        />
      </div>

      {/* Sign language learning game */}
      {showGame && (
        <SignGame
          landmarks={hands[0]?.landmarks ?? null}
          isTracking={isTracking}
          onClose={() => setShowGame(false)}
        />
      )}

      {/* Instructions overlay */}
      {!isTracking && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center space-y-4">
            <p className="text-xl">Click "Start Tracking" to begin</p>
            <p className="text-gray-400 text-sm">
              Open your hand to make a cube appear and follow your palm
            </p>
            <p className="text-gray-400 text-sm">
              Close your hand (pinch) to hide the cube
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
