<template lang="pug">
div
  // Invisible component - window is created programmatically
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, ref } from "vue";
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
}

const props = withDefaults(defineProps<Props>(), {
  rotation: () => new Vector3(0, 0, 0),
});

// Window configuration - memoized
const WINDOW_CONFIG = computed(() => ({
  width: 3,
  height: 4,
  depth: 0.6, // Total window depth
  frame: {
    thickness: 0.15,
    depth: 0.3,
  },
  glass: {
    thickness: 0.2, // Increased for better collision detection
  },
  sill: {
    width: 3.4, // Slightly wider than window
    height: 0.2,
    depth: 0.8, // Extends out from wall
  },
}));

// Material cache to prevent memory leaks
const materialCache = ref<{
  frame: StandardMaterial | null;
  glass: StandardMaterial | null;
  sill: StandardMaterial | null;
}>({
  frame: null,
  glass: null,
  sill: null,
});

let windowMeshes: Mesh[] = [];

// Create and cache materials
const createMaterials = (): {
  frame: StandardMaterial;
  glass: StandardMaterial;
  sill: StandardMaterial;
} => {
  if (!props.scene) throw new Error("Scene not available");

  // Return cached materials if they exist
  if (
    materialCache.value.frame &&
    materialCache.value.glass &&
    materialCache.value.sill
  ) {
    return {
      frame: materialCache.value.frame as StandardMaterial,
      glass: materialCache.value.glass as StandardMaterial,
      sill: materialCache.value.sill as StandardMaterial,
    };
  }

  // Create new materials and cache them
  const frameMaterial = new StandardMaterial("windowFrame", props.scene);
  frameMaterial.diffuseColor = new Color3(0.4, 0.2, 0.1); // Dark brown

  const glassMaterial = new StandardMaterial("windowGlass", props.scene);
  glassMaterial.diffuseColor = new Color3(0.8, 0.9, 1.0); // Light blue tint
  glassMaterial.alpha = 0.3; // Semi-transparent
  glassMaterial.specularColor = new Color3(1, 1, 1); // Shiny reflection

  const sillMaterial = new StandardMaterial("windowSill", props.scene);
  sillMaterial.diffuseColor = new Color3(0.9, 0.9, 0.85); // Light beige stone

  // Cache materials
  materialCache.value = {
    frame: frameMaterial,
    glass: glassMaterial,
    sill: sillMaterial,
  };

  return { frame: frameMaterial, glass: glassMaterial, sill: sillMaterial };
};

// Create window frame parts
const createFrameParts = (materials: { frame: StandardMaterial }): Mesh[] => {
  const config = WINDOW_CONFIG.value;
  const meshes: Mesh[] = [];

  // Top frame
  const topFrame = MeshBuilder.CreateBox(
    "windowTopFrame",
    {
      width: config.width,
      height: config.frame.thickness,
      depth: config.frame.depth,
    },
    props.scene!,
  );
  topFrame.position = props.position.clone();
  topFrame.position.y += config.height / 2 - config.frame.thickness / 2;
  topFrame.material = materials.frame;
  meshes.push(topFrame);

  // Bottom frame
  const bottomFrame = MeshBuilder.CreateBox(
    "windowBottomFrame",
    {
      width: config.width,
      height: config.frame.thickness,
      depth: config.frame.depth,
    },
    props.scene!,
  );
  bottomFrame.position = props.position.clone();
  bottomFrame.position.y -= config.height / 2 - config.frame.thickness / 2;
  bottomFrame.material = materials.frame;
  meshes.push(bottomFrame);

  // Left frame
  const leftFrame = MeshBuilder.CreateBox(
    "windowLeftFrame",
    {
      width: config.frame.thickness,
      height: config.height - 2 * config.frame.thickness,
      depth: config.frame.depth,
    },
    props.scene!,
  );
  leftFrame.position = props.position.clone();
  leftFrame.position.x -= config.width / 2 - config.frame.thickness / 2;
  leftFrame.material = materials.frame;
  meshes.push(leftFrame);

  // Right frame
  const rightFrame = MeshBuilder.CreateBox(
    "windowRightFrame",
    {
      width: config.frame.thickness,
      height: config.height - 2 * config.frame.thickness,
      depth: config.frame.depth,
    },
    props.scene!,
  );
  rightFrame.position = props.position.clone();
  rightFrame.position.x += config.width / 2 - config.frame.thickness / 2;
  rightFrame.material = materials.frame;
  meshes.push(rightFrame);

  // Middle vertical divider
  const middleFrame = MeshBuilder.CreateBox(
    "windowMiddleFrame",
    {
      width: config.frame.thickness * 0.7,
      height: config.height - 2 * config.frame.thickness,
      depth: config.frame.depth,
    },
    props.scene!,
  );
  middleFrame.position = props.position.clone();
  middleFrame.material = materials.frame;
  meshes.push(middleFrame);

  return meshes;
};

