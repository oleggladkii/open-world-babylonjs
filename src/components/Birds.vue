<template>
  <div></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Scene, Vector3, AbstractMesh } from "@babylonjs/core";
import { useLoadModel } from "@/composables/useLoadModel";

interface Props {
  scene: Scene;
  addShadowCaster: (mesh: AbstractMesh) => void;
}

const props = defineProps<Props>();

const { loadModel } = useLoadModel();

let birdsMesh: AbstractMesh | null = null;
const animationTime = ref(0);

// Circular flight parameters
const flightRadius = 30; // Radius of the circular flight path
const flightHeight = 19; // Height above ground
const flightSpeed = 0.01; // Speed of circular movement

const createBirds = async () => {
  if (!props.scene) return;

  try {
    const birdsResult = await loadModel(props.scene, {
      fileName: "birds.glb",
      rootUrl: "/assets/models/animations/",
      position: new Vector3(flightRadius, flightHeight, 0),
      scaling: new Vector3(3, 3, 3),
      rotation: new Vector3(0, 180, 0),
      name: "birds",
      autoPlayAnimations: true,
      animationSpeed: 0.5,
      loopAnimations: true,
    });

    if (birdsResult && birdsResult.meshes.length > 0) {
      // Get the main birds mesh
      birdsMesh = birdsResult.meshes[0];

      // Enable shadow casting
      props.addShadowCaster(birdsMesh);

      // Start circular flight animation
      startCircularFlight();
    }
  } catch (error) {
    console.error("Error loading birds model:", error);
  }
};
const startCircularFlight = () => {
  if (!birdsMesh || !props.scene) return;
  const renderObserver = props.scene.onBeforeRenderObservable.add(() => {
    if (birdsMesh) {
      animationTime.value += flightSpeed;
      const x = Math.cos(animationTime.value) * flightRadius;
      const z = Math.sin(animationTime.value) * flightRadius;

      birdsMesh.position.x = x;
      birdsMesh.position.y = flightHeight;
      birdsMesh.position.z = z;

      const rotationAngle = (Math.PI - animationTime.value) % (Math.PI * 2);
      birdsMesh.rotation.y = rotationAngle;
    }
  });
};

onMounted(() => {
  createBirds();
});

onUnmounted(() => {
  // Clean up
  if (birdsMesh) {
    if ((birdsMesh as any)._circularFlightObserver) {
      props.scene.onBeforeRenderObservable.remove(
        (birdsMesh as any)._circularFlightObserver,
      );
    }
    birdsMesh.dispose();
    birdsMesh = null;
  }
});
</script>
