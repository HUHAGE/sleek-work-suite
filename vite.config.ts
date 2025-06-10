import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    electron({
      entry: "electron/main.ts",
    }),
    electron({
      entry: "electron/preload.ts",
      onstart(options) {
        options.reload();
      },
    }),
    renderer(),
  ],
  base: process.env.ELECTRON === 'true' ? './' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
