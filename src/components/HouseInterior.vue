<template lang="pug">
  .house-interior(v-if="isActive")
    canvas(ref="canvasRef")
    HouseWalls(v-if="scene" :scene="scene" :add-shadow-caster="addShadowCaster")
    HouseFloor(v-if="scene" :scene="scene" :add-shadow-caster="addShadowCaster")
    HouseCeiling(v-if="scene" :scene="scene" :add-shadow-caster="addShadowCaster")
    HouseWindow(
      v-if="scene"
      :scene="scene"
      :position="windowPosition"
      :add-shadow-caster="addShadowCaster"
    )
    HouseSofa(
      v-if="scene"
      :scene="scene"
      :add-shadow-caster="addShadowCaster"
      :player-position="playerPosition"
      :is-active="isActive"
      @sit-down="handleSitDown"
    )
    HouseTable(
      v-if="scene"
      :scene="scene"
      :add-shadow-caster="addShadowCaster"
      :player-position="playerPosition"
      :is-active="isActive"
      @use-table="handleUseTable"
    )
    BooksShelf(
      v-if="scene"
      :scene="scene"
      :add-shadow-caster="addShadowCaster"
      :player-position="playerPosition"
      :is-active="isActive"
    )
    HouseLamp(
      v-if="scene"
      :scene="scene"
      :add-shadow-caster="addShadowCaster"
      :player-position="playerPosition"
      :is-active="isActive"
      @light-toggled="handleLightToggled"
    )
    HouseDoor(
      v-if="scene"
      :scene="scene"
      :add-shadow-caster="addShadowCaster"
      :position="doorPosition"
    )
    GarageGate(
      v-if="scene"
      :scene="scene"
      :add-shadow-caster="addShadowCaster"
      :position="garageGatePosition"
    )
    WorkDesk(
      v-if="scene"
      :scene="scene"
      :position="workDeskPosition"
    )
    //- Bike(
    //-   v-if="scene"
    //-   :scene="scene"
    //-   :position="bikePosition"
    //- )
    InteractionPrompt(
      text="Press E to exit"
      :trigger-position="exitPosition"
      :trigger-radius="2"
      :player-position="playerPosition"
      :is-active="isActive"
      :key-binding="KEY_CODES.E"
      @interact="handleExit"
    )
    .instructions
      .instruction Use WASD to move <br> and mouse to look around
      .instruction(v-if="isLocalMode") FPS: {{ currentFPS }}
  </template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  FreeCamera,
  MeshBuilder,
  PhysicsImpostor,
  Scalar,
  Angle,
  Mesh,
  Observer,
} from "@babylonjs/core";
import "@babylonjs/inspector";
import { CannonJSPlugin } from "@babylonjs/core/Physics/Plugins/cannonJSPlugin";
import * as CANNON from "cannon";
import InteractionPrompt from "./InteractionPrompt.vue";
import { KEY_CODES } from "../constants/keyCodes";
import HouseWalls from "./house/HouseWalls.vue";
import HouseFloor from "./house/HouseFloor.vue";
import HouseCeiling from "./house/HouseCeiling.vue";
import HouseSofa from "./house/HouseSofa.vue";
import HouseTable from "./house/HouseTable.vue";
import BooksShelf from "./house/BooksShelf.vue";
import HouseWindow from "./house/HouseWindow.vue";
import HouseLamp from "./house/HouseLamp.vue";
import HouseDoor from "./house/HouseDoor.vue";
import GarageGate from "./house/GarageGate.vue";
import WorkDesk from "./house/WorkDesk.vue";
import Bike from "./house/Bike.vue";

interface Props {
  isActive: boolean;
  onExit?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  onExit: undefined,
});

// Refs
const canvasRef = ref<HTMLCanvasElement>();
const playerPosition = ref<Vector3 | null>(null);
const currentFPS = ref<number>(0);
const exitPosition = new Vector3(-5, 1, 9);
const windowPosition = new Vector3(-5, 3, -10);
const doorPosition = new Vector3(-5, 0, 9.8);
const garageGatePosition = new Vector3(5, 3, 9.7);
const workDeskPosition = new Vector3(2.5, 0, -3.7);
const bikePosition = new Vector3(1, 0.6, 5);
const scene = ref<Scene | null>(null);

