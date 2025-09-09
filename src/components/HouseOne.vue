<template lang="pug">
div
  // This component handles the residential family house
  // Loads and positions the house model with shadows
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Scene, Vector3, AbstractMesh } from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene | null;
  addShadowCaster: (mesh: AbstractMesh) => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();

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
    }
  } catch (error) {
    console.warn("Failed to load red roof house:", error);
  }
};

const cleanup = () => {
  // Dispose all house meshes
  houseInstance.forEach((mesh) => {
    if (mesh && mesh.dispose) {
      mesh.dispose();
    }
  });
  houseInstance = [];
};

onMounted(() => {
  createHouse();
});

onUnmounted(() => {
  cleanup();
});
</script>
