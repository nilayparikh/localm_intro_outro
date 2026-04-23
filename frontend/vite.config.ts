import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error - path types work at runtime
import path from "path";

// @ts-expect-error - __dirname available via Vite
const __dirnameAlias = __dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirnameAlias, "./src"),
      "@common": path.resolve(__dirnameAlias, "../../../common/frontend"),
    },
    dedupe: [
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
      "react",
      "react-dom",
    ],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 5184,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("@ffmpeg/")) {
            return "ffmpeg";
          }

          if (
            id.includes("rxdb") ||
            id.includes("dexie") ||
            id.includes("rxjs")
          ) {
            return "data";
          }

          if (id.includes("@azure/")) {
            return "azure";
          }

          if (id.includes("@mui/") || id.includes("@emotion/")) {
            return "mui";
          }

          if (
            id.includes("html-to-image") ||
            id.includes("file-saver") ||
            id.includes("jszip") ||
            id.includes("crypto-js")
          ) {
            return "export-utils";
          }

          return "vendor";
        },
      },
    },
  },
});
