import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { RigidBody } from '../physics/RigidBody';

interface HandCubeProps {
  position: [number, number, number];
  color?: string;
  physicsEnabled?: boolean;
}

export function HandCube({ position, color = '#ffffff', physicsEnabled = false }: HandCubeProps) {
  const meshRef = useRef<Mesh>(null);

  // Gentle floating rotation (only when physics is disabled)
  useFrame((state) => {
    if (meshRef.current && !physicsEnabled) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.8;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const meshContent = (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.7}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );

  if (physicsEnabled) {
    return (
      <RigidBody
        type="kinematic"
        position={position}
        shape="cuboid"
        args={[0.2, 0.2, 0.2]}
      >
        {meshContent}
      </RigidBody>
    );
  }

  return <group position={position}>{meshContent}</group>;
}
