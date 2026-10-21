import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
const frontend = process.cwd();
const evidence = process.env.CF031_EVIDENCE;
if (!evidence || !/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.BACKEND_API_URL ?? "")) throw new Error("Requires disposable Spring backend supplied by the Java harness.");
export default defineConfig({
  testDir: ".", testMatch: "onboarding.integrated.spec.ts", workers: 1, fullyParallel: false, retries: 0, forbidOnly: true,
  timeout: 90_000, expect: { timeout: 12_000 }, outputDir: path.join(evidence, "artifacts"),
  reporter: [["line"], ["json", { outputFile: path.join(evidence, "playwright.json") }]],
  webServer: { command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3111", cwd: frontend, url: "http://127.0.0.1:3111/auth", reuseExistingServer: false, timeout: 120_000 },
  use: { baseURL: "http://127.0.0.1:3111", locale: "pt-BR", reducedMotion: "reduce", screenshot: "only-on-failure", trace: "off", video: "off" },
  projects: [
    { name: "mobile-360-SP", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 }, timezoneId: "America/Sao_Paulo" } },
    { name: "tablet-768-UTC", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, timezoneId: "UTC" } },
    { name: "desktop-1440-Kiritimati", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, timezoneId: "Pacific/Kiritimati" } },
  ],
});
