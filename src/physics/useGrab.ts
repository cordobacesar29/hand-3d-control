import { useRef, useCallback } from 'react';
import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
import { getPhysicsWorld } from './world';

interface GrabState {
  isGrabbing: boolean;
  grabbedBody: RapierRigidBody | null;
  initialBodyType: 'dynamic' | 'kinematic' | 'fixed' | null;
}

interface UseGrabOptions {
  /** Maximum distance to grab an object (default: 2.0 meters) */
  maxGrabDistance?: number;
  /** Velocity multiplier when throwing (default: 5.0) */
  throwForce?: number;
}

export function useGrab(options: UseGrabOptions = {}) {
  const { maxGrabDistance = 2.0, throwForce = 5.0 } = options;

  const grabState = useRef<GrabState>({
    isGrabbing: false,
    grabbedBody: null,
    initialBodyType: null,
  });

  /**
   * Find the nearest dynamic rigid body within grab distance
   */
  const findNearestBody = useCallback(
    (position: [number, number, number]): RapierRigidBody | null => {
      const world = getPhysicsWorld();
      let nearestBody: RapierRigidBody | null = null;
      let minDistance = maxGrabDistance;

      world.forEachRigidBody((body) => {
        // Only grab dynamic bodies
        if (!body.isDynamic()) return;

        const translation = body.translation();
        const dx = translation.x - position[0];
        const dy = translation.y - position[1];
        const dz = translation.z - position[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < minDistance) {
          minDistance = distance;
          nearestBody = body;
        }
      });

      return nearestBody;
    },
    [maxGrabDistance]
  );

  /**
   * Attempt to grab an object near the hand position
   */
  const grab = useCallback(
    (handPosition: [number, number, number]) => {
      if (grabState.current.isGrabbing) return;

      const body = findNearestBody(handPosition);
      if (!body) return;

      // Validate body before operations
      if (!body.isValid()) return;

      try {
        // Store initial body type
        const bodyType = body.isDynamic()
          ? 'dynamic'
          : body.isKinematic()
            ? 'kinematic'
            : 'fixed';

        grabState.current = {
          isGrabbing: true,
          grabbedBody: body,
          initialBodyType: bodyType,
        };

        // Make body kinematic while grabbed (follows hand)
        body.setBodyType(1, true); // 1 = KinematicPositionBased
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      } catch (e) {
        // Reset grab state on error
        grabState.current = {
          isGrabbing: false,
          grabbedBody: null,
          initialBodyType: null,
        };
        console.error('Failed to grab body:', e);
      }
    },
    [findNearestBody]
  );

  /**
   * Update grabbed object position to follow hand
   */
  const updateGrabbedPosition = useCallback(
    (handPosition: [number, number, number]) => {
      const { isGrabbing, grabbedBody } = grabState.current;
      if (!isGrabbing || !grabbedBody) return;

      // Validate body before operations
      if (!grabbedBody.isValid()) {
        grabState.current = {
          isGrabbing: false,
          grabbedBody: null,
          initialBodyType: null,
        };
        return;
      }

      try {
        // Move grabbed body to hand position
        grabbedBody.setNextKinematicTranslation({
          x: handPosition[0],
          y: handPosition[1],
          z: handPosition[2],
        });
      } catch (e) {
        console.error('Failed to update grabbed body position:', e);
        grabState.current = {
          isGrabbing: false,
          grabbedBody: null,
          initialBodyType: null,
        };
      }
    },
    []
  );

  /**
   * Release the grabbed object and apply throw velocity
   */
  const release = useCallback(
    (handVelocity: [number, number, number]) => {
      const { isGrabbing, grabbedBody, initialBodyType } = grabState.current;
      if (!isGrabbing || !grabbedBody) return;

      // Validate body before operations
      if (!grabbedBody.isValid()) {
        grabState.current = {
          isGrabbing: false,
          grabbedBody: null,
          initialBodyType: null,
        };
        return;
      }

      try {
        // Restore original body type
        if (initialBodyType === 'dynamic') {
          grabbedBody.setBodyType(0, true); // 0 = Dynamic

          // Apply throw velocity (scaled by throwForce)
          grabbedBody.setLinvel(
            {
              x: handVelocity[0] * throwForce,
              y: handVelocity[1] * throwForce,
              z: handVelocity[2] * throwForce,
            },
            true
          );
        }
      } catch (e) {
        console.error('Failed to release body:', e);
      } finally {
        // Clear grab state
        grabState.current = {
          isGrabbing: false,
          grabbedBody: null,
          initialBodyType: null,
        };
      }
    },
    [throwForce]
  );

  return {
    grab,
    release,
    updateGrabbedPosition,
  };
}
