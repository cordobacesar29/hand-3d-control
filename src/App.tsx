import { useEffect, useRef, useState } from 'react';
import { Scene } from './scene';
import { useHandControl } from './hooks/useHandControl';
import { useScene } from './hooks/useScene';
import { LandmarkOverlay } from './components/feedback';

function App() {
  const {
    worldPosition,
    isGrabbing,
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

  // Move selected object when grabbing
  useEffect(() => {
    if (isGrabbing && selectedId && worldPosition) {
      updateObjectPosition(selectedId, worldPosition);
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
    <div className="flex flex-col w-screen h-screen bg-gray-950 text-white">
      {/* Screen reader announcements for hand detection state */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {handStateAnnouncement}
      </div>
      <header className="px-6 py-3 border-b border-gray-800 bg-black/80 z-10 flex items-center justify-between">
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
        <div className="px-6 py-2 bg-red-900/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      <main className="flex-1 relative overflow-hidden">
        <Scene
          objects={objects}
          selectedId={selectedId}
          onSelect={setSelected}
          handPosition={worldPosition}
          isGrabbing={isGrabbing}
        />

        {/* Video overlay */}
        <div
          className={`absolute bottom-4 left-4 transition-opacity ${
            showVideo && isTracking ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <video
            ref={videoRef}
            className="w-48 h-36 rounded-lg border border-gray-700 bg-black object-cover scale-x-[-1]"
            playsInline
            muted
          />
          <LandmarkOverlay hands={hands} width={192} height={144} />
          {isGrabbing && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Instructions */}
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center space-y-4">
              <p className="text-xl">Click "Start Tracking" to begin</p>
              <p className="text-gray-400 text-sm">
                Pinch (thumb + index) to grab and move the cube
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
