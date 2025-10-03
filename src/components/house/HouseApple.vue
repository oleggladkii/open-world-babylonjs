<template lang="pug">
div
  // Invisible component - apple is created programmatically
  InteractionPrompt(
    v-if="appleMesh && isLoaded && !isHeld"
    text="To take apple press E"
    :trigger-position="applePosition"
    :trigger-radius="1.5"
    :player-position="playerPosition"
    :is-active="isActive"
    :key-binding="KEY_CODES.E"
    @interact="pickupApple"
  )
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from "vue";
import {
  Scene,
  Vector3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  PhysicsImpostor,
  Observer,
  PointerEventTypes,
  PointerInfo,
} from "@babylonjs/core";
import InteractionPrompt from "../InteractionPrompt.vue";
import { KEY_CODES } from "../../constants/keyCodes";
import appleTextureUrl from "../../assets/textures/apple.jpg";

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

// Refs
const appleMesh = ref<Mesh | null>(null);
const isLoaded = ref(false);
const isHeld = ref(false);
const pointerObserver = ref<Observer<PointerInfo> | null>(null);
const originalPosition = new Vector3(-8.6, 1.1, -3.8);
const followPlayerInterval = ref<NodeJS.Timeout | null>(null);

// Computed properties
const applePosition = computed(() => {
  if (appleMesh.value && appleMesh.value.isEnabled()) {
    return appleMesh.value.position.clone();
  }
  return originalPosition.clone();
});

const createApple = () => {
  if (!props.scene) {
    return;
  }

  try {
    const apple = MeshBuilder.CreateSphere(
      "apple",
      {
        diameter: 0.2,
        segments: 5,
      },
      props.scene,
    );

    apple.position = originalPosition.clone();

    const appleMaterial = new StandardMaterial("appleMaterial", props.scene);

    const appleTexture = new Texture(appleTextureUrl, props.scene);

    appleMaterial.diffuseTexture = appleTexture;
    appleMaterial.specularColor = new Color3(0.2, 0.2, 0.2); // Low specular for matte finish
    appleMaterial.emissiveColor = new Color3(0.05, 0.02, 0.02); // Slight red glow

    apple.material = appleMaterial;

    apple.physicsImpostor = new PhysicsImpostor(
      apple,
      PhysicsImpostor.SphereImpostor,
      {
        mass: 0,
        friction: 0.8,
        restitution: 0.3,
        disableBidirectionalTransformation: false,
      },
      props.scene,
    );

    apple.receiveShadows = true;
    if (props.addShadowCaster) {
      props.addShadowCaster(apple);
    }

    appleMesh.value = apple;
    isLoaded.value = true;
  } catch (error) {
    console.error("Error creating apple:", error);
  }
};

const pickupApple = () => {
  if (!appleMesh.value || !props.scene || !props.playerPosition) return;

  try {
    if (appleMesh.value.physicsImpostor) {
      appleMesh.value.physicsImpostor.dispose();
      appleMesh.value.physicsImpostor = null;
    }

    // Position apple in front of camera instead of hiding it
    const camera = props.scene.activeCamera;
    if (camera) {
      const cameraForward = camera.getForwardRay().direction;
      const holdPosition = props.playerPosition.clone();
      holdPosition.y += 1.5; // At chest level
      holdPosition.addInPlace(cameraForward.scale(1.5)); // 1.5 units in front of camera
      appleMesh.value.position = holdPosition;
    }
    appleMesh.value.setEnabled(true); // Keep it visible

    isHeld.value = true;

    // Start following player movement
    startFollowingPlayer();

    setupThrowListener();
  } catch (error) {
    console.error("Error picking up apple:", error);
  }
};

const startFollowingPlayer = () => {
  if (!appleMesh.value || !props.playerPosition) return;

  // Clear any existing interval
  if (followPlayerInterval.value) {
    clearInterval(followPlayerInterval.value);
  }

  // Update apple position every frame to follow camera
  followPlayerInterval.value = setInterval(() => {
    if (
      !appleMesh.value ||
      !props.playerPosition ||
      !isHeld.value ||
      !props.scene
    ) {
      if (followPlayerInterval.value) {
        clearInterval(followPlayerInterval.value);
        followPlayerInterval.value = null;
      }
      return;
    }

    const camera = props.scene.activeCamera;
    if (!camera) return;

    // Get camera forward direction
    const cameraForward = camera.getForwardRay().direction;

    // Position apple in front of camera at player position
    const holdPosition = props.playerPosition.clone();
    holdPosition.y += 1.5; // At chest level

    // Move apple forward in camera direction
    holdPosition.addInPlace(cameraForward.scale(1.5)); // 1.5 units in front of camera

    appleMesh.value.position = holdPosition;
  }, 16); // ~60 FPS updates
};

