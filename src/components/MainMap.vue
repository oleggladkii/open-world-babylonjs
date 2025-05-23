<template lang="pug">
div
  app-loader(v-if="uiStore.isLoading")
  main-map-ui(v-else)
  canvas(ref="canvasRef")
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, watch } from "vue";
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
  AnimationGroup,
  CreateAudioEngineAsync,
  CreateStreamingSoundAsync,
  AudioEngine,
  Sound,
} from "@babylonjs/core";
import {
  CloudProceduralTexture,
  GrassProceduralTexture,
} from "@babylonjs/procedural-textures";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GLTFFileLoader } from "@babylonjs/loaders/glTF";
import mainMapHeightMap from "@/assets/textures/main-map-height-map.png";
import mainMapHeightMapTexture from "@/assets/textures/main-map-height-map-texture.png";
import { MAIN_MAP_CONFIG } from "@/utils/config/mainMap.config";
import { useDebug } from "@/composables/useDebug";
import { Inspector } from "@babylonjs/inspector";
import MainMapUi from "@/components/MainMapUi.vue";
import { useUiStore } from "@/store/ui";
import AppLoader from "@/components/AppLoader.vue";
const CONFIG = MAIN_MAP_CONFIG;
const uiStore = useUiStore();

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
  audioEngine: AudioEngine | null;
  backgroundMusic: Sound | null;
}>({
  engine: null,
  scene: null,
  mainMapCamera: null,
  buildings: [],
  environments: [],
  animatedModels: [],
  selectedBuilding: null,
  modelCache: new Map(),
  audioEngine: null,
  backgroundMusic: null,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isGrabbing = ref(false);

// Store event handler references for cleanup
const handlePointerDown = (canvas: HTMLCanvasElement) => {
  isGrabbing.value = true;
  canvas.style.cursor = "grabbing";
};
const resetCursorState = (canvas: HTMLCanvasElement) => {
  isGrabbing.value = false;
  canvas.style.cursor = "grab";
};
const handlePointerUp = (canvas: HTMLCanvasElement) => {
  resetCursorState(canvas);
};
const handlePointerLeave = (canvas: HTMLCanvasElement) => {
  resetCursorState(canvas);
};
const handlePointerMove = (canvas: HTMLCanvasElement) => {
  if (isGrabbing.value) {
    canvas.style.cursor = "grabbing";
  }
};

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
    let mesh: Mesh;
    if (state.modelCache.has(buildingConfig.modelName)) {
      const cachedMesh = state.modelCache.get(buildingConfig.modelName);
      if (!cachedMesh) return null;
      mesh = cachedMesh.clone(`building_${index}`);
    } else {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "/assets/models/buildings/",
        buildingConfig.modelName,
        scene
      );
      mesh = result.meshes[0];
      if (!mesh) return null;

      state.modelCache.set(buildingConfig.modelName, mesh);
    }

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
    let mesh: Mesh;
    if (state.modelCache.has(environmentConfig.modelName)) {
      const cachedMesh = state.modelCache.get(environmentConfig.modelName);
      if (!cachedMesh) return null;
      mesh = cachedMesh.clone(`env_${index}`);
    } else {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "/assets/models/environments/",
        environmentConfig.modelName,
        scene
      );
      mesh = result.meshes[0];
      if (!mesh) return null;

      state.modelCache.set(environmentConfig.modelName, mesh);
    }

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
  const texture = new Texture(mainMapHeightMapTexture);
  groundMat.diffuseTexture = texture;
  groundMat.specularColor = new Color3(0, 0, 0);
  groundMat.ambientColor = new Color3(1, 1, 1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  const wallHeight = 30;
  const wallConfig = {
    height: wallHeight,
    sideOrientation: Mesh.DOUBLESIDE,
  };

  const wallMaterial = new StandardMaterial("wallMat", scene);
  const grassProcText = new GrassProceduralTexture("grass", 600, scene);
  wallMaterial.ambientTexture = grassProcText;

  // Create a group for all walls
  const wallsGroup = new Mesh("wallsGroup", scene);
  wallsGroup.isVisible = true;

  const createWall = (
    name: string,
    width: number,
    position: Vector3,
    rotationY = 0
  ) => {
    const wall = MeshBuilder.CreatePlane(
      name,
      {
        width,
        ...wallConfig,
      },
      scene
    );
    wall.position = position;
    wall.rotation.y = rotationY;
    wall.material = wallMaterial;
    wall.parent = wallsGroup;
    return wall;
  };

  createWall(
    "frontWall",
    CONFIG.ground.width,
    new Vector3(0, -(wallHeight / 2) + 7, CONFIG.ground.height / 2)
  );
  createWall(
    "backWall",
    CONFIG.ground.width,
    new Vector3(0, -(wallHeight / 2) + 7, -CONFIG.ground.height / 2),
    Math.PI
  );
  createWall(
    "leftWall",
    CONFIG.ground.height,
    new Vector3(-CONFIG.ground.width / 2, -(wallHeight / 2) + 7, 0),
    Math.PI / 2
  );
  createWall(
    "rightWall",
    CONFIG.ground.height,
    new Vector3(CONFIG.ground.width / 2, -(wallHeight / 2) + 7, 0),
    -Math.PI / 2
  );

  if (CONFIG.debug.groundGrid) {
    createGroundGrid(scene, CONFIG.ground.width, CONFIG.ground.height);
  }
  return ground;
};

