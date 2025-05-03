<template lang="pug">
div
  canvas(ref="canvasRef", style="width: 100%; height: 100vh")
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
  ActionManager,
  ExecuteCodeAction,
  Animation,
  Mesh,
  Texture,
  CubicEase,
  Vector4,
} from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials";
import grassTexture from "@/assets/textures/grass.jpg";
import officeBuildingTexture from "@/assets/textures/office-building-texture.png";
import mainMapHeightMap from "@/assets/textures/main-map-height-map.png";
import mainMapHeightMapTexture from "@/assets/textures/main-map-height-map-texture.png";

const props = defineProps<{
  isThirdPersonView: boolean;
}>();
const emit = defineEmits<{
  (e: "update:isThirdPersonView", value: boolean): void;
  (e: "setTargetPosition", position: Vector3): void;
}>();

// Reset camera to initial position
watch(
  () => props.isThirdPersonView,
  (newV) => {
    if (!newV && state.rtsCamera) {
      state.rtsCamera.position = new Vector3(0, CONFIG.camera.initialRadius, 0);
      state.rtsCamera.alpha = -Math.PI / 1.7;
      state.rtsCamera.beta = Math.PI / 3;
      state.rtsCamera.radius = CONFIG.camera.initialRadius;
    }
  }
);

// Constants and configuration
const CONFIG = {
  ground: {
    width: 200,
    height: 200,
    textureUrl: grassTexture,
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
  buildings: {
    count: 3,
    sizes: [
      { width: 17, depth: 10, height: 6 },
      { width: 20, depth: 30, height: 7 },
      { width: 13, depth: 17, height: 20 },
    ],
    spacing: 15,
    baseColor: new Color3(0.6, 0.6, 0.6),
    highlightColors: [
      new Color3(0.2, 0.8, 0.2),
      new Color3(0.8, 0.2, 0.2),
      new Color3(0.2, 0.2, 0.8),
    ],
  },
} as const;
const BUILDING_POSITIONS = [
  new Vector3(28, CONFIG.buildings.sizes[0].height / 2 + 5, 4),
  new Vector3(-40, CONFIG.buildings.sizes[0].height / 2 + 7, 10),
  new Vector3(9, CONFIG.buildings.sizes[0].height / 2 + 12, 21),
];

// Interfaces
interface SceneState {
  engine: Engine | null;
  scene: Scene | null;
  rtsCamera: ArcRotateCamera | null;
  currentCamera: ArcRotateCamera | null;
  buildings: Mesh[];
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

const animateCameraTransition = (
  startPos: Vector3,
  targetPos: Vector3,
  duration: number,
  onComplete: () => void
): void => {
  if (!state.scene) return;

  // Create camera position animation
  const positionAnimation = new Animation(
    "cameraTransition",
    "position",
    60,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const keys = [
    { frame: 0, value: startPos },
    { frame: 60, value: targetPos },
  ];

  positionAnimation.setKeys(keys);

  // Create fade animation
  const fadeAnimation = new Animation(
    "fadeTransition",
    "alpha",
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  const fadeKeys = [
    { frame: 0, value: 1 }, // Full visibility
    { frame: 20, value: 0.8 }, // Slight fade
    { frame: 40, value: 0.4 }, // Moderate fade
    { frame: 50, value: 0.2 }, // Strong fade
    { frame: 60, value: 0 }, // Complete darkness
  ];

  fadeAnimation.setKeys(fadeKeys);

  // Add easing functions for smoother animation
  fadeAnimation.setEasingFunction(new CubicEase());
  positionAnimation.setEasingFunction(new CubicEase());

  if (state.rtsCamera) {
    // Add both animations to the camera
    state.rtsCamera.animations = [positionAnimation, fadeAnimation];

    // Start the animation
    state.scene.beginAnimation(state.rtsCamera, 0, 60, false, 1, () => {
      // Call the completion callback
      onComplete();
    });
  }
};

const transitionToThirdPerson = (targetPos: Vector3): void => {
  if (!state.rtsCamera) return;

  const startPos = state.rtsCamera.position;
  const targetCameraPos = new Vector3(targetPos.x, 2, targetPos.z);

  emit("setTargetPosition", targetPos);

  animateCameraTransition(startPos, targetCameraPos, 1500, () => {
    emit("update:isThirdPersonView", true);
  });
};

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

const createBuilding = (scene: Scene, index: number): Mesh => {
  const box = MeshBuilder.CreateBox(`building-${index}`, {
    ...CONFIG.buildings.sizes[index],
    faceUV: [
      new Vector4(0, 0, 1, 1),
      new Vector4(0, 0, 1, 1),
      new Vector4(0, 0, 1, 1),
      new Vector4(0, 0, 1, 1),
      new Vector4(0, 0, 0, 0),
      new Vector4(0, 0, 0, 0),
      new Vector4(0, 0, 0, 0),
    ],
  });

  // Center the buildings by calculating the total width and offset
  box.position = BUILDING_POSITIONS[index];
  const mat = new StandardMaterial(`mat-${index}`, scene);
  mat.diffuseTexture = new Texture(officeBuildingTexture);
  box.material = mat;

  setupBuildingInteractions(box, mat, index, scene);

  return box;
};

const setupBuildingInteractions = (
  building: Mesh,
  material: StandardMaterial,
  index: number,
  scene: Scene
): void => {
  building.actionManager = new ActionManager(scene);

  const currentIndex = index; // Capture the index in closure

  building.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
      material.emissiveColor = CONFIG.buildings.highlightColors[currentIndex];
    })
  );

  building.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
      material.emissiveColor = Color3.Black();
    })
  );

  building.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
      transitionToThirdPerson(building.position);
    })
  );
};

const createBuildings = (scene: Scene): Mesh[] => {
  return Array.from({ length: CONFIG.buildings.count }, (_, i) =>
    createBuilding(scene, i)
  );
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
      subdivisions: 10,
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

  // createGroundGrid(scene);
  return ground;
};

const createScene = (): void => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  state.engine = new Engine(canvas, true);
  state.scene = new Scene(state.engine);

  // Create scene elements
  state.rtsCamera = createCamera(state.scene, canvas);
  state.currentCamera = state.rtsCamera;

  new HemisphericLight("light", new Vector3(0, 1, 0), state.scene);
  createGround(state.scene);
  state.buildings = createBuildings(state.scene);

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
    building.dispose();
  });

  if (state.scene) {
    state.scene.dispose();
  }

  window.removeEventListener("resize", () => {
    state.engine?.resize();
  });
};

onMounted(() => {
  createScene();
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
