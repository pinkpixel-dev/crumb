import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  // Do not let Vite paint over Rust compiler errors.
  clearScreen: false,

  server: {
    // Tauri points at a fixed port, so failing is better than silently moving.
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },

  build: {
    // Matches the webviews Tauri ships against on desktop.
    target: "es2022",
    sourcemap: false,
  },
}));
