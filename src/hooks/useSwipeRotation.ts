import { useRef, useCallback, useEffect } from 'react';

interface SwipeRotationConfig {
  /** Sensitivity multiplier for rotation speed (default: 3.0) */
  sensitivity?: number;
  /** Friction coefficient for momentum decay (0-1, lower = more friction, default: 0.92) */
  friction?: number;
  /** Minimum velocity to continue momentum animation (default: 0.001) */
  minVelocity?: number;
}

interface UseSwipeRotationReturn {
  /** Call this each frame with the right hand X position (normalized 0-1) when active */
  updateHandPosition: (x: number | null, isGrabbing: boolean) => void;
}

/**
 * Hook that handles swipe gesture to rotate the scene with momentum
 *
 * Usage:
 * - When right hand is open (not grabbing), horizontal movement rotates the scene
 * - Momentum continues briefly after hand stops or leaves
 * - Movement feels like "turning a page" or spinning a lazy susan
 */
export function useSwipeRotation(
  onRotate: (deltaY: number) => void,
  setRotation: (rotation: number) => void,
  config: SwipeRotationConfig = {}
): UseSwipeRotationReturn {
  const {
    sensitivity = 3.0,
    friction = 0.92,
    minVelocity = 0.001,
  } = config;

  // Track previous X position for delta calculation
  const prevX = useRef<number | null>(null);

  // Current velocity for momentum
  const velocity = useRef(0);

  // Whether the hand is currently controlling rotation
  const isActive = useRef(false);

  // Animation frame ID for cleanup
  const animationFrameId = useRef<number | null>(null);

  // Track current rotation for momentum animation
  const currentRotation = useRef(0);

  // Store callbacks in refs to avoid stale closures in animation loop
  const setRotationRef = useRef(setRotation);
  const frictionRef = useRef(friction);
  const minVelocityRef = useRef(minVelocity);

  // Update refs in effect to avoid accessing during render
  useEffect(() => {
    setRotationRef.current = setRotation;
    frictionRef.current = friction;
    minVelocityRef.current = minVelocity;
  }, [setRotation, friction, minVelocity]);

  // Momentum animation loop - using named function expression to avoid self-reference during initialization
  const startMomentumAnimation = useCallback(() => {
    // Cancel any existing animation
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
    }

    // Named function for recursion
    const animate = () => {
      if (Math.abs(velocity.current) > minVelocityRef.current) {
        // Apply velocity to rotation
        currentRotation.current += velocity.current;
        setRotationRef.current(currentRotation.current);

        // Apply friction to decay velocity
        velocity.current *= frictionRef.current;

        // Continue animation
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Velocity too small, stop animation
        velocity.current = 0;
        animationFrameId.current = null;
      }
    };

    // Start the animation
    if (Math.abs(velocity.current) > minVelocityRef.current) {
      animationFrameId.current = requestAnimationFrame(animate);
    }
  }, []);

  // Stop momentum animation
  const stopMomentum = useCallback(() => {
    if (animationFrameId.current !== null) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  // Update hand position each frame
  const updateHandPosition = useCallback(
    (x: number | null, isGrabbing: boolean) => {
      // Swipe rotation is active when hand is present and NOT grabbing
      const shouldBeActive = x !== null && !isGrabbing;

      if (shouldBeActive) {
        // Stop any existing momentum animation while actively controlling
        stopMomentum();

        if (prevX.current !== null) {
          // Calculate delta from previous position
          // Negative because moving hand left should rotate scene right (like turning a page)
          const deltaX = -(x - prevX.current);

          // Apply sensitivity to get rotation delta
          const rotationDelta = deltaX * sensitivity;

          // Update velocity for momentum (smoothed with current velocity)
          velocity.current = velocity.current * 0.5 + rotationDelta * 0.5;

          // Apply rotation immediately
          currentRotation.current += rotationDelta;
          onRotate(rotationDelta);
        }

        prevX.current = x;
        isActive.current = true;
      } else {
        // Hand left or started grabbing
        if (isActive.current) {
          // Was active, now stopping - start momentum
          prevX.current = null;
          isActive.current = false;
          startMomentumAnimation();
        }
      }
    },
    [sensitivity, onRotate, startMomentumAnimation, stopMomentum]
  );

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return {
    updateHandPosition,
  };
}
