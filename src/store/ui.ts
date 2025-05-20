import { ref } from "vue";
import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", () => {
  const volume = ref(30);
  const isMuted = ref(true);
  const isUiVisible = ref(true);
  const isLoading = ref(true);

  const setVolume = (value: number) => {
    volume.value = Math.max(0, Math.min(100, value));
    isMuted.value = volume.value === 0;
  };

  const toggleMute = () => (isMuted.value = !isMuted.value);
  const hideUi = () => (isUiVisible.value = false);
  const showUi = () => (isUiVisible.value = true);
  const setLoading = (value: boolean) => (isLoading.value = value);

  return {
    // State
    volume,
    isMuted,
    isUiVisible,
    isLoading,
    // Actions
    setVolume,
    toggleMute,
    hideUi,
    showUi,
    setLoading,
  };
});
