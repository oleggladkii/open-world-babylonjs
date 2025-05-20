<template lang="pug">
.app-loader
  .loader-container
    app-loader-hourglass
</template>

<script setup lang="ts">
import AppLoaderHourglass from "@/components/AppLoaderHourglass.vue";
</script>

<style scoped lang="scss">
.app-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #161617;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
</style>
