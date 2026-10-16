/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 素材パス /assets/{crk|crob}/... と衝突しないよう、ビルド成果物の置き場所を変える
  build: { assetsDir: "_app" },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    globals: false,
  },
});
