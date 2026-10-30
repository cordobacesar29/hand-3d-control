import { useRef, useEffect } from 'react';
import type { HandLandmarks } from '../../types/hand';

interface LandmarkOverlayProps {
  hands: HandLandmarks[];
  width?: number;
  height?: number;
}

// MediaPipe hand skeleton connections
const FINGER_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17],
];

const LANDMARK_RADIUS = 3;
const LINE_WIDTH = 2;
const LANDMARK_COLOR = '#00ff88';
const LINE_COLOR = '#00ccff';

/**
 * Draws hand skeleton landmarks on a canvas overlay
 */
export function LandmarkOverlay({
  hands,
  width = 192,
  height = 144,
}: LandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw each hand
    for (const hand of hands) {
      const { landmarks } = hand;
      if (landmarks.length !== 21) continue;

      // Draw connections (lines)
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';

      for (const [startIdx, endIdx] of FINGER_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }

      // Draw landmarks (circles)
      ctx.fillStyle = LANDMARK_COLOR;

      for (const landmark of landmarks) {
        ctx.beginPath();
        ctx.arc(
          landmark.x * width,
          landmark.y * height,
          LANDMARK_RADIUS,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }, [hands, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none scale-x-[-1]"
      aria-hidden="true"
    />
  );
}
