<template lang="pug">
div
  // This component handles street lamp instances
  // Optimized with instancing for performance
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import {
  Scene,
  Vector3,
  AbstractMesh,
  Mesh,
  DirectionalLight,
  Color3,
  Angle,
} from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene | null;
  addShadowCaster: (mesh: AbstractMesh) => void;
  isNight?: boolean;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();

let streetLampInstances: AbstractMesh[] = [];
let streetLampLights: DirectionalLight[] = [];

const lampPositions = [
  new Vector3(0, 0, 3.5),
  new Vector3(-25, 0, 3.5),
  new Vector3(25, 0, 3.5),
  new Vector3(-15, 0, 24.8),
  new Vector3(15, 0, 24.8),
];
const lampRotations = [
  new Vector3(0, 0, 0),
  new Vector3(0, 0, 0),
  new Vector3(0, 0, 0),
  new Vector3(0, Angle.FromDegrees(180).radians(), 0),
  new Vector3(0, Angle.FromDegrees(180).radians(), 0),
];

const createStreetLamps = async () => {
  if (!props.scene) return;

  try {
    const lampResult = await loadModel(props.scene, {
      fileName: "street-lamp.glb",
      rootUrl: "/assets/models/environments/",
      position: new Vector3(0, 0, 0),
      scaling: new Vector3(1, 1, 1),
      name: "streetLamp",
    });

    if (lampResult && lampResult.meshes.length > 0) {
      // Get all lamp meshes (not just the first one)
      const lampMeshes = lampResult.meshes.filter(
        (mesh) => mesh.getTotalVertices() > 0,
      );

      if (lampMeshes.length > 0) {
        // Hide original meshes so only instances are visible
        lampMeshes.forEach((mesh) => {
          mesh.setEnabled(false);
        });

        // Create instances for each position
        for (let i = 0; i < lampPositions.length; i++) {
          // Create instances for each mesh part of the lamp
          for (let meshIndex = 0; meshIndex < lampMeshes.length; meshIndex++) {
            const originalMesh = lampMeshes[meshIndex];

            if (originalMesh instanceof Mesh) {
              const lampInstance = originalMesh.createInstance(
                `streetLamp_${i}_mesh_${meshIndex}`,
              );

              lampInstance.position = lampPositions[i];
              lampInstance.scaling = new Vector3(1.5, 1.5, 1.5);
              lampInstance.receiveShadows = true;
              props.addShadowCaster(lampInstance);

              // Add rotation
              lampInstance.rotation = lampRotations[i];

              streetLampInstances.push(lampInstance);
            }
          }

          // Create directional light for this lamp position
          if (props.isNight) {
            // Use the first mesh instance as reference for light positioning
            const referenceMesh =
              streetLampInstances[
                streetLampInstances.length - lampMeshes.length
              ];
            if (referenceMesh) {
            //   createLampLight(referenceMesh, i);
            }
          }
        }

        console.log(
          `Created ${streetLampInstances.length} street lamp mesh instances`,
        );
      }
    }
  } catch (error) {
    console.warn("Failed to load street lamp model:", error);
  }
};

const createLampLight = (lampMesh: AbstractMesh, index: number) => {
  if (!props.scene) return;

  const light = new DirectionalLight(
    `streetLampLight_${index}`,
    new Vector3(0, -100, 0), // Direction: straight downward
    props.scene,
  );

  // Position light above the actual lamp mesh
  light.position = lampMesh.position.clone();
//   light.direction = lampMesh.position.clone();
  light.position.z = index > 2 ? -light.position.z + 4 : -light.position.z - 4;
  light.position.y += 7; // Raise light above lamp post

  // Warm street lamp color
  light.diffuse = new Color3(1.0, 0.8, 0.4); // Warm yellow-orange
  light.specular = new Color3(0.8, 0.6, 0.3);
  light.intensity = 2; // Moderate intensity for street lighting

  // Set light range and falloff
  light.range = 2; // Light reaches 4 units

  streetLampLights.push(light);
};

const cleanup = () => {
  // Dispose all lights
  streetLampLights.forEach((light) => {
    if (light && light.dispose) {
      light.dispose();
    }
  });
  streetLampLights = [];

  // Dispose all instances
  streetLampInstances.forEach((instance) => {
    if (instance && instance.dispose) {
      instance.dispose();
    }
  });
  streetLampInstances = [];
};

onMounted(() => {
  createStreetLamps();
});

onUnmounted(() => {
  cleanup();
});
</script>
