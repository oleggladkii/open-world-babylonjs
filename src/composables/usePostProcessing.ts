import {
  DefaultRenderingPipeline,
  ImageProcessingConfiguration,
} from "@babylonjs/core";
import type { Scene, ArcRotateCamera } from "@babylonjs/core";

export type PostProcessingQuality = "low" | "medium" | "high";

export interface PostProcessingConfig {
  quality?: PostProcessingQuality;
  enableFXAA?: boolean;
  enableBloom?: boolean;
  enableChromaticAberration?: boolean;
  enableVignette?: boolean;
  enableGrain?: boolean;
}

interface QualityPreset {
  fxaa: boolean;
  bloom: boolean;
  bloomScale: number;
  bloomThreshold: number;
  bloomWeight: number;
  chromaticAberration: boolean;
  chromaticAberrationAmount: number;
  vignette: boolean;
  vignetteWeight: number;
  grain: boolean;
  grainIntensity: number;
  samples: number;
}

const QUALITY_PRESETS: Record<PostProcessingQuality, QualityPreset> = {
  low: {
    fxaa: true,
    bloom: false,
    bloomScale: 0,
    bloomThreshold: 0,
    bloomWeight: 0,
    chromaticAberration: false,
    chromaticAberrationAmount: 0,
    vignette: false,
    vignetteWeight: 0,
    grain: false,
    grainIntensity: 0,
    samples: 1,
  },
  medium: {
    fxaa: true,
    bloom: true,
    bloomScale: 0.5,
    bloomThreshold: 0.8,
    bloomWeight: 0.3,
    chromaticAberration: false,
    chromaticAberrationAmount: 0,
    vignette: true,
    vignetteWeight: 1.5,
    grain: false,
    grainIntensity: 0,
    samples: 2,
  },
  high: {
    fxaa: true,
    bloom: true,
    bloomScale: 0.7,
    bloomThreshold: 0.7,
    bloomWeight: 0.5,
    chromaticAberration: true,
    chromaticAberrationAmount: 1.5,
    vignette: true,
    vignetteWeight: 2.0,
    grain: true,
    grainIntensity: 10,
    samples: 4,
  },
};

export const usePostProcessing = () => {
  let pipeline: DefaultRenderingPipeline | null = null;

  const createPostProcessing = (
    scene: Scene,
    camera: ArcRotateCamera,
    config: PostProcessingConfig = {},
  ): DefaultRenderingPipeline => {
    const quality = config.quality || "low";
    const preset = QUALITY_PRESETS[quality];

    pipeline = new DefaultRenderingPipeline(
      "defaultPipeline",
      preset.fxaa,
      scene,
      [camera],
    );

    // Base image processing settings
    pipeline.imageProcessingEnabled = true;
    pipeline.imageProcessing.contrast = 1.4;
    pipeline.imageProcessing.exposure = 1.05;
    pipeline.imageProcessing.toneMappingEnabled = true;
    pipeline.imageProcessing.toneMappingType =
      ImageProcessingConfiguration.TONEMAPPING_ACES;

    // FXAA antialiasing
    pipeline.fxaaEnabled = config.enableFXAA ?? preset.fxaa;

    // Bloom effect - adds glow to bright areas
    const enableBloom = config.enableBloom ?? preset.bloom;
    pipeline.bloomEnabled = enableBloom;
    if (enableBloom) {
      pipeline.bloomScale = preset.bloomScale;
      pipeline.bloomThreshold = preset.bloomThreshold;
      pipeline.bloomWeight = preset.bloomWeight;
    }

    // Chromatic aberration - simulates lens color fringing
    const enableCA =
      config.enableChromaticAberration ?? preset.chromaticAberration;
    pipeline.chromaticAberrationEnabled = enableCA;
    if (enableCA) {
      pipeline.chromaticAberration.aberrationAmount =
        preset.chromaticAberrationAmount;
    }

    // Vignette - darkens edges for cinematic look
    const enableVignette = config.enableVignette ?? preset.vignette;
    if (enableVignette) {
      pipeline.imageProcessing.vignetteEnabled = true;
      pipeline.imageProcessing.vignetteWeight = preset.vignetteWeight;
      pipeline.imageProcessing.vignetteCameraFov = 0.8;
    }

    // Grain - adds film-like noise texture
    const enableGrain = config.enableGrain ?? preset.grain;
    if (enableGrain) {
      pipeline.grainEnabled = true;
      pipeline.grain.intensity = preset.grainIntensity;
      pipeline.grain.animated = true;
    }

    // Samples for antialiasing quality
    pipeline.samples = preset.samples;

    return pipeline;
  };

  const setQuality = (quality: PostProcessingQuality) => {
    if (!pipeline) return;

    const preset = QUALITY_PRESETS[quality];

    pipeline.fxaaEnabled = preset.fxaa;
    pipeline.bloomEnabled = preset.bloom;
    pipeline.chromaticAberrationEnabled = preset.chromaticAberration;
    pipeline.grainEnabled = preset.grain;
    pipeline.samples = preset.samples;

    if (preset.bloom) {
      pipeline.bloomScale = preset.bloomScale;
      pipeline.bloomThreshold = preset.bloomThreshold;
      pipeline.bloomWeight = preset.bloomWeight;
    }

    if (preset.chromaticAberration) {
      pipeline.chromaticAberration.aberrationAmount =
        preset.chromaticAberrationAmount;
    }

    if (preset.vignette) {
      pipeline.imageProcessing.vignetteEnabled = true;
      pipeline.imageProcessing.vignetteWeight = preset.vignetteWeight;
    } else {
      pipeline.imageProcessing.vignetteEnabled = false;
    }

    if (preset.grain) {
      pipeline.grain.intensity = preset.grainIntensity;
    }
  };

  const dispose = () => {
    if (pipeline) {
      pipeline.dispose();
      pipeline = null;
    }
  };

  return {
    createPostProcessing,
    setQuality,
    dispose,
  };
};

// Legacy export for backward compatibility
export function createPostProcessing(
  scene: Scene,
  camera: ArcRotateCamera,
  config: PostProcessingConfig = {},
): DefaultRenderingPipeline {
  const { createPostProcessing: create } = usePostProcessing();
  return create(scene, camera, config);
}
