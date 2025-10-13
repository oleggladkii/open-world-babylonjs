<template lang="pug">
div
  // Invisible component - work desk is created programmatically
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
  Texture,
  Angle,
} from "@babylonjs/core";
import chipboardTextureUrl from "../../assets/textures/chipboard.jpg";

interface Props {
  scene: Scene | null;
  position?: Vector3;
}

const props = withDefaults(defineProps<Props>(), {
  position: () => new Vector3(0, 0, 0),
});

// Work desk configuration
const DESK_CONFIG = {
  // Desk top
  topWidth: 4,
  topDepth: 1.8,
  topThickness: 0.05,

  // Desk legs
  legThickness: 0.08,
  legHeight: 1.25,

  // Shelf
  shelfWidth: 3.9,
  shelfDepth: 1.7,
  shelfThickness: 0.03,
  shelfHeight: 0.9, // Height from floor

  // Tool board (above desk)
  toolBoardWidth: 3.6,
  toolBoardDepth: 0.05,
  toolBoardHeight: 1.3, // Height from floor
  toolBoardThickness: 2.5,

  // Motorcycle wheels on tool board
  wheelRadius: 0.6,
  wheelThickness: 0.4,
  wheelPosition: {
    left: -0.8, // Left wheel X offset from center
    right: 0.8, // Right wheel X offset from center
  },
};

let deskMeshes: Mesh[] = [];

