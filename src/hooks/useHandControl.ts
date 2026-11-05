import { useEffect, useRef, useState } from 'react';
import { useHandTracking } from './useHandTracking';
import { handToWorld, getIndexTip, isPinching, countExtendedFingers } from '../lib';

interface SingleHandState {
  worldPosition: [number, number, number];
  isGrabbing: boolean;
  extendedFingerCount: number;
  confidence: number;
  velocity: [number, number, number];
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
  /** Legacy: velocity of first detected hand */
  velocity: [number, number, number];
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
  hand: import('../types/hand').HandLandmarks,
  prevPosition: [number, number, number] | null,
  currentVelocity: [number, number, number]
): SingleHandState | null {
  const indexTip = getIndexTip(hand.landmarks);
  if (!indexTip) return null;

  const worldPos = handToWorld(indexTip);
  const currentPosition: [number, number, number] = [worldPos.x, worldPos.y, worldPos.z];

  // Calculate velocity delta
  let newVelocity: [number, number, number] = [0, 0, 0];
  if (prevPosition !== null) {
    const delta: [number, number, number] = [
      currentPosition[0] - prevPosition[0],
      currentPosition[1] - prevPosition[1],
      currentPosition[2] - prevPosition[2],
    ];
    // Smooth velocity: velocity = velocity * 0.5 + delta * 0.5
    newVelocity = [
      currentVelocity[0] * 0.5 + delta[0] * 0.5,
      currentVelocity[1] * 0.5 + delta[1] * 0.5,
      currentVelocity[2] * 0.5 + delta[2] * 0.5,
    ];
  }

  return {
    worldPosition: currentPosition,
    isGrabbing: isPinching(hand.landmarks),
    extendedFingerCount: countExtendedFingers(hand.landmarks),
    confidence: hand.score,
    velocity: newVelocity,
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
    velocity: [0, 0, 0],
  });

  // Track previous grab state for edge detection (per hand)
  const wasLeftGrabbing = useRef(false);
  const wasRightGrabbing = useRef(false);

  // Track previous positions for velocity calculation (per hand)
  const prevLeftPos = useRef<[number, number, number] | null>(null);
  const prevRightPos = useRef<[number, number, number] | null>(null);

  // Track smoothed velocity (per hand)
  const leftVelocity = useRef<[number, number, number]>([0, 0, 0]);
  const rightVelocity = useRef<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (hands.length === 0) {
      setState({
        leftHand: null,
        rightHand: null,
        worldPosition: null,
        isGrabbing: false,
        confidence: 0,
        extendedFingerCount: 0,
        velocity: [0, 0, 0],
      });
      wasLeftGrabbing.current = false;
      wasRightGrabbing.current = false;
      prevLeftPos.current = null;
      prevRightPos.current = null;
      leftVelocity.current = [0, 0, 0];
      rightVelocity.current = [0, 0, 0];
      return;
    }

    let leftHand: SingleHandState | null = null;
    let rightHand: SingleHandState | null = null;

    // Assign hands based on MediaPipe handedness
    // Note: MediaPipe reports handedness from the camera's perspective,
    // and since video is mirrored, "Left" from MediaPipe is actually the user's RIGHT hand
    for (const hand of hands) {
      if (hand.handedness === 'Left') {
        // MediaPipe "Left" = user's right hand (mirrored video)
        const handState = computeHandState(hand, prevRightPos.current, rightVelocity.current);
        if (!handState) continue;

        rightHand = handState;
        // Update velocity and previous position for next frame
        rightVelocity.current = handState.velocity;
        prevRightPos.current = handState.worldPosition;

        // Detect grab/release edges for right hand
        if (handState.isGrabbing && !wasRightGrabbing.current) {
          // Right hand just started grabbing
        } else if (!handState.isGrabbing && wasRightGrabbing.current) {
          // Right hand just released
        }
        wasRightGrabbing.current = handState.isGrabbing;
      } else {
        // MediaPipe "Right" = user's left hand (mirrored video)
        const handState = computeHandState(hand, prevLeftPos.current, leftVelocity.current);
        if (!handState) continue;

        leftHand = handState;
        // Update velocity and previous position for next frame
        leftVelocity.current = handState.velocity;
        prevLeftPos.current = handState.worldPosition;

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
      velocity: primaryHand?.velocity ?? [0, 0, 0],
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
