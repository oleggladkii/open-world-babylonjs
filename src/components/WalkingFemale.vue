<template lang="pug">
div
  // This component handles the walking female character
  // It's designed to be used within a Babylon.js scene
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Scene, Vector3, Angle, AbstractMesh } from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene | null;
  addShadowCaster: (mesh: AbstractMesh) => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();

let femaleAnimationCleanup: (() => void) | null = null;
let maleAnimationCleanup: (() => void) | null = null;

const createWalkingCharacters = async () => {
  if (!props.scene) return;

  try {
    // Load female character
    const femaleResult = await loadModel(props.scene, {
      fileName: "female-walk-loop.glb",
      rootUrl: "/assets/models/animations/",
      position: new Vector3(0, 0, 0),
      scaling: new Vector3(2, 2, 2),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      name: "female",
    });

    // Load male character with phone
    const maleResult = await loadModel(props.scene, {
      fileName: "male-phone.glb",
      rootUrl: "/assets/models/animations/",
      position: new Vector3(0, 0, 0),
      scaling: new Vector3(2, 2, 2),
      rotation: new Vector3(0, Angle.FromDegrees(-90).radians(), 0),
      name: "malePhone",
    });

    if (femaleResult && femaleResult.meshes.length > 0) {
      // Setup shadows for all meshes - only receive shadows, don't cast for performance
      femaleResult.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        // Disabled shadow casting for characters to improve performance
        // props.addShadowCaster(mesh);
      });

      // Start walk animation if available
      if (femaleResult.animationGroups.length > 0) {
        const walkAnimation = femaleResult.animationGroups[0];
        walkAnimation.start(
          true,
          1.0,
          walkAnimation.from,
          walkAnimation.to,
          false,
        );
      }

      // Add movement behavior - walk along the road
      const rootMesh = femaleResult.rootMesh || femaleResult.meshes[0];
      let currentX = 0; // Start at left edge of road
      const roadZ = -21.5; // Road position Z coordinate
      const walkSpeed = 0.04; // Walking speed
      let direction = 1; // 1 for right, -1 for left
      let isRotating = false;
      let rotationProgress = 0;
      let targetRotation = Angle.FromDegrees(90).radians();
      let startRotation = Angle.FromDegrees(90).radians();
      const rotationSpeed = 0.05; // Rotation interpolation speed

      // Position character on the road initially
      rootMesh.position = new Vector3(currentX, 0, roadZ);
      // Set initial rotation to face right (positive X direction)
      rootMesh.rotation.y = targetRotation;

      const animationLoop = () => {
        if (isRotating) {
          // Smooth rotation interpolation
          rotationProgress += rotationSpeed;
          if (rotationProgress >= 1) {
            rotationProgress = 1;
            isRotating = false;
          }

          // Interpolate between start and target rotation
          rootMesh.rotation.y =
            startRotation + (targetRotation - startRotation) * rotationProgress;
        } else {
          // Move along X axis (road direction)
          currentX += walkSpeed * direction;

          // Check if reached road edges and start smooth turn
          if (currentX >= 28 && direction === 1) {
            // Right edge of road - start turning left
            direction = -1;
            currentX = 28;
            isRotating = true;
            rotationProgress = 0;
            startRotation = rootMesh.rotation.y;
            targetRotation = Angle.FromDegrees(-90).radians();
          } else if (currentX <= -28 && direction === -1) {
            // Left edge of road - start turning right
            direction = 1;
            currentX = -28;
            isRotating = true;
            rotationProgress = 0;
            startRotation = rootMesh.rotation.y;
            targetRotation = Angle.FromDegrees(90).radians();
          }
        }

        // Update position
        rootMesh.position.x = currentX;
        rootMesh.position.z = roadZ;
      };

      // Register animation loop with scene
      props.scene.registerBeforeRender(animationLoop);

      // Store cleanup function
      femaleAnimationCleanup = () => {
        props.scene?.unregisterBeforeRender(animationLoop);
      };
    }

    // Setup male character with phone
    if (maleResult && maleResult.meshes.length > 0) {
      // Setup shadows for all meshes - only receive shadows, don't cast for performance
      maleResult.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        // Disabled shadow casting for characters to improve performance
        // props.addShadowCaster(mesh);
      });

      // Start walk animation if available
      if (maleResult.animationGroups.length > 0) {
        const walkAnimation = maleResult.animationGroups[0];
        walkAnimation.start(
          true,
          1.0,
          walkAnimation.from,
          walkAnimation.to,
          false,
        );
      }

      // Add movement behavior - walk in opposite direction
      const rootMesh = maleResult.rootMesh || maleResult.meshes[0];
      let currentX = 25; // Start at right edge of road (opposite to female)
      const roadZ = -23; // Different road position Z coordinate
      const walkSpeed = 0.03; // Walking speed
      let direction = -1; // -1 for left, 1 for right (opposite to female)
      let isRotating = false;
      let rotationProgress = 0;
      let targetRotation = Angle.FromDegrees(-90).radians();
      let startRotation = Angle.FromDegrees(-90).radians();
      const rotationSpeed = 0.05; // Rotation interpolation speed

      // Position character on the road initially
      rootMesh.position = new Vector3(currentX, 0, roadZ);
      // Set initial rotation to face left (negative X direction)
      rootMesh.rotation.y = targetRotation;

      const maleAnimationLoop = () => {
        if (isRotating) {
          // Smooth rotation interpolation
          rotationProgress += rotationSpeed;
          if (rotationProgress >= 1) {
            rotationProgress = 1;
            isRotating = false;
          }

          // Interpolate between start and target rotation
          rootMesh.rotation.y =
            startRotation + (targetRotation - startRotation) * rotationProgress;
        } else {
          // Move along X axis (road direction)
          currentX += walkSpeed * direction;

          // Check if reached road edges and start smooth turn
          if (currentX <= -28 && direction === -1) {
            // Left edge of road - start turning right
            direction = 1;
            currentX = -28;
            isRotating = true;
            rotationProgress = 0;
            startRotation = rootMesh.rotation.y;
            targetRotation = Angle.FromDegrees(90).radians();
          } else if (currentX >= 28 && direction === 1) {
            // Right edge of road - start turning left
            direction = -1;
            currentX = 28;
            isRotating = true;
            rotationProgress = 0;
            startRotation = rootMesh.rotation.y;
            targetRotation = Angle.FromDegrees(-90).radians();
          }
        }

        // Update position
        rootMesh.position.x = currentX;
        rootMesh.position.z = roadZ;
      };

      // Register male animation loop with scene
      props.scene.registerBeforeRender(maleAnimationLoop);

      // Store cleanup function
      maleAnimationCleanup = () => {
        props.scene?.unregisterBeforeRender(maleAnimationLoop);
      };
    }
  } catch (error) {
    console.warn("Failed to load character models:", error);
  }
};

onMounted(() => {
  createWalkingCharacters();
});

onUnmounted(() => {
  if (femaleAnimationCleanup) {
    femaleAnimationCleanup();
  }
  if (maleAnimationCleanup) {
    maleAnimationCleanup();
  }
});
</script>
