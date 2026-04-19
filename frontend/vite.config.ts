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
  },
});
