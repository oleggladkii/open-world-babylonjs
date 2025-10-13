<template lang="pug">
.main-map-ui(v-if="uiStore.isUiVisible")
  .overlay
  .main-title(ref="titleRef") Powered by Babylon.js
  .about-container(ref="aboutContainer")
    .camera-controls-panel
      .controls-section
        h5 About
        p This is a demo project built with Babylon.js, showcasing the capabilities of a powerful WebGL engine for interactive 3D environments on the web. It highlights features like real-time lighting, smooth camera transitions, animations and more.
      .controls-section
        h5 Used technologies
        p 
          strong Babylon.js
          span - core WebGL engine for rendering 3D environments, lighting, materials, animations, and camera control
        p 
          strong GSAP
          span — used for smooth UI transitions and advanced timeline-based animations
        p 
          strong Vue 3
          span - reactive UI framework used to manage components and UI state
      button.back-button(@click="isShowAbout = false") Back
  .main-controls(ref="menuContainer")
    template(v-if="isShowControls")
      .camera-controls-panel
        .controls-section
          h5 Mouse Controls
          .control-row
            .control-input Left click + drag
            .control-action Rotate camera around target
          .control-row
            .control-input Right click + drag
            .control-action Pan camera (move target)
          .control-row
            .control-input Mouse wheel
            .control-action Zoom in/out
        .controls-section
          h5 Keyboard Controls
          .control-row
            .control-input Escape
            .control-action Return to main menu
        button.back-button(@click="isShowControls = false") Back
    template(v-else)
      button.menu-item(
        v-for="(item, idx) in menuItems",
        :key="item.label",
        :ref="(el) => (menuItemsRefs[idx] = el)",
        @click="item.action"
      )
        span.chevron ❮
        span.menu-label {{ item.label }}
        span.chevron ❯
  .volume-controls
    .volume-control
      label.volume-label Volume
      button.icon-button(@click="uiStore.toggleMusicMute")
        i.material-icons {{ uiStore.isMusicMuted ? "volume_off" : "volume_up" }}
      input.volume-slider(
        v-model="uiStore.musicVolume",
        type="range",
        min="0",
        max="100",
        @input="handleMusicVolumeChange"
      )
</template>

<script setup lang="ts">
import { useUiStore } from "@/store/ui";
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useDebounceFn } from "@vueuse/core";

const uiStore = useUiStore();
const backgroundMusic = ref<HTMLAudioElement | null>(null);
const menuContainer = ref<HTMLElement | null>(null);
const menuItemsRefs = ref<HTMLElement[]>([]);
const titleRef = ref<HTMLElement | null>(null);
const aboutContainer = ref<HTMLElement | null>(null);
let titleSplit: SplitText | null = null;
let titleAnimation: gsap.core.Timeline | null = null;

const handleMusicVolumeChange = useDebounceFn((event: Event) => {
  const target = event.target as HTMLInputElement;
  uiStore.setMusicVolume(Number(target.value));
  // Update background music volume
  if (backgroundMusic.value) {
    const volume = uiStore.isMusicMuted ? 0 : Number(target.value) / 100;
    backgroundMusic.value.volume = volume;
  }
}, 100);

const handleStart = () => {
  startBackgroundMusic();
  uiStore.hideUi();
};

const isShowAbout = ref(false);
const isShowControls = ref(false);

const menuItems = [
  { label: "Start", action: handleStart },
  { label: "About", action: () => (isShowAbout.value = true) },
  { label: "Controls", action: () => (isShowControls.value = true) },
];

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && !uiStore.isUiVisible) {
    uiStore.showUi();
  }
};

// Initialize background music
const initBackgroundMusic = async () => {
  try {
    backgroundMusic.value = new Audio("/assets/sounds/background-ambient.mp3");
    backgroundMusic.value.loop = true;
    backgroundMusic.value.volume = uiStore.isMusicMuted
      ? 0
      : (uiStore.musicVolume / 100) * 0.2; // Background music is 80% quieter

    backgroundMusic.value.addEventListener("error", (error: Event) => {
      console.error("Failed to load background music:", error);
    });

    // Load the audio but don't autoplay
    backgroundMusic.value.load();
  } catch (error) {
    console.error("Failed to initialize background music:", error);
  }
};

// Start background music (called on user interaction)
const startBackgroundMusic = () => {
  if (backgroundMusic.value && backgroundMusic.value.readyState >= 2) {
    backgroundMusic.value.play().catch((error: Error) => {
      console.error("Failed to start background music:", error);
    });
  }
};

const initTitleAnimation = () => {
  if (!titleRef.value) return;

  if (titleAnimation) {
    titleAnimation.kill();
  }
  if (titleSplit) {
    titleSplit.revert();
  }

  titleSplit = new SplitText(titleRef.value, { type: "chars" });
  titleAnimation = gsap.timeline({
    repeat: -1,
    repeatDelay: 2,
    paused: true,
    onUpdate: () => {
      if (titleRef.value) {
        const rect = titleRef.value.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        if (isVisible) {
          titleAnimation?.play();
        } else {
          titleAnimation?.pause();
        }
      }
    },
  });

  titleSplit.chars.forEach((char, index) => {
    if (titleAnimation) {
      titleAnimation.to(
        char,
        {
          y: -5,
          duration: 0.3,
          ease: "sine.inOut",
          delay: index * 0.05,
          yoyo: true,
          repeat: 1,
        },
        0,
      );
    }
  });

  if (uiStore.isUiVisible) {
    titleAnimation.play();
  }
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown, { passive: true });
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          titleAnimation?.play();
        } else {
          titleAnimation?.pause();
        }
      });
    },
    { threshold: 0.1 },
  );

  if (titleRef.value) {
    observer.observe(titleRef.value);
  }

  nextTick(() => {
    initTitleAnimation();
    initBackgroundMusic();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
  if (titleAnimation) {
    titleAnimation.kill();
  }
  if (titleSplit) {
    titleSplit.revert();
  }
  if (observer) {
    observer.disconnect();
  }
  // Cleanup audio
  if (backgroundMusic.value) {
    backgroundMusic.value.pause();
    backgroundMusic.value.src = "";
    backgroundMusic.value = null;
  }
});

