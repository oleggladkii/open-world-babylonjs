<template lang="pug">
div
  // This component handles the idle male character
  // It's designed to be used within a Babylon.js scene with hover interactions
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import {
  Scene,
  Vector3,
  Angle,
  AbstractMesh,
  Material,
  Observer,
  PointerInfo,
  PointerEventTypes,
  AnimationGroup,
} from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";
import { useInteractivePointer } from "@/composables/useInteractivePointer";

interface Props {
  scene: Scene | null;
  addShadowCaster: (mesh: AbstractMesh) => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();
const {
  createPointer,
  showPointer,
  hidePointer,
  dispose: disposePointer,
} = useInteractivePointer();

let maleMeshes: AbstractMesh[] = [];
const greetingMeshes: AbstractMesh[] = [];
const currentMeshes: AbstractMesh[] = [];
const originalMaterials: Map<AbstractMesh, Material> = new Map();
let pointerObserver: Observer<PointerInfo> | null = null;
let idleAnimation: AnimationGroup | null = null;
let greetingAnimation: AnimationGroup | null = null;
let isPlayingGreeting = false;

const switchToGreeting = () => {
  if (isPlayingGreeting || !idleAnimation || !greetingAnimation) return;

  isPlayingGreeting = true;

  // Stop idle animation and hide idle meshes
  idleAnimation.stop();
  maleMeshes.forEach((mesh) => mesh.setEnabled(false));

  // Show greeting meshes and play greeting animation
  greetingMeshes.forEach((mesh) => mesh.setEnabled(true));
  greetingAnimation.start(
    false,
    1.0,
    greetingAnimation.from,
    greetingAnimation.to,
    false,
  );

  // Listen for animation end to switch back to idle
  const onAnimationEnd = greetingAnimation.onAnimationGroupEndObservable.add(
    () => {
      // Hide greeting meshes and show idle meshes
      greetingMeshes.forEach((mesh) => mesh.setEnabled(false));
      maleMeshes.forEach((mesh) => mesh.setEnabled(true));

      // Start idle animation again
      if (idleAnimation) {
        idleAnimation.start(
          true,
          1.0,
          idleAnimation.from,
          idleAnimation.to,
          false,
        );
      }

      isPlayingGreeting = false;

      // Remove the observer
      if (greetingAnimation) {
        greetingAnimation.onAnimationGroupEndObservable.remove(onAnimationEnd);
      }
    },
  );

  // Fallback: use timeout based on animation duration
  const animationDuration =
    ((greetingAnimation.to - greetingAnimation.from) / 30) * 1000; // Convert frames to ms (assuming 30fps)
};

const setupPointerInteraction = () => {
  if (!props.scene) return;

  pointerObserver = props.scene.onPointerObservable.add((pointerInfo) => {
    const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

    // Check if picked mesh belongs to the character
    const isCharacterMesh =
      pickedMesh &&
      currentMeshes.some(
        (mesh) =>
          mesh === pickedMesh ||
          mesh.getChildMeshes().includes(pickedMesh as AbstractMesh),
      );

    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERMOVE:
        if (isCharacterMesh) {
          const canvas = props.scene?.getEngine().getRenderingCanvas();
          if (canvas) {
            canvas.style.cursor = "pointer";
          }
          showPointer();
        } else {
          const canvas = props.scene?.getEngine().getRenderingCanvas();
          if (canvas) {
            canvas.style.cursor = "default";
          }
          // hidePointer();
        }
        break;

      case PointerEventTypes.POINTERDOWN:
        if (isCharacterMesh) {
          switchToGreeting();
        }
        break;
    }
  });
};

const createIdleMale = async () => {
  if (!props.scene) return;

  try {
    // Load idle model
    const idleResult = await loadModel(props.scene, {
      fileName: "male-idle-2.glb",
      rootUrl: "/assets/models/animations/",
      position: new Vector3(8, 0, -2),
      scaling: new Vector3(2, 2, 2),
      rotation: new Vector3(0, Angle.FromDegrees(180).radians(), 0),
      name: "idleMale",
    });

    // Load greeting model
    const greetingResult = await loadModel(props.scene, {
      fileName: "male-greeting.glb",
      rootUrl: "/assets/models/animations/",
      position: new Vector3(8, 0, -2),
      scaling: new Vector3(2, 2, 2),
      rotation: new Vector3(0, Angle.FromDegrees(180).radians(), 0),
      name: "greetingMale",
    });

    if (idleResult && idleResult.meshes.length > 0) {
      // Setup idle meshes
      idleResult.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        props.addShadowCaster(mesh);
        maleMeshes.push(mesh);
        currentMeshes.push(mesh);

        // Store original materials for hover effect
        if (mesh.material) {
          originalMaterials.set(mesh, mesh.material);
        }
      });

      // Setup idle animation
      if (idleResult.animationGroups.length > 0) {
        idleAnimation = idleResult.animationGroups[0];
        idleAnimation.start(
          false,
          1.0,
          idleAnimation.from,
          idleAnimation.to,
          false,
        );
      }
    }

    if (greetingResult && greetingResult.meshes.length > 0) {
      // Setup greeting meshes (initially hidden)
      greetingResult.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        props.addShadowCaster(mesh);
        mesh.setEnabled(false); // Hide initially
        greetingMeshes.push(mesh);
        currentMeshes.push(mesh);

        // Store original materials for hover effect
        if (mesh.material) {
          originalMaterials.set(mesh, mesh.material);
        }
      });

      // Setup greeting animation
      if (greetingResult.animationGroups.length > 0) {
        greetingAnimation = greetingResult.animationGroups[0];
        // Ensure animation is configured to not loop
        greetingAnimation.loopAnimation = false;
      }
    }

    // Create rotating pointer above the character
    createPointer(props.scene, {
      position: new Vector3(8, 0, -2), // Same position as the character
      height: 5, // 5 units above the character
      size: 2, // Smaller size for better UX
      rotationSpeed: 1, // Normal rotation speed
    });

    // Setup pointer interaction after all models are loaded
    setupPointerInteraction();
  } catch (error) {
    console.warn("Failed to load male character models:", error);
  }
};

const cleanup = () => {
  // Remove pointer observer
  if (pointerObserver && props.scene) {
    props.scene.onPointerObservable.remove(pointerObserver);
  }

  // Reset cursor
  if (props.scene) {
    const canvas = props.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      canvas.style.cursor = "default";
    }
  }

  // Stop animations
  if (idleAnimation) {
    idleAnimation.stop();
  }
  if (greetingAnimation) {
    greetingAnimation.stop();
  }

  // Dispose rotating pointer
  disposePointer();

  // Clear arrays and maps
  maleMeshes = [];
  greetingMeshes.length = 0;
  currentMeshes.length = 0;
  originalMaterials.clear();
};

onMounted(() => {
  createIdleMale();
});

onUnmounted(() => {
  cleanup();
});
</script>
