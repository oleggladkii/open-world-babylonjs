import {
  Scene,
  Engine,
  Vector3,
  Color3,
  Color4,
  UniversalCamera,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  CascadedShadowGenerator,
} from "@babylonjs/core";

// FogMode constants
const FOGMODE_NONE = 0;
const FOGMODE_EXP = 1;
const FOGMODE_EXP2 = 2;
const FOGMODE_LINEAR = 3;

export interface SceneConfig {
  // Basic scene settings
  clearColor?: Color4;
  ambientColor?: Color3;

  // Fog settings
  fogMode?: number;
  fogColor?: Color3;
  fogDensity?: number;
  fogStart?: number;
  fogEnd?: number;

  // Physics settings
  enablePhysics?: boolean;
  gravity?: Vector3;

  // Rendering settings
  enableShadows?: boolean;
  shadowMapSize?: number;
  shadowBlurKernel?: number;
  shadowDarkness?: number;

  // Performance settings
  enableOfflineSupport?: boolean;
  enableIncrementalLoading?: boolean;

  // Animation settings
  animationPropertiesOverride?: {
    enableBlending?: boolean;
    blendingSpeed?: number;
    loopMode?: number;
  };
}

export const useScene = () => {
  let scene: Scene | null = null;
  let shadowGenerator: ShadowGenerator | null = null;

  const createScene = (engine: Engine, config: SceneConfig = {}): Scene => {
    scene = new Scene(engine);

    // Apply basic scene configuration
    setupSceneProperties(scene, config);

    // Setup lighting
    setupLighting(scene, config);

    // Setup shadows if enabled
    if (config.enableShadows !== false) {
      setupShadows(scene, config);
    }

    // Setup fog if configured
    if (config.fogMode !== undefined) {
      setupFog(scene, config);
    }

    // Setup physics if enabled
    if (config.enablePhysics) {
      setupPhysics(scene, config);
    }

    // Setup animation properties
    if (config.animationPropertiesOverride) {
      setupAnimationProperties(scene, config);
    }

    return scene;
  };

  const setupSceneProperties = (scene: Scene, config: SceneConfig) => {
    // Set clear color (background color)
    if (config.clearColor) {
      scene.clearColor = config.clearColor;
    } else {
      scene.clearColor = new Color4(0.2, 0.2, 0.3, 1.0); // Default dark blue
    }

    // Set ambient color
    if (config.ambientColor) {
      scene.ambientColor = config.ambientColor;
    } else {
      scene.ambientColor = new Color3(0.1, 0.1, 0.1); // Subtle ambient
    }

    // Enable incremental loading
    if (config.enableIncrementalLoading) {
      scene.useRightHandedSystem = true;
    }
  };

  const setupLighting = (scene: Scene, config: SceneConfig) => {
    // Create hemispheric light for ambient lighting
    const hemisphericLight = new HemisphericLight(
      "hemisphericLight",
      new Vector3(0, 1, 0),
      scene,
    );
    hemisphericLight.intensity = 0.5;
    hemisphericLight.diffuse = new Color3(1, 1, 0.8);
    hemisphericLight.specular = new Color3(0.2, 0.2, 0.2);

    // Create directional light for sun lighting
    const directionalLight = new DirectionalLight(
      "directionalLight",
      new Vector3(-1, -1, -1),
      scene,
    );
    directionalLight.intensity = 0.8;
    directionalLight.diffuse = new Color3(1, 0.9, 0.7);
    directionalLight.specular = new Color3(0.3, 0.3, 0.3);
    directionalLight.position = new Vector3(50, 100, 50);
  };

  const setupShadows = (scene: Scene, config: SceneConfig) => {
    const directionalLight = scene.getLightByName(
      "directionalLight",
    ) as DirectionalLight;
    if (directionalLight) {
      // Use CascadedShadowGenerator for better quality
      shadowGenerator = new CascadedShadowGenerator(
        config.shadowMapSize || 2048,
        directionalLight,
      );

      shadowGenerator.darkness = config.shadowDarkness || 0.3;
      shadowGenerator.setDarkness(config.shadowDarkness || 0.3);

      if (config.shadowBlurKernel) {
        // shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = config.shadowBlurKernel;
      }

      // Enable soft shadows
      shadowGenerator.usePercentageCloserFiltering = true;
      shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
    }
  };

  const setupFog = (scene: Scene, config: SceneConfig) => {
    try {
      scene.fogMode = config.fogMode || FOGMODE_EXP2;

      if (config.fogColor) {
        scene.fogColor = config.fogColor;
      } else {
        scene.fogColor = new Color3(0.9, 0.9, 0.85);
      }

      if (config.fogMode === FOGMODE_LINEAR) {
        scene.fogStart = config.fogStart || 20;
        scene.fogEnd = config.fogEnd || 200;
      } else {
        scene.fogDensity = config.fogDensity || 0.01;
      }
    } catch (error) {
      console.warn("Fog setup failed:", error);
      // Disable fog on error
      scene.fogMode = FOGMODE_NONE;
    }
  };

  const setupPhysics = async (scene: Scene, config: SceneConfig) => {
    try {
      // Import physics engine dynamically
      const { CannonJSPlugin } = await import(
        "@babylonjs/core/Physics/Plugins/cannonJSPlugin"
      );

      scene.enablePhysics(
        config.gravity || new Vector3(0, -9.81, 0),
        new CannonJSPlugin(),
      );
    } catch (error) {
      console.warn("Physics engine not available:", error);
    }
  };

  const setupAnimationProperties = (scene: Scene, config: SceneConfig) => {
    if (config.animationPropertiesOverride) {
      const override = config.animationPropertiesOverride;

      // Initialize animationPropertiesOverride if it doesn't exist
      if (!scene.animationPropertiesOverride) {
        scene.animationPropertiesOverride = {
          enableBlending: true,
          blendingSpeed: 0.01,
          loopMode: 1,
        };
      }

      if (override.enableBlending !== undefined) {
        scene.animationPropertiesOverride.enableBlending =
          override.enableBlending;
      }

      if (override.blendingSpeed !== undefined) {
        scene.animationPropertiesOverride.blendingSpeed =
          override.blendingSpeed;
      }

      if (override.loopMode !== undefined) {
        scene.animationPropertiesOverride.loopMode = override.loopMode;
      }
    }
  };

  const addShadowCaster = (mesh: any) => {
    if (shadowGenerator && mesh) {
      shadowGenerator.addShadowCaster(mesh, true);
    }
  };

  const addShadowReceiver = (mesh: any) => {
    if (mesh) {
      mesh.receiveShadows = true;
    }
  };

  const getScene = (): Scene | null => {
    return scene;
  };

  const getShadowGenerator = (): ShadowGenerator | null => {
    return shadowGenerator;
  };

  const disposeScene = () => {
    if (shadowGenerator) {
      shadowGenerator.dispose();
      shadowGenerator = null;
    }

    if (scene) {
      scene.dispose();
      scene = null;
    }
  };

  return {
    createScene,
    addShadowCaster,
    addShadowReceiver,
    getScene,
    getShadowGenerator,
    disposeScene,
  };
};
