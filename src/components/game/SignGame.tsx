import { useEffect, useState, useCallback, useRef } from 'react';
import type { Landmark3D } from '../../types/hand';
import {
  getExtendedFingersArray,
  matchSign,
  LSA_PATTERNS,
} from '../../lib';

interface SignGameProps {
  landmarks: Landmark3D[] | null;
  isTracking: boolean;
  onClose: () => void;
}

const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

const SUCCESS_HOLD_MS = 1000;

export function SignGame({ landmarks, isTracking, onClose }: SignGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const targetPattern = LSA_PATTERNS[currentIndex];
  const [score, setScore] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentFingers, setCurrentFingers] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current hand state
  useEffect(() => {
    if (!landmarks || landmarks.length < 21) {
      setCurrentFingers([false, false, false, false, false]);
      return;
    }
    const fingers = getExtendedFingersArray(landmarks);
    setCurrentFingers(fingers);
  }, [landmarks]);

  // Check for match
  useEffect(() => {
    if (isSuccess) return;

    const result = matchSign(currentFingers, targetPattern, 0);

    if (result.isMatch && !successTimer.current) {
      successTimer.current = setTimeout(() => {
        setIsSuccess(true);
        setScore((s) => s + 1);

        // After brief delay, advance to next letter
        setTimeout(() => {
          setCurrentIndex((idx) => (idx + 1) % LSA_PATTERNS.length);
          setIsSuccess(false);
          successTimer.current = null;
        }, 800);
      }, SUCCESS_HOLD_MS);
    } else if (!result.isMatch && successTimer.current) {
      clearTimeout(successTimer.current);
      successTimer.current = null;
    }
  }, [currentFingers, targetPattern, isSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
    };
  }, []);

  const handleSkip = useCallback(() => {
    if (successTimer.current) {
      clearTimeout(successTimer.current);
      successTimer.current = null;
    }
    setCurrentIndex((idx) => (idx + 1) % LSA_PATTERNS.length);
    setIsSuccess(false);
  }, []);

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none">
      {/* Game panel */}
      <div className="pointer-events-auto mx-auto mb-6 max-w-md rounded-xl bg-black/85 backdrop-blur-sm border border-gray-700 p-6 shadow-2xl">
        {/* Header with score and close button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Score</span>
            <span className="text-2xl font-bold text-white">{score}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Target letter */}
        <div
          className={`text-center mb-4 transition-all duration-300 ${
            isSuccess ? 'scale-110' : ''
          }`}
        >
          <div
            className={`text-8xl font-bold transition-colors duration-300 ${
              isSuccess ? 'text-green-400' : 'text-white'
            }`}
          >
            {targetPattern.letter}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {targetPattern.description}
          </div>
        </div>

        {/* Finger indicators */}
        <div className="space-y-3">
          {/* Expected configuration (target) */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
              Target
            </div>
            <div className="flex justify-center gap-2">
              {targetPattern.fingers.map((extended, idx) => (
                <div
                  key={`target-${idx}`}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      extended
                        ? 'bg-blue-500 border-blue-400'
                        : 'bg-transparent border-gray-600'
                    }`}
                  />
                  <span className="text-[10px] text-gray-500 mt-1">
                    {FINGER_NAMES[idx]?.[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current hand state */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
              Your Hand
            </div>
            <div className="flex justify-center gap-2">
              {currentFingers.map((extended, idx) => {
                const isCorrect = extended === targetPattern.fingers[idx];
                return (
                  <div
                    key={`current-${idx}`}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                        isSuccess
                          ? 'bg-green-500 border-green-400'
                          : isCorrect
                            ? extended
                              ? 'bg-green-500 border-green-400'
                              : 'bg-transparent border-green-500'
                            : extended
                              ? 'bg-red-500 border-red-400'
                              : 'bg-transparent border-red-500'
                      }`}
                    />
                    <span
                      className={`text-[10px] mt-1 transition-colors ${
                        isCorrect ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {FINGER_NAMES[idx]?.[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status */}
        {!isTracking && (
          <div className="mt-4 text-center text-yellow-500 text-sm">
            Start tracking to play
          </div>
        )}

        {isTracking && !landmarks && (
          <div className="mt-4 text-center text-gray-400 text-sm">
            Show your hand to the camera
          </div>
        )}

        {isSuccess && (
          <div className="mt-4 text-center text-green-400 text-sm font-semibold animate-pulse">
            Correct! Next letter...
          </div>
        )}
      </div>
    </div>
  );
}
