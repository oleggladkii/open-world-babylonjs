import {
  Scene,
  SceneLoader,
  AbstractMesh,
  Mesh,
  Vector3,
  AnimationGroup,
  StandardMaterial,
  PBRMaterial,
  Texture,
  Color3,
} from "@babylonjs/core";

export interface ModelConfig {
  // Basic model info
  name?: string;
  fileName: string;
  rootUrl: string;
  meshNames?: string | string[];

  // Transform settings
  position?: Vector3;
  rotation?: Vector3;
  scaling?: Vector3;

  // Material settings
  materialOverrides?: {
    [meshName: string]: {
      diffuseColor?: Color3;
      specularColor?: Color3;
      emissiveColor?: Color3;
      diffuseTexture?: string;
      normalTexture?: string;
      specularTexture?: string;
    };
  };

  // Animation settings
  autoPlayAnimations?: boolean;
  animationSpeed?: number;
  loopAnimations?: boolean;

  // Shadow settings
  castShadows?: boolean;
  receiveShadows?: boolean;

  // Collision settings
  checkCollisions?: boolean;

  // Visibility settings
  visible?: boolean;

  // Performance settings
  useCache?: boolean;
  optimizeMesh?: boolean;

  // Callbacks
  onLoaded?: (
    meshes: AbstractMesh[],
    animationGroups: AnimationGroup[],
  ) => void;
  onError?: (error: any) => void;
}

export interface LoadedModel {
  meshes: AbstractMesh[];
  animationGroups: AnimationGroup[];
  rootMesh: AbstractMesh | null;
  dispose: () => void;
}

