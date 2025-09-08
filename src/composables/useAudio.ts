import {
  Scene,
  Engine,
  Sound,
  StreamingSound,
  CreateSoundAsync,
  CreateStreamingSoundAsync,
  AudioEngine,
  Vector3,
} from "@babylonjs/core";
import { watch, ref, computed } from "vue";

export type AudioType = "sound" | "streaming";

export interface AudioConfig {
  // Basic audio info
  name: string;
  url: string;
  type?: AudioType;

  // Playback settings
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  playbackRate?: number;

  // Spatial audio settings
  spatialSound?: boolean;
  position?: Vector3;
  maxDistance?: number;
  rolloffFactor?: number;
  refDistance?: number;
  distanceModel?: string;
  panningModel?: string;

  // Advanced settings
  offset?: number;
  length?: number;

  // Callbacks
  onReady?: (audio: Sound | StreamingSound) => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
}

export interface AudioGroup {
  name: string;
  sounds: Map<string, Sound | StreamingSound>;
  volume: number;
  muted: boolean;
}

export interface LoadedAudio {
  sound: Sound | StreamingSound;
  config: AudioConfig;
  dispose: () => void;
}

export const useAudio = () => {
  const audioEngine = ref<AudioEngine | null>(null);
  const audioCache = new Map<string, LoadedAudio>();
  const audioGroups = new Map<string, AudioGroup>();
  const loadingPromises = new Map<string, Promise<LoadedAudio | null>>();

  // Global audio settings
  const masterVolume = ref(1.0);
  const masterMuted = ref(false);

  const initializeAudioEngine = (engine: Engine): AudioEngine | null => {
    try {
      audioEngine.value = engine.getAudioEngine();
      return audioEngine.value;
    } catch (error) {
      console.warn("Failed to initialize audio engine:", error);
      return null;
    }
  };

  const loadAudio = async (
    config: AudioConfig,
  ): Promise<LoadedAudio | null> => {
    try {
      const cacheKey = `${config.url}_${config.name}`;

      // Check cache first
      if (audioCache.has(cacheKey)) {
        const cachedAudio = audioCache.get(cacheKey);
        if (cachedAudio) {
          return cachedAudio;
        }
      }

      // Check if already loading
      if (loadingPromises.has(cacheKey)) {
        return await loadingPromises.get(cacheKey);
      }

      // Start loading
      const loadingPromise = performAudioLoad(config, cacheKey);
      loadingPromises.set(cacheKey, loadingPromise);

      const loadedAudio = await loadingPromise;
      loadingPromises.delete(cacheKey);

      if (loadedAudio) {
        audioCache.set(cacheKey, loadedAudio);
      }

      return loadedAudio;
    } catch (error) {
      console.error("Audio loading failed:", error);
      if (config.onError) {
        config.onError(error);
      }
      return null;
    }
  };

  const performAudioLoad = async (
    config: AudioConfig,
    cacheKey: string,
  ): Promise<LoadedAudio | null> => {
    if (!audioEngine.value) {
      throw new Error("Audio engine not initialized");
    }

    let sound: Sound | StreamingSound;

    try {
      if (config.type === "streaming") {
        sound = await CreateStreamingSoundAsync(
          config.name,
          config.url,
          {
            loop: config.loop || false,
            autoplay: config.autoplay || false,
            volume: config.volume || 1.0,
            playbackRate: config.playbackRate || 1.0,
            spatialSound: config.spatialSound || false,
            maxDistance: config.maxDistance || 100,
            rolloffFactor: config.rolloffFactor || 1,
            refDistance: config.refDistance || 1,
            distanceModel: config.distanceModel || "linear",
            panningModel: config.panningModel || "HRTF",
            offset: config.offset,
            length: config.length,
          },
          audioEngine.value,
        );
      } else {
        sound = await CreateSoundAsync(
          config.name,
          config.url,
          {
            loop: config.loop || false,
            autoplay: config.autoplay || false,
            volume: config.volume || 1.0,
            playbackRate: config.playbackRate || 1.0,
            spatialSound: config.spatialSound || false,
            maxDistance: config.maxDistance || 100,
            rolloffFactor: config.rolloffFactor || 1,
            refDistance: config.refDistance || 1,
            distanceModel: config.distanceModel || "linear",
            panningModel: config.panningModel || "HRTF",
            offset: config.offset,
            length: config.length,
          },
          audioEngine.value,
        );
      }

      // Setup spatial audio position
      if (config.spatialSound && config.position) {
        sound.setPosition(config.position);
      }

      // Setup callbacks
      if (config.onReady) {
        sound.onReady = () => config.onReady!(sound);
      }

      if (config.onEnded) {
        sound.onEnded = config.onEnded;
      }

      const loadedAudio: LoadedAudio = {
        sound,
        config,
        dispose: () => {
          sound.dispose();
        },
      };

      return loadedAudio;
    } catch (error) {
      console.error(`Failed to load audio: ${config.name}`, error);
      throw error;
    }
  };

  const playAudio = (
    nameOrAudio: string | LoadedAudio,
    options?: {
      volume?: number;
      loop?: boolean;
      offset?: number;
    },
  ): boolean => {
    try {
      let audio: LoadedAudio | undefined;

      if (typeof nameOrAudio === "string") {
        audio = getAudioByName(nameOrAudio);
      } else {
        audio = nameOrAudio;
      }

      if (!audio) {
        console.warn(`Audio not found: ${nameOrAudio}`);
        return false;
      }

      if (options?.volume !== undefined) {
        audio.sound.volume = options.volume;
      }

      if (options?.loop !== undefined) {
        audio.sound.loop = options.loop;
      }

      if (options?.offset !== undefined && "setPlaybackRate" in audio.sound) {
        // For regular sounds, we can set offset
        audio.sound.play(0, options.offset);
      } else {
        audio.sound.play();
      }

      return true;
    } catch (error) {
      console.error("Failed to play audio:", error);
      return false;
    }
  };

  const stopAudio = (nameOrAudio: string | LoadedAudio): boolean => {
    try {
      let audio: LoadedAudio | undefined;

      if (typeof nameOrAudio === "string") {
        audio = getAudioByName(nameOrAudio);
      } else {
        audio = nameOrAudio;
      }

      if (!audio) {
        console.warn(`Audio not found: ${nameOrAudio}`);
        return false;
      }

      audio.sound.stop();
      return true;
    } catch (error) {
      console.error("Failed to stop audio:", error);
      return false;
    }
  };

  const pauseAudio = (nameOrAudio: string | LoadedAudio): boolean => {
    try {
      let audio: LoadedAudio | undefined;

      if (typeof nameOrAudio === "string") {
        audio = getAudioByName(nameOrAudio);
      } else {
        audio = nameOrAudio;
      }

      if (!audio) {
        console.warn(`Audio not found: ${nameOrAudio}`);
        return false;
      }

      audio.sound.pause();
      return true;
    } catch (error) {
      console.error("Failed to pause audio:", error);
      return false;
    }
  };

  const setAudioVolume = (
    nameOrAudio: string | LoadedAudio,
    volume: number,
  ): boolean => {
    try {
      let audio: LoadedAudio | undefined;

      if (typeof nameOrAudio === "string") {
        audio = getAudioByName(nameOrAudio);
      } else {
        audio = nameOrAudio;
      }

      if (!audio) {
        console.warn(`Audio not found: ${nameOrAudio}`);
        return false;
      }

      audio.sound.volume = Math.max(0, Math.min(1, volume));
      return true;
    } catch (error) {
      console.error("Failed to set audio volume:", error);
      return false;
    }
  };

  const setAudioPosition = (
    nameOrAudio: string | LoadedAudio,
    position: Vector3,
  ): boolean => {
    try {
      let audio: LoadedAudio | undefined;

      if (typeof nameOrAudio === "string") {
        audio = getAudioByName(nameOrAudio);
      } else {
        audio = nameOrAudio;
      }

      if (!audio) {
        console.warn(`Audio not found: ${nameOrAudio}`);
        return false;
      }

      if (audio.config.spatialSound) {
        audio.sound.setPosition(position);
        return true;
      } else {
        console.warn(`Audio ${audio.config.name} is not spatial`);
        return false;
      }
    } catch (error) {
      console.error("Failed to set audio position:", error);
      return false;
    }
  };

  const createAudioGroup = (
    groupName: string,
    initialVolume: number = 1.0,
  ): AudioGroup => {
    const group: AudioGroup = {
      name: groupName,
      sounds: new Map(),
      volume: initialVolume,
      muted: false,
    };

    audioGroups.set(groupName, group);
    return group;
  };

  const addToAudioGroup = (groupName: string, audioName: string): boolean => {
    const group = audioGroups.get(groupName);
    const audio = getAudioByName(audioName);

    if (!group || !audio) {
      console.warn(`Group or audio not found: ${groupName}, ${audioName}`);
      return false;
    }

    group.sounds.set(audioName, audio.sound);
    return true;
  };

  const setGroupVolume = (groupName: string, volume: number): boolean => {
    const group = audioGroups.get(groupName);
    if (!group) {
      console.warn(`Audio group not found: ${groupName}`);
      return false;
    }

    group.volume = Math.max(0, Math.min(1, volume));

    // Apply volume to all sounds in group
    group.sounds.forEach((sound) => {
      if (!group.muted) {
        sound.volume = group.volume;
      }
    });

    return true;
  };

  const muteAudioGroup = (
    groupName: string,
    muted: boolean = true,
  ): boolean => {
    const group = audioGroups.get(groupName);
    if (!group) {
      console.warn(`Audio group not found: ${groupName}`);
      return false;
    }

    group.muted = muted;

    // Apply mute to all sounds in group
    group.sounds.forEach((sound) => {
      sound.volume = muted ? 0 : group.volume;
    });

    return true;
  };

  const loadMultipleAudio = async (
    configs: AudioConfig[],
  ): Promise<(LoadedAudio | null)[]> => {
    const promises = configs.map((config) => loadAudio(config));
    return Promise.all(promises);
  };

  const getAudioByName = (name: string): LoadedAudio | undefined => {
    for (const [key, audio] of audioCache.entries()) {
      if (audio.config.name === name) {
        return audio;
      }
    }
    return undefined;
  };

  const getLoadedAudio = (cacheKey: string): LoadedAudio | null => {
    return audioCache.get(cacheKey) || null;
  };

  const isAudioPlaying = (nameOrAudio: string | LoadedAudio): boolean => {
    let audio: LoadedAudio | undefined;

    if (typeof nameOrAudio === "string") {
      audio = getAudioByName(nameOrAudio);
    } else {
      audio = nameOrAudio;
    }

    if (!audio) {
      return false;
    }

    return audio.sound.isPlaying;
  };

  const clearAudioCache = () => {
    audioCache.forEach((audio) => audio.dispose());
    audioCache.clear();
    loadingPromises.clear();
  };

  const removeFromCache = (cacheKey: string) => {
    const audio = audioCache.get(cacheKey);
    if (audio) {
      audio.dispose();
      audioCache.delete(cacheKey);
    }
  };

  const getCacheSize = (): number => {
    return audioCache.size;
  };

  const getCacheKeys = (): string[] => {
    return Array.from(audioCache.keys());
  };

  const getAudioGroups = (): string[] => {
    return Array.from(audioGroups.keys());
  };

  const disposeAudio = () => {
    clearAudioCache();
    audioGroups.clear();
    audioEngine.value = null;
  };

  return {
    // Initialization
    initializeAudioEngine,

    // Audio loading
    loadAudio,
    loadMultipleAudio,

    // Playback control
    playAudio,
    stopAudio,
    pauseAudio,

    // Volume control
    setAudioVolume,
    masterVolume,
    masterMuted,

    // Spatial audio
    setAudioPosition,

    // Audio groups
    createAudioGroup,
    addToAudioGroup,
    setGroupVolume,
    muteAudioGroup,
    getAudioGroups,

    // Utility
    getAudioByName,
    getLoadedAudio,
    isAudioPlaying,

    // Cache management
    clearAudioCache,
    removeFromCache,
    getCacheSize,
    getCacheKeys,

    // Cleanup
    disposeAudio,
  };
};
