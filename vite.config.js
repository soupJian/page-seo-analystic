import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        sidebar: resolve(__dirname, "src/sidebar/sidebar.html"),
        content: resolve(__dirname, "src/content/content.ts"),
        background: resolve(__dirname, "src/background/background.ts"),
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
    minify: "terser",
    terserOptions: {
      mangle: {
        // 保留类名不被压缩
        reserved: ["PageAnalyzer", "SidebarManager", "BackgroundManager"],
      },
    },
  },
  publicDir: "public",
});
