<template lang="pug">
div
  // Invisible component - floor is created programmatically
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  MeshBuilder,
  PhysicsImpostor,
  Mesh,
  StandardMaterial,
  Texture,
  Color3,
} from "@babylonjs/core";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
}

const props = defineProps<Props>();

let ground1: Mesh | null = null; // Room 1 floor (wood)
let ground2: Mesh | null = null; // Room 2 floor (tiles)
let carpet: Mesh | null = null; // Carpet in room 1

import tilesTextureUrl from "../../assets/textures/tiles.jpg";

const createFloor = () => {
  if (!props.scene) {
    console.warn("Scene not available for floor creation");
    return;
  }

  try {
    // ====== ROOM 1 FLOOR (10x20) - WOOD TEXTURE ======
    // Room 1: X: -10 to 0, Z: -10 to +10
    ground1 = MeshBuilder.CreateBox(
      "room1Floor",
      { width: 10, height: 0.5, depth: 20 },
      props.scene,
    );
    ground1.position.set(-5, -0.25, 0); // Center at (-5, -0.25, 0)

    // Create wood floor material with texture
    const woodMaterial = new StandardMaterial("woodFloorMaterial", props.scene);
    const woodTexture = new Texture(
      "/assets/textures/wood-floor.jpg",
      props.scene,
    );

    // Configure texture tiling for 10x20 floor
    woodTexture.uScale = 5; // Repeat texture 5 times horizontally
    woodTexture.vScale = 10; // Repeat texture 10 times vertically

    woodMaterial.diffuseTexture = woodTexture;
    woodMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for wood

    // Apply wood material to room 1
    ground1.material = woodMaterial;

    ground1.physicsImpostor = new PhysicsImpostor(
      ground1,
      PhysicsImpostor.BoxImpostor,
      {
        mass: 0,
        friction: 0.8,
        restitution: 0.3,
      },
      props.scene,
    );

    // ====== CARPET IN ROOM 1 (2x2) ======
    // Create carpet mesh slightly above the floor
    carpet = MeshBuilder.CreateBox(
      "carpet",
      { width: 4, height: 0.02, depth: 5 }, // Very thin carpet
      props.scene,
    );
    // Position at center of room 1: X=-5 (center), Z=0 (center), Y slightly above floor
    carpet.position.set(-5, 0.01, -4); // Center of room 1, just above floor

    // Create carpet material with texture
    const carpetMaterial = new StandardMaterial("carpetMaterial", props.scene);
    const carpetTexture = new Texture(
      "/assets/textures/carpet-floor.jpg",
      props.scene,
    );

    // Configure texture for 2x2 carpet (single texture instance)
    carpetTexture.uScale = 1; // Single texture repeat
    carpetTexture.vScale = 1; // Single texture repeat

    carpetMaterial.diffuseTexture = carpetTexture;
    carpetMaterial.specularColor = new Color3(0.05, 0.05, 0.05); // Very low specular for fabric

    // Apply material to carpet
    carpet.material = carpetMaterial;

    // Carpet receives shadows but doesn't cast them (it's very thin)
    carpet.receiveShadows = true;
    // Don't add carpet to shadow casters as it's too thin

    // ====== ROOM 2 FLOOR (10x15) - TILES TEXTURE ======
    // Room 2: X: 0 to +10, Z: -5 to +10 (15 units depth)
    ground2 = MeshBuilder.CreateBox(
      "room2Floor",
      { width: 10, height: 0.5, depth: 15 },
      props.scene,
    );
    ground2.position.set(5, -0.25, 2.5); // Center at (5, -0.25, 2.5)

    // Create tiles floor material with texture
    const tilesMaterial = new StandardMaterial(
      "tilesFloorMaterial",
      props.scene,
    );
    const tilesTexture = new Texture(tilesTextureUrl, props.scene);

    // Configure texture tiling for 10x15 floor
    tilesTexture.uScale = 2; // Repeat texture 5 times horizontally
    tilesTexture.vScale = 2; // Repeat texture 7.5 times vertically

    tilesMaterial.diffuseTexture = tilesTexture;
    tilesMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Moderate specular for tiles

    // Apply tiles material to room 2
    ground2.material = tilesMaterial;

    ground2.physicsImpostor = new PhysicsImpostor(
      ground2,
      PhysicsImpostor.BoxImpostor,
      {
        mass: 0,
        friction: 0.8,
        restitution: 0.3,
      },
      props.scene,
    );
  } catch (error) {
    console.error("Error creating house floor:", error);
  }
};

const cleanup = () => {
  if (ground1) {
    ground1.dispose();
    ground1 = null;
  }
  if (ground2) {
    ground2.dispose();
    ground2 = null;
  }
  if (carpet) {
    carpet.dispose();
    carpet = null;
  }
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createFloor();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene && !ground1 && !ground2 && !carpet) {
    createFloor();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export ground and carpet references for other components (like physics checks)
defineExpose({
  ground1: () => ground1,
  ground2: () => ground2,
  carpet: () => carpet,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - floor is a 3D object */
</style>
