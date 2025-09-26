import { ref, onMounted, onUnmounted } from "vue";
import { Scene, FreeCamera, Vector3, PhysicsImpostor } from "@babylonjs/core";

export interface FirstPersonConfig {
  moveSpeed?: number;
  mouseSensitivity?: number;
  jumpForce?: number;
  playerHeight?: number;
}

export const useFirstPersonControls = () => {
  const keys = ref({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    e: false,
  });

  const isPointerLocked = ref(false);
  let camera: FreeCamera | null = null;
  let scene: Scene | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let playerImpostor: PhysicsImpostor | null = null;
  let config: FirstPersonConfig = {};

  const initControls = (
    freeCamera: FreeCamera,
    gameScene: Scene,
    gameCanvas: HTMLCanvasElement,
    impostor: PhysicsImpostor,
    controlConfig: FirstPersonConfig = {},
  ) => {
    camera = freeCamera;
    scene = gameScene;
    canvas = gameCanvas;
    playerImpostor = impostor;
    config = {
      moveSpeed: 3, // Increased speed
      mouseSensitivity: 0.002,
      jumpForce: 4, // Reduced jump force
      playerHeight: 1.2, // Lower camera height
      ...controlConfig,
    };

    setupPointerLock();
    setupKeyboardControls();
    setupMouseControls();
    setupMovementLoop();
  };

  const setupPointerLock = () => {
    if (!canvas) return;

    // Request pointer lock on canvas click
    canvas.addEventListener("click", () => {
      canvas?.requestPointerLock();
    });

    // Handle pointer lock change
    document.addEventListener("pointerlockchange", () => {
      isPointerLocked.value = document.pointerLockElement === canvas;
    });
  };

  const setupKeyboardControls = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.value.w = true;
          break;
        case "KeyA":
          keys.value.a = true;
          break;
        case "KeyS":
          keys.value.s = true;
          break;
        case "KeyD":
          keys.value.d = true;
          break;
        case "Space":
          keys.value.space = true;
          event.preventDefault();
          break;
        case "KeyE":
          keys.value.e = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          keys.value.w = false;
          break;
        case "KeyA":
          keys.value.a = false;
          break;
        case "KeyS":
          keys.value.s = false;
          break;
        case "KeyD":
          keys.value.d = false;
          break;
        case "Space":
          keys.value.space = false;
          break;
        case "KeyE":
          keys.value.e = false;
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Store references for cleanup
    (setupKeyboardControls as any).handleKeyDown = handleKeyDown;
    (setupKeyboardControls as any).handleKeyUp = handleKeyUp;
  };

  const setupMouseControls = () => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.value || !camera) return;

      const { movementX, movementY } = event;
      const sensitivity = config.mouseSensitivity || 0.002;

      // Horizontal rotation (Y axis)
      camera.rotation.y += movementX * sensitivity;

      // Vertical rotation (X axis) with limits
      camera.rotation.x += movementY * sensitivity;
      camera.rotation.x = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, camera.rotation.x),
      );
    };

    document.addEventListener("mousemove", handleMouseMove);
    (setupMouseControls as any).handleMouseMove = handleMouseMove;
  };

  const setupMovementLoop = () => {
    if (!scene) return;

    scene.registerBeforeRender(() => {
      if (!camera || !playerImpostor) return;

      const deltaTime = scene!.getEngine().getDeltaTime() / 1000;
      const moveSpeed = (config.moveSpeed || 5) * deltaTime;

      // Calculate movement direction based on camera rotation
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      // Remove Y component for ground movement
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();

      const movement = Vector3.Zero();

      // WASD movement
      if (keys.value.w) movement.addInPlace(forward.scale(moveSpeed));
      if (keys.value.s) movement.addInPlace(forward.scale(-moveSpeed));
      if (keys.value.d) movement.addInPlace(right.scale(moveSpeed));
      if (keys.value.a) movement.addInPlace(right.scale(-moveSpeed));

      // Apply movement to physics body
      if (movement.length() > 0) {
        const currentVelocity = playerImpostor.getLinearVelocity();
        if (currentVelocity) {
          // Preserve Y velocity (gravity/jumping)
          movement.y = currentVelocity.y;
          playerImpostor.setLinearVelocity(movement.scale(15)); // Increased scale for faster movement
        }
      }

      // Jumping
      if (keys.value.space) {
        const velocity = playerImpostor.getLinearVelocity();
        if (velocity && Math.abs(velocity.y) < 0.5) {
          // Only jump if not already jumping (increased threshold)
          const currentVel = velocity.clone();
          currentVel.y = config.jumpForce || 4; // Set Y velocity directly
          playerImpostor.setLinearVelocity(currentVel);
        }
      }

      // Update camera position to follow physics body
      const playerPosition = playerImpostor.object.position;
      camera.position.copyFrom(
        playerPosition.add(new Vector3(0, config.playerHeight || 1.8, 0)),
      );
    });
  };

  const cleanup = () => {
    // Remove event listeners
    if ((setupKeyboardControls as any).handleKeyDown) {
      document.removeEventListener(
        "keydown",
        (setupKeyboardControls as any).handleKeyDown,
      );
      document.removeEventListener(
        "keyup",
        (setupKeyboardControls as any).handleKeyUp,
      );
    }

    if ((setupMouseControls as any).handleMouseMove) {
      document.removeEventListener(
        "mousemove",
        (setupMouseControls as any).handleMouseMove,
      );
    }

    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    // Reset refs
    isPointerLocked.value = false;
    camera = null;
    scene = null;
    canvas = null;
    playerImpostor = null;
  };

  return {
    keys,
    isPointerLocked,
    initControls,
    cleanup,
  };
};
