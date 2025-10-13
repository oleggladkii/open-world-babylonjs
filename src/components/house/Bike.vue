<template lang="pug">
div
  // Invisible component - racing bike is created programmatically
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  Vector3,
  Angle,
  AbstractMesh,
  PhysicsImpostor,
} from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene | null;
  position?: Vector3;
}

const props = withDefaults(defineProps<Props>(), {
  position: () => new Vector3(0, 0, 0),
});

const { loadModel } = useLoadModel();
let bikeMeshes: AbstractMesh[] = [];

const createBike = async () => {
  if (!props.scene) {
    console.warn("Scene not available for bike creation");
    return;
  }

  try {
    const bikeResult = await loadModel(props.scene, {
      fileName: "high-tech_racing_bike.glb",
      rootUrl: "/assets/models/house/",
      position: props.position,
      scaling: new Vector3(1.4, 1.4, 1.4),
      rotation: new Vector3(0, Angle.FromDegrees(0).radians(), 0),
      name: "racingBike",
    });

    if (bikeResult && bikeResult.meshes.length > 0) {
      // Get all bike meshes
      const bikeMeshParts = bikeResult.meshes.filter(
        (mesh) => mesh.getTotalVertices() > 0,
      );

      if (bikeMeshParts.length > 0) {
        bikeMeshParts.forEach((mesh) => {
          // Add physics collision
          mesh.physicsImpostor = new PhysicsImpostor(
            mesh,
            PhysicsImpostor.BoxImpostor,
            { mass: 0.5, friction: 0.8, restitution: 0.1 },
            props.scene!,
          );

          // Store for cleanup
          bikeMeshes.push(mesh);
        });

        console.log(
          `Racing bike loaded with ${bikeMeshParts.length} mesh parts`,
        );
      }
    }
  } catch (error) {
    console.error("Error loading racing bike model:", error);
  }
};

const cleanup = () => {
  // Dispose all bike meshes
  bikeMeshes.forEach((mesh) => {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose();
    }
    if (mesh.dispose) {
      mesh.dispose();
    }
  });
  bikeMeshes = [];
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createBike();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createBike();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export for other components
defineExpose({
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - bike is a 3D object */
</style>
