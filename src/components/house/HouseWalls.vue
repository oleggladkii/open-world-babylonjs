<template lang="pug">
div
  // Invisible component - walls are created programmatically
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
} from "@babylonjs/core";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
}

const props = defineProps<Props>();

// Wall configuration for optimized layout
const WALL_CONFIG = {
  height: 6, // Increased from 5 to 6
  thickness: 0.5,
  // Room 1: 10x20 (from X=-10 to X=0, Z=-10 to Z=+10)
  room1: {
    width: 10,
    depth: 20,
    centerX: -5,
    centerZ: 0,
  },
  // Room 2: 10x15 (from X=0 to X=+10, Z=0 to Z=+15) - UPDATED SIZE
  room2: {
    width: 10,
    depth: 15,
    centerX: 5,
    centerZ: 7.5, // Center moved due to new depth
  },
  doorway: {
    width: 5.5, // from Z=-2.75 to Z=2.75
    centerZ: 0,
  },
};

let mergedWalls: Mesh | null = null;

const createWallGeometries = (): Mesh[] => {
  if (!props.scene) return [];

  const walls: Mesh[] = [];

  // Materials
  // Light gray material for room 1 walls (20x20)
  const lightGrayMaterial = new StandardMaterial("lightGrayMat", props.scene);
  lightGrayMaterial.diffuseColor = new Color3(0.24, 0.24, 0.24); // rgba(210, 215, 220, 1)

  const greenMaterial = new StandardMaterial("greenMat", props.scene);
  greenMaterial.diffuseColor = new Color3(0, 1, 0);

  const blueMaterial = new StandardMaterial("blueMat", props.scene);
  blueMaterial.diffuseColor = new Color3(0, 0, 1);

  const yellowMaterial = new StandardMaterial("yellowMat", props.scene);
  yellowMaterial.diffuseColor = new Color3(1, 1, 0);

  const grayMaterial = new StandardMaterial("grayMat", props.scene);
  grayMaterial.diffuseColor = new Color3(180 / 255, 180 / 255, 180 / 255);

  // Material for doorway arch (brown)
  const archMaterial = new StandardMaterial("archMat", props.scene);
  archMaterial.diffuseColor = new Color3(101 / 255, 67 / 255, 33 / 255); // Brown color rgba(101, 67, 33, 1)

  // ====== Room 1 Walls (10x20) - Light Gray rgba(210, 215, 220, 1) ======
  // North wall (Light Gray) - with window opening
  // Window configuration for wall1
  const windowWidth = 3;
  const windowHeight = 4;
  const windowCenterX = -5; // Center of wall1
  const windowCenterY = 3; // Center of wall (wall height is 6, center at y=3)
  // Left part of wall1 (west side of window)
  const wall1Left = MeshBuilder.CreateBox(
    "wall1-North-Left",
    {
      width: (10 - windowWidth) / 2, // 3.5 units wide
      height: WALL_CONFIG.height,
      depth: WALL_CONFIG.thickness,
    },
    props.scene,
  );
  wall1Left.position.set(-5 - windowWidth / 2 - (10 - windowWidth) / 4, 3, -10);
  wall1Left.material = lightGrayMaterial;
  walls.push(wall1Left);

  // Right part of wall1 (east side of window)
  const wall1Right = MeshBuilder.CreateBox(
    "wall1-North-Right",
    {
      width: (10 - windowWidth) / 2, // 3.5 units wide
      height: WALL_CONFIG.height,
      depth: WALL_CONFIG.thickness,
    },
    props.scene,
  );
  wall1Right.position.set(
    -5 + windowWidth / 2 + (10 - windowWidth) / 4,
    3,
    -10,
  );
  wall1Right.material = lightGrayMaterial;
  walls.push(wall1Right);

  // Top part of wall1 (above window)
  const topHeight = WALL_CONFIG.height - (windowCenterY + windowHeight / 2); // Space from top of window to ceiling
  const wall1Top = MeshBuilder.CreateBox(
    "wall1-North-Top",
    {
      width: windowWidth,
      height: topHeight, // Space above window (6 - 5 = 1)
      depth: WALL_CONFIG.thickness,
    },
    props.scene,
  );
  wall1Top.position.set(
    windowCenterX,
    windowCenterY + windowHeight / 2 + topHeight / 2, // Position above window
    -10,
  );
  wall1Top.material = lightGrayMaterial;
  walls.push(wall1Top);

  // Bottom part of wall1 (below window)
  const bottomHeight = windowCenterY - windowHeight / 2; // Space from floor to bottom of window
  const wall1Bottom = MeshBuilder.CreateBox(
    "wall1-North-Bottom",
    {
      width: windowWidth,
      height: bottomHeight, // Space below window (3 - 2 = 1)
      depth: WALL_CONFIG.thickness,
    },
    props.scene,
  );
  wall1Bottom.position.set(
    windowCenterX,
    bottomHeight / 2, // Position below window
    -10,
  );
  wall1Bottom.material = lightGrayMaterial;
  walls.push(wall1Bottom);

  // South wall (Light Gray)
  const wall2 = MeshBuilder.CreateBox(
    "wall2-South",
    { width: 10, height: WALL_CONFIG.height, depth: WALL_CONFIG.thickness },
    props.scene,
  );
  wall2.position.set(-5, 3, 10); // Updated Y position for height 6
  wall2.material = lightGrayMaterial;
  walls.push(wall2);

  // West wall (Light Gray)
  const wall3 = MeshBuilder.CreateBox(
    "wall3-West",
    { width: WALL_CONFIG.thickness, height: WALL_CONFIG.height, depth: 20 },
    props.scene,
  );
  wall3.position.set(-10, 3, 0); // Updated Y position for height 6
  wall3.material = lightGrayMaterial;
  walls.push(wall3);

  // East wall (Light Gray) - with doorway from z=-2.75 to z=2.75
  // North part
  const wall4a = MeshBuilder.CreateBox(
    "wall4a-East-North",
    {
      width: WALL_CONFIG.thickness / 2,
      height: WALL_CONFIG.height,
      depth: 10.25,
    },
    props.scene,
  );
  wall4a.position.set(0, 3, -5.375); // Updated Y position for height 6
  wall4a.material = lightGrayMaterial;
  walls.push(wall4a);

  // South part
  const wall4b = MeshBuilder.CreateBox(
    "wall4b-East-South",
    {
      width: WALL_CONFIG.thickness / 2,
      height: WALL_CONFIG.height,
      depth: 7.25,
    },
    props.scene,
  );
  wall4b.position.set(0, 3, 6.375); // Updated Y position for height 6
  wall4b.material = lightGrayMaterial;
  walls.push(wall4b);

  // ====== Room 2 Walls (10x15) - UPDATED ======
  // West wall (GRAY) - with doorway from z=-2.75 to z=2.75
  // North part
  const wall5a = MeshBuilder.CreateBox(
    "wall5a-West2-North",
    {
      width: WALL_CONFIG.thickness / 2,
      height: WALL_CONFIG.height,
      depth: 10.25,
    },
    props.scene,
  );
  wall5a.position.set(0.25, 3, -5.375); // Updated Y position for height 6
  wall5a.material = grayMaterial;
  walls.push(wall5a);

  // // South part (from z=2.75 to z=15) - EXTENDED
  const wall5b = MeshBuilder.CreateBox(
    "wall5b-West2-South",
    {
      width: WALL_CONFIG.thickness / 2,
      height: WALL_CONFIG.height,
      depth: 7.25,
    },
    props.scene,
  );
  wall5b.position.set(0.25, 3, 6.375); // Updated Y position for height 6
  wall5b.material = grayMaterial;
  walls.push(wall5b);

  // // North wall (GRAY) - EXTENDED
  const wall5c = MeshBuilder.CreateBox(
    "wall5c-North2",
    { width: 10, height: WALL_CONFIG.height, depth: WALL_CONFIG.thickness },
    props.scene,
  );
  wall5c.position.set(5, 3, -5); // Updated Y position for height 6
  wall5c.material = grayMaterial;
  walls.push(wall5c);

  // // South wall (GRAY) - NEW POSITION
  const wall6 = MeshBuilder.CreateBox(
    "wall6-South2",
    { width: 10, height: WALL_CONFIG.height, depth: WALL_CONFIG.thickness },
    props.scene,
  );
  wall6.position.set(5, 3, 10); // Updated Y position for height 6
  wall6.material = grayMaterial;
  walls.push(wall6);

  // // East wall (GRAY) - EXTENDED
  const wall7 = MeshBuilder.CreateBox(
    "wall7-East2",
    { width: WALL_CONFIG.thickness, height: WALL_CONFIG.height, depth: 15 },
    props.scene,
  );
  wall7.position.set(10, 3, 2.5); // Updated Y position for height 6
  wall7.material = grayMaterial;
  walls.push(wall7);

  // ====== DOORWAY ARCH (RED) ======
  // Left pillar (north side)
  const archPillarLeft = MeshBuilder.CreateBox(
    "archPillarLeft",
    {
      width: WALL_CONFIG.thickness * 1.4,
      height: WALL_CONFIG.height,
      depth: WALL_CONFIG.thickness * 0.8,
    },
    props.scene,
  );
  // archPillarLeft.position.set(-0.1, 3, -2.5); // Left side of doorway
  archPillarLeft.position.set(0.15, 3, -0.2); // Updated Y position for height 6
  archPillarLeft.material = archMaterial;
  walls.push(archPillarLeft);

  // Right pillar (south side)
  const archPillarRight = MeshBuilder.CreateBox(
    "archPillarRight",
    {
      width: WALL_CONFIG.thickness * 1.4,
      height: WALL_CONFIG.height,
      depth: WALL_CONFIG.thickness * 0.8,
    },
    props.scene,
  );
  archPillarRight.position.set(0.15, 3, 2.75); // Updated Y position for height 6
  archPillarRight.material = archMaterial;
  walls.push(archPillarRight);

  // Top horizontal beam
  const archBeam = MeshBuilder.CreateBox(
    "archBeam",
    {
      width: WALL_CONFIG.thickness * 1.4,
      height: 1.5,
      depth: 2.95, // Spans the doorway width
    },
    props.scene,
  );
  archBeam.position.set(0.15, 5.25, 1.4); // Above the doorway
  archBeam.material = archMaterial;
  walls.push(archBeam);
  return walls;
};

