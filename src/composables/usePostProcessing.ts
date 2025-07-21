import {
  DefaultRenderingPipeline,
  ImageProcessingConfiguration,
} from "@babylonjs/core";
import type { Scene, ArcRotateCamera } from "@babylonjs/core";

export function createPostProcessing(scene: Scene, camera: ArcRotateCamera) {
  const pipeline = new DefaultRenderingPipeline(
    "defaultPipeline",
    true,
    scene,
    [camera]
  );
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.contrast = 1.1;
  pipeline.imageProcessing.exposure = 1.05;
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.toneMappingType =
    ImageProcessingConfiguration.TONEMAPPING_ACES;
}
