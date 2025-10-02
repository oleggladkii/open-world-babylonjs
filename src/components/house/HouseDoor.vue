<template lang="pug">
div
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  Vector3,
  AbstractMesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";

interface Props {
  scene: Scene;
  addShadowCaster: (mesh: AbstractMesh) => void;
  position?: Vector3;
}

const props = withDefaults(defineProps<Props>(), {
  position: () => new Vector3(0, 0, 0),
});

// State
const doorMeshes = ref<AbstractMesh[]>([]);

// Door configuration
const doorConfig = {
  frameWidth: 0.2, // Frame thickness
  frameHeight: 4.5, // Door height
  frameDepth: 2.5, // Door width
  doorThickness: 0.1,
  handleRadius: 0.08,
  handleLength: 0.15,
};

const createDoorFrame = () => {
  if (!props.scene) return;

  const frameColor = new Color3(0.4, 0.3, 0.2); // Brown wood color
  const doorColor = new Color3(0.5, 0.4, 0.3); // Lighter brown for door
  const handleColor = new Color3(0.8, 0.7, 0.4); // Brass handle

  // Create door frame (similar to window frame)
  // Left frame
  const leftFrame = MeshBuilder.CreateBox(
    "doorFrameLeft",
    {
      width: doorConfig.frameWidth,
      height: doorConfig.frameHeight,
      depth: doorConfig.frameWidth,
    },
    props.scene,
  );
  leftFrame.position = new Vector3(
    props.position.x - doorConfig.frameDepth / 2,
    props.position.y + doorConfig.frameHeight / 2,
    props.position.z - 0.05,
  );

  // Right frame
  const rightFrame = MeshBuilder.CreateBox(
    "doorFrameRight",
    {
      width: doorConfig.frameWidth,
      height: doorConfig.frameHeight,
      depth: doorConfig.frameWidth,
    },
    props.scene,
  );
  rightFrame.position = new Vector3(
    props.position.x + doorConfig.frameDepth / 2,
    props.position.y + doorConfig.frameHeight / 2,
    props.position.z - 0.05,
  );

  // Top frame
  const topFrame = MeshBuilder.CreateBox(
    "doorFrameTop",
    {
      width: doorConfig.frameDepth + 0.2,
      height: doorConfig.frameWidth,
      depth: doorConfig.frameWidth,
    },
    props.scene,
  );
  topFrame.position = new Vector3(
    props.position.x,
    props.position.y + doorConfig.frameHeight,
    props.position.z - 0.05,
  );

  // Create door panel
  const doorPanel = MeshBuilder.CreateBox(
    "doorPanel",
    {
      width: doorConfig.frameDepth - 0.05, // Slightly smaller than frame
      height: doorConfig.frameHeight - 0.05,
      depth: doorConfig.doorThickness,
    },
    props.scene,
  );
  doorPanel.position = new Vector3(
    props.position.x,
    props.position.y + doorConfig.frameHeight / 2,
    props.position.z - doorConfig.doorThickness + 0.05, // Move panel further back behind frame
  );

  // Create door handle
  const doorHandle = MeshBuilder.CreateCylinder(
    "doorHandle",
    {
      height: doorConfig.handleLength,
      diameter: doorConfig.handleRadius * 2,
      tessellation: 16,
    },
    props.scene,
  );
  doorHandle.position = new Vector3(
    props.position.x + doorConfig.frameDepth / 2 - 0.3, // Right side of door
    props.position.y + doorConfig.frameHeight / 2 - 0.3,
    props.position.z - doorConfig.doorThickness - 0.05, // Match door panel position
  );
  doorHandle.rotation.z = Math.PI / 2; // Rotate to be horizontal
  doorHandle.rotation.y = Math.PI / 2; // Rotate to be horizontal

  // Create materials
  const frameMaterial = new StandardMaterial("doorFrameMaterial", props.scene);
  frameMaterial.diffuseColor = frameColor;
  frameMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
  frameMaterial.zOffset = -1;

  const doorMaterial = new StandardMaterial("doorMaterial", props.scene);
  doorMaterial.diffuseColor = doorColor;
  doorMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
  doorMaterial.zOffset = -2; // Panel behind frame

  const handleMaterial = new StandardMaterial("handleMaterial", props.scene);
  handleMaterial.diffuseColor = handleColor;
  handleMaterial.specularColor = new Color3(0.8, 0.8, 0.6);
  handleMaterial.emissiveColor = new Color3(0.1, 0.08, 0.05); // Slight glow
  handleMaterial.zOffset = -1;

  // Apply materials
  leftFrame.material = frameMaterial;
  rightFrame.material = frameMaterial;
  topFrame.material = frameMaterial;
  doorPanel.material = doorMaterial;
  doorHandle.material = handleMaterial;

  // Set zOffset for meshes to prevent z-fighting
  leftFrame.material!.zOffset = -1;
  rightFrame.material!.zOffset = -1;
  topFrame.material!.zOffset = -1;
  doorPanel.material!.zOffset = -2; // Panel behind frame
  doorHandle.material!.zOffset = -1;

  // Add to shadow casters
  props.addShadowCaster(leftFrame);
  props.addShadowCaster(rightFrame);
  props.addShadowCaster(topFrame);
  props.addShadowCaster(doorPanel);
  props.addShadowCaster(doorHandle);

  // Enable shadow receiving
  leftFrame.receiveShadows = true;
  rightFrame.receiveShadows = true;
  topFrame.receiveShadows = true;
  doorPanel.receiveShadows = true;
  doorHandle.receiveShadows = true;

  // Store meshes for cleanup
  doorMeshes.value.push(leftFrame, rightFrame, topFrame, doorPanel, doorHandle);
};

const cleanup = () => {
  // Dispose all door meshes
  doorMeshes.value.forEach((mesh) => {
    mesh.dispose();
  });
  doorMeshes.value = [];
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createDoorFrame();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createDoorFrame();
  }
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
/* No styles needed for this component */
</style>
