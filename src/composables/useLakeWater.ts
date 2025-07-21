import { useUiStore } from "@/store/ui";
import {
  Scene,
  Mesh,
  Vector2,
  Vector3,
  Texture,
  Color3,
  MeshBuilder,
  PointerInfo,
  PointerEventTypes,
  AudioEngineV2,
  CreateStreamingSoundAsync,
  StreamingSound,
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";
import { watch } from "vue";

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
  const createLakeWater = async (
    scene: Scene,
    audioEngine: AudioEngineV2,
    options: LakeWaterOptions = {}
  ): Promise<{
    waterMesh: Mesh;
    waterMaterial: WaterMaterial;
    addReflectionTarget: (mesh: Mesh) => void;
    dispose: () => void;
  }> => {
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

    const uiStore = useUiStore();

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
    waterMesh.rotation.x = Math.PI / 2;

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

    waterMesh.material = waterMaterial;
    waterMesh.visibility = 0.97;
    waterMesh.renderingGroupId = 1;

    let waterSound: StreamingSound | null = null;
    if (audioEngine) {
      try {
        waterSound = await CreateStreamingSoundAsync(
          "waterDrip",
          "assets/sounds/water-drip.mp3",
          {
            loop: false,
            autoplay: false,
          },
          audioEngine
        );
        console.log("Water sound loaded successfully");
      } catch (error) {
        console.error("Failed to load water sound:", error);
      }
    }
    watch(
      () => uiStore.soundsVolume,
      (newVolume) => {
        if (waterSound) {
          waterSound.volume = newVolume / 100;
        }
      },
      {
        immediate: true,
      }
    );
    watch(
      () => uiStore.isSoundsMuted,
      (isMuted) => {
        if (waterSound) {
          waterSound.volume = isMuted ? 0 : uiStore.soundsVolume / 100;
        }
      },
      {
        immediate: true,
      }
    );

    scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        if (
          pointerInfo.pickInfo?.hit &&
          pointerInfo.pickInfo.pickedMesh === waterMesh
        ) {
          if (waterSound) {
            waterSound.play();
          }
        }
      }
    });

    const addReflectionTarget = (mesh: Mesh) => {
      waterMaterial.addToRenderList(mesh);
    };

    return {
      waterMesh,
      waterMaterial,
      addReflectionTarget,
      dispose: () => {
        if (waterSound) {
          waterSound.dispose();
        }
        waterMesh.dispose();
        waterMaterial.dispose();
      },
    };
  };

  return {
    createLakeWater,
  };
};
