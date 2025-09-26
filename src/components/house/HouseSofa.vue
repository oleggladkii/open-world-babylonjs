<template lang="pug">
div
  // Invisible component - sofa is created programmatically
  //- InteractionPrompt(
  //-   v-if="sofaMesh && isLoaded"
  //-   text="Press F to sit down"
  //-   :trigger-position="interactionPosition"
  //-   :trigger-radius="3"
  //-   :player-position="playerPosition"
  //-   :is-active="isActive"
  //-   key-binding="F"
  //-   @interact="handleSitDown"
  //- )
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Scene,
  Vector3,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  SceneLoader,
  Angle,
} from "@babylonjs/core";
// import { useLoadModel } from "@/composables/useLoadModel";
// import InteractionPrompt from "../InteractionPrompt.vue";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
  playerPosition?: Vector3 | null;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  playerPosition: null,
  isActive: true,
  addShadowCaster: undefined,
});

const emit = defineEmits<{
  sitDown: [position: Vector3];
}>();

// Refs
const sofaMesh = ref<Mesh | null>(null);
const isLoaded = ref(false);
const interactionPosition = ref(new Vector3(-5, 0.5, -7)); // Position in front of sofa

// Composable (removed unused loadModel)
// const { loadModel } = useLoadModel();

const loadSofa = async () => {
  if (!props.scene) {
    console.warn("Scene not available for sofa loading");
    return;
  }

  try {
    console.log("Loading sofa model...");

    // Load the sofa model
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "/assets/models/house/",
      "modern_gray_sofa__3d_model.glb",
      props.scene,
    );

    if (result.meshes && result.meshes.length > 0) {
      // Find the root mesh (usually has no parent or is the first mesh)
      let rootMesh = result.meshes.find((mesh) => !mesh.parent) as Mesh;
      if (!rootMesh) {
        rootMesh = result.meshes[0] as Mesh;
      }
      sofaMesh.value = rootMesh;

      console.log("Sofa loaded with", result.meshes.length, "meshes");

      // Position and rotate the sofa in the first room next to carpet
      // Carpet is at (-5, 0.01, -4) with size 4x5
      rootMesh.position.set(-1.5, 0.9, -4); // West of carpet, facing towards it
      rootMesh.scaling.setAll(4);

      // Apply rotation to all meshes using rotate method (this works!)
      result.meshes.forEach((mesh) => {
        if (mesh instanceof Mesh) {
          mesh.rotate(Vector3.Up(), Angle.FromDegrees(45).radians()); // Face towards carpet
        }
      });

      // Create a simple box impostor for collision that covers the sofa area
      const sofaCollisionBox = MeshBuilder.CreateBox(
        "sofaCollision",
        { width: 2, height: 6, depth: 4.5 }, // Scaled dimensions for 4x sofa
        props.scene,
      );
      sofaCollisionBox.position.copyFrom(rootMesh.position);
      sofaCollisionBox.position.y += 2; // Center the collision box (half of height 4/2 = 2)
      sofaCollisionBox.isVisible = false; // Make it invisible

      // Add physics impostor to the collision box
      sofaCollisionBox.physicsImpostor = new PhysicsImpostor(
        sofaCollisionBox,
        PhysicsImpostor.BoxImpostor,
        {
          mass: 0, // Static object (won't fall due to gravity)
          // mass: 50, // Uncomment this and comment line above if you want sofa to fall with physics
          friction: 0.8,
          restitution: 0,
        },
        props.scene,
      );

      // Enable shadow casting and receiving for all meshes
      result.meshes.forEach((mesh) => {
        if (mesh instanceof Mesh) {
          // Shadows disabled for performance
          // mesh.receiveShadows = true;
          // if (props.addShadowCaster) {
          //   props.addShadowCaster(mesh);
          // }
        }
      });

      // Update interaction position to be in front of the sofa (90° rotation means front is to the east)
      interactionPosition.value = new Vector3(-5, 0.5, -7); // In front of sofa (east side after 90° rotation)

      isLoaded.value = true;
      console.log("Sofa loaded and positioned successfully");
    } else {
      console.error("No meshes found in sofa model");
    }
  } catch (error) {
    console.error("Error loading sofa model:", error);
  }
};

const handleSitDown = () => {
  if (sofaMesh.value) {
    // Calculate sitting position on the sofa
    const sittingPosition = sofaMesh.value.position.clone();
    sittingPosition.y += 0.8; // Sit on top of sofa
    sittingPosition.z += 0.5; // Slightly forward on the sofa

    emit("sitDown", sittingPosition);
    console.log("Player sitting on sofa at position:", sittingPosition);
  }
};

const cleanup = () => {
  if (sofaMesh.value) {
    sofaMesh.value.dispose();
    sofaMesh.value = null;
  }
  isLoaded.value = false;
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene && !isLoaded.value) {
      loadSofa();
    } else if (!newScene) {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene && !isLoaded.value) {
    loadSofa();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export for parent component access
defineExpose({
  sofaMesh: () => sofaMesh.value,
  isLoaded: () => isLoaded.value,
  cleanup,
});
</script>

<style scoped>
/* No visual styling needed - sofa is a 3D object */
</style>
