<template lang="pug">
.home
  .scene-container
    MainMap(
      v-show="!isThirdPersonView",
      :is-third-person-view="isThirdPersonView",
      @update:is-third-person-view="updateThirdPersonView",
      @set-target-position="setTargetPosition"
    )
    BuildingCamera(
      v-show="isThirdPersonView",
      :is-third-person-view="isThirdPersonView",
      @exit="handleExitThirdPerson"
    )
</template>

<script setup lang="ts">
import { ref } from "vue";
import MainMap from "@/components/MainMap.vue";
import BuildingCamera from "@/components/BuildingCamera.vue";
import { Vector3 } from "@babylonjs/core";

const isThirdPersonView = ref(false);
const targetPosition = ref<Vector3>(Vector3.Zero());

const updateThirdPersonView = (value: boolean): void => {
  console.log("isThirdPersonView.value", value);
  isThirdPersonView.value = value;
};

const setTargetPosition = (position: Vector3): void => {
  targetPosition.value = position;
};

const handleExitThirdPerson = (): void => {
  isThirdPersonView.value = false;
};
</script>

<style scoped>
.home {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.scene-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  touch-action: none;
}
</style>
