import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The frontend talks to "/api" (see src/services/apiClient.js).
 * Vite proxies those calls to the Spring Boot server, which keeps
 * the browser on a single origin and avoids CORS in development.
 *
 * Set VITE_BACKEND_URL when the API runs somewhere other than
 * http://localhost:8080.
 */
const backendUrl = process.env.VITE_BACKEND_URL || "http://localhost:8080";

const proxy = {
  "/api": {
    target: backendUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Allow the hosted preview domain (and localhost) to reach the dev server.
    allowedHosts: ["localhost", "127.0.0.1", ".e2b.app"],
    proxy,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ["localhost", "127.0.0.1", ".e2b.app"],
    proxy,
  },
});