import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { RigidBody } from '../physics/RigidBody';

interface InteractiveCubeProps {
  id: string;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  physicsEnabled?: boolean;
  mass?: number;
  restitution?: number;
  friction?: number;
  isGrabbable?: boolean;
}

export function InteractiveCube({
  id,
  position,
  isSelected,
  onSelect,
  physicsEnabled = false,
  mass = 1,
  restitution = 0.3,
  friction = 0.5,
  isGrabbable = false,
}: InteractiveCubeProps) {
  const meshRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Rotation animation
      if (isSelected && !physicsEnabled) {
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      }

      // Pulse animation when grabbable
      if (isGrabbable) {
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.05;
        meshRef.current.scale.setScalar(1 + pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const baseColor = '#ffffff';
  const hoverColor = '#4a9eff';
  const selectedColor = '#ff6b35';
  const grabbableColor = '#00ff00';

  const color = isGrabbable
    ? grabbableColor
    : isSelected
      ? selectedColor
      : isHovered
        ? hoverColor
        : baseColor;

  const meshContent = (
    <mesh
      ref={meshRef}
      onClick={() => onSelect(isSelected ? null : id)}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={isGrabbable ? 0.4 : isSelected ? 0.3 : isHovered ? 0.1 : 0}
      />
    </mesh>
  );

  if (physicsEnabled) {
    return (
      <RigidBody
        type="dynamic"
        position={position}
        mass={mass}
        restitution={restitution}
        friction={friction}
        shape="cuboid"
        args={[0.5, 0.5, 0.5]}
        objectId={id}
      >
        {meshContent}
      </RigidBody>
    );
  }

  return <group position={position}>{meshContent}</group>;
}
