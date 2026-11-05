import RAPIER from '@dimforge/rapier3d-compat';

let rapierInstance: typeof RAPIER | null = null;
let worldInstance: RAPIER.World | null = null;

/**
 * Initialize Rapier physics engine (singleton pattern)
 * Must be called before using any physics features
 */
export async function initRapier(): Promise<typeof RAPIER> {
  if (rapierInstance) {
    return rapierInstance;
  }

  await RAPIER.init();
  rapierInstance = RAPIER;

  return rapierInstance;
}

/**
 * Get or create the physics world (singleton)
 * Gravity is set to -9.81 m/s² on Y axis (standard Earth gravity)
 */
export function getPhysicsWorld(): RAPIER.World {
  if (!worldInstance) {
    if (!rapierInstance) {
      throw new Error('Rapier not initialized. Call initRapier() first.');
    }

    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    worldInstance = new rapierInstance.World(gravity);
  }

  return worldInstance;
}

/**
 * Get the Rapier instance (must be initialized first)
 */
export function getRapier(): typeof RAPIER {
  if (!rapierInstance) {
    throw new Error('Rapier not initialized. Call initRapier() first.');
  }
  return rapierInstance;
}

/**
 * Reset the physics world (useful for cleanup/testing)
 */
export function resetPhysicsWorld(): void {
  if (worldInstance) {
    worldInstance.free();
    worldInstance = null;
  }
}
