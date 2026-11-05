import { useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Object3D } from 'three';
import { Euler, Quaternion } from 'three';
import { getRapier, getPhysicsWorld } from './world';
import type { RigidBody as RapierRigidBody, Collider } from '@dimforge/rapier3d-compat';
import type { PhysicsBodyDescriptor } from './types';
import { registerRigidBody } from './useGrab';

interface RigidBodyProps extends Partial<PhysicsBodyDescriptor> {
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Shape of the collider */
  shape?: 'cuboid' | 'sphere';
  /** Args for the collider shape (e.g., [halfX, halfY, halfZ] for cuboid, [radius] for sphere) */
  args?: number[];
  /** Object ID for grab system mapping */
  objectId?: string;
  /** Callback when rigid body is created */
  onBodyCreated?: (body: RapierRigidBody) => void;
}

/**
 * Wrapper component that adds physics to Three.js objects
 * Syncs Rapier rigid body with Three.js mesh every frame
 */
export function RigidBody({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  type = 'dynamic',
  mass = 1,
  restitution = 0.3,
  friction = 0.5,
  linearDamping = 0.1,
  angularDamping = 0.1,
  gravityScale = 1.0,
  shape = 'cuboid',
  args = [0.5, 0.5, 0.5],
  objectId,
  onBodyCreated,
}: RigidBodyProps) {
  const groupRef = useRef<Object3D>(null);
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const colliderRef = useRef<Collider | null>(null);

  // Use refs to track props and avoid dependency array issues
  const propsRef = useRef({
    position,
    rotation,
    type,
    mass,
    restitution,
    friction,
    linearDamping,
    angularDamping,
    gravityScale,
    shape,
    args,
    objectId,
    onBodyCreated,
  });

  // Update props ref when props change
  useEffect(() => {
    propsRef.current = {
      position,
      rotation,
      type,
      mass,
      restitution,
      friction,
      linearDamping,
      angularDamping,
      gravityScale,
      shape,
      args,
      objectId,
      onBodyCreated,
    };
  }, [position, rotation, type, mass, restitution, friction, linearDamping, angularDamping, gravityScale, shape, args, objectId, onBodyCreated]);

  // Create rigid body and collider on mount
  useEffect(() => {
    if (!groupRef.current) return;

    const RAPIER = getRapier();
    const world = getPhysicsWorld();

    const {
      position: currentPosition,
      rotation: currentRotation,
      type: currentType,
      mass: currentMass,
      restitution: currentRestitution,
      friction: currentFriction,
      linearDamping: currentLinearDamping,
      angularDamping: currentAngularDamping,
      gravityScale: currentGravityScale,
      shape: currentShape,
      args: currentArgs,
    } = propsRef.current;

    // Create rigid body descriptor based on type
    let rigidBodyDesc;
    switch (currentType) {
      case 'dynamic':
        rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic();
        break;
      case 'kinematic':
        rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        break;
      case 'fixed':
        rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
        break;
    }

    // Set initial position and rotation
    rigidBodyDesc.setTranslation(currentPosition[0], currentPosition[1], currentPosition[2]);

    // Convert Euler angles to quaternion properly
    const euler = new Euler(currentRotation[0], currentRotation[1], currentRotation[2]);
    const quat = new Quaternion().setFromEuler(euler);
    rigidBodyDesc.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });

    // Configure physics properties
    if (currentType === 'dynamic') {
      rigidBodyDesc.setLinearDamping(currentLinearDamping);
      rigidBodyDesc.setAngularDamping(currentAngularDamping);
      rigidBodyDesc.setGravityScale(currentGravityScale);
    }

    const rigidBody = world.createRigidBody(rigidBodyDesc);
    rigidBodyRef.current = rigidBody;

    // Create collider based on shape
    let colliderDesc;
    switch (currentShape) {
      case 'cuboid':
        colliderDesc = RAPIER.ColliderDesc.cuboid(currentArgs[0], currentArgs[1], currentArgs[2]);
        break;
      case 'sphere':
        colliderDesc = RAPIER.ColliderDesc.ball(currentArgs[0]);
        break;
    }

    colliderDesc.setRestitution(currentRestitution);
    colliderDesc.setFriction(currentFriction);
    if (currentType === 'dynamic') {
      // Calculate density from mass and volume
      let volume = 1.0;
      if (currentShape === 'cuboid') {
        // Volume = width * height * depth (args are half-extents)
        volume = (currentArgs[0] * 2) * (currentArgs[1] * 2) * (currentArgs[2] * 2);
      } else if (currentShape === 'sphere') {
        // Volume = (4/3) * π * r³
        volume = (4 / 3) * Math.PI * Math.pow(currentArgs[0], 3);
      }
      const density = currentMass / volume;
      colliderDesc.setDensity(density);
    }

    const collider = world.createCollider(colliderDesc, rigidBody);
    colliderRef.current = collider;

    // Register body with grab system if objectId provided
    if (propsRef.current.objectId) {
      registerRigidBody(rigidBody, propsRef.current.objectId);
    }

    // Notify parent component
    if (propsRef.current.onBodyCreated) {
      propsRef.current.onBodyCreated(rigidBody);
    }

    // Cleanup on unmount
    return () => {
      if (colliderRef.current) {
        world.removeCollider(colliderRef.current, true);
        colliderRef.current = null;
      }
      if (rigidBodyRef.current) {
        world.removeRigidBody(rigidBodyRef.current);
        rigidBodyRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Sync Three.js mesh with Rapier body every frame
  useFrame(() => {
    if (!groupRef.current || !rigidBodyRef.current) return;

    const body = rigidBodyRef.current;
    const currentType = propsRef.current.type;

    if (currentType === 'dynamic') {
      // For dynamic bodies: read position/rotation from physics engine
      const translation = body.translation();
      const rotation = body.rotation();

      groupRef.current.position.set(translation.x, translation.y, translation.z);
      groupRef.current.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    } else if (currentType === 'kinematic') {
      // For kinematic bodies: write Three.js position to physics engine
      // (this allows manual control from React state)
      const pos = groupRef.current.position;
      const quat = groupRef.current.quaternion;
      body.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z });
      body.setNextKinematicRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w });
    }
    // Fixed bodies don't need sync - they never move
  });

  return <group ref={groupRef}>{children}</group>;
}