const createWorkDesk = () => {
  if (!props.scene) {
    console.warn("Scene not available for work desk creation");
    return;
  }

  try {
    // Create gray material for desk parts
    const grayMaterial = new StandardMaterial(
      "workDeskGrayMaterial",
      props.scene,
    );
    grayMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6); // Gray color
    grayMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular
    grayMaterial.emissiveColor = new Color3(0.02, 0.02, 0.02); // Very slight glow

    // Create chipboard material for tool board
    const chipboardMaterial = new StandardMaterial(
      "chipboardMaterial",
      props.scene,
    );
    const chipboardTexture = new Texture(chipboardTextureUrl, props.scene);
    chipboardTexture.uScale = 1;
    chipboardTexture.vScale = 1;
    chipboardMaterial.diffuseTexture = chipboardTexture;
    chipboardMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    chipboardMaterial.emissiveColor = new Color3(0.01, 0.01, 0.01);

    // ====== DESK TOP ======
    const deskTop = MeshBuilder.CreateBox(
      "deskTop",
      {
        width: DESK_CONFIG.topWidth,
        height: DESK_CONFIG.topThickness,
        depth: DESK_CONFIG.topDepth,
      },
      props.scene,
    );
    deskTop.position.set(
      props.position.x,
      props.position.y + DESK_CONFIG.legHeight + DESK_CONFIG.topThickness / 2,
      props.position.z,
    );
    deskTop.material = grayMaterial;

    // ====== DESK LEGS (4 legs) ======
    const legPositions = [
      // Front left
      {
        x: -DESK_CONFIG.topWidth / 2 + DESK_CONFIG.legThickness / 2,
        z: -DESK_CONFIG.topDepth / 2 + DESK_CONFIG.legThickness / 2,
      },
      // Front right
      {
        x: DESK_CONFIG.topWidth / 2 - DESK_CONFIG.legThickness / 2,
        z: -DESK_CONFIG.topDepth / 2 + DESK_CONFIG.legThickness / 2,
      },
      // Back left
      {
        x: -DESK_CONFIG.topWidth / 2 + DESK_CONFIG.legThickness / 2,
        z: DESK_CONFIG.topDepth / 2 - DESK_CONFIG.legThickness / 2,
      },
      // Back right
      {
        x: DESK_CONFIG.topWidth / 2 - DESK_CONFIG.legThickness / 2,
        z: DESK_CONFIG.topDepth / 2 - DESK_CONFIG.legThickness / 2,
      },
    ];

    for (let i = 0; i < 4; i++) {
      const leg = MeshBuilder.CreateBox(
        `deskLeg${i}`,
        {
          width: DESK_CONFIG.legThickness,
          height: DESK_CONFIG.legHeight,
          depth: DESK_CONFIG.legThickness,
        },
        props.scene,
      );
      leg.position.set(
        props.position.x + legPositions[i].x,
        props.position.y + DESK_CONFIG.legHeight / 2,
        props.position.z + legPositions[i].z,
      );
      leg.material = grayMaterial;
      deskMeshes.push(leg);
    }

    // ====== SHELF UNDER DESK ======
    const shelf = MeshBuilder.CreateBox(
      "deskShelf",
      {
        width: DESK_CONFIG.shelfWidth,
        height: DESK_CONFIG.shelfThickness,
        depth: DESK_CONFIG.shelfDepth,
      },
      props.scene,
    );
    shelf.position.set(
      props.position.x,
      props.position.y +
        DESK_CONFIG.shelfHeight +
        DESK_CONFIG.shelfThickness / 2,
      props.position.z,
    );
    shelf.material = grayMaterial;

    // ====== TOOL BOARD (above desk) ======
    const toolBoard = MeshBuilder.CreateBox(
      "toolBoard",
      {
        width: DESK_CONFIG.toolBoardWidth,
        height: DESK_CONFIG.toolBoardThickness,
        depth: DESK_CONFIG.toolBoardDepth,
      },
      props.scene,
    );
    toolBoard.position.set(
      props.position.x,
      props.position.y +
        DESK_CONFIG.toolBoardHeight +
        DESK_CONFIG.toolBoardThickness / 2,
      props.position.z - 1,
    );
    toolBoard.material = chipboardMaterial;

    // ====== MOTORCYCLE WHEELS ON TOOL BOARD ======
    // Create black material for wheels
    // const wheelMaterial = new StandardMaterial("wheelMaterial", props.scene);
    // wheelMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1); // Dark black
    // wheelMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
    // wheelMaterial.emissiveColor = new Color3(0.01, 0.01, 0.01);

    // // Left wheel
    // const leftWheel = MeshBuilder.CreateTorus(
    //   "leftMotorcycleWheel",
    //   {
    //     diameter: DESK_CONFIG.wheelRadius * 2,
    //     thickness: DESK_CONFIG.wheelThickness,
    //     tessellation: 32,
    //   },
    //   props.scene,
    // );
    // leftWheel.position.set(
    //   props.position.x + DESK_CONFIG.wheelPosition.left,
    //   props.position.y +
    //     DESK_CONFIG.toolBoardHeight +
    //     DESK_CONFIG.toolBoardThickness / 2,
    //   props.position.z -
    //     1 +
    //     DESK_CONFIG.toolBoardDepth / 2 +
    //     DESK_CONFIG.wheelThickness / 2,
    // );
    // leftWheel.rotation.x = Angle.FromDegrees(90).radians();
    // leftWheel.material = wheelMaterial;

    // // Right wheel
    // const rightWheel = MeshBuilder.CreateTorus(
    //   "rightMotorcycleWheel",
    //   {
    //     diameter: DESK_CONFIG.wheelRadius * 2,
    //     thickness: DESK_CONFIG.wheelThickness,
    //     tessellation: 16,
    //   },
    //   props.scene,
    // );
    // rightWheel.position.set(
    //   props.position.x + DESK_CONFIG.wheelPosition.right,
    //   props.position.y +
    //     DESK_CONFIG.toolBoardHeight +
    //     DESK_CONFIG.toolBoardThickness / 2,
    //   props.position.z -
    //     1 +
    //     DESK_CONFIG.toolBoardDepth / 2 +
    //     DESK_CONFIG.wheelThickness / 2,
    // );
    // rightWheel.rotation.x = Angle.FromDegrees(90).radians();
    // rightWheel.material = wheelMaterial;

    // Add physics to all parts (static)
    const allParts = [deskTop, shelf, toolBoard, leftWheel, rightWheel];

    // Add legs to the list
    for (let i = 0; i < 4; i++) {
      const leg = props.scene.getMeshByName(`deskLeg${i}`);
      if (leg) allParts.push(leg as Mesh);
    }

    allParts.forEach((part) => {
      part.physicsImpostor = new PhysicsImpostor(
        part,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8, restitution: 0.1 },
        props.scene!,
      );

      // Store for cleanup
      deskMeshes.push(part);
    });

    console.log(
      "Work desk created with desk top, 4 legs, shelf, tool board, and 2 motorcycle wheels",
    );
  } catch (error) {
    console.error("Error creating work desk:", error);
  }
};

const cleanup = () => {
  // Dispose all desk meshes
  deskMeshes.forEach((mesh) => {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose();
    }
    mesh.dispose();
  });
  deskMeshes = [];
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createWorkDesk();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createWorkDesk();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export configuration for other components
defineExpose({
  DESK_CONFIG,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - work desk is a 3D object */
</style>
