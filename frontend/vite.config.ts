import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  server: {
    port: 4173,
    host: true, // This ensures the server is accessible externally
  },
  build: {
    target: 'esnext'
  },
});
