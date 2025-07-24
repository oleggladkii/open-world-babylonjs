<template lang="pug">
.home
  .scene-container
    VillageMap
</template>

<script setup lang="ts">
import VillageMap from "@/components/VillageMap.vue";
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
