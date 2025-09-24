import { ArcRotateCamera, Vector3, Animation, Scene } from "@babylonjs/core";

export interface CameraAnimationOptions {
  duration?: number; // Animation duration in milliseconds
  targetPosition?: Vector3; // Target position to look at
  targetRadius?: number; // Target camera radius (zoom level)
  targetAlpha?: number; // Target horizontal rotation
  targetBeta?: number; // Target vertical rotation
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

export interface CameraState {
  position: Vector3;
  radius: number;
  alpha: number;
  beta: number;
}

export const useCameraAnimation = () => {
  let originalCameraState: CameraState | null = null;
  let isAnimating = false;

  /**
   * Store the current camera state for later restoration
   */
  const storeCameraState = (camera: ArcRotateCamera): void => {
    originalCameraState = {
      position: camera.target.clone(),
      radius: camera.radius,
      alpha: camera.alpha,
      beta: camera.beta,
    };
  };

  /**
   * Animate camera to focus on a specific target
   */
  const animateCameraToTarget = (
    camera: ArcRotateCamera,
    scene: Scene,
    options: CameraAnimationOptions = {},
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (isAnimating) {
        console.log("Camera is already animating, skipping...");
        resolve();
        return;
      }

      console.log("Starting camera animation with options:", options);
      isAnimating = true;

      // Store original state if not already stored
      if (!originalCameraState) {
        storeCameraState(camera);
      }

      const {
        duration = 2000,
        targetPosition = new Vector3(8, 0, -2), // IdleMale position
        targetRadius = 8,
        targetAlpha = camera.alpha,
        targetBeta = Math.PI / 3, // 60 degrees
      } = options;

      const frameRate = 60;
      const totalFrames = Math.ceil((duration / 1000) * frameRate);

      // Create animations for each property
      const targetAnimation = new Animation(
        "cameraTargetAnimation",
        "target",
        frameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      const radiusAnimation = new Animation(
        "cameraRadiusAnimation",
        "radius",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      const alphaAnimation = new Animation(
        "cameraAlphaAnimation",
        "alpha",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      const betaAnimation = new Animation(
        "cameraBetaAnimation",
        "beta",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      // Set animation keys
      const targetKeys = [
        { frame: 0, value: camera.target.clone() },
        { frame: totalFrames, value: targetPosition },
      ];

      const radiusKeys = [
        { frame: 0, value: camera.radius },
        { frame: totalFrames, value: targetRadius },
      ];

      const alphaKeys = [
        { frame: 0, value: camera.alpha },
        { frame: totalFrames, value: targetAlpha },
      ];

      const betaKeys = [
        { frame: 0, value: camera.beta },
        { frame: totalFrames, value: targetBeta },
      ];

      targetAnimation.setKeys(targetKeys);
      radiusAnimation.setKeys(radiusKeys);
      alphaAnimation.setKeys(alphaKeys);
      betaAnimation.setKeys(betaKeys);

      // Apply animations to camera first
      camera.animations = [
        targetAnimation,
        radiusAnimation,
        alphaAnimation,
        betaAnimation,
      ];

      // Start all animations together
      scene.beginAnimation(camera, 0, totalFrames, false, 1, () => {
        console.log("Camera animation finished!");
        isAnimating = false;
        resolve();
      });
    });
  };

  /**
   * Restore camera to its original state
   */
  const restoreCameraState = (
    camera: ArcRotateCamera,
    scene: Scene,
    options: { duration?: number } = {},
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!originalCameraState || isAnimating) {
        resolve();
        return;
      }

      isAnimating = true;

      const { duration = 2000 } = options;
      const frameRate = 60;
      const totalFrames = Math.ceil((duration / 1000) * frameRate);

      // Create animations for restoration
      const targetAnimation = new Animation(
        "cameraRestoreTargetAnimation",
        "target",
        frameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      const radiusAnimation = new Animation(
        "cameraRestoreRadiusAnimation",
        "radius",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      const alphaAnimation = new Animation(
        "cameraRestoreAlphaAnimation",
        "alpha",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      const betaAnimation = new Animation(
        "cameraRestoreBetaAnimation",
        "beta",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT,
      );

      // Set animation keys for restoration
      const targetKeys = [
        { frame: 0, value: camera.target.clone() },
        { frame: totalFrames, value: originalCameraState.position },
      ];

      const radiusKeys = [
        { frame: 0, value: camera.radius },
        { frame: totalFrames, value: originalCameraState.radius },
      ];

      const alphaKeys = [
        { frame: 0, value: camera.alpha },
        { frame: totalFrames, value: originalCameraState.alpha },
      ];

      const betaKeys = [
        { frame: 0, value: camera.beta },
        { frame: totalFrames, value: originalCameraState.beta },
      ];

      targetAnimation.setKeys(targetKeys);
      radiusAnimation.setKeys(radiusKeys);
      alphaAnimation.setKeys(alphaKeys);
      betaAnimation.setKeys(betaKeys);

      // Apply animations to camera first
      camera.animations = [
        targetAnimation,
        radiusAnimation,
        alphaAnimation,
        betaAnimation,
      ];

      // Start restoration animation
      scene.beginAnimation(camera, 0, totalFrames, false, 1, () => {
        isAnimating = false;
        originalCameraState = null; // Clear stored state
        resolve();
      });
    });
  };

  /**
   * Check if camera is currently animating
   */
  const getIsAnimating = (): boolean => {
    return isAnimating;
  };

  /**
   * Get stored camera state
   */
  const getOriginalCameraState = (): CameraState | null => {
    return originalCameraState;
  };

  return {
    animateCameraToTarget,
    restoreCameraState,
    storeCameraState,
    getIsAnimating,
    getOriginalCameraState,
  };
};
