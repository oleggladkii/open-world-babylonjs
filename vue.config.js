const { defineConfig } = require("@vue/cli-service");

const plugins = [];

if (process.env.NODE_ENV === "production") {
  const { join } = require("path");
}

module.exports = defineConfig({
  transpileDependencies: true,
  pwa: {
    name: "OnixBase",
    themeColor: "#FFFFFF",
    msTileColor: "#000000",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black",
    workboxOptions: {
      exclude: [/index\.html$/],
    },
  },
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
         @import '~@/scss/_colors.scss';
         `,
      },
    },
  },
  configureWebpack(config) {
    config.plugins = [...config.plugins, ...plugins];
  },
  chainWebpack: (config) => {
    // Add GLB file loader
    config.module
      .rule("glb")
      .test(/\.glb$/)
      .use("file-loader")
      .loader("file-loader")
      .options({
        name: "models/[name].[hash:8].[ext]",
      });
  },
});
