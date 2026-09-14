import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/common-components.visual.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  preserveOutput: "always",
  outputDir: "../artifacts/playwright/common-components",
  reporter: "line",
  use: {
    baseURL: process.env.CF_TEST_BASE_URL ?? "http://127.0.0.1:3100",
    locale: "pt-BR",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    timezoneId: process.env.CF_TEST_TIMEZONE ?? "America/Sao_Paulo",
  },
  projects: [
    {
      name: "chromium-mobile-360x800",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 } },
    },
  ],
});