// Create glass panes
const createGlassPanes = (materials: { glass: StandardMaterial }): Mesh[] => {
  const config = WINDOW_CONFIG.value;
  const meshes: Mesh[] = [];

  const glassWidth = (config.width - 3 * config.frame.thickness) / 2;
  const glassHeight = config.height - 2 * config.frame.thickness;

  // Left glass pane
  const leftGlass = MeshBuilder.CreateBox(
    "windowLeftGlass",
    {
      width: glassWidth,
      height: glassHeight,
      depth: config.glass.thickness,
    },
    props.scene!,
  );
  leftGlass.position = props.position.clone();
  leftGlass.position.x -= (glassWidth + config.frame.thickness * 0.7) / 2;
  leftGlass.material = materials.glass;
  meshes.push(leftGlass);

  // Right glass pane
  const rightGlass = MeshBuilder.CreateBox(
    "windowRightGlass",
    {
      width: glassWidth,
      height: glassHeight,
      depth: config.glass.thickness,
    },
    props.scene!,
  );
  rightGlass.position = props.position.clone();
  rightGlass.position.x += (glassWidth + config.frame.thickness * 0.7) / 2;
  rightGlass.material = materials.glass;
  meshes.push(rightGlass);

  return meshes;
};

// Create window sill
const createWindowSill = (materials: { sill: StandardMaterial }): Mesh => {
  const config = WINDOW_CONFIG.value;

  const windowSill = MeshBuilder.CreateBox(
    "windowSill",
    {
      width: config.sill.width,
      height: config.sill.height,
      depth: config.sill.depth,
    },
    props.scene!,
  );
  windowSill.position = props.position.clone();
  windowSill.position.y -= config.height / 2 + config.sill.height / 2;
  windowSill.position.z += config.sill.depth / 4;
  windowSill.material = materials.sill;
  windowSill.material.zOffset = -1;

  return windowSill;
};

// Create collision mesh
const createCollisionMesh = (): Mesh => {
  const config = WINDOW_CONFIG.value;

  const windowCollision = MeshBuilder.CreateBox(
    "windowCollision",
    {
      width: config.width - 2 * config.frame.thickness,
      height: config.height - 2 * config.frame.thickness,
      depth: 0.3,
    },
    props.scene!,
  );
  windowCollision.position = props.position.clone();
  windowCollision.isVisible = false;
  windowCollision.physicsImpostor = new PhysicsImpostor(
    windowCollision,
    PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 0.8, restitution: 0.3 },
    props.scene!,
  );

  return windowCollision;
};

const createWindow = (): Mesh[] => {
  if (!props.scene) return [];

  const meshes: Mesh[] = [];

  try {
    // Create and cache materials
    const materials = createMaterials();

    // Create frame parts
    const frameMeshes = createFrameParts(materials);
    meshes.push(...frameMeshes);

    // Create glass panes
    const glassMeshes = createGlassPanes(materials);
    meshes.push(...glassMeshes);

    // Create window sill
    const windowSill = createWindowSill(materials);
    meshes.push(windowSill);

    // Create collision mesh
    const collisionMesh = createCollisionMesh();
    meshes.push(collisionMesh);

    // Apply rotation if specified
    if (
      props.rotation &&
      (props.rotation.x !== 0 ||
        props.rotation.y !== 0 ||
        props.rotation.z !== 0)
    ) {
      meshes.forEach((mesh) => {
        mesh.rotation = props.rotation!.clone();
      });
    }

    // Add physics to solid parts (frame, sill, and glass for collision)
    const solidMeshes = meshes.filter((mesh) => mesh !== collisionMesh);
    solidMeshes.forEach((mesh) => {
      mesh.physicsImpostor = new PhysicsImpostor(
        mesh,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8, restitution: 0.3 },
        props.scene!,
      );
    });

    return meshes;
  } catch (error) {
    console.error("Error creating window:", error);
    return [];
  }
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

// Debounce utility
const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number,
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
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

// Cleanup materials when component unmounts
const cleanupMaterials = () => {
  if (materialCache.value.frame) {
    materialCache.value.frame.dispose();
  }
  if (materialCache.value.glass) {
    materialCache.value.glass.dispose();
  }
  if (materialCache.value.sill) {
    materialCache.value.sill.dispose();
  }
  materialCache.value = { frame: null, glass: null, sill: null };
};

// Debounced window creation to prevent multiple rapid recreations
const debouncedCreateWindow = debounce(() => {
  cleanup();
  if (props.scene) {
    createWindowMeshes();
  }
}, 100);

// Combined watcher for scene and position changes
watch(
  [() => props.scene, () => props.position],
  ([newScene, newPosition], [oldScene, oldPosition]) => {
    // If scene changed from null to scene, create immediately
    if (!oldScene && newScene) {
      createWindowMeshes();
      return;
    }

    // If scene became null, cleanup immediately
    if (oldScene && !newScene) {
      cleanup();
      return;
    }

    // For position changes or scene updates, use debounced creation
    if (newScene && (newPosition !== oldPosition || newScene !== oldScene)) {
      debouncedCreateWindow();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createWindowMeshes();
  }
});

onUnmounted(() => {
  cleanup();
  cleanupMaterials();
});

// Export configuration for other components
defineExpose({
  WINDOW_CONFIG,
  cleanup,
  cleanupMaterials,
});
</script>

<style scoped>
/* No visual styling needed - window is a 3D object */
</style>
