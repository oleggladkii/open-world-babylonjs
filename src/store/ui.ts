import { ref } from "vue";
import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", () => {
  const musicVolume = ref(20);
  const isMusicMuted = ref(false);
  const isUiVisible = ref(true);
  const isLoading = ref(true);
  const hasInteractedWithCharacter = ref(false);

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

  return {
    // State
    musicVolume,
    isMusicMuted,
    isUiVisible,
    isLoading,
    hasInteractedWithCharacter,
    // Actions
    setMusicVolume,
    toggleMusicMute,
    hideUi,
    showUi,
    setLoading,
    setCharacterInteraction,
  };
});
