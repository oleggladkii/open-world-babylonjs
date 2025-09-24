import { ref, computed, watch } from "vue";
import {
  CreateAudioEngineAsync,
  CreateSoundAsync,
  Vector3,
} from "@babylonjs/core";
import type { AudioEngineV2, StaticSound } from "@babylonjs/core";
import { useUiStore } from "@/store/ui";

export interface AudioConfig {
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  spatialSound?: boolean;
  maxDistance?: number;
  rolloffFactor?: number;
  refDistance?: number;
  onReady?: () => void;
  onEnded?: () => void;
}

export function useAudio() {
  const sounds = ref<Map<string, StaticSound>>(new Map());
  const soundConfigs = ref<Map<string, AudioConfig>>(new Map()); // Store original configs
  const uiStore = useUiStore();
  const masterVolume = ref(1);
  let audioEngine: AudioEngineV2 | null = null;

  // Initialize audio engine
  const initAudioEngine = async (): Promise<AudioEngineV2 | null> => {
    if (audioEngine) return audioEngine;

    try {
      audioEngine = await CreateAudioEngineAsync();

      // Wait for audio engine to be unlocked
      await audioEngine.unlockAsync();

      return audioEngine;
    } catch (error) {
      console.error("Failed to create audio engine:", error);
      return null;
    }
  };

  // Load audio file using new Babylon.js API
  const loadAudio = async (
    name: string,
    url: string,
    config: AudioConfig = {},
  ): Promise<StaticSound | null> => {
    const existingSound = sounds.value.get(name);
    if (existingSound) {
      return existingSound;
    }

    try {
      // Ensure audio engine is initialized
      const engine = await initAudioEngine();
      if (!engine) {
        console.error("Audio engine not available");
        return null;
      }

      const finalVolume = (config.volume ?? 1) * (uiStore.musicVolume / 100);


      const sound = await CreateSoundAsync(name, url, {
        loop: config.loop ?? false,
        volume: finalVolume,
        spatialEnabled: config.spatialSound ?? false,
        maxInstances: 1,
      });

      if (config.onReady) {
        config.onReady();
      }

      sounds.value.set(name, sound);
      soundConfigs.value.set(name, config); // Store config for later volume updates
      return sound;
    } catch (error) {
      console.error(`Failed to load audio: ${name}`, error);
      return null;
    }
  };

  // Play audio
  const playAudio = (name: string, delay: number = 0): boolean => {
    const sound = sounds.value.get(name);

    if (!sound) {
      return false;
    }

    if (delay > 0) {
      setTimeout(() => {
        sound.play();
      }, delay * 1000);
    } else {
      sound.play();
    }
    return true;
  };

  // Stop audio
  const stopAudio = (name: string): boolean => {
    const sound = sounds.value.get(name);
    if (sound) {
      sound.stop();
      return true;
    }
    return false;
  };

  // Pause audio
  const pauseAudio = (name: string): boolean => {
    const sound = sounds.value.get(name);
    if (sound) {
      sound.pause();
      return true;
    }
    return false;
  };

  // Set volume for specific audio
  const setAudioVolume = (name: string, volume: number): boolean => {
    const sound = sounds.value.get(name);
    if (sound) {
      sound.setVolume(Math.max(0, Math.min(1, volume)));
      return true;
    }
    return false;
  };

  // Set master volume
  const setMasterVolume = (volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    const volumeRatio = newVolume / masterVolume.value;
    masterVolume.value = newVolume;

    // Apply volume ratio to all sounds
    sounds.value.forEach((sound) => {
      const currentVolume = sound.getVolume();
      sound.setVolume(currentVolume * volumeRatio);
    });
  };

  // Update audio position (for spatial audio)
  const updateAudioPosition = (name: string, position: Vector3): boolean => {
    const sound = sounds.value.get(name);
    if (sound && sound.spatialSound) {
      sound.setPosition(position);
      return true;
    }
    return false;
  };

  // Check if audio is playing
  const isAudioPlaying = (name: string): boolean => {
    const sound = sounds.value.get(name);
    return sound ? sound.isPlaying : false;
  };

  // Cleanup
  const dispose = () => {
    sounds.value.forEach((sound) => {
      sound.dispose();
    });
    sounds.value.clear();
  };

  // Computed properties
  const loadedSounds = computed(() => Array.from(sounds.value.keys()));
  const playingSounds = computed(() =>
    Array.from(sounds.value.entries())
      .filter(([_, sound]) => sound.isPlaying)
      .map(([name, _]) => name),
  );

  // Watch for musicVolume changes and update all loaded sounds
  watch(
    () => uiStore.musicVolume,
    (newVolume) => {
      sounds.value.forEach((sound, name) => {
        const config = soundConfigs.value.get(name);
        if (config) {
          const newSoundVolume = (config.volume ?? 1) * (newVolume / 100);
          sound.volume = newSoundVolume;
        }
      });
    },
  );

  return {
    // State
    masterVolume,
    loadedSounds,
    playingSounds,

    // Core methods
    loadAudio,
    playAudio,
    stopAudio,
    pauseAudio,

    // Volume control
    setAudioVolume,
    setMasterVolume,

    // Spatial audio
    updateAudioPosition,

    // Status
    isAudioPlaying,

    // Cleanup
    dispose,
  };
}
