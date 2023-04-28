import path from "path";

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3003,
  },
  resolve: {
    alias: {
      "hls.js": "hls.js/dist/hls.min.js",
      "@list-helper/core": path.resolve(
        __dirname,
        "./src/domains/list-helper-core"
      ),
      "@list-helper/hooks": path.resolve(
        __dirname,
        "./src/domains/list-helper-hook"
      ),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
  },
});
