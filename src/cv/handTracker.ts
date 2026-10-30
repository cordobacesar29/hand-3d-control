import type { HandLandmarks, HandsConfig, Landmark3D } from '../types/hand';

const DEFAULT_CONFIG: HandsConfig = {
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
};

type HandResultCallback = (hands: HandLandmarks[]) => void;

interface MediaPipeHands {
  setOptions: (options: Partial<HandsConfig>) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => void;
}

interface MediaPipeResults {
  multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
  multiHandedness?: Array<{ label: string; score: number }>;
}

declare global {
  interface Window {
    Hands: new (config: { locateFile: (file: string) => string }) => MediaPipeHands;
  }
}

/**
 * MediaPipe Hands tracker with smoothing
 * Loads MediaPipe from CDN
 */
export class HandTracker {
  private hands: MediaPipeHands | null = null;
  private animationId: number | null = null;
  private onResults: HandResultCallback | null = null;
  private smoothingFactor = 0.5;
  private previousLandmarks: Map<string, Landmark3D[]> = new Map();
  private videoElement: HTMLVideoElement | null = null;
  private isRunning = false;

  private config: Partial<HandsConfig>;

  constructor(config: Partial<HandsConfig> = {}) {
    this.config = config;
  }

  public async start(
    videoElement: HTMLVideoElement,
    callback: HandResultCallback
  ): Promise<void> {
    this.onResults = callback;
    this.videoElement = videoElement;

    // Load MediaPipe script if not already loaded
    if (!window.Hands) {
      await this.loadScript(
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
      );
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...this.config };

    this.hands = new window.Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: finalConfig.maxNumHands,
      modelComplexity: finalConfig.modelComplexity,
      minDetectionConfidence: finalConfig.minDetectionConfidence,
      minTrackingConfidence: finalConfig.minTrackingConfidence,
    });

    this.hands.onResults(this.handleResults.bind(this));

    this.isRunning = true;
    this.processFrame();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.hands) {
      this.hands.close();
      this.hands = null;
    }
    this.onResults = null;
    this.videoElement = null;
    this.previousLandmarks.clear();
  }

  private async processFrame(): Promise<void> {
    if (!this.isRunning || !this.hands || !this.videoElement) return;

    if (this.videoElement.readyState >= 2) {
      await this.hands.send({ image: this.videoElement });
    }

    this.animationId = requestAnimationFrame(() => this.processFrame());
  }

  private handleResults(results: MediaPipeResults): void {
    if (!this.onResults) return;

    const hands: HandLandmarks[] = [];

    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i];

        const hand: HandLandmarks = {
          landmarks: this.smoothLandmarks(
            landmarks,
            handedness.label as 'Left' | 'Right'
          ),
          handedness: handedness.label as 'Left' | 'Right',
          score: handedness.score,
        };

        hands.push(hand);
      }
    }

    this.onResults(hands);
  }

  private smoothLandmarks(
    landmarks: Array<{ x: number; y: number; z: number }>,
    handedness: 'Left' | 'Right'
  ): Landmark3D[] {
    const current: Landmark3D[] = landmarks.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
    }));

    const key = handedness;
    const previous = this.previousLandmarks.get(key);

    if (!previous) {
      this.previousLandmarks.set(key, current);
      return current;
    }

    const smoothed = current.map((curr, idx) => {
      const prev = previous[idx];
      return {
        x: this.smoothingFactor * curr.x + (1 - this.smoothingFactor) * prev.x,
        y: this.smoothingFactor * curr.y + (1 - this.smoothingFactor) * prev.y,
        z: this.smoothingFactor * curr.z + (1 - this.smoothingFactor) * prev.z,
      };
    });

    this.previousLandmarks.set(key, smoothed);
    return smoothed;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
}
