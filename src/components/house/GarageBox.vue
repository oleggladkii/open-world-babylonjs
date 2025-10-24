<template lang="pug">
div
  // Invisible component - garage box is created programmatically
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  MeshBuilder,
  PhysicsImpostor,
  StandardMaterial,
  Texture,
  Color3,
  Mesh,
  Vector3,
} from "@babylonjs/core";
import boxCardboardTextureUrl from "../../assets/textures/box-cardboard.jpg";

interface Props {
  scene: Scene | null;
  position?: Vector3;
}

const props = withDefaults(defineProps<Props>(), {
  position: () => new Vector3(0, 0, 0),
});

// Garage box configuration
const BOX_CONFIG = {
  width: 1.2,
  height: 0.9,
  depth: 1.2,
};

let boxMesh: Mesh | null = null;

const createGarageBox = () => {
  if (!props.scene) {
    console.warn("Scene not available for garage box creation");
    return;
  }

  try {
    // Create the main box
    const box = MeshBuilder.CreateBox(
      "garageBox",
      {
        width: BOX_CONFIG.width,
        height: BOX_CONFIG.height,
        depth: BOX_CONFIG.depth,
      },
      props.scene,
    );

    box.position.set(
      props.position.x,
      props.position.y + BOX_CONFIG.height / 2,
      props.position.z,
    );

    // Create material with cardboard texture for the box
    const boxMaterial = new StandardMaterial("garageBoxMaterial", props.scene);
    const boxTexture = new Texture(boxCardboardTextureUrl, props.scene);
    boxTexture.uScale = 1;
    boxTexture.vScale = 1;
    boxMaterial.diffuseTexture = boxTexture;
    boxMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    boxMaterial.emissiveColor = new Color3(0.01, 0.01, 0.01);

    box.material = boxMaterial;

    // Add physics (static box)
    box.physicsImpostor = new PhysicsImpostor(
      box,
      PhysicsImpostor.BoxImpostor,
      { mass: 0.3, friction: 0.9, restitution: 0.05 },
      props.scene,
    );

    boxMesh = box;

    console.log("Garage box created at position:", props.position);
  } catch (error) {
    console.error("Error creating garage box:", error);
  }
};

const cleanup = () => {
  if (boxMesh) {
    if (boxMesh.physicsImpostor) {
      boxMesh.physicsImpostor.dispose();
    }
    if (boxMesh.material) {
      boxMesh.material.dispose();
    }
    boxMesh.dispose();
    boxMesh = null;
  }
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createGarageBox();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createGarageBox();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export configuration for other components
defineExpose({
  BOX_CONFIG,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - garage box is a 3D object */
</style>
