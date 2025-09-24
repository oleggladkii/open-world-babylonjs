import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "OnixBase",
        short_name: "OnixBase",
        description: "Open World Babylon.js Application",
        theme_color: "#FFFFFF",
        background_color: "#000000",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["legacy-js-api", "import"],
        additionalData: `@use "@/scss/_colors.scss" as *;`,
      },
    },
  },
  assetsInclude: ["**/*.glb", "**/*.gltf"],
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: [
            "@babylonjs/core",
            "@babylonjs/loaders",
            "@babylonjs/materials",
          ],
          babylonGui: ["@babylonjs/gui"],
          babylonInspector: ["@babylonjs/inspector"],
          vue: ["vue", "vue-router", "pinia"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "@babylonjs/core",
      "@babylonjs/loaders",
      "@babylonjs/materials",
      "@babylonjs/gui",
      "@babylonjs/inspector",
      "@babylonjs/procedural-textures",
      "@babylonjs/serializers",
    ],
  },
  server: {
    port: 8080,
    host: true,
  },
});
