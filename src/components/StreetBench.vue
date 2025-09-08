<template lang="pug">
div
  // This component handles street bench instances
  // Optimized with instancing for performance
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Scene, Vector3, AbstractMesh, Mesh, Angle } from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene | null;
  addShadowCaster: (mesh: AbstractMesh) => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();

let streetBenchInstances: AbstractMesh[] = [];

const benchPositions = [
  new Vector3(-46, -50.5, 0), // Near house area, left side
  new Vector3(46, -50.5, 0), // Near house area, right side
  new Vector3(0, -50.5, 0), // Center area, facing north
];

const benchRotations = [
  new Vector3(0, 0, Angle.FromDegrees(90).radians()), // Angled toward center
  new Vector3(0, 0, Angle.FromDegrees(90).radians()), // Angled toward center
  new Vector3(0, 0, Angle.FromDegrees(90).radians()), // Facing forward
];

const createStreetBenches = async () => {
  if (!props.scene) return;

  try {
    const benchResult = await loadModel(props.scene, {
      fileName: "donate_bench.glb",
      rootUrl: "public/assets/models/environments/",
      position: new Vector3(0, 0, 0),
      scaling: new Vector3(0.5, 0.5, 0.5),
      name: "streetBench",
    });

    if (benchResult && benchResult.meshes.length > 0) {
      // Get all bench meshes (not just the first one)
      const benchMeshes = benchResult.meshes.filter(
        (mesh) => mesh.getTotalVertices() > 0,
      );

      if (benchMeshes.length > 0) {
        // Hide original meshes so only instances are visible
        benchMeshes.forEach((mesh) => {
          mesh.setEnabled(false);
        });

        // Create instances for each position
        for (let i = 0; i < benchPositions.length; i++) {
          // Create instances for each mesh part of the bench
          for (let meshIndex = 0; meshIndex < benchMeshes.length; meshIndex++) {
            const originalMesh = benchMeshes[meshIndex];

            if (originalMesh instanceof Mesh) {
              const benchInstance = originalMesh.createInstance(
                `streetBench_${i}_mesh_${meshIndex}`,
              );

              benchInstance.position = benchPositions[i];
              benchInstance.scaling = new Vector3(1, 1, 1);
              benchInstance.receiveShadows = true;
              props.addShadowCaster(benchInstance);

              // Add rotation
              benchInstance.rotation = benchRotations[i];

              streetBenchInstances.push(benchInstance);
            }
          }
        }

        console.log(
          `Created ${streetBenchInstances.length} street bench mesh instances`,
        );
      }
    }
  } catch (error) {
    console.warn("Failed to load street bench model:", error);
  }
};

const cleanup = () => {
  // Dispose all instances
  streetBenchInstances.forEach((instance) => {
    if (instance && instance.dispose) {
      instance.dispose();
    }
  });
  streetBenchInstances = [];
};

onMounted(() => {
  createStreetBenches();
});

onUnmounted(() => {
  cleanup();
});
</script>