const stopFollowingPlayer = () => {
  if (followPlayerInterval.value) {
    clearInterval(followPlayerInterval.value);
    followPlayerInterval.value = null;
  }
};

const setupThrowListener = () => {
  if (!props.scene) return;

  if (pointerObserver.value) {
    props.scene.onPointerObservable.remove(pointerObserver.value);
  }
  pointerObserver.value = props.scene.onPointerObservable.add((pointerInfo) => {
    if (
      pointerInfo.type === PointerEventTypes.POINTERDOWN &&
      pointerInfo.event.button === 0 && // Left mouse button
      isHeld.value
    ) {
      throwApple();
    }
  });
};

const throwApple = () => {
  if (!appleMesh.value || !props.scene || !props.playerPosition) return;

  try {
    // Get camera direction for throw direction
    const camera = props.scene.activeCamera;
    if (!camera) return;

    // Position apple in front of player and make it visible
    const throwPosition = props.playerPosition.clone();
    throwPosition.y += 1.5; // At chest height
    appleMesh.value.position = throwPosition;
    appleMesh.value.setEnabled(true);

    // Re-enable physics with throw force
    appleMesh.value.physicsImpostor = new PhysicsImpostor(
      appleMesh.value,
      PhysicsImpostor.SphereImpostor,
      {
        mass: 0.2,
        friction: 0.8,
        restitution: 0.3,
        disableBidirectionalTransformation: false,
      },
      props.scene,
    );

    // Enable continuous collision detection to prevent tunneling
    if (appleMesh.value.physicsImpostor.physicsBody) {
      appleMesh.value.physicsImpostor.physicsBody.material.friction = 0.8;
      appleMesh.value.physicsImpostor.physicsBody.material.restitution = 0.3;
      // Set continuous collision detection
      appleMesh.value.physicsImpostor.physicsBody.ccdMotionThreshold = 0.1;
      appleMesh.value.physicsImpostor.physicsBody.ccdSweptSphereRadius = 0.1;
    }

    // Calculate throw direction towards screen center, slightly higher
    const engine = props.scene.getEngine();
    const screenCenterX = engine.getRenderWidth() / 2;
    const screenCenterY = engine.getRenderHeight() / 2 - 50; // Slightly higher than center

    // Get ray from camera through screen center
    const ray = props.scene.createPickingRay(
      screenCenterX,
      screenCenterY,
      null,
      camera,
    );

    const throwForce = ray.direction.scale(3); // Throw strength
    throwForce.y += 0.5; // Add slight upward arc

    // Apply impulse for throwing
    appleMesh.value.physicsImpostor.applyImpulse(
      throwForce,
      appleMesh.value.getAbsolutePosition(),
    );

    // Mark as no longer held
    isHeld.value = false;

    // Stop following player
    stopFollowingPlayer();

    // Remove throw listener
    if (pointerObserver.value && props.scene) {
      props.scene.onPointerObservable.remove(pointerObserver.value);
      pointerObserver.value = null;
    }

    // Respawn apple after 10 seconds (will wait if apple is held)
    setTimeout(() => {
      respawnApple();
    }, 10000);

    console.log("Apple thrown");
  } catch (error) {
    console.error("Error throwing apple:", error);
  }
};

const respawnApple = () => {
  if (!props.scene) return;

  // If apple is currently held, retry in 1 second
  if (isHeld.value) {
    setTimeout(() => {
      respawnApple();
    }, 1000);
    return;
  }

  try {
    // Create a new apple instead of respawning the old one
    createApple();

    console.log("New apple created on table");
  } catch (error) {
    console.error("Error creating new apple:", error);
  }
};

const cleanup = () => {
  // Stop following player
  stopFollowingPlayer();

  // Remove pointer observer
  if (pointerObserver.value && props.scene) {
    props.scene.onPointerObservable.remove(pointerObserver.value);
    pointerObserver.value = null;
  }

  if (appleMesh.value) {
    if (appleMesh.value.physicsImpostor) {
      appleMesh.value.physicsImpostor.dispose();
    }
    if (appleMesh.value.material) {
      appleMesh.value.material.dispose();
    }
    appleMesh.value.dispose();
    appleMesh.value = null;
  }

  isLoaded.value = false;
  isHeld.value = false;
};

// Watch for scene changes
watch(
  () => props.scene,
  (newScene) => {
    if (newScene) {
      createApple();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  cleanup();
});

// Export for other components
defineExpose({
  appleMesh,
  isLoaded,
  isHeld,
  cleanup,
  pickupApple,
  respawnApple,
});
</script>
