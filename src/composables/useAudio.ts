import { ref, computed } from "vue";
import { Sound, Vector3 } from "@babylonjs/core";

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
  const sounds = ref<Map<string, Sound>>(new Map());
  const masterVolume = ref(1);

  // Load audio file
  const loadAudio = (
    name: string,
    url: string,
    config: AudioConfig = {},
  ): Sound | null => {
    const existingSound = sounds.value.get(name);
    if (existingSound) {
      return existingSound;
    }

    try {
      const sound = new Sound(name, url, null, () => config.onReady?.(), {
        autoplay: config.autoplay ?? false,
        loop: config.loop ?? false,
        volume: (config.volume ?? 1) * masterVolume.value,
        spatialSound: config.spatialSound ?? false,
        maxDistance: config.maxDistance ?? 100,
        rolloffFactor: config.rolloffFactor ?? 1,
        refDistance: config.refDistance ?? 1,
      });

      if (config.onEnded) {
        sound.onended = config.onEnded;
      }

      sounds.value.set(name, sound);
      return sound;
    } catch (error) {
      console.error(`Failed to load audio: ${name}`, error);
      return null;
    }
  };

  // Play audio
  const playAudio = (name: string, delay: number = 0): boolean => {
    const sound = sounds.value.get(name);
    if (sound && sound.isReady()) {
      if (delay > 0) {
        setTimeout(() => sound.play(), delay * 1000);
      } else {
        sound.play();
      }
      return true;
    }
    return false;
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
