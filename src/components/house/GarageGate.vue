<template lang="pug">
div
  // Invisible component - garage gate is created programmatically
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  MeshBuilder,
  PhysicsImpostor,
  StandardMaterial,
  Color3,
  Mesh,
  Vector3,
} from "@babylonjs/core";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
  position?: Vector3;
}

const props = withDefaults(defineProps<Props>(), {
  position: () => new Vector3(0, 0, 0),
});

// Garage gate configuration
const GATE_CONFIG = {
  totalWidth: 8, // Total width of the gate
  totalHeight: 6, // Total height of the gate
  stripeHeight: 0.4, // Height of each horizontal stripe
  stripeGap: 0.005, // Gap between stripes
  thickness: 0.1, // Thickness of each stripe
  stripeCount: 12, // Number of horizontal stripes
};

let gateMeshes: Mesh[] = [];

const createGarageGate = () => {
  if (!props.scene) {
    console.warn("Scene not available for garage gate creation");
    return;
  }

  try {
    // Create white material for stripes
    const whiteMaterial = new StandardMaterial(
      "garageGateMaterial",
      props.scene,
    );
    whiteMaterial.diffuseColor = new Color3(1, 1, 1); // Pure white
    whiteMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for matte finish
    whiteMaterial.emissiveColor = new Color3(0.05, 0.05, 0.05); // Slight glow

    // Calculate starting position for the first stripe (bottom)
    const startY =
      props.position.y -
      GATE_CONFIG.totalHeight / 2 +
      GATE_CONFIG.stripeHeight / 2;

    // Create 10 horizontal stripes
    for (let i = 0; i < GATE_CONFIG.stripeCount; i++) {
      const stripe = MeshBuilder.CreateBox(
        `garageGateStripe${i}`,
        {
          width: GATE_CONFIG.totalWidth,
          height: GATE_CONFIG.stripeHeight,
          depth: GATE_CONFIG.thickness,
        },
        props.scene,
      );

      // Position each horizontal stripe
      const stripeY =
        startY + i * (GATE_CONFIG.stripeHeight + GATE_CONFIG.stripeGap);
      stripe.position.set(props.position.x, stripeY, props.position.z);

      // Apply material
      stripe.material = whiteMaterial;

      // Add physics (static)
      stripe.physicsImpostor = new PhysicsImpostor(
        stripe,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8, restitution: 0.3 },
        props.scene,
      );

      // Store for cleanup
      gateMeshes.push(stripe);
    }

    console.log(
      `Garage gate created with ${GATE_CONFIG.stripeCount} horizontal white stripes`,
    );
  } catch (error) {
    console.error("Error creating garage gate:", error);
  }
};

const cleanup = () => {
  // Dispose all gate meshes
  gateMeshes.forEach((mesh) => {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose();
    }
    mesh.dispose();
  });
  gateMeshes = [];
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createGarageGate();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createGarageGate();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export configuration for other components
defineExpose({
  GATE_CONFIG,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - garage gate is a 3D object */
</style>
