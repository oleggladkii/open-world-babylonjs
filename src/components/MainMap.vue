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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GLTFFileLoader } from "@babylonjs/loaders/glTF";
import mainMapHeightMap from "@/assets/textures/main-map-height-map.png";
import mainMapHeightMapTexture from "@/assets/textures/main-map-height-map-texture.png";
import { MAIN_MAP_CONFIG } from "@/utils/config/mainMap.config";
import { useDebug } from "@/composables/useDebug";

const CONFIG = MAIN_MAP_CONFIG;
interface BuildingData {
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

interface EnvironmentData {
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
  environments: EnvironmentData[];
}>({
  engine: null,
  scene: null,
  mainMapCamera: null,
  buildings: [],
  environments: [],
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

const {
  setupBuildingGizmoPosition,
  setupBuildingGizmoScale,
  setupBuildingGizmoRotation,
  createGroundGrid,
  setupLightGizmo,
} = useDebug();

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
      if (CONFIG.debug.buildingGizmoPosition) {
        setupBuildingGizmoPosition(building.mesh, CONFIG.buildings[i], scene);
      }
      if (CONFIG.debug.buildingGizmoScale) {
        setupBuildingGizmoScale(building.mesh, CONFIG.buildings[i], scene);
      }
      if (CONFIG.debug.buildingGizmoRotation) {
        setupBuildingGizmoRotation(building.mesh, CONFIG.buildings[i], scene);
      }
    }
  }
  return buildings;
};

const loadEnvironmentModel = async (
  scene: Scene,
  index: number
): Promise<EnvironmentData | null> => {
  try {
    const environmentConfig = CONFIG.environments[index];
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "/assets/models/environments/",
      environmentConfig.modelName,
      scene
    );
    const mesh = result.meshes[0];
    if (!mesh) return null;
    mesh.position = environmentConfig.position;
    mesh.rotation = environmentConfig.rotation;
    mesh.scaling = environmentConfig.scale;

    if (environmentConfig.interactible) {
      // TODO: setup environment interactions
    }
    return {
      mesh: mesh as Mesh,
      position: mesh.position,
      rotation: mesh.rotation,
      scale: mesh.scaling,
    };
  } catch (error) {
    console.error(`Failed to load environment model ${index}:`, error);
    return null;
  }
};

const createEnvironments = async (scene: Scene): Promise<EnvironmentData[]> => {
  const environments: EnvironmentData[] = [];

  for (let i = 0; i < CONFIG.environments.length; i++) {
    const environment = await loadEnvironmentModel(scene, i);
    if (environment) {
      environments.push(environment);
      if (CONFIG.debug.buildingGizmoPosition) {
        setupBuildingGizmoPosition(
          environment.mesh,
          CONFIG.environments[i],
          scene
        );
      }
      if (CONFIG.debug.buildingGizmoScale) {
        setupBuildingGizmoScale(
          environment.mesh,
          CONFIG.environments[i],
          scene
        );
      }
      if (CONFIG.debug.buildingGizmoRotation) {
        setupBuildingGizmoRotation(
          environment.mesh,
          CONFIG.environments[i],
          scene
        );
      }
    }
  }
  return environments;
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

  if (CONFIG.debug.groundGrid) {
    createGroundGrid(scene, CONFIG.ground.width, CONFIG.ground.height);
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

  const light = new HemisphericLight(
    "light",
    new Vector3(15.124765396118164, 20.659635543823242, -13.0604829788208),
    state.scene
  );
  if (CONFIG.debug.lightGizmo) {
    setupLightGizmo(light, state.scene);
  }
  createGround(state.scene);

  // Load buildings and environments
  state.buildings = await createBuildings(state.scene);
  state.environments = await createEnvironments(state.scene);

  // state.scene.registerBeforeRender(() => {
  //   if (state.buildings[0]) {
  //     state.buildings[0].mesh.rotation.y += 0.01;
  //   }
  // });

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

  state.environments.forEach((environment) => {
    environment.mesh.dispose();
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
