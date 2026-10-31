import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface InteractiveSphereProps {
  id: string;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

export function InteractiveSphere({
  id,
  position,
  isSelected,
  onSelect,
}: InteractiveSphereProps) {
  const meshRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const baseColor = '#ffffff';
  const hoverColor = '#4a9eff';
  const selectedColor = '#ff6b35';

  const color = isSelected
    ? selectedColor
    : isHovered
      ? hoverColor
      : baseColor;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => onSelect(isSelected ? null : id)}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <sphereGeometry args={[0.6, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.6}
        emissive={color}
        emissiveIntensity={isSelected ? 0.3 : isHovered ? 0.1 : 0}
      />
    </mesh>
  );
}
