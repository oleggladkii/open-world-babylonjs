<template lang="pug">
div 
  h1 Oops! Page not found
  router-link(to="/") Go to home
</template>

<style scoped>
div {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100vh;
}
h1 {
  font-size: 28px;
}
a {
  text-decoration: none;
  color: #0000ff;
  font-size: 20px;
}
</style>
