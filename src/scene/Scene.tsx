import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { InteractiveCube } from './InteractiveCube';
import { InteractiveSphere } from './InteractiveSphere';
import { InteractiveCone } from './InteractiveCone';
import { usePhysics } from '../physics/usePhysics';
import { RigidBody } from '../physics/RigidBody';
import type { SceneObject } from '../hooks/useScene';

interface SceneProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  sceneRotationY?: number;
  grabbableObjectId?: string | null;
}

function PhysicsContent({
  objects,
  selectedId,
  onSelect,
  sceneRotationY,
  grabbableObjectId,
}: {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  sceneRotationY: number;
  grabbableObjectId: string | null;
}) {
  const { isReady } = usePhysics();

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Ground plane - invisible but collidable */}
      {isReady && (
        <RigidBody type="fixed" position={[0, -1.5, 0]} shape="cuboid" args={[50, 0.1, 50]}>
          <mesh visible={false}>
            <boxGeometry args={[100, 0.2, 100]} />
            <meshStandardMaterial color="#444444" />
          </mesh>
        </RigidBody>
      )}

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
            isPhysicsReady={isReady}
            isGrabbable={grabbableObjectId === obj.id}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={10}
      />
    </>
  );
}

function ShapeRenderer({
  obj,
  isSelected,
  onSelect,
  isPhysicsReady,
  isGrabbable,
}: {
  obj: SceneObject;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  isPhysicsReady: boolean;
  isGrabbable: boolean;
}) {
  if (!obj.visible) {
    return null;
  }

  const commonProps = {
    id: obj.id,
    position: obj.position,
    isSelected,
    onSelect,
    isGrabbable,
  };

  // Enable physics based on object settings and physics readiness
  const enablePhysics = isPhysicsReady && (obj.physicsEnabled ?? false);

  switch (obj.type) {
    case 'cube':
      return (
        <InteractiveCube
          {...commonProps}
          physicsEnabled={enablePhysics}
          mass={obj.mass}
          restitution={obj.restitution}
          friction={obj.friction}
        />
      );
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
  sceneRotationY = 0,
  grabbableObjectId = null,
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, -4], fov: 75 }}
      gl={{ alpha: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <PhysicsContent
        objects={objects}
        selectedId={selectedId}
        onSelect={onSelect}
        sceneRotationY={sceneRotationY}
        grabbableObjectId={grabbableObjectId}
      />
    </Canvas>
  );
}