// Store references for cleanup
let engine: Engine | null = null;
let camera: FreeCamera | null = null;
let player: Mesh | null = null;
let ambientLight: HemisphericLight | null = null;
let exitCheckInterval: number | null = null;
let beforeRenderObserver: Observer<Scene> | null = null;
// let shadowGenerator: any = null; // Currently unused - shadows are commented out

// Development mode check
const isLocalMode = import.meta.env.MODE === "development";

// FPS tracking
let lastTime = performance.now();
let frameCount = 0;

// Shadow caster helper function (currently unused)
const addShadowCaster = () => {
  // Currently unused - shadows are commented out
};

const initHouseInterior = async () => {
  if (!canvasRef.value) return;

  try {
    // ====== Initialize ======
    engine = new Engine(canvasRef.value, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      antialias: false, // Disable antialiasing for better performance
      powerPreference: "high-performance",
    });
    scene.value = new Scene(engine);

    // Performance optimizations
    scene.value.skipPointerMovePicking = true; // Skip pointer move picking for better performance
    scene.value.constantlyUpdateMeshUnderPointer = false; // Disable constant mesh updates

    // Additional performance settings
    scene.value.autoClear = false; // Don't auto-clear, we'll do it manually
    scene.value.autoClearDepthAndStencil = false; // Performance boost

    // FPS Camera
    camera = new FreeCamera("camera", new Vector3(0, 1.8, 0), scene.value);
    camera.inputs.clear(); // Disable default inputs
    camera.rotation.y = Angle.FromDegrees(180).radians();
    // Lighting - General ambient light for all rooms (reduced intensity for performance)
    ambientLight = new HemisphericLight(
      "ambientLight",
      new Vector3(0, 1, 0), // General upward direction for even lighting
      scene.value,
    );
    ambientLight.intensity = 0.6; // Reduced from default 1.0 for better performance

    // Physics (Cannon.js) - MOVED BEFORE CHILD COMPONENTS
    const gravity = new Vector3(0, -2, 0); // Reduced gravity
    const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
    scene.value.enablePhysics(gravity, cannonPlugin);

    // ====== Player ======
    player = MeshBuilder.CreateBox(
      "player",
      { width: 0.8, height: 1.8, depth: 0.8 },
      scene.value,
    );
    player.position.set(-5, 0.9, 7); // Start at the cross in the first room
    player.isVisible = false; // Invisible player
    player.physicsImpostor = new PhysicsImpostor(
      player,
      PhysicsImpostor.BoxImpostor, // Back to Box for better stability
      {
        mass: 1,
        friction: 0.3, // Increased friction for better control
        restitution: 0, // No bouncing
        disableBidirectionalTransformation: false,
      },
      scene.value,
    );

    // Wait for physics body to be created, then configure it
    setTimeout(() => {
      if (
        player &&
        player.physicsImpostor &&
        player.physicsImpostor.physicsBody
      ) {
        // Lock rotation to prevent tipping over
        player.physicsImpostor.physicsBody.fixedRotation = true;
        player.physicsImpostor.physicsBody.updateMassProperties();

        // Set material properties
        if (player.physicsImpostor.physicsBody.material) {
          player.physicsImpostor.physicsBody.material.friction = 0.3;
          player.physicsImpostor.physicsBody.material.restitution = 0;
        }

        // Set damping via physics body properties
        if (player.physicsImpostor.physicsBody.linearDamping !== undefined) {
          player.physicsImpostor.physicsBody.linearDamping = 0.9;
        }

        console.log("Player physics configured successfully");
      } else {
        console.warn("Physics body not available for configuration");
      }
    }, 100); // Small delay to ensure physics body is created

    // ====== FPS Controls ======
    const keys: Record<string, boolean> = {};

    // Mouse controls
    const onPointerLockChange = () => {
      // Handle pointer lock changes if needed
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!camera || document.pointerLockElement !== canvasRef.value) return;

      const sensitivity = 0.002;
      camera.rotation.y += event.movementX * sensitivity;
      camera.rotation.x += event.movementY * sensitivity; // Normal (not inverted)

      // Clamp vertical rotation to prevent looking too far up/down
      camera.rotation.x = Scalar.Clamp(
        camera.rotation.x,
        -Math.PI / 3, // -60 degrees (looking down)
        Math.PI / 3, // +60 degrees (looking up)
      );
    };

    // Setup controls (using e.code for universal keyboard layout support)
    keydownHandler = (e) => {
      keys[e.code.toLowerCase()] = true;

      // Handle F key for sofa interaction (handled by InteractionPrompt component)
      // No additional handling needed here as it's managed by the HouseSofa component
      if (e.code === "KeyF") {
        // Handle F key for sofa interaction
        // No additional handling needed here as it's managed by the HouseSofa component
      }
    };

    keyupHandler = (e) => {
      keys[e.code.toLowerCase()] = false;
    };

    pointerLockChangeHandler = onPointerLockChange;
    mouseMoveHandler = onMouseMove;

    // Click to lock pointer
    clickHandler = () => {
      canvasRef.value?.requestPointerLock();
    };

    // Add event listeners
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);
    document.addEventListener("pointerlockchange", pointerLockChangeHandler);
    canvasRef.value.addEventListener("mousemove", mouseMoveHandler);
    canvasRef.value.addEventListener("click", clickHandler);

    // Reusable vectors
    const moveVector = new Vector3();
    const tempVector = new Vector3();

    // Anti-stuck system
    const lastPosition = new Vector3();
    let stuckCounter = 0;
    const maxStuckFrames = 30; // If stuck for 30 frames, teleport

    beforeRenderObserver = scene.value.onBeforeRenderObservable.add(() => {
      if (!player?.physicsImpostor || !camera) return;

      const speed = 5;
      const vel = player.physicsImpostor.getLinearVelocity();
      if (!vel) return;

      // Reset movement vector
      moveVector.set(0, 0, 0);

      // Get camera direction vectors
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      // Keep movement horizontal (remove Y component)
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();

      // Build movement vector relative to camera direction (using key codes)
      if (keys["keyw"]) moveVector.addInPlace(forward);
      if (keys["keys"]) moveVector.subtractInPlace(forward);
      if (keys["keya"]) moveVector.subtractInPlace(right);
      if (keys["keyd"]) moveVector.addInPlace(right);

      // Normalize diagonal movement and apply speed
      if (moveVector.length() > 0) {
        moveVector.normalize();
        moveVector.scaleInPlace(speed);
      }

      // Anti-stuck system - detect if player is stuck
      if (!player || !player.position) {
        return; // Exit early if player is not ready
      }
      const currentPos = player.getAbsolutePosition();
      const distanceMoved = Vector3.Distance(currentPos, lastPosition);

      if (moveVector.length() > 0 && distanceMoved < 0.01) {
        // Player is trying to move but not moving - might be stuck
        stuckCounter++;
        if (stuckCounter > maxStuckFrames) {
          // Player is stuck, push them away from walls
          const pushForce = new Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5,
          )
            .normalize()
            .scale(2);
          if (player.physicsImpostor) {
            player.physicsImpostor.setLinearVelocity(pushForce);
          }
          stuckCounter = 0;
          console.log("Player unstuck applied");
        }
      } else {
        stuckCounter = 0;
      }
      lastPosition.copyFrom(currentPos);

      // Prevent falling through floor - maintain minimum Y position
      const minY = 0.9; // Player should stay at this height
      const currentY = player.position.y;

      if (currentY < minY) {
        // Use physics impostor to set position instead of direct position
        if (player.physicsImpostor) {
          player.physicsImpostor.setLinearVelocity(
            new Vector3(vel.x, 0, vel.z),
          );
        }
        player.position.y = minY;
        // Reset physics body position
        if (player.physicsImpostor && player.physicsImpostor.physicsBody) {
          player.physicsImpostor.physicsBody.position.y = minY;
        }
      }

      // Always set velocity directly - no gradual acceleration
      if (player.physicsImpostor) {
        tempVector.set(moveVector.x, vel.y, moveVector.z);
        player.physicsImpostor.setLinearVelocity(tempVector);

        // If no movement input, stop horizontal movement immediately
        if (moveVector.length() === 0) {
          tempVector.set(0, vel.y, 0);
          player.physicsImpostor.setLinearVelocity(tempVector);
        }
      }

      // Additional stability check - prevent excessive downward velocity
      if (vel.y < -5 && player.physicsImpostor) {
        // Reduced from -10 to -5 for better stability
        tempVector.set(moveVector.x, -5, moveVector.z);
        player.physicsImpostor.setLinearVelocity(tempVector);
      }

      // Update camera position to follow player with room-specific boundaries
      const playerPos = player.getAbsolutePosition();

      let roomBounds;

      // Determine which room the player is in and set appropriate boundaries
      // Updated bounds to match NEW wall positions
      if (playerPos.x < -0.5) {
        // Player is in the first room (10x20) - unchanged
        roomBounds = {
          minX: -9.5, // Blue wall at x=-10 + margin
          maxX: -0.5, // Yellow walls at x=0 - margin
          minZ: -9.5, // Red wall at z=-10 + margin
          maxZ: 9.5, // Green wall at z=10 - margin
          minY: 0.5,
          maxY: 4.5,
        };
      } else if (playerPos.x > 0.5) {
        // Player is in the second room (10x10) - UPDATED to smaller room!
        roomBounds = {
          minX: 0.5, // Gray walls at x=0.25 + margin
          maxX: 9.5, // Gray wall at x=10 - margin
          minZ: -4.5, // Gray wall at z=-5 + margin
          maxZ: 9.5, // Gray wall at z=10 - margin
          minY: 0.5,
          maxY: 4.5,
        };
      } else {
        // Player is in the doorway area - allow movement between rooms
        roomBounds = {
          minX: -9.5,
          maxX: 9.5,
          minZ: -2.5, // Doorway area from z=-2.75 to z=2.75
          maxZ: 2.5,
          minY: 0.5,
          maxY: 4.5,
        };
      }

      // Apply camera bounds with smooth clamping
      const targetCameraPos = {
        x: Math.max(roomBounds.minX, Math.min(roomBounds.maxX, playerPos.x)),
        y: Math.max(
          roomBounds.minY,
          Math.min(roomBounds.maxY, playerPos.y + 1.8),
        ),
        z: Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, playerPos.z)),
      };

      // Strict camera bounds - prevent any clipping through walls
      // Apply very strict bounds based on actual wall positions with large safety margins
      let finalX = targetCameraPos.x;
      let finalY = targetCameraPos.y;
      let finalZ = targetCameraPos.z;

      if (playerPos.x < -0.5) {
        // First room - very strict bounds (walls at x=-10, x=0, z=-10, z=10)
        finalX = Math.max(-8.0, Math.min(-2.0, finalX)); // 2.0 unit margin from walls
        finalZ = Math.max(-8.0, Math.min(8.0, finalZ)); // 2.0 unit margin from walls
      } else if (playerPos.x > 0.5) {
        // Second room - UPDATED bounds (walls at x=0.25, x=10, z=-5, z=10)
        finalX = Math.max(2.0, Math.min(8.0, finalX)); // 2.0 unit margin from walls
        finalZ = Math.max(-3.0, Math.min(8.0, finalZ)); // Updated: north wall at z=-5, south at z=10
      } else {
        // Doorway - extremely restricted (only in doorway area)
        finalX = Math.max(-8.0, Math.min(8.0, finalX));
        finalZ = Math.max(-1.0, Math.min(1.0, finalZ)); // Very tight doorway
      }

      // Height bounds - keep camera well within room
      finalY = Math.max(1.0, Math.min(4.0, finalY));

      // Set camera position with ultra-strict bounds
      camera.position.x = finalX;
      camera.position.y = finalY;
      camera.position.z = finalZ;

      // Update player position for interaction prompts
      playerPosition.value = playerPos.clone();

      // Debug: log when near exit
      const distanceToExit = Vector3.Distance(playerPos, exitPosition);
      if (distanceToExit < 3) {
        console.log(
          `Near exit! Distance: ${distanceToExit.toFixed(2)}, Player pos: ${playerPos.x.toFixed(1)}, ${playerPos.z.toFixed(1)}`,
        );
      }
    });

    // ====== Render ======
    engine.runRenderLoop(() => {
      scene.value!.render();

      // Calculate FPS only in development mode
      if (isLocalMode) {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 2000) {
          // Update every 2 seconds instead of 1
          currentFPS.value = Math.round(
            (frameCount * 1000) / (currentTime - lastTime),
          );
          frameCount = 0;
          lastTime = currentTime;
        }
      }
    });

    // Handle window resize
    resizeHandler = () => {
      engine!.resize();
    };
    window.addEventListener("resize", resizeHandler);
  } catch (error) {
    console.error("Error initializing house interior:", error);
  }
};

