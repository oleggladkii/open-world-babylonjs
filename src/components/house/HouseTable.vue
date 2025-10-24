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
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
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
  playerPosition?: Vector3 | null;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  playerPosition: null,
  isActive: false,
});

const emit = defineEmits<{
  useTable: [position: Vector3];
}>();

// Performance: Disable video for better FPS (set to false to improve performance)
const ENABLE_TV_VIDEO = true; // Set to false to disable video and improve FPS significantly

// Table configuration - memoized
const TABLE_CONFIG = computed(() => ({
  position: new Vector3(-4.5, 0, -2.25),
  dimensions: {
    height: 0.75,
    topWidth: 1.2,
    topDepth: 2,
    topThickness: 0.1,
    legWidth: 0.1,
  },
  television: {
    position: new Vector3(-9.2, 0.91, -4.4),
    rotation: new Vector3(0, Math.PI / 2, 0),
    scaling: new Vector3(0.2, 0.2, 0.2),
  },
  screen: {
    position: new Vector3(-9.1, 1.69, -4.48),
    width: 1.825,
    height: 1.14,
  },
  video: {
    width: 256,
    height: 144,
    src: "/assets/videos/tv-placeholder.mp4",
  },
}));

// Material cache to prevent memory leaks
const materialCache = ref<{
  brown: StandardMaterial | null;
  glass: StandardMaterial | null;
  screen: StandardMaterial | null;
}>({
  brown: null,
  glass: null,
  screen: null,
});

// Video cache
const videoCache = ref<{
  element: HTMLVideoElement | null;
  texture: VideoTexture | null;
}>({
  element: null,
  texture: null,
});

// Refs
const tableMesh = ref<Mesh | null>(null);
const televisionMesh = ref<Mesh | null>(null);
const screenPlane = ref<Mesh | null>(null);
const isLoaded = ref(false);
const interactionPosition = ref(new Vector3(-4.5, 0.5, -2.25)); // Position in front of table
const { loadModel } = useLoadModel();

// Create and cache materials
const createMaterials = (): {
  brown: StandardMaterial;
  glass: StandardMaterial;
} => {
  if (!props.scene) throw new Error("Scene not available");

  // Return cached materials if they exist
  if (materialCache.value.brown && materialCache.value.glass) {
    return {
      brown: materialCache.value.brown as StandardMaterial,
      glass: materialCache.value.glass as StandardMaterial,
    };
  }

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

  // Cache materials
  materialCache.value = {
    brown: brownMaterial,
    glass: glassMaterial,
    screen: materialCache.value.screen, // Keep existing screen material
  };

  return { brown: brownMaterial, glass: glassMaterial };
};

// Create table top
const createTableTop = (materials: { glass: StandardMaterial }): Mesh => {
  const config = TABLE_CONFIG.value;
  
  const tableTop = MeshBuilder.CreateBox(
    "tableTop",
    {
      width: config.dimensions.topWidth,
      height: config.dimensions.topThickness,
      depth: config.dimensions.topDepth,
    },
    props.scene!,
  );
  tableTop.position.set(
    config.position.x,
    config.dimensions.height - config.dimensions.topThickness / 2,
    config.position.z,
  );
  tableTop.material = materials.glass;

  return tableTop;
};

// Create table legs
const createTableLegs = (materials: { brown: StandardMaterial }): Mesh[] => {
  const config = TABLE_CONFIG.value;
  const legs: Mesh[] = [];

  const legPositions = [
    {
      x: -config.dimensions.topWidth / 2 + config.dimensions.legWidth / 2,
      z: -config.dimensions.topDepth / 2 + config.dimensions.legWidth / 2,
    }, // Front left
    {
      x: config.dimensions.topWidth / 2 - config.dimensions.legWidth / 2,
      z: -config.dimensions.topDepth / 2 + config.dimensions.legWidth / 2,
    }, // Front right
    {
      x: -config.dimensions.topWidth / 2 + config.dimensions.legWidth / 2,
      z: config.dimensions.topDepth / 2 - config.dimensions.legWidth / 2,
    }, // Back left
    {
      x: config.dimensions.topWidth / 2 - config.dimensions.legWidth / 2,
      z: config.dimensions.topDepth / 2 - config.dimensions.legWidth / 2,
    }, // Back right
  ];

  legPositions.forEach((pos, index) => {
    const leg = MeshBuilder.CreateBox(
      `tableLeg${index + 1}`,
      {
        width: config.dimensions.legWidth,
        height: 1,
        depth: config.dimensions.legWidth,
      },
      props.scene!,
    );
    leg.position.set(
      config.position.x + pos.x,
      0.25,
      config.position.z + pos.z,
    );
    leg.material = materials.brown;
    legs.push(leg);
  });

  return legs;
};

