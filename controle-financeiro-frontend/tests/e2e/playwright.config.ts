import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.CF_TEST_BASE_URL ?? "http://127.0.0.1:3100";
const fixedNow =
  process.env.CF_TEST_FIXED_NOW ?? "2026-09-08T02:59:59.000Z";
const seed = process.env.CF_TEST_SEED ?? "cf001-v1";
const timezoneId =
  process.env.CF_TEST_TIMEZONE ?? "America/Sao_Paulo";

const viewports = [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
];

export default defineConfig({
  testDir: ".",
  testMatch: ["**/auth.smoke.spec.ts", "**/controlled-clock.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  outputDir: "../artifacts/playwright/test-results",
  reporter: [
    ["line"],
    [
      "html",
      {
        open: "never",
        outputFolder: "../artifacts/playwright/report",
      },
    ],
  ],
  metadata: {
    fixedNow,
    seed,
    timezoneId,
  },
  use: {
    baseURL,
    locale: "pt-BR",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    timezoneId,
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: viewports.map(({ name, width, height }) => ({
    name: `chromium-${name}-${timezoneId}-${seed}`,
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width, height },
    },
  })),
});
