<template>
  <div></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import {
  Scene,
  Vector3,
  Angle,
  Mesh,
  InstancedMesh,
  AbstractMesh,
} from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene;
  addShadowCaster: (mesh: AbstractMesh) => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();

// Tree positions around the village scene
const treePositions = [
  new Vector3(-28, -26, 0),
  new Vector3(2, 25, 0),
  new Vector3(20, 23, 0),
];

// Random rotations for natural appearance
const treeRotations = [
  new Vector3(0, 0, Angle.FromDegrees(45).radians()),
  new Vector3(0, 0, Angle.FromDegrees(180).radians()),
  new Vector3(0, 0, Angle.FromDegrees(315).radians()),
];

// Slight scale variations for natural look
const treeScales = [
  new Vector3(1.2, 1.2, 1.2),
  new Vector3(0.9, 0.9, 0.9),
  new Vector3(1.3, 1.3, 1.3),
];

let treeInstances: InstancedMesh[] = [];
const treeInstancesByPosition: InstancedMesh[][] = []; // Group instances by tree position
let windAnimationId: number | null = null;
let windTime = 0;

const createTrees = async () => {
  if (!props.scene) return;

  try {
    const treeResult = await loadModel(props.scene, {
      fileName: "anime_nature_tree_01.glb",
      rootUrl: "/assets/models/environments/",
      position: new Vector3(0, 0, 0),
      scaling: new Vector3(1, 1, 1),
      name: "animeTree",
    });

    if (treeResult && treeResult.meshes.length > 0) {
      // Get all tree meshes (not just the first one)
      const treeMeshes = treeResult.meshes.filter(
        (mesh) => mesh.getTotalVertices() > 0,
      );

      if (treeMeshes.length > 0) {
        // Hide original meshes so only instances are visible
        treeMeshes.forEach((mesh) => {
          mesh.setEnabled(false);
        });

        // Create instances for each position
        treePositions.forEach((position, index) => {
          const treeGroup: InstancedMesh[] = []; // Group for this tree position

          treeMeshes.forEach((mesh) => {
            if (mesh instanceof Mesh) {
              const instance = mesh.createInstance(
                `treeInstance_${index}_${mesh.name}`,
              );

              // Apply position, rotation, and scaling
              instance.position = position.clone();
              instance.rotation = treeRotations[index].clone();
              instance.scaling = treeScales[index].clone();

              // Enable shadow receiving only for performance - trees don't need to cast shadows
              // props.addShadowCaster(instance);
              instance.receiveShadows = true;

              treeInstances.push(instance);
              treeGroup.push(instance); // Add to this tree's group
            }
          });

          treeInstancesByPosition.push(treeGroup); // Store the group
        });
        // Start wind animation after trees are created
        startWindAnimation();
      }
    }
  } catch (error) {
    console.error("Error loading tree model:", error);
  }
};

// Wind swaying animation function
const startWindAnimation = () => {
  const animateWind = () => {
    windTime += 0.016; // ~60fps increment

    treeInstancesByPosition.forEach((treeGroup, treeIndex) => {
      // Different wind patterns for each tree position
      const windStrength = 0.025 + treeIndex * 0.01; // Slightly different strength per tree
      const windSpeed = 1.0 + treeIndex * 0.2; // Different speed per tree
      const windOffset = treeIndex * 0.5; // Phase offset for natural variation

      // Calculate wind sway using sine wave
      const swayAmount =
        Math.sin(windTime * windSpeed + windOffset) * windStrength;

      // Apply same rotation to all parts of this tree (leaves and trunk)
      const originalRotation = treeRotations[treeIndex % treeRotations.length];
      const newRotationY = originalRotation.y + swayAmount;

      treeGroup.forEach((instance) => {
        instance.rotation.y = newRotationY;
      });
    });

    windAnimationId = requestAnimationFrame(animateWind);
  };

  animateWind();
};

onMounted(() => {
  createTrees();
});

onUnmounted(() => {
  // Stop wind animation
  if (windAnimationId) {
    cancelAnimationFrame(windAnimationId);
    windAnimationId = null;
  }

  // Clean up instances
  treeInstances.forEach((instance) => {
    instance.dispose();
  });
  treeInstances = [];
});
</script>
