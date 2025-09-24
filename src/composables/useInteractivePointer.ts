import { ref, onUnmounted } from "vue";
import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Texture,
  AbstractMesh,
  Animation,
  Animatable,
  Color3,
  Angle,
} from "@babylonjs/core";
import handPointerUrl from "@/assets/images/hand-pointer.svg?url";

interface InteractivePointerConfig {
  position: Vector3;
  height: number; // Height above the model
  size: number; // Size of the pointer plane
  rotationSpeed: number; // Rotation speed (radians per second)
}

export const useInteractivePointer = () => {
  const pointerMesh = ref<AbstractMesh | null>(null);
  const pointerAnimatable = ref<Animatable | null>(null);
  const isVisible = ref(false);

  const createPointer = (scene: Scene, config: InteractivePointerConfig) => {
    if (!scene) {
      console.error("No scene provided to createPointer");
      return null;
    }

    try {
      // Create a plane for the pointer
      const plane = MeshBuilder.CreatePlane(
        "interactivePointer",
        {
          size: config.size,
        },
        scene,
      );

      // Position the plane above the model
      plane.position = new Vector3(
        config.position.x,
        config.position.y + config.height,
        config.position.z,
      );

      // Make the plane always face the camera (billboard mode)
      plane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

      // Rotate pointer 180 degrees for correct orientation
      plane.rotation.z = Angle.FromDegrees(180).radians();

      // Create material with hand pointer texture
      const material = new StandardMaterial("pointerMaterial", scene);

      const texture = new Texture(handPointerUrl, scene);

      texture.hasAlpha = true;
      material.diffuseTexture = texture;
      material.emissiveColor = new Color3(0.8, 0.8, 0.8); // Slight glow
      material.disableLighting = true;
      material.backFaceCulling = false;

      plane.material = material;

      // Make sure it's enabled and visible
      plane.setEnabled(true);
      plane.isVisible = true;

      // Create rotation animation
      const rotationAnimation = Animation.CreateAndStartAnimation(
        "pointerRotation",
        plane,
        "rotation.y",
        30, // 30 FPS
        60, // 60 frames = 2 seconds for one full rotation
        0, // Start value
        Math.PI * 2, // End value (360 degrees)
        Animation.ANIMATIONLOOPMODE_CYCLE,
      );

      // Create wave-like vertical movement animation with sine curve
      const baseY = plane.position.y;
      const waveAnimation = new Animation(
        "pointerWave",
        "position.y",
        30, // 30 FPS
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CYCLE,
      );

      // Create smooth wave motion using sine curve
      const waveKeys = [];
      for (let frame = 0; frame <= 90; frame++) {
        const progress = (frame / 90) * Math.PI * 2; // Full sine wave cycle
        const yOffset = Math.sin(progress) * 0.5; // Amplitude of 0.5 units
        waveKeys.push({
          frame: frame,
          value: baseY + yOffset,
        });
      }

      waveAnimation.setKeys(waveKeys);
      plane.animations.push(waveAnimation);

      // Start the wave animation
      scene.beginAnimation(plane, 0, 90, true);

      // Ensure animations loop forever
      if (rotationAnimation) {
        rotationAnimation.loopAnimation = true;
      }

      // Store references
      pointerMesh.value = plane;
      pointerAnimatable.value = rotationAnimation;
      isVisible.value = true;

      // Start visible by default
      plane.setEnabled(true);

      return plane;
    } catch (error) {
      console.error("Failed to create interactive pointer:", error);
      return null;
    }
  };

  const showPointer = () => {
    if (pointerMesh.value) {
      pointerMesh.value.setEnabled(true);
      isVisible.value = true;

      // Restart animation if it exists
      if (pointerAnimatable.value) {
        pointerAnimatable.value.restart();
      }
    }
  };

  const hidePointer = () => {
    if (pointerMesh.value) {
      pointerMesh.value.setEnabled(false);
      isVisible.value = false;

      // Pause animation
      if (pointerAnimatable.value) {
        pointerAnimatable.value.pause();
      }
    }
  };

  const updatePosition = (newPosition: Vector3, height?: number) => {
    if (pointerMesh.value) {
      pointerMesh.value.position = new Vector3(
        newPosition.x,
        newPosition.y + (height || 3),
        newPosition.z,
      );
    }
  };

  const setRotationSpeed = (speed: number) => {
    // For changing speed, we need to recreate the animation
    if (pointerMesh.value && pointerMesh.value.getScene()) {
      const scene = pointerMesh.value.getScene();

      // Stop current animation
      if (pointerAnimatable.value) {
        scene.stopAnimation(pointerAnimatable.value.target);
      }

      // Create new animation with different speed
      const newAnimation = Animation.CreateAndStartAnimation(
        "pointerRotation",
        pointerMesh.value,
        "rotation.y",
        30, // 30 FPS
        Math.floor(30 / speed), // Adjust frame count based on speed
        0, // Start value
        Math.PI * 2, // End value (360 degrees)
        Animation.ANIMATIONLOOPMODE_CYCLE,
      );

      pointerAnimatable.value = newAnimation;
    }
  };

  const dispose = () => {
    if (pointerAnimatable.value && pointerMesh.value) {
      const scene = pointerMesh.value.getScene();
      scene.stopAnimation(pointerAnimatable.value.target);
      pointerAnimatable.value = null;
    }

    if (pointerMesh.value) {
      // Dispose material and texture
      if (pointerMesh.value.material) {
        const material = pointerMesh.value.material as StandardMaterial;
        if (material.diffuseTexture) {
          material.diffuseTexture.dispose();
        }
        material.dispose();
      }

      pointerMesh.value.dispose();
      pointerMesh.value = null;
    }

    isVisible.value = false;
  };

  // Auto cleanup on component unmount
  onUnmounted(() => {
    dispose();
  });

  return {
    // State
    pointerMesh,
    isVisible,

    // Methods
    createPointer,
    showPointer,
    hidePointer,
    updatePosition,
    setRotationSpeed,
    dispose,
  };
};
