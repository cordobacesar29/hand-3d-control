import { useState, useCallback } from 'react';

export type ShapeType = 'cube' | 'sphere' | 'cone';

export interface SceneObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  type: ShapeType;
  visible: boolean;
}

export interface HandCube {
  position: [number, number, number];
  visible: boolean;
}

interface SceneState {
  objects: SceneObject[];
  selectedId: string | null;
  sceneRotationY: number;
  leftCube: HandCube;
  rightCube: HandCube;
  setSelected: (id: string | null) => void;
  updateObjectPosition: (id: string, position: [number, number, number]) => void;
  updateShapeFromFingerCount: (fingerCount: number) => void;
  rotateScene: (deltaY: number) => void;
  setSceneRotationY: (rotation: number) => void;
  updateLeftCube: (position: [number, number, number] | null, visible: boolean) => void;
  updateRightCube: (position: [number, number, number] | null, visible: boolean) => void;
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

const DEFAULT_POSITION: [number, number, number] = [0, 0, 0];

export function useScene(): SceneState {
  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: 'shape-1',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      type: 'cube',
      visible: false, // Hidden by default - hand cubes are now the main feature
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sceneRotationY, setSceneRotationY] = useState(0);

  // Per-hand cubes
  const [leftCube, setLeftCube] = useState<HandCube>({
    position: DEFAULT_POSITION,
    visible: false,
  });

  const [rightCube, setRightCube] = useState<HandCube>({
    position: DEFAULT_POSITION,
    visible: false,
  });

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

  const updateLeftCube = useCallback(
    (position: [number, number, number] | null, visible: boolean) => {
      setLeftCube({
        position: position ?? DEFAULT_POSITION,
        visible,
      });
    },
    []
  );

  const updateRightCube = useCallback(
    (position: [number, number, number] | null, visible: boolean) => {
      setRightCube({
        position: position ?? DEFAULT_POSITION,
        visible,
      });
    },
    []
  );

  return {
    objects,
    selectedId,
    sceneRotationY,
    leftCube,
    rightCube,
    setSelected: setSelectedId,
    updateObjectPosition,
    updateShapeFromFingerCount,
    rotateScene,
    setSceneRotationY,
    updateLeftCube,
    updateRightCube,
  };
}
