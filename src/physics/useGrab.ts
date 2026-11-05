import { useRef, useCallback } from 'react';
import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
import { getPhysicsWorld } from './world';

interface GrabState {
  isGrabbing: boolean;
  grabbedBody: RapierRigidBody | null;
  initialBodyType: 'dynamic' | 'kinematic' | 'fixed' | null;
  releaseTimer: number;
}

// Global mapping from RigidBody to object ID
const bodyToIdMap = new WeakMap<RapierRigidBody, string>();

/**
 * Register a rigid body with its object ID
 */
export function registerRigidBody(body: RapierRigidBody, id: string) {
  bodyToIdMap.set(body, id);
}

/**
 * Get the object ID for a rigid body
 */
export function getBodyId(body: RapierRigidBody | null): string | null {
  if (!body) return null;
  return bodyToIdMap.get(body) ?? null;
}

interface UseGrabOptions {
  /** Maximum distance to grab an object (default: 5.0 meters) */
  maxGrabDistance?: number;
  /** Distance at which objects highlight as grabbable (default: 6.0 meters) */
  previewDistance?: number;
  /** Velocity multiplier when throwing (default: 5.0) */
  throwForce?: number;
  /** Delay before releasing on jitter (default: 0.1 seconds) */
  releaseHysteresis?: number;
}

export interface GrabInfo {
  nearestBody: RapierRigidBody | null;
  canGrab: boolean;
  distanceToNearest: number | null;
}

export function useGrab(options: UseGrabOptions = {}) {
  const {
    maxGrabDistance = 5.0,
    previewDistance = 6.0,
    throwForce = 5.0,
    releaseHysteresis = 0.1
  } = options;

  const grabState = useRef<GrabState>({
    isGrabbing: false,
    grabbedBody: null,
    initialBodyType: null,
    releaseTimer: 0,
  });

  /**
   * Find the nearest dynamic rigid body and return body + distance info
   */
  const findNearestBody = useCallback(
    (position: [number, number, number], maxDistance: number): { body: RapierRigidBody | null; distance: number | null } => {
      const world = getPhysicsWorld();
      let nearestBody: RapierRigidBody | null = null;
      let minDistance = Infinity;

      world.forEachRigidBody((body) => {
        // Only consider dynamic bodies (skip kinematic/fixed)
        if (!body.isDynamic()) return;

        // Calculate 3D distance
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

      // Return both body and distance (or null if none found within maxDistance)
      return {
        body: minDistance <= maxDistance ? nearestBody : null,
        distance: nearestBody ? minDistance : null
      };
    },
    []
  );

  /**
   * Attempt to grab an object near the hand position
   */
  const grab = useCallback(
    (handPosition: [number, number, number]) => {
      if (grabState.current.isGrabbing) return;

      const { body } = findNearestBody(handPosition, maxGrabDistance);
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
          releaseTimer: 0,
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
          releaseTimer: 0,
        };
        console.error('Failed to grab body:', e);
      }
    },
    [findNearestBody, maxGrabDistance]
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
          releaseTimer: 0,
        };
        return;
      }

      try {
        // Reset release timer while actively moving (no jitter)
        grabState.current.releaseTimer = 0;

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
          releaseTimer: 0,
        };
      }
    },
    []
  );

  /**
   * Release the grabbed object and apply throw velocity
   * Uses hysteresis to prevent accidental release on hand jitter
   */
  const release = useCallback(
    (handVelocity: [number, number, number], deltaTime: number = 0.016) => {
      const { isGrabbing, grabbedBody, initialBodyType, releaseTimer } = grabState.current;
      if (!isGrabbing || !grabbedBody) return;

      // Apply hysteresis - increment timer, only release after threshold
      const newTimer = releaseTimer + deltaTime;
      if (newTimer < releaseHysteresis) {
        grabState.current.releaseTimer = newTimer;
        return;
      }

      // Validate body before operations
      if (!grabbedBody.isValid()) {
        grabState.current = {
          isGrabbing: false,
          grabbedBody: null,
          initialBodyType: null,
          releaseTimer: 0,
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
          releaseTimer: 0,
        };
      }
    },
    [throwForce, releaseHysteresis]
  );

  /**
   * Get info about nearest grabbable object (for UI feedback)
   */
  const getGrabInfo = useCallback(
    (handPosition: [number, number, number]): GrabInfo => {
      const { body, distance } = findNearestBody(handPosition, previewDistance);
      return {
        nearestBody: body,
        canGrab: distance !== null && distance <= maxGrabDistance,
        distanceToNearest: distance,
      };
    },
    [findNearestBody, previewDistance, maxGrabDistance]
  );

  return {
    grab,
    release,
    updateGrabbedPosition,
    getGrabInfo,
  };
}
