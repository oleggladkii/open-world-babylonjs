<template lang="pug">
div
  // Invisible component - table is created programmatically
  HouseApple(
    v-if="props.scene && isLoaded"
    :scene="props.scene"
    :add-shadow-caster="props.addShadowCaster"
    :player-position="props.playerPosition"
    :is-active="props.isActive"
  )
  //- InteractionPrompt(
  //-   v-if="tableMesh && isLoaded"
  //-   text="Press E to use table"
  //-   :trigger-position="interactionPosition"
  //-   :trigger-radius="2"
  //-   :player-position="playerPosition"
  //-   :is-active="isActive"
  //-   key-binding="E"
  //-   @interact="handleUseTable"
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
  StandardMaterial,
  Color3,
  VideoTexture,
  Angle,
} from "@babylonjs/core";
import { useLoadModel } from "../../composables/useLoadModel";
import HouseApple from "./HouseApple.vue";
// import InteractionPrompt from "../InteractionPrompt.vue";

interface Props {
  scene: Scene | null;
  addShadowCaster?: (mesh: Mesh) => void;
  playerPosition?: Vector3 | null;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  addShadowCaster: undefined,
  playerPosition: null,
  isActive: false,
});

const emit = defineEmits<{
  useTable: [position: Vector3];
}>();

// Performance: Disable video for better FPS (set to false to improve performance)
const ENABLE_TV_VIDEO = true; // Set to false to disable video and improve FPS significantly

// Refs
const tableMesh = ref<Mesh | null>(null);
const televisionMesh = ref<Mesh | null>(null);
const screenPlane = ref<Mesh | null>(null);
const videoTexture = ref<VideoTexture | null>(null);
const isLoaded = ref(false);
const interactionPosition = ref(new Vector3(-4.5, 0.5, -2.25)); // Position in front of table
const { loadModel } = useLoadModel();

