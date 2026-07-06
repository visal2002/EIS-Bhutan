import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      host: "localhost",
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
  },
  // Suppress deprecated rollupOptions warning from older plugins
  optimizeDeps: {
    rolldownOptions: {},
  },
});