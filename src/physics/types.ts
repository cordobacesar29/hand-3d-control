import type { RigidBody, Collider } from '@dimforge/rapier3d-compat';
import type { Object3D } from 'three';

export type RigidBodyType = 'dynamic' | 'kinematic' | 'fixed';

export interface PhysicsBodyDescriptor {
  type: RigidBodyType;
  mass?: number;
  restitution?: number;
  friction?: number;
  linearDamping?: number;
  angularDamping?: number;
  gravityScale?: number;
}

export interface PhysicsBody {
  rigidBody: RigidBody;
  collider: Collider;
  mesh: Object3D;
}

export interface GrabState {
  isGrabbing: boolean;
  grabbedBody: RigidBody | null;
  grabOffset: [number, number, number];
}