// ... (rest of the code remains the same)
const handleExit = () => {
  if (props.onExit) {
    props.onExit();
  }
};

const handleSitDown = (sittingPosition: Vector3) => {
  if (player && camera) {
    // Move player to sitting position
    player.position.copyFrom(sittingPosition);

    // Update camera to sitting position
    camera.position.copyFrom(sittingPosition);
    camera.position.y += 0.5; // Camera slightly above sitting position

    // Reset physics body position if available
    if (player.physicsImpostor && player.physicsImpostor.physicsBody) {
      player.physicsImpostor.physicsBody.position.set(
        sittingPosition.x,
        sittingPosition.y,
        sittingPosition.z,
      );
      // Stop any movement
      player.physicsImpostor.setLinearVelocity(Vector3.Zero());
    }

    console.log("Player is now sitting on the sofa");
  }
};

const handleUseTable = (tablePosition: Vector3) => {
  console.log("Player is using the table at position:", tablePosition);
  // You can add table interaction logic here
  // For example: open inventory, show crafting menu, etc.
};

const handleLightToggled = (isOn: boolean) => {
  console.log(`House lights are now ${isOn ? "ON" : "OFF"}`);
  if (ambientLight) {
    ambientLight.intensity = isOn ? 0.8 : 0.35;
  }
  // You can add additional logic here when lights are toggled
  // For example: update ambient lighting, play sound effects, etc.
};

