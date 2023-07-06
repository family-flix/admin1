import path from "path";

import { UserConfigExport, defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  base: "/admin",
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      "hls.js": "hls.js/dist/hls.min.js",
      "lucide-solid": require.resolve("lucide-solid").replace('cjs', 'esm'),
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
