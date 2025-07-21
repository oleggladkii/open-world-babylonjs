<template lang="pug">
div
  app-loader(v-if="uiStore.isLoading")
  main-map-ui(v-else)
  canvas(ref="canvasRef")
  .hover-tooltip(
    v-if="hoverState.isHovering && hoverState.tooltipPosition",
    :style="{ left: hoverState.tooltipPosition.x + 'px', top: hoverState.tooltipPosition.y + 'px' }"
  ) Click to enter
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
  AudioEngineV2,
  Sound,
  Animation,
  EasingFunction,
  CircleEase,
  DirectionalLight,
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
import { useClouds } from "@/composables/useClouds";
import { useGround } from "@/composables/useGround";
import { Inspector } from "@babylonjs/inspector";
import MainMapUi from "@/components/MainMapUi.vue";
import { useUiStore } from "@/store/ui";
import AppLoader from "@/components/AppLoader.vue";
import { useLakeWater } from "@/composables/useLakeWater";
import type { SunLightConfig } from "@/interfaces/MapConfig";
import { createPostProcessing } from "@/composables/usePostProcessing";

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
  audioEngine: AudioEngineV2 | null;
  backgroundMusic: Sound | null;
  clouds: ReturnType<typeof useClouds>["createParticleClouds"] | null;
  lakeWater: ReturnType<typeof useLakeWater>["createLakeWater"] | null;
  sunSphere: Mesh | null;
  sunLight: DirectionalLight | null;
  orbitTime: number;
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
  clouds: null,
  lakeWater: null,
  sunSphere: null,
  sunLight: null,
  orbitTime: 0,
});

