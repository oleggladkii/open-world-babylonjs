import { Scene, Vector3, PhysicsImpostor, Mesh } from "@babylonjs/core";
import { CannonJSPlugin } from "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import * as CANNON from "cannon";

export interface PhysicsConfig {
  gravity?: Vector3;
  timeStep?: number;
  iterations?: number;
}

export const useCannonPhysics = () => {
  let physicsPlugin: CannonJSPlugin | null = null;

  const initPhysics = (scene: Scene, config: PhysicsConfig = {}) => {
    const {
      gravity = new Vector3(0, -9.81, 0),
      timeStep = 1 / 60,
      iterations = 10,
    } = config;

    // Initialize Cannon.js plugin
    physicsPlugin = new CannonJSPlugin(true, iterations, CANNON);
    scene.enablePhysics(gravity, physicsPlugin);

    return physicsPlugin;
  };

  const createPlayerPhysics = (
    playerMesh: Mesh,
    scene: Scene,
    mass: number = 1,
  ): PhysicsImpostor => {
    // Create box physics impostor for player (CapsuleImpostor may not be supported)
    const playerImpostor = new PhysicsImpostor(
      playerMesh,
      PhysicsImpostor.BoxImpostor,
      {
        mass,
        friction: 0.4,
        restitution: 0.1,
      },
      scene,
    );

    // Lock rotation to prevent player from tipping over
    if (playerImpostor.physicsBody) {
      const body = playerImpostor.physicsBody as any;
      body.fixedRotation = true;
      body.updateMassProperties();
    }

    return playerImpostor;
  };

  const createWallPhysics = (wallMesh: Mesh, scene: Scene): PhysicsImpostor => {
    return new PhysicsImpostor(
      wallMesh,
      PhysicsImpostor.BoxImpostor,
      {
        mass: 0, // Static object
        friction: 0.8,
        restitution: 0.1,
      },
      scene,
    );
  };

  const createFloorPhysics = (
    floorMesh: Mesh,
    scene: Scene,
  ): PhysicsImpostor => {
    return new PhysicsImpostor(
      floorMesh,
      PhysicsImpostor.BoxImpostor,
      {
        mass: 0, // Static object
        friction: 0.8,
        restitution: 0.1,
      },
      scene,
    );
  };

  const applyForce = (
    impostor: PhysicsImpostor,
    force: Vector3,
    worldPoint?: Vector3,
  ) => {
    if (impostor.physicsBody) {
      const cannonForce = new CANNON.Vec3(force.x, force.y, force.z);
      const cannonPoint = worldPoint
        ? new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z)
        : impostor.physicsBody.position;

      impostor.physicsBody.applyForce(cannonForce, cannonPoint);
    }
  };

  const setLinearVelocity = (impostor: PhysicsImpostor, velocity: Vector3) => {
    if (impostor.physicsBody) {
      impostor.physicsBody.velocity.set(velocity.x, velocity.y, velocity.z);
    }
  };

  const getLinearVelocity = (impostor: PhysicsImpostor): Vector3 => {
    if (impostor.physicsBody) {
      const vel = impostor.physicsBody.velocity;
      return new Vector3(vel.x, vel.y, vel.z);
    }
    return Vector3.Zero();
  };

  const dispose = () => {
    physicsPlugin = null;
  };

  return {
    initPhysics,
    createPlayerPhysics,
    createWallPhysics,
    createFloorPhysics,
    applyForce,
    setLinearVelocity,
    getLinearVelocity,
    dispose,
  };
};
