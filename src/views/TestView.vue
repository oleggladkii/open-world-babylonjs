<template lang="pug">
canvas(ref="canvasRef", style="width: 100%; height: 100vh")
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color4,
  Color3,
  MeshBuilder,
  StandardMaterial,
  CubeTexture,
  Texture,
  Tools,
  SceneLoader,
  Matrix,
  AbstractEngine,
  HemisphericLight,
  Angle,
  DirectionalLight,
} from "@babylonjs/core";
import { GLTFFileLoader } from "@babylonjs/loaders/glTF";
import { ColorGradingTexture } from "@babylonjs/core/Materials/Textures/colorGradingTexture";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const engine = ref<Engine | null>(null);
const scene = ref<Scene | null>(null);

const createScene = (): void => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  engine.value = new Engine(canvas, true);
  scene.value = new Scene(engine.value);

  // Create camera
  const camera = new ArcRotateCamera(
    "ArcRotateCamera",
    Angle.FromDegrees(290).radians(),
    Angle.FromDegrees(60).radians(),
    65,
    new Vector3(0, 17, 0),
    scene.value
  );
  camera.attachControl(canvas, true);

  // Add lights
  const hemisphericLight = new HemisphericLight(
    "hemisphericLight",
    new Vector3(0, 1, 0),
    scene.value
  );
  hemisphericLight.intensity = 0.7;

  const directionalLight = new DirectionalLight(
    "directionalLight",
    new Vector3(-1, -2, -1),
    scene.value
  );
  directionalLight.intensity = 0.5;

  // Load tooth model
  SceneLoader.ImportMesh(
    "",
    "/assets/models/",
    "tooth.glb",
    scene.value,
    (meshes) => {
      // Center the model
      const rootMesh = meshes[0];
      rootMesh.position = new Vector3(0, 20, 0);

      // Scale the model if needed
      rootMesh.scaling = new Vector3(1, 1, 1);
    }
  );

  // Start render loop
  engine.value.runRenderLoop(() => {
    scene.value?.render();
  });

  // Handle window resize
  window.addEventListener("resize", () => {
    engine.value?.resize();
  });
};

const cleanupScene = (): void => {
  if (engine.value) {
    engine.value.dispose();
  }
  if (scene.value) {
    scene.value.dispose();
  }
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
