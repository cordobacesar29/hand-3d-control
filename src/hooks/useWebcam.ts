import { useEffect, useRef, useState } from 'react';

interface WebcamState {
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
}

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

/**
 * Hook for webcam capture with graceful error handling
 */
export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<WebcamState>({
    stream: null,
    error: null,
    isLoading: false,
  });

  const startCamera = async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setState({ stream, error: null, isLoading: false });
    } catch (err) {
      const error = err as Error;
      let errorMessage = 'Failed to access camera';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }

      setState({ stream: null, error: errorMessage, isLoading: false });
    }
  };

  const stopCamera = (): void => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      setState({ stream: null, error: null, isLoading: false });
    }
  };

  useEffect(() => {
    return () => {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [state.stream]);

  return {
    videoRef,
    stream: state.stream,
    error: state.error,
    isLoading: state.isLoading,
    startCamera,
    stopCamera,
  };
}
