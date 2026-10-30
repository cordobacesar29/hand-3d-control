import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { InteractiveCube } from './InteractiveCube';
import { HandCursor } from './HandCursor';

interface SceneProps {
  objects: Array<{
    id: string;
    position: [number, number, number];
  }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  handPosition: [number, number, number] | null;
  isGrabbing: boolean;
}

export function Scene({
  objects,
  selectedId,
  onSelect,
  handPosition,
  isGrabbing,
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 75 }}
      style={{ background: '#0a0a0a' }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      <Grid
        args={[10, 10]}
        cellColor="#444444"
        sectionColor="#666666"
        fadeDistance={30}
        position={[0, -1, 0]}
      />

      {objects.map((obj) => (
        <InteractiveCube
          key={obj.id}
          id={obj.id}
          position={obj.position}
          isSelected={selectedId === obj.id}
          onSelect={onSelect}
        />
      ))}

      {handPosition && (
        <HandCursor position={handPosition} isGrabbing={isGrabbing} />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={10}
      />
    </Canvas>
  );
}
