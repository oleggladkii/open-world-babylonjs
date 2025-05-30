import {
  Scene,
  Mesh,
  Vector3,
  ParticleSystem,
  GPUParticleSystem,
  Color4,
  Texture,
} from "@babylonjs/core";

interface CloudOptions {
  useGPU?: boolean;
  capacity?: number;
  activeParticleCount?: number;
  minEmitBox?: Vector3;
  maxEmitBox?: Vector3;
  minSize?: number;
  maxSize?: number;
  emitRate?: number;
  updateSpeed?: number;
}

export const useClouds = () => {
  const createParticleClouds = (scene: Scene) => {
    const {
      useGPU = true,
      capacity = 3000,
      activeParticleCount = 2500,
      minEmitBox = new Vector3(-30, 17, 30),
      maxEmitBox = new Vector3(-90, 17, 90),
      minSize = 2.0,
      maxSize = 10.0,
      emitRate = 1000,
      updateSpeed = 0.01,
    } = {} as CloudOptions;

    const emitter = Mesh.CreateBox("cloudEmitter", 0.01, scene);
    emitter.visibility = 0;
    let particleSystem: ParticleSystem | GPUParticleSystem;

    if (useGPU && GPUParticleSystem.IsSupported) {
      particleSystem = new GPUParticleSystem("clouds", { capacity }, scene);
      particleSystem.activeParticleCount = activeParticleCount;
    } else {
      particleSystem = new ParticleSystem("clouds", capacity, scene);
    }

    const cloudTexture = new Texture(
      "https://raw.githubusercontent.com/aWeirdo/Babylon.js/master/smoke_15.png",
      scene
    );

    particleSystem.particleTexture = cloudTexture;
    particleSystem.emitter = emitter;
    particleSystem.color1 = new Color4(0.8, 0.8, 0.8, 0.1);
    particleSystem.color2 = new Color4(0.95, 0.95, 0.95, 0.15);
    particleSystem.colorDead = new Color4(0.9, 0.9, 0.9, 0.1);
    particleSystem.minSize = minSize;
    particleSystem.maxSize = maxSize;
    particleSystem.minLifeTime = Number.MAX_SAFE_INTEGER;
    particleSystem.emitRate = emitRate;
    particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.gravity = new Vector3(0, 0, 0);
    particleSystem.direction1 = new Vector3(0, 0, 0);
    particleSystem.direction2 = new Vector3(0, 0, 0);
    particleSystem.minAngularSpeed = -2;
    particleSystem.maxAngularSpeed = 2;
    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1;
    particleSystem.updateSpeed = updateSpeed;
    particleSystem.minEmitBox = minEmitBox;
    particleSystem.maxEmitBox = maxEmitBox;

    particleSystem.start();

    return {
      particleSystem,
      emitter,
      dispose: () => {
        particleSystem.dispose();
        emitter.dispose();
      },
    };
  };

  return {
    createParticleClouds,
  };
};
