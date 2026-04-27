import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localAppData = process.env.LOCALAPPDATA || __dirname;

// https://vite.dev/config/
export default defineConfig({
  cacheDir: path.join(localAppData, "SmartEventManagement", "vite-cache-v2"),
  build: {
    emptyOutDir: false,
  },
  optimizeDeps: {
    noDiscovery: true,
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
