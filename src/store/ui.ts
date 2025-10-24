import { ref } from "vue";
import { defineStore } from "pinia";
import type { PostProcessingQuality } from "@/composables/usePostProcessing";

export type ShadowQuality = "low" | "medium" | "high";

export const useUiStore = defineStore(
  "ui",
  () => {
    const musicVolume = ref(20);
    const isMusicMuted = ref(false);
    const isUiVisible = ref(true);
    const isLoading = ref(true);
    const hasInteractedWithCharacter = ref(false);
    const graphicsQuality = ref<PostProcessingQuality>("medium");
    const shadowQuality = ref<ShadowQuality>("low"); // Default to low for better performance

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
    const setShadowQuality = (quality: ShadowQuality) =>
      (shadowQuality.value = quality);

    return {
      // State
      musicVolume,
      isMusicMuted,
      isUiVisible,
      isLoading,
      hasInteractedWithCharacter,
      graphicsQuality,
      shadowQuality,
      // Actions
      setMusicVolume,
      toggleMusicMute,
      hideUi,
      showUi,
      setLoading,
      setCharacterInteraction,
      setGraphicsQuality,
      setShadowQuality,
    };
  },
  {
    persist: {
      paths: ["musicVolume", "isMusicMuted", "graphicsQuality", "shadowQuality"],
    },
  },
);
