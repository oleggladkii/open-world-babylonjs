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
  PointerInfo,
  PointerEventTypes,
  Animation,
  AnimationGroup,
} from "@babylonjs/core";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GLTFFileLoader } from "@babylonjs/loaders/glTF";
import mainMapHeightMap from "@/assets/textures/main-map-height-map.png";
import mainMapHeightMapTexture from "@/assets/textures/main-map-height-map-texture.png";
import { MAIN_MAP_CONFIG } from "@/utils/config/mainMap.config";
import { useDebug } from "@/composables/useDebug";
import { Inspector } from "@babylonjs/inspector";

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

interface AnimatedModelData {
  mesh: Mesh;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  animationGroup: AnimationGroup | null;
}

const state = reactive<{
  engine: Engine | null;
  scene: Scene | null;
  mainMapCamera: ArcRotateCamera | null;
  buildings: BuildingData[];
  environments: EnvironmentData[];
  animatedModels: AnimatedModelData[];
  selectedBuilding: BuildingData | null;
  modelCache: Map<string, Mesh>;
}>({
  engine: null,
  scene: null,
  mainMapCamera: null,
  buildings: [],
  environments: [],
  animatedModels: [],
  selectedBuilding: null,
  modelCache: new Map(),
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
    mesh.id = `building_${index}`;
    mesh.position = buildingConfig.position;
    mesh.rotation = buildingConfig.rotation;
    mesh.scaling = buildingConfig.scale;
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
      if (CONFIG.debug.gizmoPosition) {
        setupBuildingGizmoPosition(building.mesh, CONFIG.buildings[i], scene);
      }
      if (CONFIG.debug.gizmoScale) {
        setupBuildingGizmoScale(building.mesh, CONFIG.buildings[i], scene);
      }
      if (CONFIG.debug.gizmoRotation) {
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

    // Check if model is already in cache
    let mesh: Mesh;
    if (state.modelCache.has(environmentConfig.modelName)) {
      // Clone the cached model
      const cachedMesh = state.modelCache.get(environmentConfig.modelName);
      if (!cachedMesh) return null;
      mesh = cachedMesh.clone(`env_${index}`);
    } else {
      // Load new model and cache it
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "/assets/models/environments/",
        environmentConfig.modelName,
        scene
      );
      mesh = result.meshes[0];
      if (!mesh) return null;

      // Cache the original model
      state.modelCache.set(environmentConfig.modelName, mesh);
    }

    // Set position, rotation, and scale for the mesh
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
      if (CONFIG.debug.gizmoPosition) {
        setupBuildingGizmoPosition(
          environment.mesh,
          CONFIG.environments[i],
          scene
        );
      }
      if (CONFIG.debug.gizmoScale) {
        setupBuildingGizmoScale(
          environment.mesh,
          CONFIG.environments[i],
          scene
        );
      }
      if (CONFIG.debug.gizmoRotation) {
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

const loadAnimatedModel = async (
  scene: Scene,
  index: number
): Promise<AnimatedModelData | null> => {
  try {
    const animatedConfig = CONFIG.animatedModels[index];
    let mesh: Mesh;
    let animationGroup: AnimationGroup | null = null;

    if (state.modelCache.has(animatedConfig.modelName)) {
      const cachedMesh = state.modelCache.get(animatedConfig.modelName);
      if (!cachedMesh) return null;
      mesh = cachedMesh.clone(`animated_${index}`);
    } else {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "/assets/models/animations/",
        animatedConfig.modelName,
        scene
      );
      mesh = result.meshes[0] as Mesh;
      if (!mesh) return null;

      if (result.animationGroups && result.animationGroups.length > 0) {
        animationGroup = result.animationGroups[0];
        animationGroup.name = `anim_${index}`;
        animationGroup.speedRatio = animatedConfig.animationSpeed;
        animationGroup.loopAnimation = animatedConfig.loopAnimation;
        animationGroup.start(true);
      }

      state.modelCache.set(animatedConfig.modelName, mesh);
    }

    mesh.position = animatedConfig.position;
    mesh.rotation = animatedConfig.rotation;
    mesh.scaling = animatedConfig.scale;

    // Add movement animation if path is configured and isMoving is true
    if (animatedConfig.isMoving && animatedConfig.path) {
      const pathPoints = animatedConfig.path.points;
      const duration = animatedConfig.path.duration;
      const loop = animatedConfig.path.loop;

      // Create position animation
      const positionAnimation = new Animation(
        "positionAnimation",
        "position",
        30,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );

      // Create rotation animation
      const rotationAnimation = new Animation(
        "rotationAnimation",
        "rotation",
        30,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CYCLE
      );

      // Create key frames for each point
      const positionKeyFrames = [];
      const rotationKeyFrames = [];

      for (let i = 0; i < pathPoints.length; i++) {
        const frame = (i * duration * 30) / (pathPoints.length - 1);

        positionKeyFrames.push({
          frame,
          value: pathPoints[i].position,
        });

        // Add two keyframes for rotation to create instant turn
        rotationKeyFrames.push({
          frame: frame - 1, // One frame before position change
          value: pathPoints[i].rotation,
        });

        rotationKeyFrames.push({
          frame, // Same frame as position change
          value: pathPoints[i].rotation,
        });
      }

      positionAnimation.setKeys(positionKeyFrames);
      rotationAnimation.setKeys(rotationKeyFrames);

      mesh.animations = [positionAnimation, rotationAnimation];

      // Start the animations
      scene.beginAnimation(mesh, 0, duration * 30, loop);
    }

    return {
      mesh,
      position: mesh.position,
      rotation: mesh.rotation,
      scale: mesh.scaling,
      animationGroup,
    };
  } catch (error) {
    console.error(`Failed to load animated model ${index}:`, error);
    return null;
  }
};

const createAnimatedModels = async (
  scene: Scene
): Promise<AnimatedModelData[]> => {
  const animatedModels: AnimatedModelData[] = [];

  for (let i = 0; i < CONFIG.animatedModels.length; i++) {
    const animatedModel = await loadAnimatedModel(scene, i);
    if (animatedModel) {
      animatedModels.push(animatedModel);
      if (CONFIG.debug.gizmoPosition) {
        setupBuildingGizmoPosition(
          animatedModel.mesh,
          CONFIG.animatedModels[i],
          scene
        );
      }
      if (CONFIG.debug.gizmoScale) {
        setupBuildingGizmoScale(
          animatedModel.mesh,
          CONFIG.animatedModels[i],
          scene
        );
      }
      if (CONFIG.debug.gizmoRotation) {
        setupBuildingGizmoRotation(
          animatedModel.mesh,
          CONFIG.animatedModels[i],
          scene
        );
      }
    }
  }
  return animatedModels;
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

const handleBuildingClick = (mesh: Mesh): void => {
  // Find the building data for the clicked mesh by position
  const clickedBuilding = state.buildings.find((b) => {
    // Compare positions with a small epsilon to account for floating point precision
    return (
      Math.abs(b.position.x - mesh.absolutePosition.x) < 0.1 &&
      Math.abs(b.position.y - mesh.absolutePosition.y) < 0.1 &&
      Math.abs(b.position.z - mesh.absolutePosition.z) < 0.1
    );
  });

  if (!clickedBuilding) {
    console.log("Clicked mesh is not a building:", {
      position: mesh.position,
      id: mesh.id,
    });
    return;
  }

  console.log("Clicked building:", {
    position: clickedBuilding.position,
    isInteractible:
      CONFIG.buildings[state.buildings.indexOf(clickedBuilding)].interactible,
    modelName:
      CONFIG.buildings[state.buildings.indexOf(clickedBuilding)].modelName,
  });

  // If clicking the same building, deselect it
  if (state.selectedBuilding === clickedBuilding) {
    if (state.selectedBuilding.mesh.material instanceof StandardMaterial) {
      state.selectedBuilding.mesh.material.emissiveColor = new Color3(0, 0, 0);
    }
    state.selectedBuilding = null;
    return;
  }

  // Deselect previously selected building
  if (
    state.selectedBuilding &&
    state.selectedBuilding.mesh.material instanceof StandardMaterial
  ) {
    state.selectedBuilding.mesh.material.emissiveColor = new Color3(0, 0, 0);
  }

  // Select new building if it's interactible
  if (
    clickedBuilding.mesh.material instanceof StandardMaterial &&
    CONFIG.buildings[state.buildings.indexOf(clickedBuilding)].interactible
  ) {
    clickedBuilding.mesh.material.emissiveColor = Color3.Red();
    state.selectedBuilding = clickedBuilding;
  }
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

  // Load buildings, environments and animated models
  state.buildings = await createBuildings(state.scene);
  state.environments = await createEnvironments(state.scene);
  state.animatedModels = await createAnimatedModels(state.scene);
  // Adding Fog
  state.scene.fogMode = Scene.FOGMODE_LINEAR;
  state.scene.fogColor = new Color3(0.6, 0.6, 0.6);
  state.scene.fogStart = 120;
  state.scene.fogEnd = 400;

  // Show Inspector
  if (CONFIG.debug.inspector) {
    Inspector.Show(state.scene, {});
  }

  // Add pointer event listener
  state.scene?.onPointerObservable.add((pointerInfo: PointerInfo) => {
    if (
      pointerInfo.type === PointerEventTypes.POINTERDOWN &&
      pointerInfo.pickInfo?.hit
    ) {
      const pickedMesh = pointerInfo.pickInfo.pickedMesh;
      if (pickedMesh && pickedMesh instanceof Mesh) {
        handleBuildingClick(pickedMesh);
      }
    }
  });

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
  state.animatedModels.forEach((animatedModel) => {
    if (animatedModel.animationGroup) {
      animatedModel.animationGroup.stop();
    }
    animatedModel.mesh.dispose();
  });
  state.modelCache.clear();
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