const createTable = () => {
  if (!props.scene) {
    console.warn("Scene not available for table creation");
    return;
  }

  try {
    // Create brown material for table legs (wood-like)
    const brownMaterial = new StandardMaterial("tableLegMaterial", props.scene);
    brownMaterial.diffuseColor = new Color3(0.6, 0.4, 0.2); // Brown wood color
    brownMaterial.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular for matte finish
    brownMaterial.zOffset = -1; // Prevent z-fighting with floor

    // Create transparent glass material for table top
    const glassMaterial = new StandardMaterial("tableTopMaterial", props.scene);
    glassMaterial.diffuseColor = new Color3(0.9, 0.9, 1.0); // Slight blue tint
    glassMaterial.specularColor = new Color3(1.0, 1.0, 1.0); // High specular for glass
    glassMaterial.alpha = 0.3; // Transparent
    glassMaterial.backFaceCulling = false; // Show both sides
    glassMaterial.zOffset = 1; // Render glass on top

    // Table dimensions
    const tableHeight = 0.75; // Зменшуємо висоту столу
    const tableTopWidth = 1.2;
    const tableTopDepth = 2;
    const tableTopThickness = 0.1;
    const legWidth = 0.1;
    const legHeight = tableHeight - tableTopThickness;

    // Create table top
    const tableTop = MeshBuilder.CreateBox(
      "tableTop",
      {
        width: tableTopWidth,
        height: tableTopThickness,
        depth: tableTopDepth,
      },
      props.scene,
    );
    tableTop.position.set(-4.5, tableHeight - tableTopThickness / 2, -2.25);
    tableTop.material = glassMaterial;

    // Create 4 legs
    const legPositions = [
      {
        x: -tableTopWidth / 2 + legWidth / 2,
        z: -tableTopDepth / 2 + legWidth / 2,
      }, // Front left
      {
        x: tableTopWidth / 2 - legWidth / 2,
        z: -tableTopDepth / 2 + legWidth / 2,
      }, // Front right
      {
        x: -tableTopWidth / 2 + legWidth / 2,
        z: tableTopDepth / 2 - legWidth / 2,
      }, // Back left
      {
        x: tableTopWidth / 2 - legWidth / 2,
        z: tableTopDepth / 2 - legWidth / 2,
      }, // Back right
    ];

    const legs: Mesh[] = [];
    legPositions.forEach((pos, index) => {
      const leg = MeshBuilder.CreateBox(
        `tableLeg${index + 1}`,
        {
          width: legWidth,
          height: 1,
          depth: legWidth,
        },
        props.scene!,
      );
      leg.position.set(-4.5 + pos.x, 0.25, -2.25 + pos.z);
      leg.material = brownMaterial;
      legs.push(leg);
    });

    // Merge all table parts into one mesh
    const allTableParts = [tableTop, ...legs];
    const mergedTable = Mesh.MergeMeshes(
      allTableParts,
      true,
      true,
      undefined,
      false,
      true,
    );

    if (mergedTable) {
      mergedTable.name = "redTable";
      tableMesh.value = mergedTable;

      // Add physics impostor for collision
      mergedTable.physicsImpostor = new PhysicsImpostor(
        mergedTable,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.8, restitution: 0 },
        props.scene,
      );

      // Shadows disabled for performance
      // mergedTable.receiveShadows = true;
      // if (props.addShadowCaster) {
      //   props.addShadowCaster(mergedTable);
      // }

      isLoaded.value = true;
      console.log("Red table created successfully");

      // Load television after table is created
      loadTelevision();
    }
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

const addVideoToTV = () => {
  if (!props.scene || !ENABLE_TV_VIDEO) {
    console.log("TV video disabled for performance");
    return;
  }

  try {
    // Create video element with performance optimizations
    const videoElement = document.createElement("video");
    videoElement.src = "/assets/videos/tv-placeholder.mp4";
    videoElement.loop = true;
    videoElement.muted = true; // Muted for autoplay
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    
    // Performance optimizations for video
    videoElement.width = 256; // Reduce video resolution for better performance
    videoElement.height = 144; // 16:9 ratio at lower quality
    videoElement.playbackRate = 1.0; // Normal speed

    // Create video texture with performance settings
    videoTexture.value = new VideoTexture(
      "tvVideoTexture",
      videoElement,
      props.scene,
      false, // Not inverted
      false, // Not mirrored
      VideoTexture.TRILINEAR_SAMPLINGMODE, // Better quality filtering
      {
        autoPlay: true,
        autoUpdateTexture: true,
      },
    );

    videoTexture.value.uScale = -1;
    
    // Performance: Update video texture less frequently
    videoTexture.value.updateSamplingMode(VideoTexture.BILINEAR_SAMPLINGMODE); // Lower quality = better FPS
    
    // Create a rectangular plane for the TV screen
    screenPlane.value = MeshBuilder.CreatePlane(
      "tvScreen",
      {
        width: 1.825, // Screen width
        height: 1.14, // Screen height (16:9 aspect ratio)
      },
      props.scene,
    );

    // Position the screen plane in front of the TV
    screenPlane.value.position.set(-9.1, 1.69, -4.48); // Slightly in front of TV
    screenPlane.value.rotation.y = Angle.FromDegrees(90).radians();

    // Create material for the screen
    const screenMaterial = new StandardMaterial(
      "tvScreenMaterial",
      props.scene,
    );
    screenMaterial.diffuseTexture = videoTexture.value;
    screenMaterial.emissiveTexture = videoTexture.value; // Make it glow
    screenMaterial.emissiveColor = new Color3(0.8, 0.8, 0.8); // Bright emission
    screenMaterial.backFaceCulling = false; // Show both sides

    // Apply material to screen plane
    screenPlane.value.material = screenMaterial;

    // Add physics impostor for collision with apple
    screenPlane.value.physicsImpostor = new PhysicsImpostor(
      screenPlane.value,
      PhysicsImpostor.BoxImpostor,
      { mass: 0, friction: 0.8, restitution: 0.3 },
      props.scene,
    );

    // Start playing the video
    videoElement.play().catch((error) => {
      console.warn("Video autoplay failed:", error);
    });

    console.log("Video screen plane created successfully");
  } catch (error) {
    console.error("Error adding video to TV:", error);
  }
};

const loadTelevision = async () => {
  if (!props.scene) return;

  try {
    const loadedModel = await loadModel(props.scene, {
      fileName: "digital_television.glb",
      rootUrl: "/assets/models/house/",
      position: new Vector3(-9.2, 0.91, -4.4), // On top of the table
      rotation: new Vector3(0, Math.PI / 2, 0), // Rotated 90 degrees
      scaling: new Vector3(0.2, 0.2, 0.2), // Scale down to fit on table
      castShadows: false, // Disable shadows for performance
      receiveShadows: false,
      useCache: true,
      optimizeMesh: true,
      name: "digitalTelevision",
    });

    if (loadedModel && loadedModel.meshes.length > 0) {
      // Store the main mesh
      televisionMesh.value = loadedModel.meshes[0] as Mesh;

      // Add physics impostor for collision
      if (televisionMesh.value) {
        televisionMesh.value.physicsImpostor = new PhysicsImpostor(
          televisionMesh.value,
          PhysicsImpostor.BoxImpostor,
          { mass: 0, friction: 0.8, restitution: 0 },
          props.scene,
        );
      }

      // Add video to TV screen
      addVideoToTV();

      console.log("Digital television loaded successfully");
    }
  } catch (error) {
    console.error("Error loading television:", error);
  }
};

const handleUseTable = () => {
  if (tableMesh.value) {
    emit("useTable", tableMesh.value.position.clone());
  }
};

const cleanup = () => {
  if (tableMesh.value) {
    if (tableMesh.value.physicsImpostor) {
      tableMesh.value.physicsImpostor.dispose();
    }
    tableMesh.value.dispose();
    tableMesh.value = null;
  }

  if (televisionMesh.value) {
    if (televisionMesh.value.physicsImpostor) {
      televisionMesh.value.physicsImpostor.dispose();
    }
    televisionMesh.value.dispose();
    televisionMesh.value = null;
  }

  if (screenPlane.value) {
    if (screenPlane.value.physicsImpostor) {
      screenPlane.value.physicsImpostor.dispose();
    }
    screenPlane.value.dispose();
    screenPlane.value = null;
  }

  // Dispose video texture
  if (videoTexture.value) {
    videoTexture.value.dispose();
    videoTexture.value = null;
  }

  isLoaded.value = false;
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createTable();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.scene) {
    createTable();
  }
});

onUnmounted(() => {
  cleanup();
});

// Export for other components
defineExpose({
  tableMesh,
  televisionMesh,
  isLoaded,
  cleanup,
});
</script>
