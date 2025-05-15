<template lang="pug">
.home
  .scene-container
    MainMap
</template>

<script setup lang="ts">
import MainMap from "@/components/MainMap.vue";
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
