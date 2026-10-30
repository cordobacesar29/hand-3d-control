import type { Landmark3D } from '../types/hand';

interface WorldCoords {
  x: number;
  y: number;
  z: number;
}

interface MappingConfig {
  xRange: [number, number]; // World X range
  yRange: [number, number]; // World Y range
  zRange: [number, number]; // World Z range (depth)
}

const DEFAULT_CONFIG: MappingConfig = {
  xRange: [-6, 6], // Match horizontal visible area at z=0 (~[-6.8, 6.8])
  yRange: [-3, 3], // Centered range for natural hand movement
  zRange: [-3, 3], // Wider depth range for natural movement
};

/**
 * Map normalized hand landmark to 3D world coordinates
 *
 * Hand coords: x,y in [0,1], z relative to wrist
 * World coords: configurable range, default [-6,6] for x
 */
export function handToWorld(
  landmark: Landmark3D,
  config: MappingConfig = DEFAULT_CONFIG
): WorldCoords {
  // Invert X because camera is mirrored
  const normalizedX = 1 - landmark.x;
  // Invert Y because screen Y is top-down, world Y is bottom-up
  const normalizedY = 1 - landmark.y;
  // MediaPipe Z is roughly [-0.3, 0.3] relative to wrist
  // Map to [0,1] by clamping and scaling
  const clampedZ = Math.max(-0.3, Math.min(0.3, landmark.z));
  const normalizedZ = (clampedZ + 0.3) / 0.6; // Maps [-0.3, 0.3] to [0, 1]

  return {
    x: lerp(config.xRange[0], config.xRange[1], normalizedX),
    y: lerp(config.yRange[0], config.yRange[1], normalizedY),
    z: lerp(config.zRange[0], config.zRange[1], normalizedZ),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Get index finger tip position (landmark 8)
 */
export function getIndexTip(landmarks: Landmark3D[]): Landmark3D | null {
  return landmarks[8] ?? null;
}

/**
 * Check if hand is in "pinch" gesture (thumb tip close to index tip)
 */
export function isPinching(landmarks: Landmark3D[], threshold = 0.05): boolean {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  if (!thumbTip || !indexTip) return false;

  const distance = Math.sqrt(
    (thumbTip.x - indexTip.x) ** 2 +
    (thumbTip.y - indexTip.y) ** 2 +
    (thumbTip.z - indexTip.z) ** 2
  );

  return distance < threshold;
}
