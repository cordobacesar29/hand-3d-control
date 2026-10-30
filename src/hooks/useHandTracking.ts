import { useEffect, useState, useCallback } from 'react';
import { useWebcam } from './useWebcam';
import { HandTracker } from '../cv/handTracker';
import type { HandTrackingState, HandsConfig } from '../types/hand';

interface UseHandTrackingConfig {
  autoStart?: boolean;
  handsConfig?: Partial<HandsConfig>;
}

interface UseHandTrackingReturn extends HandTrackingState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  isLoading: boolean;
}

/**
 * Hook for hand tracking using MediaPipe Hands
 */
export function useHandTracking(
  config: UseHandTrackingConfig = {}
): UseHandTrackingReturn {
  const { autoStart = false, handsConfig } = config;
  const { videoRef, error: webcamError, isLoading, startCamera, stopCamera } = useWebcam();

  const [state, setState] = useState<HandTrackingState>({
    hands: [],
    isTracking: false,
    confidence: 0,
    error: null,
  });

  const [tracker, setTracker] = useState<HandTracker | null>(null);

  const startTracking = useCallback(async (): Promise<void> => {
    try {
      await startCamera();

      if (!videoRef.current) {
        setState((prev) => ({
          ...prev,
          error: 'Video element not available',
        }));
        return;
      }

      const newTracker = new HandTracker(handsConfig);

      newTracker.start(videoRef.current, (hands) => {
        const avgConfidence = hands.length > 0
          ? hands.reduce((sum, h) => sum + h.score, 0) / hands.length
          : 0;

        setState({
          hands,
          isTracking: true,
          confidence: avgConfidence,
          error: null,
        });
      });

      setTracker(newTracker);
      setState((prev) => ({ ...prev, isTracking: true }));
    } catch (err) {
      const error = err as Error;
      setState({
        hands: [],
        isTracking: false,
        confidence: 0,
        error: error.message || 'Failed to start hand tracking',
      });
    }
  }, [startCamera, videoRef, handsConfig]);

  const stopTracking = useCallback((): void => {
    if (tracker) {
      tracker.stop();
      setTracker(null);
    }
    stopCamera();
    setState({
      hands: [],
      isTracking: false,
      confidence: 0,
      error: null,
    });
  }, [tracker, stopCamera]);

  useEffect(() => {
    if (autoStart) {
      startTracking();
    }
  }, [autoStart, startTracking]);

  useEffect(() => {
    return () => {
      tracker?.stop();
    };
  }, [tracker]);

  useEffect(() => {
    if (webcamError) {
      setState((prev) => ({
        ...prev,
        error: webcamError,
        isTracking: false,
      }));
    }
  }, [webcamError]);

  return {
    ...state,
    videoRef,
    startTracking,
    stopTracking,
    isLoading,
  };
}
