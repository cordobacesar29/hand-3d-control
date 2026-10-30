import { useState } from 'react';

interface SceneObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface SceneState {
  objects: SceneObject[];
  selectedId: string | null;
  setSelected: (id: string | null) => void;
  updateObjectPosition: (id: string, position: [number, number, number]) => void;
}

export function useScene(): SceneState {
  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: 'cube-1',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const updateObjectPosition = (
    id: string,
    position: [number, number, number]
  ) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, position } : obj))
    );
  };

  return {
    objects,
    selectedId,
    setSelected: setSelectedId,
    updateObjectPosition,
  };
}
