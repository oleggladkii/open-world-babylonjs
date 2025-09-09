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
  new Vector3(18, 8, 0),
  new Vector3(2, 25, 0),
  new Vector3(20, 23, 0),
];

// Random rotations for natural appearance
const treeRotations = [
  new Vector3(0, 0, Angle.FromDegrees(45).radians()),
  new Vector3(0, 0, Angle.FromDegrees(199).radians()),
  new Vector3(0, 0, Angle.FromDegrees(180).radians()),
  new Vector3(0, 0, Angle.FromDegrees(315).radians()),
];

// Slight scale variations for natural look
const treeScales = [
  new Vector3(1.2, 1.2, 1.2),
  new Vector3(1.1, 1.1, 1.1),
  new Vector3(0.9, 0.9, 0.9),
  new Vector3(1.3, 1.3, 1.3),
];

let treeInstances: InstancedMesh[] = [];

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
          treeMeshes.forEach((mesh) => {
            if (mesh instanceof Mesh) {
              const instance = mesh.createInstance(
                `treeInstance_${index}_${mesh.name}`,
              );

              // Apply position, rotation, and scaling
              instance.position = position.clone();
              instance.rotation = treeRotations[index].clone();
              instance.scaling = treeScales[index].clone();

              // Enable shadow casting and receiving
              props.addShadowCaster(instance);
              instance.receiveShadows = true;

              treeInstances.push(instance);
            }
          });
        });

        console.log(`Created ${treeInstances.length} tree instances`);
      }
    }
  } catch (error) {
    console.error("Error loading tree model:", error);
  }
};

onMounted(() => {
  createTrees();
});

onUnmounted(() => {
  // Clean up instances
  treeInstances.forEach((instance) => {
    instance.dispose();
  });
  treeInstances = [];
});
</script>
