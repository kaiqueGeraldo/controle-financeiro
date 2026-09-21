import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.CF_TEST_BASE_URL ?? "http://127.0.0.1:3107";
const fixedNow =
  process.env.CF_TEST_FIXED_NOW ?? "2027-01-31T05:00:00.000Z";
const seed = process.env.CF_TEST_SEED ?? "cf007-v1";

const projects = [
  {
    key: "sao-paulo",
    timezoneId: "America/Sao_Paulo",
  },
  {
    key: "kiritimati",
    timezoneId: "Pacific/Kiritimati",
  },
];

export default defineConfig({
  testDir: ".",
  testMatch: ["**/temporal.integrated.spec.ts", "**/cf015.visual.integrated.spec.ts", "**/cf015.recovery.integrated.spec.ts",
    ...(process.env.CF015_NATIVE_ZOOM === "1" ? ["**/cf015.native-zoom.integrated.spec.ts"] : [])],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  outputDir: "../artifacts/cf007/playwright-results",
  reporter: [["line"]],
  metadata: {
    fixedNow,
    seed,
    backendApiUrl: process.env.BACKEND_API_URL ?? "not-configured",
  },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3107",
    env: {
      CF_E2E_SERVER_CLOCK: "1",
      CF_E2E_AUTH_NOW: process.env.CF_E2E_AUTH_NOW ?? "",
      // Next dev cria um worker: o preload precisa alcançar também esse processo.
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --require ./tests/e2e/support/server-clock.cjs`,
    },
    cwd: "../..",
    url: `${baseURL}/auth`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL,
    locale: "pt-BR",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: projects.map(({ key, timezoneId }) => ({
    name: `chromium-desktop-${key}-${seed}`,
    metadata: { fixedNow, seed, timezoneId },
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 1440, height: 900 },
      timezoneId,
    },
  })),
});
