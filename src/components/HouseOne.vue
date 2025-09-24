<template lang="pug">
div
  // This component handles the residential family house
  // Loads and positions the house model with shadows and interactive pointer
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Scene, Vector3, AbstractMesh } from "@babylonjs/core";
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

let houseInstance: AbstractMesh[] = [];

const createHouse = async () => {
  if (!props.scene) return;

  try {
    const houseResult = await loadModel(props.scene, {
      fileName: "residential_family_house.glb",
      rootUrl: "/assets/models/buildings/",
      position: new Vector3(20, 0, 14),
      scaling: new Vector3(16, 16, 16),
      name: "redHouse",
    });

    if (houseResult && houseResult.meshes.length > 0) {
      // Add shadows to all house meshes
      houseResult.meshes.forEach((mesh) => {
        mesh.receiveShadows = true;
        props.addShadowCaster(mesh);
        houseInstance.push(mesh);
      });

      // Create interactive pointer above the house (initially hidden)
      createPointer(props.scene, {
        position: new Vector3(16, 0, 15), // House position
        height: 14, // Height above the house
        size: 5, // Size of the pointer
        rotationSpeed: 2, // Rotation speed
      });

      // Explicitly hide the pointer initially - it will be shown after chat interaction
      hidePointer();
    }
  } catch (error) {
    console.warn("Failed to load red roof house:", error);
  }
};

const showHousePointer = () => {
  showPointer();
};

const cleanup = () => {
  // Dispose all house meshes
  houseInstance.forEach((mesh) => {
    if (mesh && mesh.dispose) {
      mesh.dispose();
    }
  });
  houseInstance = [];
  
  // Dispose pointer
  disposePointer();
};

// Expose function to parent component
defineExpose({
  showHousePointer,
});

onMounted(() => {
  createHouse();
});

onUnmounted(() => {
  cleanup();
});
</script>
