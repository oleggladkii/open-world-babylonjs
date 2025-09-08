import {
  Scene,
  Vector3,
  FreeCamera,
  ArcRotateCamera,
  UniversalCamera,
  Camera,
  DeviceOrientationCamera,
  VRDeviceOrientationFreeCamera,
} from "@babylonjs/core";

export type CameraType =
  | "free"
  | "arcRotate"
  | "universal"
  | "deviceOrientation"
  | "vr";

export interface CameraConfig {
  type?: CameraType;
  name?: string;
  position?: Vector3;
  target?: Vector3;

  // FreeCamera & UniversalCamera specific
  setTarget?: Vector3;

  // ArcRotateCamera specific
  alpha?: number;
  beta?: number;
  radius?: number;

  // Camera controls
  attachControls?: boolean;

  // Movement settings
  speed?: number;
  angularSensibility?: number;

  // Collision settings
  checkCollisions?: boolean;
  ellipsoid?: Vector3;

  // Constraints
  minZ?: number;
  maxZ?: number;

  // ArcRotateCamera constraints
  lowerAlphaLimit?: number;
  upperAlphaLimit?: number;
  lowerBetaLimit?: number;
  upperBetaLimit?: number;
  lowerRadiusLimit?: number;
  upperRadiusLimit?: number;

  // Inertia settings
  inertia?: number;

  // Auto rotation (ArcRotateCamera)
  useAutoRotationBehavior?: boolean;
  autoRotationBehaviorIdleRotationSpeed?: number;
  autoRotationBehaviorIdleRotationWaitTime?: number;
  autoRotationBehaviorIdleRotationSpinupTime?: number;

  // Framing behavior (ArcRotateCamera)
  useFramingBehavior?: boolean;
  framingBehaviorMode?: number;
  framingBehaviorRadiusScale?: number;
  framingBehaviorPositionY?: number;
  framingBehaviorDefaultElevation?: number;
  framingBehaviorElevationReturnTime?: number;
  framingBehaviorElevationReturnWaitTime?: number;
}

