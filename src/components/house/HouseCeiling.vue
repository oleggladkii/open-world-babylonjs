<template lang="pug">
div
  // Invisible component - ceiling is created programmatically
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  Color3,
  PhysicsImpostor,
} from "@babylonjs/core";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
}

const props = defineProps<Props>();

let ceiling1: Mesh | null = null; // Room 1 ceiling
let ceiling2: Mesh | null = null; // Room 2 ceiling

const createCeiling = () => {
  if (!props.scene) {
    console.warn("Scene not available for ceiling creation");
    return;
  }

  try {
    // Dark gray material for ceiling
    const ceilingMaterial = new StandardMaterial(
      "ceilingMaterial",
      props.scene,
    );
    ceilingMaterial.diffuseColor = new Color3(0.2, 0.25, 0.35); // Dark gray
    ceilingMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular

    // ====== ROOM 1 CEILING (10x20) ======
    // Room 1: X: -10 to 0, Z: -10 to +10
    ceiling1 = MeshBuilder.CreateBox(
      "room1Ceiling",
      { width: 10, height: 0.2, depth: 20 }, // Thin ceiling
      props.scene,
    );
    ceiling1.position.set(-5, 6, 0); // At height 6 (wall height)

    ceiling1.material = ceilingMaterial;

    // Add physics impostor for bouncing
    ceiling1.physicsImpostor = new PhysicsImpostor(
      ceiling1,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0.3 },
      props.scene,
    );

    // Shadows disabled for performance
    // ceiling1.receiveShadows = false;
    // if (props.addShadowCaster) {
    //   props.addShadowCaster(ceiling1);
    // }

    // ====== ROOM 2 CEILING (10x15) ======
    // Room 2: X: 0 to +10, Z: -5 to +10 (15 units depth)
    ceiling2 = MeshBuilder.CreateBox(
      "room2Ceiling",
      { width: 10, height: 0.2, depth: 15 }, // Thin ceiling
      props.scene,
    );
    ceiling2.position.set(5, 6, 2.5); // At height 6, center at (5, 6, 2.5)

    ceiling2.material = ceilingMaterial;

    // Add physics impostor for bouncing
    ceiling2.physicsImpostor = new PhysicsImpostor(
      ceiling2,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0.3 },
      props.scene,
    );

    // Shadows disabled for performance
    // ceiling2.receiveShadows = false;
    // if (props.addShadowCaster) {
    //   props.addShadowCaster(ceiling2);
    // }

    console.log("Room 1 ceiling (10x20) created with dark gray material");
    console.log("Room 2 ceiling (10x15) created with dark gray material");
  } catch (error) {
    console.error("Error creating house ceiling:", error);
  }
};

const cleanup = () => {
  if (ceiling1) {
    if (ceiling1.physicsImpostor) {
      ceiling1.physicsImpostor.dispose();
    }
    ceiling1.dispose();
    ceiling1 = null;
  }
  if (ceiling2) {
    if (ceiling2.physicsImpostor) {
      ceiling2.physicsImpostor.dispose();
    }
    ceiling2.dispose();
    ceiling2 = null;
  }
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createCeiling();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene && !ceiling1 && !ceiling2) {
    createCeiling();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export ceiling references for other components
defineExpose({
  ceiling1: () => ceiling1,
  ceiling2: () => ceiling2,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - ceiling is a 3D object */
</style>
