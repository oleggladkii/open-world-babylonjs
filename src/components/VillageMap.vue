<template lang="pug">
.wrapper
  app-loader(v-if="uiStore.isLoading")
  main-map-ui(v-else)
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
  tree-nature(
    v-if="sceneRef && addShadowCasterRef"
    :scene="sceneRef"
    :add-shadow-caster="addShadowCasterRef"
  )
  birds(
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
import { useUiStore } from "@/store/ui";
import "@babylonjs/inspector";
import grassTextureUrl from "../assets/textures/grass.jpg";
import AppLoader from "@/components/AppLoader.vue";
import MainMapUi from "@/components/MainMapUi.vue";

const canvasRef = ref<HTMLCanvasElement>();
const uiStore = useUiStore();

let engine: Engine | null = null;
let scene: Scene | null = null;
const sceneRef = ref<Scene | null>(null);
const addShadowCasterRef = ref<((mesh: AbstractMesh) => void) | null>(null);
const isNight = ref(true); // Default to night mode to show street lamp lights

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
  camera.upperRadiusLimit = 80;
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
  const camera = createCamera(scene, canvasRef.value);

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

onMounted(async () => {
  const result = await createRTSScene();
  if (import.meta.env.MODE === "development") {
    scene?.debugLayer.show();
  }
  if (result) {
    cleanup = () => {
      window.removeEventListener("resize", result.handleResize);
      disposeScene();
      if (result.engine) {
        result.engine.dispose();
      }
    };
  }
  setTimeout(() => {
  uiStore.setLoading(false);
  }, 1500);
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