export const useCamera = () => {
  let camera: Camera | null = null;

  const createCamera = (
    scene: Scene,
    canvas: HTMLCanvasElement,
    config: CameraConfig = {},
  ): Camera => {
    const cameraType = config.type || "free";
    const cameraName = config.name || `${cameraType}Camera`;

    switch (cameraType) {
      case "arcRotate":
        camera = createArcRotateCamera(scene, canvas, cameraName, config);
        break;
      case "universal":
        camera = createUniversalCamera(scene, canvas, cameraName, config);
        break;
      case "deviceOrientation":
        camera = createDeviceOrientationCamera(
          scene,
          canvas,
          cameraName,
          config,
        );
        break;
      case "vr":
        camera = createVRCamera(scene, canvas, cameraName, config);
        break;
      case "free":
      default:
        camera = createFreeCamera(scene, canvas, cameraName, config);
        break;
    }

    // Apply common camera settings
    applyCameraSettings(camera, config);

    // Attach controls if specified
    if (config.attachControls !== false) {
      camera.attachControl(canvas, true);
    }

    return camera;
  };

  const createFreeCamera = (
    scene: Scene,
    canvas: HTMLCanvasElement,
    name: string,
    config: CameraConfig,
  ): FreeCamera => {
    const position = config.position || new Vector3(0, 5, -10);
    const freeCamera = new FreeCamera(name, position, scene);

    if (config.setTarget) {
      freeCamera.setTarget(config.setTarget);
    } else if (config.target) {
      freeCamera.setTarget(config.target);
    } else {
      freeCamera.setTarget(Vector3.Zero());
    }

    return freeCamera;
  };

  const createArcRotateCamera = (
    scene: Scene,
    canvas: HTMLCanvasElement,
    name: string,
    config: CameraConfig,
  ): ArcRotateCamera => {
    const alpha = config.alpha || -Math.PI / 2;
    const beta = config.beta || Math.PI / 2.5;
    const radius = config.radius || 10;
    const target = config.target || Vector3.Zero();

    const arcCamera = new ArcRotateCamera(
      name,
      alpha,
      beta,
      radius,
      target,
      scene,
    );

    // Apply ArcRotateCamera specific settings
    if (config.lowerAlphaLimit !== undefined)
      arcCamera.lowerAlphaLimit = config.lowerAlphaLimit;
    if (config.upperAlphaLimit !== undefined)
      arcCamera.upperAlphaLimit = config.upperAlphaLimit;
    if (config.lowerBetaLimit !== undefined)
      arcCamera.lowerBetaLimit = config.lowerBetaLimit;
    if (config.upperBetaLimit !== undefined)
      arcCamera.upperBetaLimit = config.upperBetaLimit;
    if (config.lowerRadiusLimit !== undefined)
      arcCamera.lowerRadiusLimit = config.lowerRadiusLimit;
    if (config.upperRadiusLimit !== undefined)
      arcCamera.upperRadiusLimit = config.upperRadiusLimit;

    // Auto rotation behavior
    if (config.useAutoRotationBehavior) {
      const autoRotationBehavior = new (
        scene.getEngine() as any
      ).AutoRotationBehavior();
      if (config.autoRotationBehaviorIdleRotationSpeed !== undefined) {
        autoRotationBehavior.idleRotationSpeed =
          config.autoRotationBehaviorIdleRotationSpeed;
      }
      if (config.autoRotationBehaviorIdleRotationWaitTime !== undefined) {
        autoRotationBehavior.idleRotationWaitTime =
          config.autoRotationBehaviorIdleRotationWaitTime;
      }
      if (config.autoRotationBehaviorIdleRotationSpinupTime !== undefined) {
        autoRotationBehavior.idleRotationSpinupTime =
          config.autoRotationBehaviorIdleRotationSpinupTime;
      }
      arcCamera.addBehavior(autoRotationBehavior);
    }

    // Framing behavior
    if (config.useFramingBehavior) {
      const framingBehavior = new (scene.getEngine() as any).FramingBehavior();
      if (config.framingBehaviorMode !== undefined) {
        framingBehavior.mode = config.framingBehaviorMode;
      }
      if (config.framingBehaviorRadiusScale !== undefined) {
        framingBehavior.radiusScale = config.framingBehaviorRadiusScale;
      }
      if (config.framingBehaviorPositionY !== undefined) {
        framingBehavior.positionY = config.framingBehaviorPositionY;
      }
      if (config.framingBehaviorDefaultElevation !== undefined) {
        framingBehavior.defaultElevation =
          config.framingBehaviorDefaultElevation;
      }
      if (config.framingBehaviorElevationReturnTime !== undefined) {
        framingBehavior.elevationReturnTime =
          config.framingBehaviorElevationReturnTime;
      }
      if (config.framingBehaviorElevationReturnWaitTime !== undefined) {
        framingBehavior.elevationReturnWaitTime =
          config.framingBehaviorElevationReturnWaitTime;
      }
      arcCamera.addBehavior(framingBehavior);
    }

    return arcCamera;
  };

  const createUniversalCamera = (
    scene: Scene,
    canvas: HTMLCanvasElement,
    name: string,
    config: CameraConfig,
  ): UniversalCamera => {
    const position = config.position || new Vector3(0, 5, -10);
    const universalCamera = new UniversalCamera(name, position, scene);

    if (config.setTarget) {
      universalCamera.setTarget(config.setTarget);
    } else if (config.target) {
      universalCamera.setTarget(config.target);
    } else {
      universalCamera.setTarget(Vector3.Zero());
    }

    return universalCamera;
  };

  const createDeviceOrientationCamera = (
    scene: Scene,
    canvas: HTMLCanvasElement,
    name: string,
    config: CameraConfig,
  ): DeviceOrientationCamera => {
    const position = config.position || new Vector3(0, 5, -10);
    const deviceCamera = new DeviceOrientationCamera(name, position, scene);

    if (config.setTarget) {
      deviceCamera.setTarget(config.setTarget);
    } else if (config.target) {
      deviceCamera.setTarget(config.target);
    } else {
      deviceCamera.setTarget(Vector3.Zero());
    }

    return deviceCamera;
  };

  const createVRCamera = (
    scene: Scene,
    canvas: HTMLCanvasElement,
    name: string,
    config: CameraConfig,
  ): VRDeviceOrientationFreeCamera => {
    const position = config.position || new Vector3(0, 5, -10);
    const vrCamera = new VRDeviceOrientationFreeCamera(name, position, scene);

    if (config.setTarget) {
      vrCamera.setTarget(config.setTarget);
    } else if (config.target) {
      vrCamera.setTarget(config.target);
    } else {
      vrCamera.setTarget(Vector3.Zero());
    }

    return vrCamera;
  };

  const applyCameraSettings = (camera: Camera, config: CameraConfig) => {
    // Movement settings
    if (config.speed !== undefined && "speed" in camera) {
      (camera as any).speed = config.speed;
    }

    if (
      config.angularSensibility !== undefined &&
      "angularSensibility" in camera
    ) {
      (camera as any).angularSensibility = config.angularSensibility;
    }

    // Collision settings
    if (config.checkCollisions !== undefined && "checkCollisions" in camera) {
      (camera as any).checkCollisions = config.checkCollisions;
    }

    if (config.ellipsoid && "ellipsoid" in camera) {
      (camera as any).ellipsoid = config.ellipsoid;
    }

    // Z-clipping
    if (config.minZ !== undefined) {
      camera.minZ = config.minZ;
    }

    if (config.maxZ !== undefined) {
      camera.maxZ = config.maxZ;
    }

    // Inertia
    if (config.inertia !== undefined && "inertia" in camera) {
      (camera as any).inertia = config.inertia;
    }
  };

  const getCamera = (): Camera | null => {
    return camera;
  };

  const updateCameraPosition = (position: Vector3) => {
    if (camera) {
      camera.position = position;
    }
  };

  const updateCameraTarget = (target: Vector3) => {
    if (camera && "setTarget" in camera) {
      (camera as any).setTarget(target);
    }
  };

  const enableCameraCollisions = (ellipsoid?: Vector3) => {
    if (camera && "checkCollisions" in camera) {
      (camera as any).checkCollisions = true;
      if (ellipsoid && "ellipsoid" in camera) {
        (camera as any).ellipsoid = ellipsoid;
      }
    }
  };

  const disableCameraCollisions = () => {
    if (camera && "checkCollisions" in camera) {
      (camera as any).checkCollisions = false;
    }
  };

  const disposeCamera = () => {
    if (camera) {
      camera.dispose();
      camera = null;
    }
  };

  return {
    createCamera,
    getCamera,
    updateCameraPosition,
    updateCameraTarget,
    enableCameraCollisions,
    disableCameraCollisions,
    disposeCamera,
  };
};