watch(
  () => uiStore.isUiVisible,
  async (visible) => {
    if (visible) {
      await nextTick();
      if (titleAnimation) {
        titleAnimation.kill();
      }
      if (titleSplit) {
        titleSplit.revert();
      }
      initTitleAnimation();

      gsap.fromTo(
        menuContainer.value,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" },
      );
      gsap.fromTo(
        menuItemsRefs.value,
        { y: -30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          ease: "bounce.out",
          stagger: 0.12,
          delay: 1,
        },
      );
    }
  },
  { immediate: true },
);

watch(
  () => isShowAbout.value,
  async (showAbout) => {
    if (showAbout) {
      await nextTick();
      if (aboutContainer.value) {
        gsap.set(aboutContainer.value, {
          clipPath: "inset(0 0 100% 0)",
        });
        gsap.to(aboutContainer.value, {
          clipPath: "inset(0 0 0% 0)",
          duration: 0.5,
          ease: "power1.out",
        });
      }
    } else {
      if (aboutContainer.value) {
        gsap.to(aboutContainer.value, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.5,
          ease: "power2.in",
        });
      }
    }
  },
);

// Watch for music mute changes
watch(
  () => uiStore.isMusicMuted,
  (isMuted) => {
    if (backgroundMusic.value) {
      const volume = isMuted ? 0 : (uiStore.musicVolume / 100) * 0.2; // Background music is 80% quieter
      backgroundMusic.value.volume = volume;
    }
  },
);

// Watch for music volume changes
watch(
  () => uiStore.musicVolume,
  (volume) => {
    if (backgroundMusic.value && !uiStore.isMusicMuted) {
      backgroundMusic.value.volume = (volume / 100) * 0.2; // Background music is 80% quieter
    }
  },
);
</script>

<style scoped>
.main-map-ui {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  font-family: "Space Grotesk", sans-serif;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(8px);
  background-color: rgba(0, 0, 0, 0.5);
}

.main-title {
  position: absolute;
  top: 110px;
  right: -180px;
  transform: rotate(35deg);
  color: #fff;
  font-size: 2rem;
  font-family: sans-serif;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 120;
  display: inline-block;
  background: rgba(34, 34, 34, 0.2);
  padding: 2px 0;
  width: 700px;
  text-align: center;
  font-family: "Space Grotesk", sans-serif;
}

.main-title :deep(.char) {
  display: inline-block;
  position: relative;
}

.main-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 1;
  background: #fff;
  color: #222;
  padding: 2.5rem 3rem;
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  align-items: center;
  min-width: 320px;
  font-family: sans-serif;
}

.menu-item {
  background: none;
  border: none;
  color: #222;
  font-size: 1.35rem;
  font-family: inherit;
  padding: 0.75rem 2.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition:
    background 0.2s,
    color 0.2s,
    font-weight 0.2s;
  position: relative;
  font-weight: 400;
  letter-spacing: 0.04em;
  opacity: 1;
}

.menu-item .chevron {
  opacity: 0;
  transition: opacity 0.2s;
}

.menu-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.menu-item:hover .chevron {
  opacity: 1;
}

.chevron {
  color: #222;
  font-size: 1.35rem;
  margin: 0 1.2rem;
  font-family: sans-serif;
  user-select: none;
}

.menu-label {
  flex: 1 1 auto;
  text-align: center;
}

.volume-controls {
  position: absolute;
  top: 2rem;
  left: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 1rem;
  z-index: 1;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.volume-label {
  min-width: 60px;
  color: #222;
  font-size: 0.9rem;
  font-weight: 500;
}

.icon-button {
  background: none;
  border: none;
  color: #222;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.volume-slider {
  width: 150px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #222;
  border-radius: 50%;
  cursor: pointer;
}

.material-icons {
  font-size: 24px;
}

.camera-controls-panel {
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
  padding: 0;
}

.camera-controls-panel h4 {
  margin: 0 0 1.5rem 0;
  color: #222;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.camera-controls-panel p {
  margin: 0 0 8px 0;
  color: #444;
  font-size: 0.95rem;
  line-height: 1.5;
}

.camera-controls-panel ul {
  margin: 0 0 8px 0;
  padding-left: 1.5rem;
  color: #444;
  font-size: 0.95rem;
  line-height: 1.5;
}

.camera-controls-panel li {
  margin-bottom: 4px;
}

.controls-section {
  margin-bottom: 1.5rem;
}

.controls-section:last-of-type {
  margin-bottom: 1rem;
}

.controls-section h5 {
  margin: 0 0 0.75rem 0;
  color: #444;
  font-size: 1.4rem;
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 0.25rem;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.control-row:last-child {
  border-bottom: none;
}

.control-input {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
  min-width: 140px;
}

.control-action {
  color: #666;
  font-size: 0.9rem;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
}

.back-button {
  background: rgba(0, 0, 0, 0.08);
  border: none;
  color: #222;
  font-size: 1rem;
  font-family: inherit;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
}

.back-button:hover {
  background: rgba(0, 0, 0, 0.12);
}

.about-container {
  width: 100%;
  height: 100%;
  position: fixed;
  margin: auto;
  background-color: #fff;
  z-index: 110;
  clip-path: inset(0 0 100% 0);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
