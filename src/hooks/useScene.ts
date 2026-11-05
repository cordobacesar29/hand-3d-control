import { useState, useCallback } from 'react';

export type ShapeType = 'cube' | 'sphere' | 'cone';

export interface SceneObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  type: ShapeType;
  visible: boolean;
  // Physics properties (optional)
  physicsEnabled?: boolean;
  mass?: number;
  restitution?: number;
  friction?: number;
}

interface SceneState {
  objects: SceneObject[];
  selectedId: string | null;
  sceneRotationY: number;
  setSelected: (id: string | null) => void;
  updateObjectPosition: (id: string, position: [number, number, number]) => void;
  updateShapeFromFingerCount: (fingerCount: number) => void;
  rotateScene: (deltaY: number) => void;
  setSceneRotationY: (rotation: number) => void;
}

function fingerCountToShapeType(count: number): ShapeType | null {
  switch (count) {
    case 1:
      return 'cube';
    case 2:
      return 'sphere';
    case 3:
      return 'cone';
    default:
      return null;
  }
}

export function useScene(): SceneState {
  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: 'shape-1',
      position: [0, 1, 0], // Start above ground to test gravity
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      type: 'cube',
      visible: true, // Visible by default to test physics
      physicsEnabled: true,
      mass: 1,
      restitution: 0.3,
      friction: 0.5,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sceneRotationY, setSceneRotationY] = useState(0);

  const updateObjectPosition = useCallback(
    (id: string, position: [number, number, number]) => {
      setObjects((prev) =>
        prev.map((obj) => (obj.id === id ? { ...obj, position } : obj))
      );
    },
    []
  );

  const updateShapeFromFingerCount = useCallback((fingerCount: number) => {
    const shapeType = fingerCountToShapeType(fingerCount);
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === 'shape-1'
          ? {
              ...obj,
              type: shapeType ?? obj.type,
              visible: shapeType !== null,
            }
          : obj
      )
    );
  }, []);

  const rotateScene = useCallback((deltaY: number) => {
    setSceneRotationY((prev) => prev + deltaY);
  }, []);

  return {
    objects,
    selectedId,
    sceneRotationY,
    setSelected: setSelectedId,
    updateObjectPosition,
    updateShapeFromFingerCount,
    rotateScene,
    setSceneRotationY,
  };
}
