import { useEffect, useRef, useState } from 'react';
import { useHandTracking } from './useHandTracking';
import { handToWorld, getIndexTip, isPinching } from '../lib';

interface HandControlState {
  worldPosition: [number, number, number] | null;
  isGrabbing: boolean;
  confidence: number;
}

interface UseHandControlReturn extends HandControlState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isTracking: boolean;
  error: string | null;
  hands: import('../types/hand').HandLandmarks[];
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

/**
 * Hook that provides hand position in 3D world coordinates
 * Ready to control scene objects
 */
export function useHandControl(): UseHandControlReturn {
  const {
    hands,
    isTracking,
    error,
    videoRef,
    startTracking,
    stopTracking,
  } = useHandTracking();

  const [state, setState] = useState<HandControlState>({
    worldPosition: null,
    isGrabbing: false,
    confidence: 0,
  });

  // Track previous grab state for edge detection
  const wasGrabbing = useRef(false);

  useEffect(() => {
    if (hands.length === 0) {
      setState({
        worldPosition: null,
        isGrabbing: false,
        confidence: 0,
      });
      return;
    }

    const hand = hands[0];
    const indexTip = getIndexTip(hand.landmarks);

    if (!indexTip) {
      setState((prev) => ({ ...prev, worldPosition: null }));
      return;
    }

    const worldPos = handToWorld(indexTip);
    const grabbing = isPinching(hand.landmarks);

    // Detect grab/release edges
    if (grabbing && !wasGrabbing.current) {
      // Just started grabbing
    } else if (!grabbing && wasGrabbing.current) {
      // Just released
    }
    wasGrabbing.current = grabbing;

    setState({
      worldPosition: [worldPos.x, worldPos.y, worldPos.z],
      isGrabbing: grabbing,
      confidence: hand.score,
    });
  }, [hands]);

  return {
    ...state,
    videoRef,
    isTracking,
    error,
    hands,
    startTracking,
    stopTracking,
  };
}
