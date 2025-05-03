<template lang="pug">
canvas(ref="canvasRef", style="width: 100%; height: 100vh")
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  FreeCamera,
  Texture,
} from "@babylonjs/core";
import grassTexture from "@/assets/textures/grass.jpg";

const props = defineProps<{
  isThirdPersonView: boolean;
}>();
const emit = defineEmits<{
  (e: "exit"): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const engine = ref<Engine | null>(null);
const scene = ref<Scene | null>(null);
const camera = ref<FreeCamera | null>(null);

const CONFIG = {
  ground: {
    width: 50,
    height: 50,
    textureUrl: grassTexture,
  },
  camera: {
    height: 3,
    moveSpeed: 2,
  },
} as const;

const createCamera = (scene: Scene, canvas: HTMLCanvasElement): FreeCamera => {
  const camera = new FreeCamera(
    "BuildingCamera",
    new Vector3(0, CONFIG.camera.height, 0),
    scene
  );

  // Speed and sensitivity settings
  camera.speed = 0.5;
  camera.angularSensibility = 1000;
  camera.inertia = 0.3;
  camera.noRotationConstraint = true;

  // Add Escape key handler for exit
  const handleEscape = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      emit("exit");
    }
  };

  window.addEventListener("keydown", handleEscape);

  // Collision and gravity settings
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.ellipsoid = new Vector3(1, 2, 1);
  camera.ellipsoidOffset = new Vector3(0, 1, 0);

  // Camera constraints
  camera.minZ = 0.1;
  camera.maxZ = 1000;

  // Setup input handling
  camera.keysUp = [87]; // W
  camera.keysDown = [83]; // S
  camera.keysLeft = [65]; // A
  camera.keysRight = [68]; // D

  // Setup mouse movement
  camera.attachControl(canvas, true);

  return camera;
};

const createScene = (): void => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  engine.value = new Engine(canvas, true);
  scene.value = new Scene(engine.value);

  // Enable gravity and collisions
  scene.value.gravity = new Vector3(0, -0.9, 0);
  scene.value.collisionsEnabled = true;

  // Create ground
  const ground = MeshBuilder.CreateGround(
    "ground",
    {
      width: CONFIG.ground.width,
      height: CONFIG.ground.height,
    },
    scene.value
  );
  ground.position.y = 0;
  ground.checkCollisions = true;
  ground.receiveShadows = true;

  // Ground texture
  const groundMat = new StandardMaterial("groundMat", scene.value);
  try {
    const texture = new Texture(CONFIG.ground.textureUrl, scene.value);
    texture.uScale = 5;
    texture.vScale = 5;
    groundMat.diffuseTexture = texture;
  } catch (error) {
    console.error("Failed to load ground texture:", error);
    groundMat.diffuseColor = new Color3(0.2, 0.8, 0.2);
  }
  ground.material = groundMat;

  // Create camera
  camera.value = createCamera(scene.value, canvas);
  camera.value.position = new Vector3(0, CONFIG.camera.height, 0);

  // Setup lighting
  new HemisphericLight("light", new Vector3(0, 1, 0), scene.value);

  // Start render loop
  engine.value.runRenderLoop(() => {
    scene.value?.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    engine.value?.resize();
  });
};

watch(
  () => props.isThirdPersonView,
  () => {
    nextTick(() => {
      engine.value?.resize();
    });
  },
  {
    immediate: true,
  }
);

const cleanupScene = (): void => {
  if (engine.value) {
    engine.value.dispose();
  }

  if (scene.value) {
    scene.value.dispose();
  }

  // Remove event listeners
  window.removeEventListener("resize", () => {
    engine.value?.resize();
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
