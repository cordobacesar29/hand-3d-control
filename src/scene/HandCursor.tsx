import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface HandCursorProps {
  position: [number, number, number];
  isGrabbing: boolean;
}

/**
 * 3D cursor that follows hand position
 * Shows pinch state with color change
 */
export function HandCursor({ position, isGrabbing }: HandCursorProps) {
  const meshRef = useRef<Mesh>(null);

  // Smooth scale animation for grab feedback
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isGrabbing ? 0.15 : 0.1;
      const currentScale = meshRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.2;
      meshRef.current.scale.setScalar(newScale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color={isGrabbing ? '#22c55e' : '#3b82f6'}
        emissive={isGrabbing ? '#22c55e' : '#3b82f6'}
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
