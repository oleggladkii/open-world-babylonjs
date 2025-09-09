<template lang="pug">
div
  // This component handles the idle male character
  // It's designed to be used within a Babylon.js scene with hover interactions
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Scene, Vector3, Angle, AbstractMesh, Material } from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene | null;
  addShadowCaster: (mesh: AbstractMesh) => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();

let maleMeshes: AbstractMesh[] = [];
const originalMaterials: Map<AbstractMesh, Material> = new Map();

const createIdleMale = async () => {
  if (!props.scene) return;

  try {
    const maleResult = await loadModel(props.scene, {
      fileName: "idle_2_male.glb",
      rootUrl: "/assets/models/animations/",
      position: new Vector3(8, 0, -2),
      scaling: new Vector3(2, 2, 2),
      rotation: new Vector3(0, Angle.FromDegrees(180).radians(), 0),
      name: "idleMale",
    });

    if (maleResult && maleResult.meshes.length > 0) {
      // Setup shadows for all meshes
      maleResult.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        props.addShadowCaster(mesh);
        maleMeshes.push(mesh);

        // Store original materials for hover effect
        if (mesh.material) {
          originalMaterials.set(mesh, mesh.material);
        }
      });

      // Start idle animation if available
      if (maleResult.animationGroups.length > 0) {
        const idleAnimation = maleResult.animationGroups[0];
        idleAnimation.start(
          true,
          1.0,
          idleAnimation.from,
          idleAnimation.to,
          false,
        );
      }
    }
  } catch (error) {
    console.warn("Failed to load idle male character model:", error);
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

  // Clear arrays and maps
  maleMeshes = [];
  originalMaterials.clear();
};

onMounted(() => {
  createIdleMale();
});

onUnmounted(() => {
  cleanup();
});
</script>
