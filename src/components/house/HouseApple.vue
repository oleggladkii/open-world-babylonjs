<template lang="pug">
div
  // Invisible component - apple is created programmatically
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  Vector3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  PhysicsImpostor,
} from "@babylonjs/core";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
  playerPosition?: Vector3 | null;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  addShadowCaster: undefined,
  playerPosition: null,
  isActive: false,
});

// Refs
const appleMesh = ref<Mesh | null>(null);
const isLoaded = ref(false);

const createApple = () => {
  if (!props.scene) {
    console.warn("Scene not available for apple creation");
    return;
  }

  try {
    // Create apple sphere
    const apple = MeshBuilder.CreateSphere(
      "apple",
      {
        diameter: 0.2, // Small apple size
        segments: 5, // Smooth sphere
      },
      props.scene,
    );

    // Position apple on the table
    apple.position.set(-8.6, 1, -3.8); // On top of the table

    // Create apple material with texture
    const appleMaterial = new StandardMaterial("appleMaterial", props.scene);

    // Load apple texture
    const appleTexture = new Texture(
      "/src/assets/textures/apple.jpg",
      props.scene,
    );

    appleMaterial.diffuseTexture = appleTexture;
    appleMaterial.specularColor = new Color3(0.2, 0.2, 0.2); // Low specular for matte finish
    appleMaterial.emissiveColor = new Color3(0.05, 0.02, 0.02); // Slight red glow

    // Apply material to apple
    apple.material = appleMaterial;

    // Add physics impostor for collision
    apple.physicsImpostor = new PhysicsImpostor(
      apple,
      PhysicsImpostor.SphereImpostor,
      { mass: 0.1, friction: 0.8, restitution: 0.3 }, // Light object with some bounce
      props.scene,
    );

    // Enable shadows
    apple.receiveShadows = true;
    if (props.addShadowCaster) {
      props.addShadowCaster(apple);
    }

    appleMesh.value = apple;
    isLoaded.value = true;

    console.log("Apple created successfully on table");
  } catch (error) {
    console.error("Error creating apple:", error);
  }
};

const cleanup = () => {
  if (appleMesh.value) {
    if (appleMesh.value.physicsImpostor) {
      appleMesh.value.physicsImpostor.dispose();
    }
    if (appleMesh.value.material) {
      appleMesh.value.material.dispose();
    }
    appleMesh.value.dispose();
    appleMesh.value = null;
  }
  isLoaded.value = false;
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createApple();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  cleanup();
});

// Export for other components
defineExpose({
  appleMesh,
  isLoaded,
  cleanup,
});
</script>
