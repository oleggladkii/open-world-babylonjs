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
import { MAIN_MAP_CONFIG } from "@/utils/config/mainMap.config";

const CONFIG = MAIN_MAP_CONFIG;
interface BuildingData {
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}
const state = reactive<{
  engine: Engine | null;
  scene: Scene | null;
  mainMapCamera: ArcRotateCamera | null;
  buildings: BuildingData[];
}>({
  engine: null,
  scene: null,
  mainMapCamera: null,
  buildings: [],
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

const createCamera = (
  scene: Scene,
  canvas: HTMLCanvasElement
): ArcRotateCamera => {
  const camera = new ArcRotateCamera(
    "RTSCamera",
    Angle.FromDegrees(250).radians(),
    Angle.FromDegrees(55).radians(),
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
  state.mainMapCamera = createCamera(state.scene, canvas);

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
