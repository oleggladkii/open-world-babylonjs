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
  DynamicTexture,
  PBRMaterial,
} from "@babylonjs/core";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
}

const props = defineProps<Props>();

let ground1: Mesh | null = null; // Room 1 floor (wood)
let ground2: Mesh | null = null; // Room 2 floor (concrete)
let carpet: Mesh | null = null; // Carpet in room 1

// Procedural concrete texture generation
function makeNoiseTexture(scene: Scene): DynamicTexture {
  // Головні кольори (A і B)
  const colA = [160, 160, 160]; // rgba(160,160,160,1)
  const colB = [220, 220, 220]; // rgba(220,220,220,1)

  // Параметри нойзу
  const SIZE = 512; // розмір текстури
  const SCALE = 6; // крупність малюнку (менше = крупніший шум)
  const OCT = 4; // кількість октав (детальність)
  const PERS = 0.5; // внесок кожної наступної октави
  const SEED = 1337;

  function seededRand(n: number): number {
    // детермінований random 0..1
    n = (n << 13) ^ n;
    const t =
      1.0 +
      ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 2147483647.0;
    return t - Math.floor(t);
  }

  function valueAt(ix: number, iy: number): number {
    return seededRand((ix * 73856093) ^ (iy * 19349663) ^ SEED);
  }

  // 2D value noise з бі-лінійною інтерполяцією
  function noise2D(x: number, y: number): number {
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const x1 = x0 + 1,
      y1 = y0 + 1;
    const sx = x - x0,
      sy = y - y0;
    const n00 = valueAt(x0, y0),
      n10 = valueAt(x1, y0);
    const n01 = valueAt(x0, y1),
      n11 = valueAt(x1, y1);
    const ix0 = n00 + (n10 - n00) * sx;
    const ix1 = n01 + (n11 - n01) * sx;
    return ix0 + (ix1 - ix0) * sy; // 0..1
  }

  // fBm — кілька октав
  function fbm(x: number, y: number): number {
    let amp = 1,
      freq = 1,
      sum = 0,
      norm = 0;
    for (let o = 0; o < OCT; o++) {
      sum += amp * noise2D(x * freq, y * freq);
      norm += amp;
      amp *= PERS;
      freq *= 2;
    }
    return sum / norm; // 0..1
  }

  const dt = new DynamicTexture(
    "concreteNoise",
    { width: SIZE, height: SIZE },
    scene,
    false,
  );
  const ctx = dt.getContext() as CanvasRenderingContext2D;
  const img = ctx.createImageData(SIZE, SIZE);
  let p = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / (SIZE / SCALE);
      const v = y / (SIZE / SCALE);
      const n = fbm(u, v); // 0..1

      const r = colA[0] + (colB[0] - colA[0]) * n;
      const g = colA[1] + (colB[1] - colA[1]) * n;
      const b = colA[2] + (colB[2] - colA[2]) * n;

      img.data[p++] = r | 0;
      img.data[p++] = g | 0;
      img.data[p++] = b | 0;
      img.data[p++] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  dt.update();
  return dt;
}

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

    // ====== ROOM 2 FLOOR (10x15) - PROCEDURAL CONCRETE TEXTURE ======
    // Room 2: X: 0 to +10, Z: -5 to +10 (15 units depth)
    ground2 = MeshBuilder.CreateBox(
      "room2Floor",
      { width: 10, height: 0.5, depth: 15 },
      props.scene,
    );
    ground2.position.set(5, -0.25, 2.5); // Center at (5, -0.25, 2.5)

    // Create procedural concrete texture
    const concreteTexture = makeNoiseTexture(props.scene);
    const concreteMaterial = new PBRMaterial("concreteMat", props.scene);
    concreteMaterial.albedoTexture = concreteTexture;
    concreteMaterial.roughness = 1.0;
    concreteMaterial.metallic = 0.0;
    // Tiling for 10x15 floor
    if (concreteMaterial.albedoTexture) {
      // Type assertion for texture scaling properties
      const texture = concreteMaterial.albedoTexture as DynamicTexture;
      texture.uScale = 5; // 5 repeats horizontally
      texture.vScale = 7.5; // 7.5 repeats vertically
    }

    // Apply concrete material to room 2
    ground2.material = concreteMaterial;

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
