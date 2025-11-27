import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/ai-resume-analyzer/" : "/",
  build: {
    outDir: "build/client",
    assetsDir: "assets",
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));