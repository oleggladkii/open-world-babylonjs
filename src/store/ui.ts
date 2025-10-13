import { ref } from "vue";
import { defineStore } from "pinia";
import type { PostProcessingQuality } from "@/composables/usePostProcessing";

export const useUiStore = defineStore(
  "ui",
  () => {
    const musicVolume = ref(20);
    const isMusicMuted = ref(false);
    const isUiVisible = ref(true);
    const isLoading = ref(true);
    const hasInteractedWithCharacter = ref(false);
    const graphicsQuality = ref<PostProcessingQuality>("medium");

    const setMusicVolume = (value: number) => {
      musicVolume.value = Math.max(0, Math.min(100, value));
      isMusicMuted.value = musicVolume.value === 0;
    };

    const toggleMusicMute = () => (isMusicMuted.value = !isMusicMuted.value);
    const hideUi = () => (isUiVisible.value = false);
    const showUi = () => (isUiVisible.value = true);
    const setLoading = (value: boolean) => (isLoading.value = value);
    const setCharacterInteraction = (value: boolean) =>
      (hasInteractedWithCharacter.value = value);
    const setGraphicsQuality = (quality: PostProcessingQuality) =>
      (graphicsQuality.value = quality);

    return {
      // State
      musicVolume,
      isMusicMuted,
      isUiVisible,
      isLoading,
      hasInteractedWithCharacter,
      graphicsQuality,
      // Actions
      setMusicVolume,
      toggleMusicMute,
      hideUi,
      showUi,
      setLoading,
      setCharacterInteraction,
      setGraphicsQuality,
    };
  },
  {
    persist: {
      paths: ["musicVolume", "isMusicMuted", "graphicsQuality"],
    },
  },
);
