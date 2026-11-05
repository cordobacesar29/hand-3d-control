import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { initRapier, getPhysicsWorld, resetPhysicsWorld } from './world';

/**
 * Hook to initialize and step the physics simulation
 * Call this once at the Scene level to run physics each frame
 */
export function usePhysics() {
  const [isReady, setIsReady] = useState(false);
  const accumulatorRef = useRef(0);

  // Initialize Rapier on mount
  useEffect(() => {
    let mounted = true;

    initRapier()
      .then(() => {
        if (mounted) {
          // Initialize world (singleton)
          getPhysicsWorld();
          setIsReady(true);
        }
      })
      .catch((error) => {
        console.error('Failed to initialize Rapier:', error);
      });

    return () => {
      mounted = false;
      // Free WASM memory on unmount
      const world = getPhysicsWorld();
      if (world) {
        resetPhysicsWorld();
      }
    };
  }, []);

  // Step physics simulation each frame with accumulator pattern
  useFrame((_, delta) => {
    if (!isReady) return;

    const world = getPhysicsWorld();

    // Fixed timestep accumulator pattern for deterministic physics
    const FIXED_TIMESTEP = 1 / 60;
    accumulatorRef.current += Math.min(delta, 0.1); // Prevent spiral of death

    while (accumulatorRef.current >= FIXED_TIMESTEP) {
      world.step();
      accumulatorRef.current -= FIXED_TIMESTEP;
    }
  });

  return { isReady };
}
