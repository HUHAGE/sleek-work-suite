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
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.time', 'console.timeEnd']
      }
    },
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        format: 'es',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs'
          ],
          'utils-vendor': [
            'date-fns',
            'zustand',
            'zod',
            'react-hook-form',
            'react-router-dom'
          ]
        }
      }
    },
    target: 'es2015',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['electron']
  }
});
