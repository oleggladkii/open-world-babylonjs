<template lang="pug">
div
  // Invisible component - bookshelf is created programmatically
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  Vector3,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  StandardMaterial,
  Color3,
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
const bookshelfMesh = ref<Mesh | null>(null);
const isLoaded = ref(false);

const createBookshelf = () => {
  if (!props.scene) {
    console.warn("Scene not available for bookshelf creation");
    return;
  }

  try {
    // Create wood material for bookshelf
    const woodMaterial = new StandardMaterial("bookshelfMaterial", props.scene);
    woodMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2); // Brown wood color
    woodMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for matte finish
    woodMaterial.zOffset = -1; // Prevent z-fighting

    // Bookshelf dimensions
    const bookshelfWidth = 6;
    const bookshelfHeight = 5;
    const bookshelfDepth = 0.9;
    const sideThickness = 0.05;

    // Create side panels (2 planes on the sides)
    const leftSide = MeshBuilder.CreateBox(
      "bookshelfLeftSide",
      {
        width: sideThickness,
        height: bookshelfHeight,
        depth: bookshelfDepth,
      },
      props.scene,
    );
    leftSide.position.set(-4.6, 1, 0);
    leftSide.rotation.y = Math.PI / 2;
    leftSide.material = woodMaterial;

    const rightSide = MeshBuilder.CreateBox(
      "bookshelfRightSide",
      {
        width: sideThickness,
        height: bookshelfHeight,
        depth: bookshelfDepth,
      },
      props.scene,
    );
    rightSide.position.set(-4.6, 1, 6);
    rightSide.rotation.y = Math.PI / 2;
    rightSide.material = woodMaterial;

    // Create back panel
    const backPanel = MeshBuilder.CreateBox(
      "bookshelfBack",
      {
        width: bookshelfWidth,
        height: bookshelfHeight,
        depth: sideThickness,
      },
      props.scene,
    );
    backPanel.position.set(-4.9, 1, 3);
    backPanel.rotation.y = Math.PI / 2;
    backPanel.material = woodMaterial;

    // Create 5 shelves
    const shelves: Mesh[] = [];
    const shelfThickness = 0.05;

    for (let i = 0; i < 5; i++) {
      const shelf = MeshBuilder.CreateBox(
        `bookshelfShelf${i + 1}`,
        {
          width: bookshelfWidth - 0.05,
          height: shelfThickness,
          depth: bookshelfDepth,
        },
        props.scene,
      );

      const shelfY = i * 0.8; // Start from height 5, go down by 0.8 each shelf
      shelf.position.set(-4.6, shelfY, 3);
      shelf.rotation.y = Math.PI / 2;
      shelf.material = woodMaterial;
      shelves.push(shelf);
    }

    const allBookshelfParts = [leftSide, rightSide, backPanel, ...shelves];

    // Bake transforms into vertices
    allBookshelfParts.forEach((m) => m.bakeCurrentTransformIntoVertices());
    const mergedBookshelf = Mesh.MergeMeshes(
      allBookshelfParts,
      true,
      true,
      undefined,
      false,
      true,
    );

    if (mergedBookshelf) {
      mergedBookshelf.name = "bookshelf";
      bookshelfMesh.value = mergedBookshelf;
      mergedBookshelf.position.set(0, 0, 0);

      // Add physics impostor for collision
      mergedBookshelf.physicsImpostor = new PhysicsImpostor(
        mergedBookshelf,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8, restitution: 0 },
        props.scene,
      );

      // Shadows disabled for performance
      // mergedBookshelf.receiveShadows = true;
      // if (props.addShadowCaster) {
      //   props.addShadowCaster(mergedBookshelf);
      // }

      isLoaded.value = true;
      console.log("Bookshelf created successfully");
    }
  } catch (error) {
    console.error("Error creating bookshelf:", error);
  }
};

const cleanup = () => {
  if (bookshelfMesh.value) {
    if (bookshelfMesh.value.physicsImpostor) {
      bookshelfMesh.value.physicsImpostor.dispose();
    }
    bookshelfMesh.value.dispose();
    bookshelfMesh.value = null;
  }

  isLoaded.value = false;
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createBookshelf();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createBookshelf();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export for other components
defineExpose({
  bookshelfMesh,
  isLoaded,
  cleanup,
});
</script>
