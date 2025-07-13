import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/popup.html"),
        sidebar: resolve(__dirname, "src/sidebar/sidebar.html"),
        content: resolve(__dirname, "src/content/content.js"),
        background: resolve(__dirname, "src/background/background.js"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: assetInfo => {
          if (assetInfo.name === "main.css") {
            return "sidebar.css";
          }
          return "[name].[ext]";
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  publicDir: "public",
});
