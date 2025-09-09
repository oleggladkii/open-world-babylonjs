<template lang="pug">
.wrapper
  //- app-loader(v-if="uiStore.isLoading")
  //- main-map-ui(v-else)
  canvas(ref="canvasRef")
  walking-female(
    v-if="sceneRef && addShadowCasterRef"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  street-lamp(
    v-if="sceneRef && addShadowCasterRef"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
    :is-night="isNight"
  )
  street-bench(
    v-if="sceneRef && addShadowCasterRef"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  house-one(
    v-if="sceneRef && addShadowCasterRef"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  idle-male(
    v-if="sceneRef && addShadowCasterRef"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  ArcRotateCamera,
  Texture,
  Mesh,
  AbstractMesh,
} from "@babylonjs/core";
import { useScene } from "@/composables/useScene";
import { useCamera } from "@/composables/useCamera";
import { createPostProcessing } from "@/composables/usePostProcessing";
import { useRoads } from "@/composables/useRoads";
import WalkingFemale from "@/components/WalkingFemale.vue";
import StreetLamp from "@/components/StreetLamp.vue";
import StreetBench from "@/components/StreetBench.vue";
import HouseOne from "@/components/HouseOne.vue";
import IdleMale from "@/components/IdleMale.vue";
import "@babylonjs/inspector";
import grassTextureUrl from "../assets/textures/grass.jpg";

const canvasRef = ref<HTMLCanvasElement>();

let engine: Engine | null = null;
let scene: Scene | null = null;
const sceneRef = ref<Scene | null>(null);
const addShadowCasterRef = ref<((mesh: AbstractMesh) => void) | null>(null);
const isNight = ref(true); // Default to night mode to show street lamp lights

// RTS-style camera configuration
const cameraConfig = {
  type: "arcRotate" as const,
  position: new Vector3(0, 30, -30),
  target: new Vector3(0, 0, 0),
  radius: 60,
  alpha: 0,
  beta: Math.PI / 3, // 60 degrees for RTS view
  lowerBetaLimit: Math.PI / 6, // Prevent going too low (30 degrees)
  upperBetaLimit: Math.PI / 2.5, // Prevent going too high (72 degrees)
  lowerRadiusLimit: 10,
  upperRadiusLimit: 80,
  checkCollisions: true,
  ellipsoid: new Vector3(2, 2, 2),
};

// Scene configuration includes lighting and shadow settings
const sceneConfig = {
  clearColor: new Color4(0.4, 0.6, 0.9, 1.0), // Sky blue background
  ambientColor: new Color3(0.3, 0.3, 0.4),
  enableShadows: true,
  enableFog: false,
  // fogMode: 3,
  // fogDensity: 0.01,
  // fogColor: new Color3(0.8, 0.9, 1.0),
  enablePhysics: false,
  enableAnimations: true,
  shadowMapSize: 2048,
  shadowBlurKernel: 32,
  shadowDarkness: 0.3,
};

const { createScene, addShadowCaster, disposeScene } = useScene();
const { createCamera, disposeCamera } = useCamera();
const { createRoads } = useRoads();

const createRTSScene = async () => {
  if (!canvasRef.value) return;

  // Initialize Babylon.js engine
  engine = new Engine(canvasRef.value, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  // Create scene with RTS configuration
  scene = createScene(engine, sceneConfig);
  if (!scene) return;

  // Set reactive scene reference
  sceneRef.value = scene;
  addShadowCasterRef.value = addShadowCaster;

  // Create RTS-style camera
  const camera = createCamera(scene, canvasRef.value, cameraConfig);

  // Disable right-click panning for RTS controls
  if (camera && "inputs" in camera) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arcCamera = camera as any;
    if (
      arcCamera.inputs &&
      arcCamera.inputs.attached &&
      arcCamera.inputs.attached.pointers
    ) {
      arcCamera.inputs.attached.pointers.buttons = [0]; // Only allow left mouse button
    }
  }

  // Add post-processing effects
  if (camera && camera.getClassName() === "ArcRotateCamera") {
    createPostProcessing(scene, camera as ArcRotateCamera);
  }

  // Lighting and shadows are now handled by useScene composable automatically

  // Create optimized ground plane for RTS map
  const ground = MeshBuilder.CreateGround(
    "ground",
    {
      width: 60,
      height: 60,
      subdivisions: 2, // Reduced from 32 to 8 for better performance
    },
    scene,
  );

  const groundMaterial = new StandardMaterial("groundMaterial", scene);


  const grassTexture = new Texture(grassTextureUrl, scene);
  grassTexture.uScale = 10; // Repeat texture 10 times horizontally
  grassTexture.vScale = 10; // Repeat texture 10 times vertically
  groundMaterial.diffuseTexture = grassTexture;
  groundMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMaterial;
  ground.receiveShadows = true;
  ground.checkCollisions = true;

  // Create walls around the ground to form a complete terrain box
  const wallHeight = 10;
  const wallThickness = 1;
  const terrainSize = 60;

  // North wall
  const northWall = MeshBuilder.CreateBox(
    "northWall",
    {
      width: terrainSize + wallThickness * 2,
      height: wallHeight,
      depth: wallThickness,
    },
    scene,
  );
  northWall.position = new Vector3(
    0,
    -(wallHeight / 2),
    terrainSize / 2 + wallThickness / 2,
  );
  northWall.material = groundMaterial;
  northWall.receiveShadows = true;
  addShadowCaster(northWall);

  // South wall
  const southWall = MeshBuilder.CreateBox(
    "southWall",
    {
      width: terrainSize + wallThickness * 2,
      height: wallHeight,
      depth: wallThickness,
    },
    scene,
  );
  southWall.position = new Vector3(
    0,
    -wallHeight / 2,
    -terrainSize / 2 - wallThickness / 2,
  );
  southWall.material = groundMaterial;
  southWall.receiveShadows = true;
  addShadowCaster(southWall);

  // East wall
  const eastWall = MeshBuilder.CreateBox(
    "eastWall",
    {
      width: wallThickness,
      height: wallHeight,
      depth: terrainSize,
    },
    scene,
  );
  eastWall.position = new Vector3(
    terrainSize / 2 + wallThickness / 2,
    -wallHeight / 2,
    0,
  );
  eastWall.material = groundMaterial;
  eastWall.receiveShadows = true;
  addShadowCaster(eastWall);

  // West wall
  const westWall = MeshBuilder.CreateBox(
    "westWall",
    {
      width: wallThickness,
      height: wallHeight,
      depth: terrainSize,
    },
    scene,
  );
  westWall.position = new Vector3(
    -terrainSize / 2 - wallThickness / 2,
    -wallHeight / 2,
    0,
  );

  // Merge only walls into one mesh for optimization
  const mergedWalls = Mesh.MergeMeshes([
    northWall,
    southWall,
    eastWall,
    westWall,
  ]);

  if (mergedWalls) {
    mergedWalls.name = "walls";
    mergedWalls.material = groundMaterial;
    mergedWalls.receiveShadows = true;
    addShadowCaster(mergedWalls);
  }

  // Create roads using composable
  createRoads(scene);

  // Load and instance tree models for optimization
  // try {
  //   const treeResult = await loadModel(scene, {
  //     fileName: "street-lamp.glb",
  //     rootUrl: "/assets/models/environments/",
  //     position: new Vector3(0, 0, 0),
  //     scaling: new Vector3(1, 1, 1),
  //     name: "tree",
  //   });

  //   if (treeResult && treeResult.meshes.length > 0) {
  //     // Find the main tree mesh (usually the largest or first non-root mesh)
  //     let originalTree: Mesh | null = null;

  //     for (const mesh of treeResult.meshes) {
  //       if (mesh instanceof Mesh && mesh.getTotalVertices() > 0) {
  //         originalTree = mesh;
  //         break;
  //       }
  //     }

  //     if (originalTree) {
  //       originalTree.receiveShadows = true;
  //       originalTree.scaling = new Vector3(7, 7, 7);
  //       addShadowCaster(originalTree);

  //       // Create tree positions
  //       const treePositions = [
  //         new Vector3(15, 6.6, 15),
  //         new Vector3(15, 6.6, -15),
  //         new Vector3(-15, 6.6, -15),
  //         new Vector3(0, 6.6, 20),
  //         new Vector3(25, 6.6, -22),
  //       ];

  //       // Position original tree at first location
  //       originalTree.position = treePositions[0];
  //       // Create instances for remaining positions
  //       for (let i = 1; i < treePositions.length; i++) {
  //         const treeInstance = originalTree.createInstance(
  //           `tree_instance_${i}`,
  //         );
  //         treeInstance.position = treePositions[i];
  //         treeInstance.receiveShadows = true;
  //         treeInstance.scaling = new Vector3(7, 7, 7);
  //         addShadowCaster(treeInstance);
  //         // Add random rotation for variety
  //         treeInstance.rotation.y = Math.random() * Math.PI * 2;
  //       }
  //     }
  //   }
  // } catch (error) {
  //   console.warn("Failed to load tree models:", error);
  // }

  // House loading is now handled by HouseOne component

  // Handle window resize
  const handleResize = () => {
    if (engine) {
      engine.resize();
    }
  };
  window.addEventListener("resize", handleResize);

  // Start render loop
  engine.runRenderLoop(() => {
    if (scene) {
      scene.render();
    }
  });

  return { engine, scene, handleResize };
};

let cleanup: (() => void) | null = null;

onMounted(async () => {
  const result = await createRTSScene();
  if (import.meta.env.MODE === "development") {
    scene?.debugLayer.show();
  }
  if (result) {
    cleanup = () => {
      window.removeEventListener("resize", result.handleResize);
      disposeScene();
      disposeCamera();
      if (result.engine) {
        result.engine.dispose();
      }
    };
  }
});

onUnmounted(() => {
  if (cleanup) {
    cleanup();
  }
});
</script>

<style scoped>
.wrapper {
  /* width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center; */
}
canvas {
  /* width: calc(100% - 48px); */
  /* height: calc(100vh - 48px); */
  width: 100%;
  height: 100vh;
}
</style>