// Store event listener references for proper cleanup
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let keyupHandler: ((e: KeyboardEvent) => void) | null = null;
let pointerLockChangeHandler: (() => void) | null = null;
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let clickHandler: (() => void) | null = null;
let resizeHandler: (() => void) | null = null;

const cleanup = () => {
  console.log("HouseInterior cleanup started");

  // Clear exit detection
  if (exitCheckInterval) {
    clearInterval(exitCheckInterval);
    exitCheckInterval = null;
  }

  // Remove render observer
  if (beforeRenderObserver && scene.value) {
    scene.value.onBeforeRenderObservable.remove(beforeRenderObserver);
    beforeRenderObserver = null;
  }

  // Remove event listeners with proper references
  if (keydownHandler) {
    window.removeEventListener("keydown", keydownHandler);
    keydownHandler = null;
  }
  if (keyupHandler) {
    window.removeEventListener("keyup", keyupHandler);
    keyupHandler = null;
  }
  if (pointerLockChangeHandler) {
    document.removeEventListener("pointerlockchange", pointerLockChangeHandler);
    pointerLockChangeHandler = null;
  }
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }

  if (canvasRef.value) {
    if (mouseMoveHandler) {
      canvasRef.value.removeEventListener("mousemove", mouseMoveHandler);
      mouseMoveHandler = null;
    }
    if (clickHandler) {
      canvasRef.value.removeEventListener("click", clickHandler);
      clickHandler = null;
    }
  }

  // Exit pointer lock if active
  if (document.pointerLockElement === canvasRef.value) {
    document.exitPointerLock();
  }

  // Dispose scene
  if (scene.value) {
    scene.value.dispose();
    scene.value = null;
  }

  // Dispose engine
  if (engine) {
    engine.dispose();
    engine = null;
  }

  // Reset state
  playerPosition.value = null;
  currentFPS.value = 0;
  player = null;
  camera = null;
  // shadowGenerator = null; // Currently unused

  // Reset FPS tracking
  lastTime = performance.now();
  frameCount = 0;

  console.log("HouseInterior cleanup completed");
};

// Watch for active state changes
watch(
  () => props.isActive,
  async (newActive) => {
    if (newActive) {
      await nextTick();
      initHouseInterior();
    } else {
      cleanup();
    }
  },
);

onMounted(() => {
  if (props.isActive) {
    nextTick(() => {
      initHouseInterior();
    });
  }
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.house-interior {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: #000;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: none;
}

.instructions {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  font-size: 16px;
  pointer-events: none;
}

.instruction {
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 12px;
  border-radius: 4px;
}
</style>