const createTable = () => {
  if (!props.scene) {
    console.warn("Scene not available for table creation");
    return;
  }

  try {
    // Create and cache materials
    const materials = createMaterials();

    // Create table parts
    const tableTop = createTableTop(materials);
    const legs = createTableLegs(materials);

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

      isLoaded.value = true;
      console.log("Red table created successfully");

      // Load television after table is created
      loadTelevision();
    }
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

// Create and cache video resources
const createVideoResources = (): {
  element: HTMLVideoElement;
  texture: VideoTexture;
} => {
  if (!props.scene) throw new Error("Scene not available");

  // Return cached resources if they exist
  if (videoCache.value.element && videoCache.value.texture) {
    return {
      element: videoCache.value.element,
      texture: videoCache.value.texture as VideoTexture,
    };
  }

  const config = TABLE_CONFIG.value;

  // Create video element with performance optimizations
  const videoElement = document.createElement("video");
  videoElement.src = config.video.src;
  videoElement.loop = true;
  videoElement.muted = true; // Muted for autoplay
  videoElement.autoplay = true;
  videoElement.playsInline = true;

  // Performance optimizations for video
  videoElement.width = config.video.width;
  videoElement.height = config.video.height;
  videoElement.playbackRate = 1.0; // Normal speed

  // Create video texture with performance settings
  const videoTexture = new VideoTexture(
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

  videoTexture.uScale = -1;

  // Performance: Update video texture less frequently
  videoTexture.updateSamplingMode(VideoTexture.BILINEAR_SAMPLINGMODE); // Lower quality = better FPS

  // Cache resources
  videoCache.value = {
    element: videoElement,
    texture: videoTexture,
  };

  return { element: videoElement, texture: videoTexture };
};

// Create screen material
const createScreenMaterial = (videoTexture: VideoTexture): StandardMaterial => {
  if (!props.scene) throw new Error("Scene not available");

  // Return cached material if it exists
  if (materialCache.value.screen) {
    return materialCache.value.screen as StandardMaterial;
  }

  const screenMaterial = new StandardMaterial("tvScreenMaterial", props.scene);
  screenMaterial.diffuseTexture = videoTexture;
  screenMaterial.emissiveTexture = videoTexture; // Make it glow
  screenMaterial.emissiveColor = new Color3(0.8, 0.8, 0.8); // Bright emission
  screenMaterial.backFaceCulling = false; // Show both sides

  // Cache material
  materialCache.value.screen = screenMaterial;

  return screenMaterial;
};

// Create screen plane
const createScreenPlane = (): Mesh => {
  const config = TABLE_CONFIG.value;

  const screenPlane = MeshBuilder.CreatePlane(
    "tvScreen",
    {
      width: config.screen.width,
      height: config.screen.height,
    },
    props.scene!,
  );

  // Position the screen plane in front of the TV
  screenPlane.position.set(
    config.screen.position.x,
    config.screen.position.y,
    config.screen.position.z,
  );
  screenPlane.rotation.y = Angle.FromDegrees(90).radians();

  return screenPlane;
};

const addVideoToTV = () => {
  if (!props.scene || !ENABLE_TV_VIDEO) {
    console.log("TV video disabled for performance");
    return;
  }

  try {
    // Create and cache video resources
    const { element: videoElement, texture: videoTexture } = createVideoResources();

    // Create screen plane
    screenPlane.value = createScreenPlane();

    // Create screen material
    const screenMaterial = createScreenMaterial(videoTexture);

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
    const config = TABLE_CONFIG.value;
    
    const loadedModel = await loadModel(props.scene, {
      fileName: "digital_television.glb",
      rootUrl: "/assets/models/house/",
      position: config.television.position,
      rotation: config.television.rotation,
      scaling: config.television.scaling,
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

// Debounce utility
const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number,
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
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

  isLoaded.value = false;
};

// Cleanup materials and video resources
const cleanupResources = () => {
  // Cleanup materials
  if (materialCache.value.brown) {
    materialCache.value.brown.dispose();
  }
  if (materialCache.value.glass) {
    materialCache.value.glass.dispose();
  }
  if (materialCache.value.screen) {
    materialCache.value.screen.dispose();
  }
  materialCache.value = { brown: null, glass: null, screen: null };

  // Cleanup video resources
  if (videoCache.value.texture) {
    videoCache.value.texture.dispose();
  }
  if (videoCache.value.element) {
    videoCache.value.element.pause();
    videoCache.value.element.src = "";
  }
  videoCache.value = { element: null, texture: null };
};

// Debounced table creation to prevent multiple rapid recreations
const debouncedCreateTable = debounce(() => {
  cleanup();
  if (props.scene) {
    createTable();
  }
}, 100);

// Watch for scene changes
watch(
  () => props.scene,
  (newScene, oldScene) => {
    // If scene changed from null to scene, create immediately
    if (!oldScene && newScene) {
      createTable();
      return;
    }
    
    // If scene became null, cleanup immediately
    if (oldScene && !newScene) {
      cleanup();
      cleanupResources();
      return;
    }
    
    // For scene updates, use debounced creation
    if (newScene && newScene !== oldScene) {
      debouncedCreateTable();
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
  cleanupResources();
});

// Export for other components
defineExpose({
  tableMesh,
  televisionMesh,
  isLoaded,
  cleanup,
  cleanupResources,
  TABLE_CONFIG,
});
</script>