// Hover state
const hoverState = reactive<{
  isHovering: boolean;
  hoveredBuilding: BuildingData | null;
  tooltipPosition: { x: number; y: number } | null;
  originalEmissiveColor: Color3 | null;
}>({
  isHovering: false,
  hoveredBuilding: null,
  tooltipPosition: null,
  originalEmissiveColor: null,
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isGrabbing = ref(false);
const isCameraAnimating = ref(false);

// Store event handler references for cleanup
const handlePointerDown = (canvas: HTMLCanvasElement) => {
  isGrabbing.value = true;
  canvas.style.cursor = "grabbing";
};
const resetCursorState = (canvas: HTMLCanvasElement) => {
  isGrabbing.value = false;
  canvas.style.cursor = hoverState.isHovering ? "pointer" : "grab";
};
const handlePointerUp = (canvas: HTMLCanvasElement) => {
  resetCursorState(canvas);
  clearHover();
};
const handlePointerLeave = (canvas: HTMLCanvasElement) => {
  resetCursorState(canvas);
  clearHover();
};
const handlePointerMove = (canvas: HTMLCanvasElement, event: PointerEvent) => {
  if (isGrabbing.value) {
    canvas.style.cursor = "grabbing";
  } else {
    // Update tooltip position
    if (hoverState.isHovering) {
      hoverState.tooltipPosition = {
        x: event.clientX + 10,
        y: event.clientY - 30,
      };
    }
  }
};

const {
  setupBuildingGizmoPosition,
  setupBuildingGizmoScale,
  setupBuildingGizmoRotation,
  createGroundGrid,
  setupLightGizmo,
} = useDebug();

// Hover functions
const clearHover = (): void => {
  if (hoverState.hoveredBuilding && hoverState.originalEmissiveColor) {
    const material = hoverState.hoveredBuilding.mesh.material;
    if (material instanceof StandardMaterial) {
      material.emissiveColor = hoverState.originalEmissiveColor;
    }
  }
  hoverState.isHovering = false;
  hoverState.hoveredBuilding = null;
  hoverState.tooltipPosition = null;
  hoverState.originalEmissiveColor = null;

  if (canvasRef.value) {
    canvasRef.value.style.cursor = "grab";
  }
};

const handleBuildingHover = (mesh: Mesh, event: PointerEvent): void => {
  if (isCameraAnimating.value) return;

  const hoveredBuilding = state.buildings.find((b) => {
    return (
      Math.abs(b.position.x - mesh.absolutePosition.x) < 0.1 &&
      Math.abs(b.position.y - mesh.absolutePosition.y) < 0.1 &&
      Math.abs(b.position.z - mesh.absolutePosition.z) < 0.1
    );
  });

  if (!hoveredBuilding) return;

  const buildingIndex = state.buildings.indexOf(hoveredBuilding);
  const buildingConfig = CONFIG.buildings[buildingIndex];

  if (!buildingConfig?.interactible) return;

  // Clear previous hover if different building
  if (hoverState.hoveredBuilding !== hoveredBuilding) {
    clearHover();
  }

  hoverState.isHovering = true;
  hoverState.hoveredBuilding = hoveredBuilding;
  hoverState.tooltipPosition = {
    x: event.clientX + 10,
    y: event.clientY - 30,
  };

  // Set cursor to pointer
  if (canvasRef.value) {
    canvasRef.value.style.cursor = "pointer";
  }

  // Highlight the building
  const material = hoveredBuilding.mesh.material;
  if (material instanceof StandardMaterial) {
    if (!hoverState.originalEmissiveColor) {
      hoverState.originalEmissiveColor = material.emissiveColor.clone();
    }
    material.emissiveColor = new Color3(0.3, 0.3, 0.8); // Blue highlight
  }
};

// Camera animation functions
const animateCameraToBuilding = (building: BuildingData): void => {
  if (!state.mainMapCamera || !state.scene || isCameraAnimating.value) return;
  console.log("animateCameraToBuilding");
  isCameraAnimating.value = true;
  const camera = state.mainMapCamera;

  // Calculate target position (slightly above and in front of the building)
  const targetPosition = building.position.clone();
  const offset = new Vector3(0, 5, 0); // Adjust height offset as needed
  targetPosition.addInPlace(offset);

  // Calculate optimal camera distance based on building scale
  const buildingSize = Math.max(
    building.scale.x,
    building.scale.y,
    building.scale.z
  );
  const targetRadius = Math.max(10, buildingSize * 3);

  // Calculate camera angles to look at the building
  const direction = targetPosition.subtract(camera.position).normalize();
  const targetAlpha = Math.atan2(direction.x, direction.z);
  const targetBeta = Math.acos(direction.y) * 0.7; // Slightly angled view

  // Create animations
  const animationAlpha = Animation.CreateAndStartAnimation(
    "cameraAlphaAnim",
    camera,
    "alpha",
    60,
    90, // 1.5 seconds
    camera.alpha,
    targetAlpha,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  const animationBeta = Animation.CreateAndStartAnimation(
    "cameraBetaAnim",
    camera,
    "beta",
    60,
    90,
    camera.beta,
    targetBeta,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  const animationRadius = Animation.CreateAndStartAnimation(
    "cameraRadiusAnim",
    camera,
    "radius",
    60,
    90,
    camera.radius,
    targetRadius,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  const animationTarget = Animation.CreateAndStartAnimation(
    "cameraTargetAnim",
    camera,
    "target",
    60,
    90,
    camera.target,
    targetPosition,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  // Add easing for smooth animation
  const easing = new CircleEase();
  easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

  if (animationAlpha) animationAlpha.easingFunction = easing;
  if (animationBeta) animationBeta.easingFunction = easing;
  if (animationRadius) animationRadius.easingFunction = easing;
  if (animationTarget) animationTarget.easingFunction = easing;
  setTimeout(() => {
    isCameraAnimating.value = false;
  }, 1000);
};

const createCamera = (
  scene: Scene,
  canvas: HTMLCanvasElement
): ArcRotateCamera => {
  const camera = new ArcRotateCamera(
    "RTSCamera",
    Angle.FromDegrees(290).radians(),
    Angle.FromDegrees(60).radians(),
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

// Update sun orbital animation
const updateSunOrbit = () => {
  if (!state.sunSphere || !state.sunLight) return;

  state.orbitTime += 0.01; // Orbit speed

  // Orbital parameters
  const orbitRadius = 160;
  const orbitHeight = 60;
  const centerX = 0; // Center of the map
  const centerZ = 0;

  // Calculate new position in orbit
  const x = centerX + Math.cos(state.orbitTime) * orbitRadius;
  const z = centerZ + Math.sin(state.orbitTime) * orbitRadius;
  const y = orbitHeight + Math.sin(state.orbitTime * 0.5) * 20; // Slight vertical variation

  // Update sun sphere position
  state.sunSphere.position.x = x;
  state.sunSphere.position.y = y;
  state.sunSphere.position.z = z;

  // Update directional light direction to point towards center
  const direction = new Vector3(-x, -y, -z).normalize();
  state.sunLight.direction = direction;
};

// Add sun light and shadows using config
const addSunLight = (scene: Scene, config?: SunLightConfig) => {
  if (!config) return;

  const sun = new DirectionalLight(
    "sun",
    new Vector3(config.direction.x, config.direction.y, config.direction.z),
    scene
  );
  sun.intensity = config.intensity;
  sun.diffuse = config.diffuse;
  sun.specular = config.specular;

  // Store reference to sun light for orbital updates
  state.sunLight = sun;

  // Add a visible yellow sun sphere at the sun's position
  const sunSphere = MeshBuilder.CreateSphere(
    "sunSphere",
    { diameter: 20 },
    scene
  );

  // Store reference to sun sphere for orbital animation
  state.sunSphere = sunSphere;

  // Set initial position
  sunSphere.position = new Vector3(120, 60, 150);
  const sunMaterial = new StandardMaterial("sunMat", scene);
  sunMaterial.disableLighting = true;
  sunMaterial.emissiveColor = new Color3(1, 0.85, 0.2); // bright yellow
  sunMaterial.diffuseColor = new Color3(1, 0.85, 0.2);
  sunMaterial.specularColor = new Color3(0, 0, 0);
  sunSphere.material = sunMaterial;
  sunSphere.isPickable = false;
  sunSphere.receiveShadows = false;
  sunSphere.isVisible = true;

  if (config.shadowEnabled) {
    // TODO: add shadows
    // const shadowGenerator = new ShadowGenerator(config.shadowMapSize, sun);
    // shadowGenerator.useBlurExponentialShadowMap = !!config.shadowBlur;
    // shadowGenerator.blurKernel = config.shadowBlurKernel;
    // shadowGenerator.setDarkness(config.shadowDarkness);
    // Add shadow casters based on mesh name patterns
    // scene.meshes.forEach((mesh) => {
    //   if (mesh.receiveShadows !== undefined) mesh.receiveShadows = true;
    //   if (
    //     config.shadowCasterNamePatterns.some((pattern) =>
    //       mesh.name.includes(pattern)
    //     )
    //   ) {
    //     console.log("yes", mesh.name);
    //     shadowGenerator.addShadowCaster(mesh, true);
    //   }
    // });
  }
};

// Create the heightmap ground
const createGround = (scene: Scene): Mesh => {
  const { createGround: createGroundMesh } = useGround();
  const ground = createGroundMesh(scene, {
    name: "ground",
    width: CONFIG.ground.width,
    height: CONFIG.ground.height,
    heightMapUrl: mainMapHeightMap,
    minHeight: -5,
    maxHeight: 30,
    subdivisions: 30,
    textureUrl: mainMapHeightMapTexture,
    position: new Vector3(0, 0, 0),
    receiveShadows: true,
    specularColor: new Color3(0, 0, 0),
    ambientColor: new Color3(1, 1, 1),
  });

  const wallHeight = 30;
  const wallConfig = {
    height: wallHeight,
    sideOrientation: Mesh.DOUBLESIDE,
  };

  const wallMaterial = new StandardMaterial("wallMat", scene);
  const grassProcText = new GrassProceduralTexture("grass", 600, scene);
  wallMaterial.ambientTexture = grassProcText;

  const wallsGroup = new Mesh("wallsGroup", scene);
  wallsGroup.isVisible = true;
  const groundCircle = MeshBuilder.CreateDisc(
    "groundCircle",
    { radius: 300, tessellation: 10 },
    scene
  );
  groundCircle.position = new Vector3(0, 2, 0);
  groundCircle.rotation.x = Angle.FromDegrees(90).radians();

  const circleGroundMat = new StandardMaterial("circleGroundMat", scene);
  const grassTexture = new GrassProceduralTexture("grassTexture", 1800, scene);
  circleGroundMat.diffuseTexture = grassTexture;
  circleGroundMat.specularColor = new Color3(0, 0, 0);
  circleGroundMat.ambientColor = new Color3(1, 1, 1);
  groundCircle.material = circleGroundMat;
  groundCircle.receiveShadows = true;
  groundCircle.parent = wallsGroup;

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
  if (isCameraAnimating.value) return;

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

  const buildingIndex = state.buildings.indexOf(clickedBuilding);
  const buildingConfig = CONFIG.buildings[buildingIndex];

  // Only handle interactible buildings
  if (!buildingConfig.interactible) {
    return;
  }

  // Clear hover state when clicking
  clearHover();

  // Animate camera to building
  animateCameraToBuilding(clickedBuilding);

  // Handle selection logic
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

  if (clickedBuilding.mesh.material instanceof StandardMaterial) {
    clickedBuilding.mesh.material.emissiveColor = Color3.Red();
    state.selectedBuilding = clickedBuilding;
  }
};

const initAudio = async (): Promise<void> => {
  state.audioEngine = await CreateAudioEngineAsync();
  state.backgroundMusic = await CreateStreamingSoundAsync(
    "backgroundAmbient",
    "/assets/sounds/background-ambient.mp3",
    { autoplay: true, loop: true, volume: 0 },
    state.audioEngine as AudioEngineV2
  );
};

watch(
  () => uiStore.musicVolume,
  (newVolume) => {
    if (state.backgroundMusic) {
      state.backgroundMusic.volume = newVolume / 100;
    }
  },
  {
    immediate: true,
  }
);
watch(
  () => uiStore.isMusicMuted,
  (isMuted) => {
    if (state.backgroundMusic) {
      state.backgroundMusic.volume = isMuted ? 0 : uiStore.musicVolume / 100;
    }
  },
  {
    immediate: true,
  }
);

const createBackgroundClouds = (scene: Scene): Mesh => {
  const cloudSphere = MeshBuilder.CreateSphere(
    "cloudSphere",
    { diameter: 600, segments: 20, arc: -0.5 },
    scene
  );
  cloudSphere.position = new Vector3(0, -20, 0);
  cloudSphere.rotation = new Vector3(Angle.FromDegrees(90).radians(), 0, 0);
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

  // Add cursor event listeners with proper event handling
  const pointerDownHandler = () => handlePointerDown(canvas);
  const pointerUpHandler = () => handlePointerUp(canvas);
  const pointerLeaveHandler = () => handlePointerLeave(canvas);
  const pointerMoveHandler = (e: PointerEvent) => handlePointerMove(canvas, e);

  canvas.addEventListener("pointerdown", pointerDownHandler);
  canvas.addEventListener("pointerup", pointerUpHandler);
  canvas.addEventListener("pointerleave", pointerLeaveHandler);
  canvas.addEventListener("pointermove", pointerMoveHandler);

  state.mainMapCamera = createCamera(state.scene, canvas);

  const light = new HemisphericLight(
    "light",
    new Vector3(15.124765396118164, 20.659635543823242, -13.0604829788208),
    state.scene
  );
  if (CONFIG.debug.lightGizmo) {
    setupLightGizmo(light, state.scene);
  }
  const ground = createGround(state.scene);

  await initAudio();
  // Create clouds
  const { createParticleClouds } = useClouds();
  state.clouds = createParticleClouds(state.scene);
  createBackgroundClouds(state.scene);

  // Create lake water
  const { createLakeWater } = useLakeWater();
  state.lakeWater = await createLakeWater(state.scene, state.audioEngine, {
    size: 78,
    subdivisions: 20,
    position: new Vector3(43.9, 3.2, -49.9),
    waveHeight: 0.2,
    bumpHeight: 0.8,
    waterColor: new Color3(0.1, 0.4, 0.8),
    colorBlendFactor: 0.5,
  });

  // Add reflection targets
  if (state.lakeWater) {
    state.lakeWater.addReflectionTarget(ground);
    if (state.clouds) {
      state.lakeWater.addReflectionTarget(state.clouds.emitter);
    }
  }

  // Load buildings, environments and animated models
  state.buildings = await createBuildings(state.scene);
  state.environments = await createEnvironments(state.scene);
  state.animatedModels = await createAnimatedModels(state.scene);

  // Add sun light and shadows
  addSunLight(state.scene, CONFIG.sunLight);

  // Show Inspector
  if (CONFIG.debug.inspector) {
    Inspector.Show(state.scene, {});
  }

  // Add pointer event listener with hover detection
  state.scene?.onPointerObservable.add((pointerInfo: PointerInfo) => {
    if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
      if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
        const pickedMesh = pointerInfo.pickInfo.pickedMesh;
        if (pickedMesh instanceof Mesh) {
          handleBuildingHover(pickedMesh, pointerInfo.event as PointerEvent);
        }
      } else {
        clearHover();
      }
    } else if (
      pointerInfo.type === PointerEventTypes.POINTERDOWN &&
      pointerInfo.pickInfo?.hit
    ) {
      const pickedMesh = pointerInfo.pickInfo.pickedMesh;
      if (pickedMesh && pickedMesh instanceof Mesh) {
        handleBuildingClick(pickedMesh);
      }
    }
  });

  createPostProcessing(state.scene, state.mainMapCamera);

  // Start render loop
  state.engine.runRenderLoop(() => {
    // Update orbital animation
    updateSunOrbit();

    state.scene?.render();
  });

  // Handle window resize
  const resizeHandler = () => {
    state.engine?.resize();
  };
  window.addEventListener("resize", resizeHandler);

  setTimeout(() => {
    uiStore.setLoading(false);
  }, 1);
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
  if (state.clouds) {
    state.clouds.dispose();
  }
  if (state.lakeWater) {
    state.lakeWater.dispose();
  }
  if (canvasRef.value) {
    const canvas = canvasRef.value;
    canvas.removeEventListener("pointerdown", () => handlePointerDown(canvas));
    canvas.removeEventListener("pointerup", () => handlePointerUp(canvas));
    canvas.removeEventListener("pointerleave", () =>
      handlePointerLeave(canvas)
    );
    canvas.removeEventListener("pointermove", (e: PointerEvent) =>
      handlePointerMove(canvas, e)
    );
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

.hover-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: translateY(-100%);
}
</style>
