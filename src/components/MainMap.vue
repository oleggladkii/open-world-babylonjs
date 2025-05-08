<template lang="pug">
div
  canvas(ref="canvasRef", style="width: 100%; height: 100vh")
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive } from "vue";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  Texture,
  SceneLoader,
  Angle,
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import { GLTFFileLoader } from "@babylonjs/loaders/glTF";
import mainMapHeightMap from "@/assets/textures/main-map-height-map.png";
import mainMapHeightMapTexture from "@/assets/textures/main-map-height-map-texture.png";

// Constants and configuration
const CONFIG = {
  debug: false,
  ground: {
    width: 200,
    height: 200,
  },
  camera: {
    initialRadius: 100,
    minRadius: 10,
    maxRadius: 100,
    panningSensibility: 50,
    wheelDeltaPercentage: 0.01,
    lowerBetaLimit: 0.1,
    upperBetaLimit: Math.PI / 2.1,
    moveSpeed: 0.8,
    edgeScrollThreshold: 20,
  },
  buildings: [
    {
      interactible: true,
      size: { width: 17, depth: 10, height: 6 },
      position: new Vector3(28, 5, 3),
      rotation: new Vector3(0, Angle.FromDegrees(90).radians(), 0),
      scale: new Vector3(1, 1.3, 1),
      modelName: "house_04.glb",
      highlightColor: new Color3(0.2, 0.8, 0.2),
    },
    {
      interactible: true,
      size: { width: 20, depth: 30, height: 7 },
      position: new Vector3(49, 6, 20),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1.15, 1.3, 1),
      modelName: "house_01.glb",
      highlightColor: new Color3(0.8, 0.2, 0.2),
    },
    {
      interactible: true,
      size: { width: 13, depth: 17, height: 20 },
      position: new Vector3(8, 5, 22),
      rotation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1.3, 1),
      modelName: "house_02.glb",
      highlightColor: new Color3(0.2, 0.2, 0.8),
    },
  ],
} as const;

// Add this interface for building data
interface BuildingData {
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

// Update the state interface
interface SceneState {
  engine: Engine | null;
  scene: Scene | null;
  rtsCamera: ArcRotateCamera | null;
  currentCamera: ArcRotateCamera | null;
  buildings: BuildingData[];
}

// Reactive state
const state = reactive<SceneState>({
  engine: null,
  scene: null,
  rtsCamera: null,
  currentCamera: null,
  buildings: [],
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

const createCamera = (
  scene: Scene,
  canvas: HTMLCanvasElement
): ArcRotateCamera => {
  const camera = new ArcRotateCamera(
    "RTSCamera",
    -Math.PI / 1.7,
    Math.PI / 3,
    CONFIG.camera.initialRadius,
    Vector3.Zero(),
    scene
  );

  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = CONFIG.camera.minRadius;
  camera.upperRadiusLimit = CONFIG.camera.maxRadius;
  camera.panningSensibility = CONFIG.camera.panningSensibility;
  camera.wheelDeltaPercentage = CONFIG.camera.wheelDeltaPercentage;
  camera.lowerBetaLimit = CONFIG.camera.lowerBetaLimit;
  camera.upperBetaLimit = CONFIG.camera.upperBetaLimit;
  camera.panningAxis = new Vector3(1, 0, 1);

  return camera;
};

const loadBuildingModel = async (
  scene: Scene,
  index: number
): Promise<BuildingData | null> => {
  try {
    const buildingConfig = CONFIG.buildings[index];
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "/assets/models/buildings/",
      buildingConfig.modelName,
      scene
    );

    const mesh = result.meshes[0];
    if (!mesh) return null;

    mesh.position = buildingConfig.position;
    mesh.rotation = buildingConfig.rotation;
    mesh.scaling = buildingConfig.scale;

    if (buildingConfig.interactible) {
      // TODO: setup building interactions
    }

    return {
      mesh: mesh as Mesh,
      position: mesh.position,
      rotation: mesh.rotation,
      scale: mesh.scaling,
    };
  } catch (error) {
    console.error(`Failed to load building model ${index}:`, error);
    return null;
  }
};

const createBuildings = async (scene: Scene): Promise<BuildingData[]> => {
  const buildings: BuildingData[] = [];

  for (let i = 0; i < CONFIG.buildings.length; i++) {
    const building = await loadBuildingModel(scene, i);
    if (building) {
      buildings.push(building);
    }
  }

  return buildings;
};

// Create grid overlay
const createGroundGrid = (scene: Scene) => {
  const grid = MeshBuilder.CreateGround(
    "grid",
    {
      width: CONFIG.ground.width,
      height: CONFIG.ground.height,
      subdivisions: 20,
    },
    scene
  );
  grid.position.y = 10;
  const gridMaterial = new GridMaterial("gridMaterial", scene);
  gridMaterial.majorUnitFrequency = 5;
  gridMaterial.minorUnitVisibility = 0.5;
  gridMaterial.gridRatio = 1;
  gridMaterial.mainColor = new Color3(1, 1, 1);
  gridMaterial.lineColor = new Color3(0.5, 0.5, 0.5);
  gridMaterial.opacity = 0.3;
  grid.material = gridMaterial;
};

// Create the heightmap ground
const createGround = (scene: Scene): Mesh => {
  const ground = MeshBuilder.CreateGroundFromHeightMap(
    "ground",
    mainMapHeightMap,
    {
      width: CONFIG.ground.width,
      height: CONFIG.ground.height,
      minHeight: -5,
      maxHeight: 30,
      subdivisions: 30,
    }
  );
  ground.position.y = 0;
  const groundMat = new StandardMaterial("groundMat", scene);
  try {
    const texture = new Texture(mainMapHeightMapTexture);
    groundMat.diffuseTexture = texture;
  } catch (error) {
    console.error("Failed to load ground texture:", error);
    groundMat.diffuseColor = new Color3(0.2, 0.8, 0.2);
  }
  ground.material = groundMat;

  if (CONFIG.debug) {
    createGroundGrid(scene);
  }
  return ground;
};

// Update createScene to handle async building creation
const createScene = async (): Promise<void> => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  state.engine = new Engine(canvas, true);
  state.scene = new Scene(state.engine);

  // Create scene elements
  state.rtsCamera = createCamera(state.scene, canvas);
  state.currentCamera = state.rtsCamera;

  new HemisphericLight("light", new Vector3(0, 1, 0), state.scene);
  createGround(state.scene);

  // Load buildings
  state.buildings = await createBuildings(state.scene);

  // Start render loop
  state.engine.runRenderLoop(() => {
    state.scene?.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    state.engine?.resize();
  });
};

const cleanupScene = (): void => {
  if (state.engine) {
    state.engine.dispose();
  }

  state.buildings.forEach((building) => {
    building.mesh.dispose();
  });

  if (state.scene) {
    state.scene.dispose();
  }

  window.removeEventListener("resize", () => {
    state.engine?.resize();
  });
};

// Update onMounted to handle async createScene
onMounted(async () => {
  await createScene();
});
onBeforeUnmount(() => {
  cleanupScene();
});
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100vh;
}
</style>
