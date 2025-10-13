# Post-Processing System

## Overview

The post-processing system provides a preset-based approach to managing visual effects quality. It allows users to choose between three quality levels that balance visual fidelity with performance.

## Quality Presets

### Low
- **FXAA antialiasing only**
- Best performance
- Recommended for: Low-end devices, mobile
- Effects: Basic antialiasing + tone mapping

### Medium (Default)
- **Moderate visual effects**
- Balanced performance/quality
- Recommended for: Most devices
- Effects:
  - FXAA antialiasing
  - Light bloom (glow on bright objects)
  - Subtle vignette (darkened edges)
  - Tone mapping with ACES

### High
- **Full visual effects**
- Best visual quality, higher GPU load
- Recommended for: High-end devices
- Effects:
  - FXAA antialiasing (4x samples)
  - Enhanced bloom
  - Chromatic aberration (lens effect)
  - Vignette
  - Animated film grain
  - Tone mapping with ACES

## Usage

### Basic Usage (Legacy API)

```typescript
import { createPostProcessing } from "@/composables/usePostProcessing";

// Create with default quality (low)
createPostProcessing(scene, camera);

// Create with specific quality
createPostProcessing(scene, camera, { quality: "medium" });

// Override specific effects
createPostProcessing(scene, camera, { 
  quality: "high",
  enableGrain: false // Disable grain even on high preset
});
```

### Composable Pattern (Recommended)

```typescript
import { usePostProcessing } from "@/composables/usePostProcessing";

const { 
  createPostProcessing, 
  setQuality, 
  dispose 
} = usePostProcessing();

// Create pipeline
const pipeline = createPostProcessing(scene, camera, { 
  quality: uiStore.graphicsQuality 
});

// Change quality dynamically
setQuality("high");

// Cleanup
dispose();
```

### Integration with Pinia Store

The system automatically syncs with the UI store:

```typescript
// In your component
import { useUiStore } from "@/store/ui";

const uiStore = useUiStore();

// User preference is persisted in localStorage
uiStore.setGraphicsQuality("high");

// Watch for changes
watch(
  () => uiStore.graphicsQuality,
  (newQuality) => {
    setPostProcessingQuality(newQuality);
  }
);
```

## UI Controls

Graphics quality can be changed from the main menu settings panel (top-left corner):
- Volume control slider
- **Graphics quality dropdown** (Low / Medium / High)

User selection is automatically saved to localStorage and restored on next session.

## Performance Impact

| Quality | FPS Impact | GPU Load | Memory |
|---------|-----------|----------|--------|
| Low     | Minimal   | ~5-10%   | Low    |
| Medium  | Moderate  | ~15-25%  | Medium |
| High    | High      | ~30-40%  | High   |

## Custom Configuration

You can override specific effects while using a preset:

```typescript
createPostProcessing(scene, camera, {
  quality: "medium",
  enableBloom: false,        // Disable bloom
  enableVignette: true,      // Force enable vignette
  enableChromaticAberration: true // Force enable CA
});
```

## Technical Details

The system uses Babylon.js `DefaultRenderingPipeline` which includes:
- FXAA (Fast Approximate Anti-Aliasing)
- Bloom (HDR glow effect)
- Chromatic Aberration (lens color fringing)
- Vignette (edge darkening)
- Grain (film-like noise)
- Image Processing (contrast, exposure, tone mapping)

All effects are GPU-accelerated and use post-process shaders.

