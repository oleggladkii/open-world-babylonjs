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
  Texture,
} from "@babylonjs/core";
import roomWoodTextureUrl from "../../assets/textures/room-wood-01.jpg";

interface Props {
  scene: Scene | null;
  playerPosition?: Vector3 | null;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
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
    // Create wood material for bookshelf with texture
    const woodMaterial = new StandardMaterial("bookshelfMaterial", props.scene);
    const woodTexture = new Texture(roomWoodTextureUrl, props.scene);

    // Configure texture tiling for bookshelf
    woodTexture.uScale = 4; // Repeat texture horizontally
    woodTexture.vScale = 4; // Repeat texture vertically

    woodMaterial.diffuseTexture = woodTexture;
    woodMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for matte finish
    woodMaterial.zOffset = -1; // Prevent z-fighting

    // Bookshelf dimensions
    const bookshelfWidth = 4;
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
    leftSide.position.set(-4.6, 1, 1);
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
    rightSide.position.set(-4.6, 1, 5);
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
    backPanel.position.set(-5, 1, 3);
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

      // 🟦 Create books only on 4 shelves (skip top shelf)
      if (i > 0) {
        for (let j = 0; j < 6; j++) {
          const bookWidth = 0.1 + Math.random() * 0.05;
          const bookHeight = 0.6 + Math.random() * 0.2;
          const bookDepth = 0.35 + Math.random() * 0.4;

          const book = MeshBuilder.CreateBox(
            `book_${i}_${j}`,
            { width: bookWidth, height: bookHeight, depth: bookDepth },
            props.scene,
          );

          const bookMaterial = new StandardMaterial(
            `bookMat_${i}_${j}`,
            props.scene,
          );
          const bookColors = [
            new Color3(0.55, 0.27, 0.07), // brown leather
            new Color3(0.33, 0.42, 0.18), // olive green
            new Color3(0.2, 0.2, 0.25), // dark gray
            new Color3(0.5, 0.0, 0.0), // dark red
            new Color3(0.15, 0.25, 0.45), // navy blue
            new Color3(0.6, 0.45, 0.3), // tan / beige
            new Color3(0.25, 0.15, 0.05), // dark brown
            new Color3(0.4, 0.1, 0.1), // reddish brown
            new Color3(0.25, 0.3, 0.15), // army green
            new Color3(0.65, 0.55, 0.4), // parchment / light brown
          ];
          const color =
            bookColors[Math.floor(Math.random() * bookColors.length)];
          bookMaterial.diffuseColor = color;

          book.material = bookMaterial;

          // Position books on the shelf
          // Bookshelf spans from Z=0 to Z=6, with shelves at Z=3
          const bookSpacing = 0.2 + Math.random() * 0.3; // Random spacing between 0.1 - 0.5
          const startZ = 4.2; // Start from left side of bookshelf

          book.position.set(
            -9.2, // Same X as shelf
            shelfY + 0.2 + shelfThickness / 2 + bookHeight / 2, // On top of shelf
            startZ + j * bookSpacing, // Along the shelf
          );
          book.rotation.y = Math.PI / 2;
        }
      }
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