const createMergedWalls = () => {
  if (!props.scene) {
    console.warn("Scene not available for wall creation");
    return;
  }

  try {
    const walls = createWallGeometries();

    if (walls.length === 0) {
      console.warn("No walls created");
      return;
    }

    // Store individual walls for cleanup
    individualWalls = [...walls];

    // Add physics impostors to individual walls before merging
    walls.forEach((wall) => {
      wall.physicsImpostor = new PhysicsImpostor(
        wall,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8, restitution: 0.3 },
        props.scene!,
      );
    });

    // Add collision walls on both sides of the doorway (not in the doorway itself)
    // Left side of doorway (north side) - from z=-10 to z=-2.75
    const doorwaySideLeft = MeshBuilder.CreateBox(
      "doorwaySideLeft",
      {
        width: WALL_CONFIG.thickness,
        height: WALL_CONFIG.height,
        depth: 10, // From wall edge to doorway start
      },
      props.scene!,
    );
    doorwaySideLeft.position.set(0, 3, -5.25); // North side of doorway
    doorwaySideLeft.isVisible = false; // Invisible collision wall

    // Right side of doorway (south side) - from z=2.75 to z=10
    const doorwaySideRight = MeshBuilder.CreateBox(
      "doorwaySideRight",
      {
        width: WALL_CONFIG.thickness,
        height: WALL_CONFIG.height,
        depth: 7.25, // From doorway end to wall edge
      },
      props.scene!,
    );
    doorwaySideRight.position.set(0, 3, 6.25); // South side of doorway
    doorwaySideRight.isVisible = false; // Invisible collision wall

    // Add physics to both sides
    doorwaySideLeft.physicsImpostor = new PhysicsImpostor(
      doorwaySideLeft,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0.3 },
      props.scene!,
    );

    doorwaySideRight.physicsImpostor = new PhysicsImpostor(
      doorwaySideRight,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0.3 },
      props.scene!,
    );

    individualWalls.push(doorwaySideLeft, doorwaySideRight);

    // Skip merging to preserve individual wall physics
    // mergedWalls = Mesh.MergeMeshes(walls, true, true, undefined, false, true);

    console.log(
      "House walls created with individual physics (no merging to preserve physics)",
    );
    console.log("Room 1: 10x20 (unchanged), Room 2: 10x10 (updated size)");

    // Individual walls kept active for physics collision detection
  } catch (error) {
    console.error("Error creating house walls:", error);
  }
};

// Store individual walls for cleanup
let individualWalls: Mesh[] = [];

const cleanup = () => {
  // Dispose individual walls with physics
  individualWalls.forEach((wall) => {
    if (wall.physicsImpostor) {
      wall.physicsImpostor.dispose();
    }
    wall.dispose();
  });
  individualWalls = [];

  // Dispose merged walls
  if (mergedWalls) {
    mergedWalls.dispose();
    mergedWalls = null;
  }
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createMergedWalls();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createMergedWalls();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export configuration for other components
defineExpose({
  WALL_CONFIG,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - walls are 3D objects */
</style>
