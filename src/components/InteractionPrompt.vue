<template lang="pug">
.ui-overlay(v-if="isVisible")
  .interaction-prompt {{ text }}
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { Vector3 } from "@babylonjs/core";

interface Props {
  text: string;
  triggerPosition: Vector3;
  triggerRadius?: number;
  playerPosition?: Vector3 | null;
  isActive?: boolean;
  keyBinding?: string;
}

const props = withDefaults(defineProps<Props>(), {
  triggerRadius: 2,
  playerPosition: null,
  isActive: true,
  keyBinding: "E",
});

const emit = defineEmits<{
  interact: [];
}>();

// Computed property to determine if prompt should be visible
const isVisible = computed(() => {
  if (!props.isActive || !props.playerPosition) return false;

  const distance = Vector3.Distance(
    props.playerPosition,
    props.triggerPosition,
  );
  return distance <= props.triggerRadius;
});

// Key handler for interaction
const handleKeyPress = (event: KeyboardEvent) => {
  if (!isVisible.value) return;

  const key = event.key.toLowerCase();
  const expectedKey = props.keyBinding.toLowerCase();

  if (key === expectedKey) {
    emit("interact");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyPress);
});
</script>

<style scoped>
.ui-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1001;
}

.interaction-prompt {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  border: 2px solid #fff;
  animation: pulse 2s infinite;
  white-space: nowrap;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.05);
  }
}
</style>
