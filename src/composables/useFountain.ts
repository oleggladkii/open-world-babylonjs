import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Texture,
  ParticleSystem,
  Mesh,
  Color4,
  Animation,
  EasingFunction,
  CircleEase,
} from "@babylonjs/core";

interface FountainOptions {
  position?: Vector3;
  capacity?: number;
  emitRate?: number;
  minEmitPower?: number;
  maxEmitPower?: number;
  minLifeTime?: number;
  maxLifeTime?: number;
  minSize?: number;
  maxSize?: number;
  gravity?: Vector3;
  direction1?: Vector3;
  direction2?: Vector3;
  color1?: Color4;
  color2?: Color4;
  colorDead?: Color4;
  blendMode?: number;
  textureUrl?: string;
  updateSpeed?: number;
  manualEmitCount?: number;
  preventAutoStart?: boolean;
}

export const useFountain = () => {
  const createFountain = async (
    scene: Scene,
    options: FountainOptions = {}
  ): Promise<{
    fountain: Mesh;
    particleSystem: ParticleSystem;
    dispose: () => void;
  }> => {
    const {
      position = new Vector3(0, 0, 0),
      capacity = 500, // Reduced from 2000 for better performance
      emitRate = 300, // Reduced from 1500 for better performance
      minEmitPower = 1,
      maxEmitPower = 2.5, // Slightly reduced for less spread
      minLifeTime = 0.5, // Increased minimum for fewer particles
      maxLifeTime = 1.2, // Slightly reduced maximum
      minSize = 0.15, // Slightly larger minimum size
      maxSize = 0.4, // Slightly smaller maximum size
      gravity = new Vector3(0, -9.81, 0),
      direction1 = new Vector3(-5, 6, 2), // Reduced spread for tighter fountain
      direction2 = new Vector3(5, 6, -2), // Reduced spread for tighter fountain
      color1 = new Color4(0.7, 0.8, 1.0, 1.0),
      color2 = new Color4(0.2, 0.5, 1.0, 1.0),
      colorDead = new Color4(0, 0, 0.2, 0.0),
      blendMode = ParticleSystem.BLENDMODE_ONEONE,
      textureUrl = "https://www.babylonjs-playground.com/textures/flare.png",
      updateSpeed = 0.02, // Optimized update speed
      manualEmitCount = -1, // Use automatic emission
      preventAutoStart = false, // Allow auto start
    } = options;

    // Create fountain base
    const fountain = MeshBuilder.CreateBox("fountain", { size: 2 }, scene);
    fountain.position = position;

    // Create fountain material
    const fountainMaterial = new StandardMaterial("fountainMaterial", scene);
    fountainMaterial.diffuseColor = new Color3(0.5, 0.5, 0.8);
    fountainMaterial.specularColor = new Color3(0.8, 0.8, 1.0);
    fountain.material = fountainMaterial;

    // Create particle system
    const particleSystem = new ParticleSystem("particles", capacity, scene);

    // Texture of each particle
    particleSystem.particleTexture = new Texture(textureUrl, scene);

    // Where the particles come from
    particleSystem.emitter = fountain; // the starting object, the emitter
    particleSystem.minEmitBox = new Vector3(-1, 0, 0); // Starting all from
    particleSystem.maxEmitBox = new Vector3(1, 0, 0); // To...

    // Colors of all particles
    particleSystem.color1 = color1;
    particleSystem.color2 = color2;
    particleSystem.colorDead = colorDead;

    // Size of each particle (random between...)
    particleSystem.minSize = minSize;
    particleSystem.maxSize = maxSize;

    // Life time of each particle (random between...)
    particleSystem.minLifeTime = minLifeTime;
    particleSystem.maxLifeTime = maxLifeTime;

    // Emission rate
    particleSystem.emitRate = emitRate;

    // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    particleSystem.blendMode = blendMode;

    // Set the gravity of all particles
    particleSystem.gravity = gravity;

    // Direction of each particle after it has been emitted
    particleSystem.direction1 = direction1;
    particleSystem.direction2 = direction2;

    // Angular speed, in radians
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;

    // Speed
    particleSystem.minEmitPower = minEmitPower;
    particleSystem.maxEmitPower = maxEmitPower;
    particleSystem.updateSpeed = updateSpeed;

    // Performance optimizations
    particleSystem.isBillboardBased = true; // Use billboards for better performance
    particleSystem.renderingGroupId = 1; // Render in a separate group

    // Manual emit count for performance control
    if (manualEmitCount > 0) {
      particleSystem.manualEmitCount = manualEmitCount;
    }

    // Start the particle system unless prevented
    if (!preventAutoStart) {
      particleSystem.start();
    }

    // Add subtle animation to the fountain base
    const animationKeys = [];
    animationKeys.push({
      frame: 0,
      value: position.y,
    });
    animationKeys.push({
      frame: 60,
      value: position.y + 0.1,
    });
    animationKeys.push({
      frame: 120,
      value: position.y,
    });

    const animationBox = new Animation(
      "fountainAnimation",
      "position.y",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const easingFunction = new CircleEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    animationBox.setEasingFunction(easingFunction);

    animationBox.setKeys(animationKeys);
    fountain.animations.push(animationBox);
    scene.beginAnimation(fountain, 0, 120, true);

    const dispose = () => {
      particleSystem.dispose();
      fountain.dispose();
      fountainMaterial.dispose();
    };

    return {
      fountain,
      particleSystem,
      dispose,
    };
  };

  return {
    createFountain,
  };
};
