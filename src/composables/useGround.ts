import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Vector3,
  Color3,
  GroundMesh,
} from "@babylonjs/core";

export interface GroundConfig {
  name?: string;
  width: number;
  height: number;
  textureUrl?: string;
  position?: Vector3;
  subdivisions?: number;
  minHeight?: number;
  maxHeight?: number;
  heightMapUrl?: string;
  receiveShadows?: boolean;
  diffuseColor?: Color3;
  specularColor?: Color3;
  ambientColor?: Color3;
}

export const useGround = () => {
  const createGround = (scene: Scene, config: GroundConfig): GroundMesh => {
    let ground: GroundMesh;

    if (config.heightMapUrl) {
      ground = MeshBuilder.CreateGroundFromHeightMap(
        config.name || "ground",
        config.heightMapUrl,
        {
          width: config.width,
          height: config.height,
          minHeight: config.minHeight || 0,
          maxHeight: config.maxHeight || 10,
          subdivisions: config.subdivisions || 20,
        },
        scene,
      );
    } else {
      ground = MeshBuilder.CreateGround(
        config.name || "ground",
        {
          width: config.width,
          height: config.height,
          subdivisions: config.subdivisions || 20,
        },
        scene,
      );
    }

    if (config.position) {
      ground.position = config.position;
    }

    const groundMat = new StandardMaterial(
      `${config.name || "ground"}Mat`,
      scene,
    );

    if (config.textureUrl) {
      const texture = new Texture(config.textureUrl, scene);
      groundMat.diffuseTexture = texture;
    }

    if (config.diffuseColor) {
      groundMat.diffuseColor = config.diffuseColor;
    }

    if (config.specularColor) {
      groundMat.specularColor = config.specularColor;
    }

    if (config.ambientColor) {
      groundMat.ambientColor = config.ambientColor;
    }

    ground.material = groundMat;
    ground.receiveShadows = true;

    return ground;
  };
  return {
    createGround,
  };
};
