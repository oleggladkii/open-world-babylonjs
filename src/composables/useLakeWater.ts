import {
  Scene,
  Mesh,
  Vector2,
  Vector3,
  Texture,
  Color3,
  MeshBuilder,
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";

interface LakeWaterOptions {
  size?: number;
  subdivisions?: number;
  position?: Vector3;
  windForce?: number;
  waveHeight?: number;
  bumpHeight?: number;
  waterColor?: Color3;
  colorBlendFactor?: number;
  bumpTextureUrl?: string;
}

export const useLakeWater = () => {
  const createLakeWater = (
    scene: Scene,
    options: LakeWaterOptions = {}
  ): {
    waterMesh: Mesh;
    waterMaterial: WaterMaterial;
    addReflectionTarget: (mesh: Mesh) => void;
    dispose: () => void;
  } => {
    const {
      size = 100,
      subdivisions = 10,
      position = new Vector3(0, 0, 0),
      windForce = 30,
      waveHeight = 0.2,
      bumpHeight = 0.05,
      waterColor = new Color3(0.047, 0.23, 0.015),
      colorBlendFactor = 0.5,
      bumpTextureUrl = "/assets/textures/waterbump.png",
    } = options;

    // Create water mesh
    const waterMesh = MeshBuilder.CreateDisc(
      "waterMesh",
      {
        radius: size / 2,
        tessellation: subdivisions * 2,
      },
      scene
    );
    waterMesh.position = position;
    waterMesh.rotation.x = Math.PI / 2; // Rotate to be horizontal

    // Create water material
    const waterMaterial = new WaterMaterial(
      "water",
      scene,
      new Vector2(size, size)
    );
    waterMaterial.backFaceCulling = true;
    waterMaterial.bumpTexture = new Texture(bumpTextureUrl, scene);
    waterMaterial.windForce = windForce;
    waterMaterial.waveHeight = waveHeight;
    waterMaterial.bumpHeight = bumpHeight;
    waterMaterial.waterColor = waterColor;
    waterMaterial.colorBlendFactor = colorBlendFactor;

    // Apply material to mesh
    waterMesh.material = waterMaterial;

    // Add reflection targets
    const addReflectionTarget = (mesh: Mesh) => {
      waterMaterial.addToRenderList(mesh);
    };

    return {
      waterMesh,
      waterMaterial,
      addReflectionTarget,
      dispose: () => {
        waterMesh.dispose();
        waterMaterial.dispose();
      },
    };
  };

  return {
    createLakeWater,
  };
};
