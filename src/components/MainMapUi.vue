<template lang="pug">
.main-map-ui(v-if="uiStore.isUiVisible")
  .overlay
  .main-title(ref="titleRef") Babylon.js world
  .main-controls(ref="menuContainer")
    button.menu-item(
      v-for="(item, idx) in menuItems",
      :key="item.label",
      :ref="(el) => (menuItemsRefs[idx] = el)",
      @click="item.action"
    )
      span.chevron ❮
      span.menu-label {{ item.label }}
      span.chevron ❯
  .volume-control
    button.icon-button(@click="uiStore.toggleMute")
      i.material-icons {{ uiStore.isMuted ? "volume_off" : "volume_up" }}
    input.volume-slider(
      v-model="uiStore.volume",
      type="range",
      min="0",
      max="100",
      @input="handleVolumeChange"
    )
</template>

<script setup lang="ts">
import { useUiStore } from "@/store/ui";
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useDebounceFn } from "@vueuse/core";

gsap.registerPlugin(SplitText);

const uiStore = useUiStore();
const menuContainer = ref<HTMLElement | null>(null);
const menuItemsRefs = ref<HTMLElement[]>([]);
const titleRef = ref<HTMLElement | null>(null);
let titleSplit: SplitText | null = null;
let titleAnimation: gsap.core.Timeline | null = null;

const handleVolumeChange = useDebounceFn((event: Event) => {
  const target = event.target as HTMLInputElement;
  uiStore.setVolume(Number(target.value));
}, 100);

const handleStart = () => {
  uiStore.hideUi();
};

const showAbout = () => {
  // TODO: Implement about app dialog
};

const menuItems = [
  { label: "Start", action: handleStart },
  { label: "About", action: showAbout },
];

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && !uiStore.isUiVisible) {
    uiStore.showUi();
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
    paused: true, // Start paused
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
        0
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
    { threshold: 0.1 }
  );

  if (titleRef.value) {
    observer.observe(titleRef.value);
  }

  nextTick(() => {
    initTitleAnimation();
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
        { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }
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
        }
      );
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.main-map-ui {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
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
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 2.5rem;
  font-family: sans-serif;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
  display: inline-block;
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
  transition: background 0.2s, color 0.2s, font-weight 0.2s;
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

.volume-control {
  position: absolute;
  top: 2rem;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 1rem;
  z-index: 1;
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
</style>
