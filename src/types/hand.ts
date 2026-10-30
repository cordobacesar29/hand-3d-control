/**
 * Hand tracking types for MediaPipe Hands integration
 */

/**
 * 3D coordinates for a single hand landmark
 */
export interface Landmark3D {
  x: number; // Normalized [0,1], origin at top-left
  y: number; // Normalized [0,1], origin at top-left
  z: number; // Depth relative to wrist (negative = closer to camera)
}

/**
 * Complete hand landmarks (21 points)
 *
 * Landmark indices:
 * 0:  Wrist
 * 1-4:   Thumb (base to tip)
 * 5-8:   Index finger (base to tip)
 * 9-12:  Middle finger (base to tip)
 * 13-16: Ring finger (base to tip)
 * 17-20: Pinky (base to tip)
 */
export interface HandLandmarks {
  landmarks: Landmark3D[];
  handedness: 'Left' | 'Right';
  score: number; // Detection confidence [0,1]
}

/**
 * Hand tracking state
 */
export interface HandTrackingState {
  hands: HandLandmarks[];
  isTracking: boolean;
  confidence: number; // Overall tracking quality [0,1]
  error: string | null;
}

/**
 * MediaPipe Hands configuration
 */
export interface HandsConfig {
  maxNumHands: number;
  modelComplexity: 0 | 1; // 0 = lite, 1 = full
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}
