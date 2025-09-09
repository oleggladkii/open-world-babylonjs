import { ref, computed } from "vue";
import { Sound, Engine, Vector3 } from "@babylonjs/core";

export interface AudioConfig {
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  playbackRate?: number;
  spatialSound?: boolean;
  maxDistance?: number;
  rolloffFactor?: number;
  refDistance?: number;
  distanceModel?: string;
  panningModel?: string;
  offset?: number;
  length?: number;
  onReady?: () => void;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export interface AudioGroup {
  name: string;
  volume: number;
  muted: boolean;
  sounds: Set<string>;
}

export function useAudio() {
  const audioEngine = ref<Engine | null>(null);
  const sounds = ref<Map<string, Sound>>(new Map());
  const audioCache = ref<Map<string, ArrayBuffer>>(new Map());
  const audioGroups = ref<Map<string, AudioGroup>>(new Map());
  const masterVolume = ref(1);
  const isInitialized = ref(false);

  // Initialize audio engine
  const initAudioEngine = async () => {
    if (isInitialized.value) return;

    try {
      // Audio engine is automatically initialized with Babylon.js
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to initialize audio engine:", error);
    }
  };

  // Load audio file
  const loadAudio = async (
    name: string,
    url: string,
    config: AudioConfig = {},
  ): Promise<Sound | null> => {
    try {
      await initAudioEngine();

      if (sounds.value.has(name)) {
        return sounds.value.get(name)!;
      }

      const sound = new Sound(
        name,
        url,
        null,
        () => {
          config.onReady?.();
        },
        {
          autoplay: config.autoplay || false,
          loop: config.loop || false,
          volume: config.volume || 1,
          playbackRate: config.playbackRate || 1,
          spatialSound: config.spatialSound || false,
          maxDistance: config.maxDistance || 100,
          rolloffFactor: config.rolloffFactor || 1,
          refDistance: config.refDistance || 1,
          distanceModel: config.distanceModel || "linear",
          offset: config.offset,
          length: config.length,
        },
      );

      if (config.onError) {
        // Handle error through sound events
        sound.onended = () => {
          if (!sound.isReady()) {
            config.onError?.(new Error(`Failed to load sound: ${name}`));
          }
        };
      }

      if (config.onEnded) {
        sound.onended = config.onEnded;
      }

      sounds.value.set(name, sound);
      return sound;
    } catch (error) {
      console.error(`Failed to load audio: ${name}`, error);
      config.onError?.(error);
      return null;
    }
  };

  // Load multiple audio files
  const loadMultipleAudio = async (
    audioList: Array<{ name: string; url: string; config?: AudioConfig }>,
  ): Promise<Map<string, Sound | null>> => {
    const results = new Map<string, Sound | null>();

    await Promise.all(
      audioList.map(async ({ name, url, config }) => {
        const sound = await loadAudio(name, url, config);
        results.set(name, sound);
      }),
    );

    return results;
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
    masterVolume.value = Math.max(0, Math.min(1, volume));
    // Apply master volume to all sounds
    sounds.value.forEach((sound) => {
      const currentVolume = sound.getVolume();
      sound.setVolume(currentVolume * masterVolume.value);
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

  // Audio groups management
  const createAudioGroup = (
    groupName: string,
    volume: number = 1,
    muted: boolean = false,
  ) => {
    audioGroups.value.set(groupName, {
      name: groupName,
      volume,
      muted,
      sounds: new Set(),
    });
  };

  const addToGroup = (soundName: string, groupName: string): boolean => {
    const group = audioGroups.value.get(groupName);
    if (group && sounds.value.has(soundName)) {
      group.sounds.add(soundName);
      return true;
    }
    return false;
  };

  const removeFromGroup = (soundName: string, groupName: string): boolean => {
    const group = audioGroups.value.get(groupName);
    if (group) {
      group.sounds.delete(soundName);
      return true;
    }
    return false;
  };

  const setGroupVolume = (groupName: string, volume: number): boolean => {
    const group = audioGroups.value.get(groupName);
    if (group) {
      group.volume = Math.max(0, Math.min(1, volume));
      group.sounds.forEach((soundName) => {
        const sound = sounds.value.get(soundName);
        if (sound && !group.muted) {
          sound.setVolume(group.volume);
        }
      });
      return true;
    }
    return false;
  };

  const setGroupMuted = (groupName: string, muted: boolean): boolean => {
    const group = audioGroups.value.get(groupName);
    if (group) {
      group.muted = muted;
      group.sounds.forEach((soundName) => {
        const sound = sounds.value.get(soundName);
        if (sound) {
          sound.setVolume(muted ? 0 : group.volume);
        }
      });
      return true;
    }
    return false;
  };

  // Cache management
  const clearCache = () => {
    audioCache.value.clear();
  };

  const removeCachedAudio = (name: string): boolean => {
    return audioCache.value.delete(name);
  };

  const getCacheInfo = () => {
    return {
      size: audioCache.value.size,
      keys: Array.from(audioCache.value.keys()),
    };
  };

  // Cleanup
  const dispose = () => {
    sounds.value.forEach((sound) => {
      sound.dispose();
    });
    sounds.value.clear();
    audioCache.value.clear();
    audioGroups.value.clear();
    isInitialized.value = false;
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
    isInitialized,
    masterVolume,
    loadedSounds,
    playingSounds,

    // Core methods
    initAudioEngine,
    loadAudio,
    loadMultipleAudio,
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

    // Groups
    createAudioGroup,
    addToGroup,
    removeFromGroup,
    setGroupVolume,
    setGroupMuted,

    // Cache management
    clearCache,
    removeCachedAudio,
    getCacheInfo,

    // Cleanup
    dispose,
  };
}
