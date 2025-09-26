<template lang="pug">
div
  // Invisible component - window is created programmatically
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  Vector3,
  PhysicsImpostor,
} from "@babylonjs/core";

interface Props {
  scene: Scene | null;
  position: Vector3;
  rotation?: Vector3;
  addShadowCaster?: (mesh: Mesh) => void;
}

const props = withDefaults(defineProps<Props>(), {
  rotation: () => new Vector3(0, 0, 0),
  addShadowCaster: undefined,
});

// Window configuration
const WINDOW_CONFIG = {
  width: 3,
  height: 4,
  depth: 0.6, // Total window depth
  frame: {
    thickness: 0.15,
    depth: 0.3,
  },
  glass: {
    thickness: 0.05,
  },
  sill: {
    width: 3.4, // Slightly wider than window
    height: 0.2,
    depth: 0.8, // Extends out from wall
  },
};

let windowMeshes: Mesh[] = [];

const createWindow = (): Mesh[] => {
  if (!props.scene) return [];

  const meshes: Mesh[] = [];

  // Materials
  // Window frame material (dark brown wood)
  const frameMaterial = new StandardMaterial("windowFrame", props.scene);
  frameMaterial.diffuseColor = new Color3(0.4, 0.2, 0.1); // Dark brown

  // Glass material (semi-transparent blue-tinted)
  const glassMaterial = new StandardMaterial("windowGlass", props.scene);
  glassMaterial.diffuseColor = new Color3(0.8, 0.9, 1.0); // Light blue tint
  glassMaterial.alpha = 0.3; // Semi-transparent
  glassMaterial.specularColor = new Color3(1, 1, 1); // Shiny reflection

  // Window sill material (light stone)
  const sillMaterial = new StandardMaterial("windowSill", props.scene);
  sillMaterial.diffuseColor = new Color3(0.9, 0.9, 0.85); // Light beige stone

  // Create window frame parts
  // Top frame
  const topFrame = MeshBuilder.CreateBox(
    "windowTopFrame",
    {
      width: WINDOW_CONFIG.width,
      height: WINDOW_CONFIG.frame.thickness,
      depth: WINDOW_CONFIG.frame.depth,
    },
    props.scene,
  );
  topFrame.position = props.position.clone();
  topFrame.position.y +=
    WINDOW_CONFIG.height / 2 - WINDOW_CONFIG.frame.thickness / 2;
  topFrame.material = frameMaterial;
  meshes.push(topFrame);

  // Bottom frame
  const bottomFrame = MeshBuilder.CreateBox(
    "windowBottomFrame",
    {
      width: WINDOW_CONFIG.width,
      height: WINDOW_CONFIG.frame.thickness,
      depth: WINDOW_CONFIG.frame.depth,
    },
    props.scene,
  );
  bottomFrame.position = props.position.clone();
  bottomFrame.position.y -=
    WINDOW_CONFIG.height / 2 - WINDOW_CONFIG.frame.thickness / 2;
  bottomFrame.material = frameMaterial;
  meshes.push(bottomFrame);

  // Left frame
  const leftFrame = MeshBuilder.CreateBox(
    "windowLeftFrame",
    {
      width: WINDOW_CONFIG.frame.thickness,
      height: WINDOW_CONFIG.height - 2 * WINDOW_CONFIG.frame.thickness,
      depth: WINDOW_CONFIG.frame.depth,
    },
    props.scene,
  );
  leftFrame.position = props.position.clone();
  leftFrame.position.x -=
    WINDOW_CONFIG.width / 2 - WINDOW_CONFIG.frame.thickness / 2;
  leftFrame.material = frameMaterial;
  meshes.push(leftFrame);

  // Right frame
  const rightFrame = MeshBuilder.CreateBox(
    "windowRightFrame",
    {
      width: WINDOW_CONFIG.frame.thickness,
      height: WINDOW_CONFIG.height - 2 * WINDOW_CONFIG.frame.thickness,
      depth: WINDOW_CONFIG.frame.depth,
    },
    props.scene,
  );
  rightFrame.position = props.position.clone();
  rightFrame.position.x +=
    WINDOW_CONFIG.width / 2 - WINDOW_CONFIG.frame.thickness / 2;
  rightFrame.material = frameMaterial;
  meshes.push(rightFrame);

  // Middle vertical divider (creates two window panes)
  const middleFrame = MeshBuilder.CreateBox(
    "windowMiddleFrame",
    {
      width: WINDOW_CONFIG.frame.thickness * 0.7,
      height: WINDOW_CONFIG.height - 2 * WINDOW_CONFIG.frame.thickness,
      depth: WINDOW_CONFIG.frame.depth,
    },
    props.scene,
  );
  middleFrame.position = props.position.clone();
  middleFrame.material = frameMaterial;
  meshes.push(middleFrame);

  // Glass panes (left and right)
  const glassWidth =
    (WINDOW_CONFIG.width - 3 * WINDOW_CONFIG.frame.thickness) / 2;
  const glassHeight = WINDOW_CONFIG.height - 2 * WINDOW_CONFIG.frame.thickness;

  // Left glass pane
  const leftGlass = MeshBuilder.CreateBox(
    "windowLeftGlass",
    {
      width: glassWidth,
      height: glassHeight,
      depth: WINDOW_CONFIG.glass.thickness,
    },
    props.scene,
  );
  leftGlass.position = props.position.clone();
  leftGlass.position.x -=
    (glassWidth + WINDOW_CONFIG.frame.thickness * 0.7) / 2;
  leftGlass.material = glassMaterial;
  meshes.push(leftGlass);

  // Right glass pane
  const rightGlass = MeshBuilder.CreateBox(
    "windowRightGlass",
    {
      width: glassWidth,
      height: glassHeight,
      depth: WINDOW_CONFIG.glass.thickness,
    },
    props.scene,
  );
  rightGlass.position = props.position.clone();
  rightGlass.position.x +=
    (glassWidth + WINDOW_CONFIG.frame.thickness * 0.7) / 2;
  rightGlass.material = glassMaterial;
  meshes.push(rightGlass);

  // Window sill
  const windowSill = MeshBuilder.CreateBox(
    "windowSill",
    {
      width: WINDOW_CONFIG.sill.width,
      height: WINDOW_CONFIG.sill.height,
      depth: WINDOW_CONFIG.sill.depth,
    },
    props.scene,
  );
  windowSill.position = props.position.clone();
  windowSill.position.y -=
    WINDOW_CONFIG.height / 2 + WINDOW_CONFIG.sill.height / 2;
  windowSill.position.z += WINDOW_CONFIG.sill.depth / 4; // Extend slightly from wall
  windowSill.material = sillMaterial;
  windowSill.material.zOffset = -1;
  meshes.push(windowSill);

  // Apply rotation if specified
  if (
    props.rotation &&
    (props.rotation.x !== 0 || props.rotation.y !== 0 || props.rotation.z !== 0)
  ) {
    meshes.forEach((mesh) => {
      mesh.rotation = props.rotation!.clone();
    });
  }

  // Add physics to solid parts (frame and sill, but not glass)
  const solidMeshes = [
    topFrame,
    bottomFrame,
    leftFrame,
    rightFrame,
    middleFrame,
    windowSill,
  ];
  solidMeshes.forEach((mesh) => {
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0 },
      props.scene!,
    );
  });

  // Add to shadow casters if function provided
  if (props.addShadowCaster) {
    meshes.forEach((mesh) => {
      props.addShadowCaster!(mesh);
    });
  }

  return meshes;
};

const createWindowMeshes = () => {
  if (!props.scene) {
    console.warn("Scene not available for window creation");
    return;
  }

  try {
    windowMeshes = createWindow();
    console.log(`Window created at position: ${props.position.toString()}`);
  } catch (error) {
    console.error("Error creating window:", error);
  }
};

const cleanup = () => {
  windowMeshes.forEach((mesh) => {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.dispose();
    }
    mesh.dispose();
  });
  windowMeshes = [];
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createWindowMeshes();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

// Watch for position changes
watch(
  () => props.position,
  () => {
    cleanup();
    if (props.scene) {
      createWindowMeshes();
    }
  },
);

onMounted(() => {
  if (props.scene) {
    createWindowMeshes();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export configuration for other components
defineExpose({
  WINDOW_CONFIG,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - window is a 3D object */
</style>
