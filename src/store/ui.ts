import { ref } from "vue";
import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", () => {
  const musicVolume = ref(20);
  const soundsVolume = ref(20);
  const isMusicMuted = ref(true);
  const isSoundsMuted = ref(false);
  const isUiVisible = ref(true);
  const isLoading = ref(true);

  const setMusicVolume = (value: number) => {
    musicVolume.value = Math.max(0, Math.min(100, value));
    isMusicMuted.value = musicVolume.value === 0;
  };

  const setSoundsVolume = (value: number) => {
    soundsVolume.value = Math.max(0, Math.min(100, value));
    isSoundsMuted.value = soundsVolume.value === 0;
  };

  const toggleMusicMute = () => (isMusicMuted.value = !isMusicMuted.value);
  const toggleSoundsMute = () => (isSoundsMuted.value = !isSoundsMuted.value);
  const hideUi = () => (isUiVisible.value = false);
  const showUi = () => (isUiVisible.value = true);
  const setLoading = (value: boolean) => (isLoading.value = value);

  return {
    // State
    musicVolume,
    soundsVolume,
    isMusicMuted,
    isSoundsMuted,
    isUiVisible,
    isLoading,
    // Actions
    setMusicVolume,
    setSoundsVolume,
    toggleMusicMute,
    toggleSoundsMute,
    hideUi,
    showUi,
    setLoading,
  };
});