export const useLoadModel = () => {
  const modelCache = new Map<string, LoadedModel>();
  const loadingPromises = new Map<string, Promise<LoadedModel>>();

  const loadModel = async (
    scene: Scene,
    config: ModelConfig,
  ): Promise<LoadedModel | null> => {
    try {
      const cacheKey = `${config.rootUrl}${config.fileName}`;

      // Check cache first if enabled
      if (config.useCache !== false && modelCache.has(cacheKey)) {
        const cachedModel = modelCache.get(cacheKey);
        if (cachedModel) {
          return cloneModel(cachedModel, config);
        }
      }

      // Check if already loading
      if (loadingPromises.has(cacheKey)) {
        const loadedModel = await loadingPromises.get(cacheKey);
        return loadedModel ? cloneModel(loadedModel, config) : null;
      }

      // Start loading
      const loadingPromise = performModelLoad(scene, config, cacheKey);
      loadingPromises.set(cacheKey, loadingPromise);

      const loadedModel = await loadingPromise;
      loadingPromises.delete(cacheKey);

      if (loadedModel && config.useCache !== false) {
        modelCache.set(cacheKey, loadedModel);
      }

      return loadedModel;
    } catch (error) {
      console.error("Model loading failed:", error);
      if (config.onError) {
        config.onError(error);
      }
      return null;
    }
  };

  const performModelLoad = async (
    scene: Scene,
    config: ModelConfig,
    cacheKey: string,
  ): Promise<LoadedModel | null> => {
    const result = await SceneLoader.ImportMeshAsync(
      config.meshNames || "",
      config.rootUrl,
      config.fileName,
      scene,
    );

    if (!result.meshes || result.meshes.length === 0) {
      throw new Error(`No meshes found in model: ${config.fileName}`);
    }

    const meshes = result.meshes;
    const animationGroups = result.animationGroups || [];
    const rootMesh = meshes[0];

    // Apply transformations
    if (config.position) {
      rootMesh.position = config.position.clone();
    }
    if (config.rotation) {
      rootMesh.rotation = config.rotation.clone();
    }
    if (config.scaling) {
      rootMesh.scaling = config.scaling.clone();
    }

    // Apply material overrides
    if (config.materialOverrides) {
      applyMaterialOverrides(meshes, config.materialOverrides, scene);
    }

    // Setup shadows
    if (config.castShadows) {
      meshes.forEach((mesh) => {
        if (mesh instanceof Mesh) {
          // This would be handled by the shadow system
        }
      });
    }

    if (config.receiveShadows) {
      meshes.forEach((mesh) => {
        if (mesh instanceof Mesh) {
          mesh.receiveShadows = true;
        }
      });
    }

    // Setup collisions
    if (config.checkCollisions) {
      meshes.forEach((mesh) => {
        if (mesh instanceof Mesh) {
          mesh.checkCollisions = true;
        }
      });
    }

    // Setup visibility
    if (config.visible !== undefined) {
      meshes.forEach((mesh) => {
        mesh.setEnabled(config.visible!);
      });
    }

    // Setup animations
    if (animationGroups.length > 0) {
      setupAnimations(animationGroups, config);
    }

    // Optimize mesh if requested
    if (config.optimizeMesh) {
      optimizeMeshes(meshes);
    }

    const loadedModel: LoadedModel = {
      meshes,
      animationGroups,
      rootMesh,
      dispose: () => {
        meshes.forEach((mesh) => mesh.dispose());
        animationGroups.forEach((group) => group.dispose());
      },
    };

    // Call onLoaded callback
    if (config.onLoaded) {
      config.onLoaded(meshes, animationGroups);
    }

    return loadedModel;
  };

  const cloneModel = (
    originalModel: LoadedModel,
    config: ModelConfig,
  ): LoadedModel => {
    const clonedMeshes: AbstractMesh[] = [];
    const clonedAnimationGroups: AnimationGroup[] = [];

    // Clone meshes
    originalModel.meshes.forEach((mesh, index) => {
      const clonedMesh = mesh.clone(
        config.name
          ? `${config.name}_${index}`
          : `${mesh.name}_clone_${Date.now()}`,
        null,
      );
      if (clonedMesh) {
        clonedMeshes.push(clonedMesh);
      }
    });

    // Clone animation groups
    originalModel.animationGroups.forEach((group) => {
      const clonedGroup = group.clone(
        config.name
          ? `${config.name}_${group.name}`
          : `${group.name}_clone_${Date.now()}`,
        (oldTarget) => {
          // Find corresponding cloned mesh
          const originalIndex = originalModel.meshes.indexOf(
            oldTarget as AbstractMesh,
          );
          return originalIndex >= 0 ? clonedMeshes[originalIndex] : oldTarget;
        },
      );
      clonedAnimationGroups.push(clonedGroup);
    });

    const rootMesh = clonedMeshes[0] || null;

    // Apply transformations to cloned model
    if (rootMesh) {
      if (config.position) {
        rootMesh.position = config.position.clone();
      }
      if (config.rotation) {
        rootMesh.rotation = config.rotation.clone();
      }
      if (config.scaling) {
        rootMesh.scaling = config.scaling.clone();
      }
    }

    // Setup animations for cloned model
    if (clonedAnimationGroups.length > 0) {
      setupAnimations(clonedAnimationGroups, config);
    }

    return {
      meshes: clonedMeshes,
      animationGroups: clonedAnimationGroups,
      rootMesh,
      dispose: () => {
        clonedMeshes.forEach((mesh) => mesh.dispose());
        clonedAnimationGroups.forEach((group) => group.dispose());
      },
    };
  };

  const applyMaterialOverrides = (
    meshes: AbstractMesh[],
    overrides: any,
    scene: Scene,
  ) => {
    meshes.forEach((mesh) => {
      if (mesh instanceof Mesh && overrides[mesh.name]) {
        const override = overrides[mesh.name];
        let material = mesh.material as StandardMaterial | PBRMaterial;

        if (!material) {
          material = new StandardMaterial(`${mesh.name}_material`, scene);
          mesh.material = material;
        }

        if (material instanceof StandardMaterial) {
          if (override.diffuseColor) {
            material.diffuseColor = override.diffuseColor;
          }
          if (override.specularColor) {
            material.specularColor = override.specularColor;
          }
          if (override.emissiveColor) {
            material.emissiveColor = override.emissiveColor;
          }
          if (override.diffuseTexture) {
            material.diffuseTexture = new Texture(
              override.diffuseTexture,
              scene,
            );
          }
          if (override.normalTexture) {
            material.bumpTexture = new Texture(override.normalTexture, scene);
          }
          if (override.specularTexture) {
            material.specularTexture = new Texture(
              override.specularTexture,
              scene,
            );
          }
        }
      }
    });
  };

  const setupAnimations = (
    animationGroups: AnimationGroup[],
    config: ModelConfig,
  ) => {
    animationGroups.forEach((group) => {
      if (config.animationSpeed !== undefined) {
        group.speedRatio = config.animationSpeed;
      }

      if (config.autoPlayAnimations) {
        group.play(config.loopAnimations !== false);
      }
    });
  };

  const optimizeMeshes = (meshes: AbstractMesh[]) => {
    meshes.forEach((mesh) => {
      if (mesh instanceof Mesh) {
        // Basic optimization
        mesh.freezeWorldMatrix();
        mesh.doNotSyncBoundingInfo = true;
      }
    });
  };

  const loadMultipleModels = async (
    scene: Scene,
    configs: ModelConfig[],
  ): Promise<(LoadedModel | null)[]> => {
    const promises = configs.map((config) => loadModel(scene, config));
    return Promise.all(promises);
  };

  const getLoadedModel = (cacheKey: string): LoadedModel | null => {
    return modelCache.get(cacheKey) || null;
  };

  const clearCache = () => {
    modelCache.forEach((model) => model.dispose());
    modelCache.clear();
    loadingPromises.clear();
  };

  const removeFromCache = (cacheKey: string) => {
    const model = modelCache.get(cacheKey);
    if (model) {
      model.dispose();
      modelCache.delete(cacheKey);
    }
  };

  const getCacheSize = (): number => {
    return modelCache.size;
  };

  const getCacheKeys = (): string[] => {
    return Array.from(modelCache.keys());
  };

  return {
    loadModel,
    loadMultipleModels,
    getLoadedModel,
    clearCache,
    removeFromCache,
    getCacheSize,
    getCacheKeys,
  };
};
