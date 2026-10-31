import { useEffect, useRef, useState } from 'react';
import { useHandTracking } from './useHandTracking';
import { handToWorld, getIndexTip, isPinching, countExtendedFingers } from '../lib';

interface SingleHandState {
  worldPosition: [number, number, number];
  isGrabbing: boolean;
  extendedFingerCount: number;
  confidence: number;
}

interface HandControlState {
  /** Left hand data (null if not detected) */
  leftHand: SingleHandState | null;
  /** Right hand data (null if not detected) */
  rightHand: SingleHandState | null;
  /** Legacy: position of first detected hand (for backward compatibility) */
  worldPosition: [number, number, number] | null;
  /** Legacy: grabbing state of first detected hand */
  isGrabbing: boolean;
  /** Legacy: confidence of first detected hand */
  confidence: number;
  /** Legacy: finger count of first detected hand */
  extendedFingerCount: number;
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
 * Compute state for a single hand from landmarks
 */
function computeHandState(
  hand: import('../types/hand').HandLandmarks
): SingleHandState | null {
  const indexTip = getIndexTip(hand.landmarks);
  if (!indexTip) return null;

  const worldPos = handToWorld(indexTip);
  return {
    worldPosition: [worldPos.x, worldPos.y, worldPos.z],
    isGrabbing: isPinching(hand.landmarks),
    extendedFingerCount: countExtendedFingers(hand.landmarks),
    confidence: hand.score,
  };
}

/**
 * Hook that provides hand position in 3D world coordinates
 * Supports two-hand tracking with left/right assignment
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
    leftHand: null,
    rightHand: null,
    worldPosition: null,
    isGrabbing: false,
    confidence: 0,
    extendedFingerCount: 0,
  });

  // Track previous grab state for edge detection (per hand)
  const wasLeftGrabbing = useRef(false);
  const wasRightGrabbing = useRef(false);

  useEffect(() => {
    if (hands.length === 0) {
      setState({
        leftHand: null,
        rightHand: null,
        worldPosition: null,
        isGrabbing: false,
        confidence: 0,
        extendedFingerCount: 0,
      });
      wasLeftGrabbing.current = false;
      wasRightGrabbing.current = false;
      return;
    }

    let leftHand: SingleHandState | null = null;
    let rightHand: SingleHandState | null = null;

    // Assign hands based on MediaPipe handedness
    // Note: MediaPipe reports handedness from the camera's perspective,
    // and since video is mirrored, "Left" from MediaPipe is actually the user's RIGHT hand
    for (const hand of hands) {
      const handState = computeHandState(hand);
      if (!handState) continue;

      if (hand.handedness === 'Left') {
        // MediaPipe "Left" = user's right hand (mirrored video)
        rightHand = handState;
        // Detect grab/release edges for right hand
        if (handState.isGrabbing && !wasRightGrabbing.current) {
          // Right hand just started grabbing
        } else if (!handState.isGrabbing && wasRightGrabbing.current) {
          // Right hand just released
        }
        wasRightGrabbing.current = handState.isGrabbing;
      } else {
        // MediaPipe "Right" = user's left hand (mirrored video)
        leftHand = handState;
        // Detect grab/release edges for left hand
        if (handState.isGrabbing && !wasLeftGrabbing.current) {
          // Left hand just started grabbing
        } else if (!handState.isGrabbing && wasLeftGrabbing.current) {
          // Left hand just released
        }
        wasLeftGrabbing.current = handState.isGrabbing;
      }
    }

    // Legacy compatibility: use first available hand for single-hand API
    const primaryHand = leftHand ?? rightHand;

    setState({
      leftHand,
      rightHand,
      worldPosition: primaryHand?.worldPosition ?? null,
      isGrabbing: primaryHand?.isGrabbing ?? false,
      confidence: primaryHand?.confidence ?? 0,
      extendedFingerCount: primaryHand?.extendedFingerCount ?? 0,
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