const handleBuildingClick = (mesh: Mesh): void => {
  const clickedBuilding = state.buildings.find((b) => {
    return (
      Math.abs(b.position.x - mesh.absolutePosition.x) < 0.1 &&
      Math.abs(b.position.y - mesh.absolutePosition.y) < 0.1 &&
      Math.abs(b.position.z - mesh.absolutePosition.z) < 0.1
    );
  });

  if (!clickedBuilding) {
    return;
  }

  // console.log("Clicked building:", {
  //   position: clickedBuilding.position,
  //   isInteractible:
  //     CONFIG.buildings[state.buildings.indexOf(clickedBuilding)].interactible,
  //   modelName:
  //     CONFIG.buildings[state.buildings.indexOf(clickedBuilding)].modelName,
  // });

  if (state.selectedBuilding === clickedBuilding) {
    if (state.selectedBuilding.mesh.material instanceof StandardMaterial) {
      state.selectedBuilding.mesh.material.emissiveColor = new Color3(0, 0, 0);
    }
    state.selectedBuilding = null;
    return;
  }

  if (
    state.selectedBuilding &&
    state.selectedBuilding.mesh.material instanceof StandardMaterial
  ) {
    state.selectedBuilding.mesh.material.emissiveColor = new Color3(0, 0, 0);
  }

  if (
    clickedBuilding.mesh.material instanceof StandardMaterial &&
    CONFIG.buildings[state.buildings.indexOf(clickedBuilding)].interactible
  ) {
    clickedBuilding.mesh.material.emissiveColor = Color3.Red();
    state.selectedBuilding = clickedBuilding;
  }
};

const initAudio = async (): Promise<void> => {
  state.audioEngine = await CreateAudioEngineAsync();
  state.audioEngine.volume = 0;
  state.backgroundMusic = await CreateStreamingSoundAsync(
    "backgroundAmbient",
    "/assets/sounds/background-ambient.mp3",
    { autoplay: true, loop: true },
    state.audioEngine
  );
};
watch(
  () => uiStore.volume,
  (newVolume) => {
    if (state.audioEngine) {
      state.audioEngine.volume = newVolume / 100;
    }
  },
  {
    immediate: true,
  }
);
watch(
  () => uiStore.isMuted,
  (isMuted) => {
    if (state.audioEngine) {
      state.audioEngine.volume = isMuted ? 0 : uiStore.volume / 100;
    }
  },
  {
    immediate: true,
  }
);

const createClouds = (scene: Scene): Mesh => {
  const cloudSphere = MeshBuilder.CreateSphere(
    "cloudSphere",
    { diameter: 600, segments: 10 },
    scene
  );
  cloudSphere.position = new Vector3(0, 8, 0);
  const cloudMaterial = new StandardMaterial("cloudMat", scene);
  const cloudProcText = new CloudProceduralTexture("cloud", 600, scene);
  cloudMaterial.emissiveTexture = cloudProcText;
  cloudMaterial.diffuseTexture = cloudProcText;
  cloudMaterial.opacityTexture = cloudProcText;
  cloudMaterial.ambientTexture = cloudProcText;
  cloudMaterial.backFaceCulling = false;
  cloudMaterial.emissiveTexture.coordinatesMode = Texture.SKYBOX_MODE;
  cloudMaterial.diffuseTexture.coordinatesMode = Texture.SKYBOX_MODE;
  cloudMaterial.opacityTexture.coordinatesMode = Texture.SKYBOX_MODE;
  cloudMaterial.ambientTexture.coordinatesMode = Texture.SKYBOX_MODE;
  cloudSphere.material = cloudMaterial;
  return cloudSphere;
};

// Update createScene to handle async building creation
const createScene = async (): Promise<void> => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  state.engine = new Engine(canvas, true);
  state.scene = new Scene(state.engine);

  // Add cursor event listeners
  canvas.addEventListener("pointerdown", () => handlePointerDown(canvas));
  canvas.addEventListener("pointerup", () => handlePointerUp(canvas));
  canvas.addEventListener("pointerleave", () => handlePointerLeave(canvas));
  canvas.addEventListener("pointermove", () => handlePointerMove(canvas));

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

  // Create clouds
  createClouds(state.scene);

  // Load buildings, environments and animated models
  state.buildings = await createBuildings(state.scene);
  state.environments = await createEnvironments(state.scene);
  state.animatedModels = await createAnimatedModels(state.scene);

  await initAudio();

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
  setTimeout(() => {
    uiStore.setLoading(false);
  }, 1000);
};

const cleanupScene = (): void => {
  if (state.engine) {
    state.engine.dispose();
  }
  if (state.backgroundMusic) {
    state.backgroundMusic.dispose();
  }
  if (state.audioEngine) {
    state.audioEngine.dispose();
  }
  if (canvasRef.value) {
    canvasRef.value.removeEventListener("pointerdown", () => {
      if (canvasRef.value) {
        handlePointerDown(canvasRef.value);
      }
    });
    canvasRef.value.removeEventListener("pointerup", () => {
      if (canvasRef.value) {
        handlePointerUp(canvasRef.value);
      }
    });
    canvasRef.value.removeEventListener("pointerleave", () => {
      if (canvasRef.value) {
        handlePointerLeave(canvasRef.value);
      }
    });
    canvasRef.value.removeEventListener("pointermove", () => {
      if (canvasRef.value) {
        handlePointerMove(canvasRef.value);
      }
    });
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
  cursor: grab;
}
</style>
