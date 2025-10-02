<template lang="pug">
.wrapper
  app-loader(v-if="uiStore.isLoading")
  main-map-ui(v-else)
  canvas(v-if="!showHouseInterior" ref="canvasRef")
  walking-female(
    v-if="sceneRef && addShadowCasterRef && !showHouseInterior"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  street-lamp(
    v-if="sceneRef && addShadowCasterRef && !showHouseInterior"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
    :is-night="isNight"
  )
  street-bench(
    v-if="sceneRef && addShadowCasterRef && !showHouseInterior"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  house-one(
    v-if="sceneRef && addShadowCasterRef && !showHouseInterior"
    ref="houseOneRef"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
    :camera="cameraRef"
    :on-house-click="handleHouseClick"
  )
  idle-male(
    v-if="sceneRef && addShadowCasterRef && cameraRef && !showHouseInterior"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
    :camera="cameraRef"
    :on-chat-closed="handleChatClosed"
  )
  tree-nature(
    v-if="sceneRef && addShadowCasterRef && !showHouseInterior"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  birds(
    v-if="sceneRef && addShadowCasterRef && !showHouseInterior"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  house-interior(
    :is-active="showHouseInterior"
    :on-exit="handleExitHouse"
  )
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
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
  Angle,
} from "@babylonjs/core";
import { useScene } from "@/composables/useScene";
import { createPostProcessing } from "@/composables/usePostProcessing";
import { useRoads } from "@/composables/useRoads";
import WalkingFemale from "@/components/WalkingFemale.vue";
import StreetLamp from "@/components/StreetLamp.vue";
import StreetBench from "@/components/StreetBench.vue";
import HouseOne from "@/components/HouseOne.vue";
import IdleMale from "@/components/IdleMale.vue";
import TreeNature from "@/components/TreeNature.vue";
import Birds from "@/components/Birds.vue";
import HouseInterior from "@/components/HouseInterior.vue";
import { useUiStore } from "@/store/ui";
import "@babylonjs/inspector";
import grassTextureUrl from "../assets/textures/grass.jpg";
import AppLoader from "@/components/AppLoader.vue";
import MainMapUi from "@/components/MainMapUi.vue";

const canvasRef = ref<HTMLCanvasElement>();
const houseOneRef = ref<InstanceType<typeof HouseOne>>();
const uiStore = useUiStore();

let engine: Engine | null = null;
let scene: Scene | null = null;
let camera: ArcRotateCamera | null = null;
const sceneRef = ref<Scene | null>(null);
const addShadowCasterRef = ref<((mesh: AbstractMesh) => void) | null>(null);
const cameraRef = ref<ArcRotateCamera | null>(null);
const isNight = ref(true); // Default to night mode to show street lamp lights
const showHouseInterior = ref(false);

// Scene configuration includes lighting and shadow settings
const sceneConfig = {
  clearColor: new Color4(0.4, 0.6, 0.9, 1.0), // Sky blue background
  ambientColor: new Color3(0.3, 0.3, 0.4),
  enableShadows: true,
  enableFog: false,
  enablePhysics: false,
  enableAnimations: true,
  shadowMapSize: 2048,
  shadowBlurKernel: 32,
  shadowDarkness: 0.3,
};

const { createScene, addShadowCaster, disposeScene } = useScene();
const { createRoads } = useRoads();

const createCamera = (
  scene: Scene,
  canvas: HTMLCanvasElement,
): ArcRotateCamera => {
  const camera = new ArcRotateCamera(
    "RTSCamera",
    Angle.FromDegrees(290).radians(),
    Angle.FromDegrees(60).radians(),
    50,
    Vector3.Zero(),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 10;
  camera.upperRadiusLimit = 60;
  camera.panningSensibility = 1000;
  camera.wheelDeltaPercentage = 0.01;
  camera.lowerBetaLimit = Angle.FromDegrees(20).radians();
  camera.upperBetaLimit = Angle.FromDegrees(75).radians();
  camera.panningAxis = new Vector3(1, 0, 1);

  return camera;
};

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
  camera = createCamera(scene, canvasRef.value);
  cameraRef.value = camera;

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

const initializeMainScene = async () => {
  console.log("Initializing main scene");

  // Ensure canvas is available
  if (!canvasRef.value) {
    console.error("Canvas not available for scene initialization");
    return;
  }

  const result = await createRTSScene();
  if (isLocalMode) {
    scene?.debugLayer.show();
  }
  if (result) {
    cleanup = () => {
      console.log("Cleaning up main scene");
      window.removeEventListener("resize", result.handleResize);
      disposeScene();
      if (result.engine) {
        result.engine.dispose();
      }
      // Reset references
      engine = null;
      scene = null;
      camera = null;
      sceneRef.value = null;
      addShadowCasterRef.value = null;
      cameraRef.value = null;
    };
    console.log("Main scene initialized successfully");
  }
};

const isLocalMode = import.meta.env.MODE === "development";

// Watch for showHouseInterior changes to manage scene lifecycle
watch(
  () => showHouseInterior.value,
  async (newValue, oldValue) => {
    console.log(`showHouseInterior changed from ${oldValue} to ${newValue}`);

    if (!newValue && oldValue === true) {
      // Returning from house interior - reinitialize main scene
      console.log("Returning from house interior, reinitializing main scene");

      // Clean up any existing scene first
      if (cleanup) {
        cleanup();
        cleanup = null;
      }

      // Wait for DOM updates and fade effect to complete
      await nextTick();

      // Add small delay to ensure fade effect is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Reinitialize the main scene
      await initializeMainScene();
    } else if (newValue && !oldValue) {
      // Entering house interior - cleanup main scene
      console.log("Entering house interior, cleaning up main scene");
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
    }
  },
);

onMounted(async () => {
  // Only initialize main scene if house interior is not active
  if (!showHouseInterior.value) {
    await initializeMainScene();
  }
});

if (isLocalMode) {
  uiStore.setLoading(false);
} else {
  setTimeout(() => {
    uiStore.setLoading(false);
  }, 1500);
}

const handleChatClosed = () => {
  // Show pointer over house after chat is closed
  if (houseOneRef.value) {
    houseOneRef.value.showHousePointer();
  }
};

const handleHouseClick = () => {
  // Create screen fade effect
  const fadeOverlay = document.createElement("div");
  fadeOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: black;
    z-index: 9999;
    opacity: 0;
    transition: opacity 2s ease-in-out;
    pointer-events: none;
  `;

  document.body.appendChild(fadeOverlay);

  // Start fade in
  setTimeout(() => {
    fadeOverlay.style.opacity = "1";
  }, 100);

  // Show house interior during fade
  setTimeout(() => {
    showHouseInterior.value = true;
  }, 1000);

  // Remove overlay after fade completes
  setTimeout(() => {
    document.body.removeChild(fadeOverlay);
  }, 3000);
};

const handleExitHouse = () => {
  // Create fade effect for exit
  const fadeOverlay = document.createElement("div");
  fadeOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: black;
    z-index: 10000;
    opacity: 0;
    transition: opacity 1s ease-in-out;
    pointer-events: none;
  `;

  document.body.appendChild(fadeOverlay);

  // Start fade in
  setTimeout(() => {
    fadeOverlay.style.opacity = "1";
  }, 100);

  // Hide house interior during fade
  setTimeout(() => {
    showHouseInterior.value = false;
  }, 500);

  // Remove overlay after fade completes
  setTimeout(() => {
    document.body.removeChild(fadeOverlay);
  }, 1500);
};

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
