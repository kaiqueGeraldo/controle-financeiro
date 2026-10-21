import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL("../../../", import.meta.url)) } }, test: { environment: "jsdom", reporters: ["verbose"], setupFiles: [fileURLToPath(new URL("../../../../tests/component/setup.ts", import.meta.url))], restoreMocks: true, unstubEnvs: true, unstubGlobals: true, include: ["src/services/onboarding/**/*.test.tsx", "src/screens/private/onboarding/**/*.test.tsx"] } });
