import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { InteractiveCube } from './InteractiveCube';
import { InteractiveSphere } from './InteractiveSphere';
import { InteractiveCone } from './InteractiveCone';
import { HandCursor } from './HandCursor';
import type { SceneObject } from '../hooks/useScene';

interface SceneProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  handPosition: [number, number, number] | null;
  isGrabbing: boolean;
  sceneRotationY?: number;
}

function ShapeRenderer({
  obj,
  isSelected,
  onSelect,
}: {
  obj: SceneObject;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}) {
  if (!obj.visible) {
    return null;
  }

  const commonProps = {
    id: obj.id,
    position: obj.position,
    isSelected,
    onSelect,
  };

  switch (obj.type) {
    case 'cube':
      return <InteractiveCube {...commonProps} />;
    case 'sphere':
      return <InteractiveSphere {...commonProps} />;
    case 'cone':
      return <InteractiveCone {...commonProps} />;
    default:
      return null;
  }
}

export function Scene({
  objects,
  selectedId,
  onSelect,
  handPosition,
  isGrabbing,
  sceneRotationY = 0,
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 75 }}
      gl={{ alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Rotating group for scene objects */}
      <group rotation={[0, sceneRotationY, 0]}>
        <Grid
          args={[10, 10]}
          cellColor="#444444"
          sectionColor="#666666"
          fadeDistance={30}
          position={[0, -1, 0]}
        />

        {objects.map((obj) => (
          <ShapeRenderer
            key={obj.id}
            obj={obj}
            isSelected={selectedId === obj.id}
            onSelect={onSelect}
          />
        ))}
      </group>

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
