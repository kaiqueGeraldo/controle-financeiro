import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/component/**/*.test.tsx"],
    reporters: ["verbose"],
    setupFiles: [fileURLToPath(new URL("./setup.ts", import.meta.url))],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
