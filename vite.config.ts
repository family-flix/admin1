import path from "path";

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  base: "/admin",
  plugins: [solidPlugin()],
  server: {
    port: 3003,
  },
  resolve: {
    alias: {
      "hls.js": "hls.js/dist/hls.min.js",
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks(filepath) {
          // if (filepath.includes("hls.js")) {
          //   return "hls";
          // }
          if (filepath.includes("node_modules") && !filepath.includes("hls")) {
            return "vendor";
          }
        },
      },
    },
  },
});
