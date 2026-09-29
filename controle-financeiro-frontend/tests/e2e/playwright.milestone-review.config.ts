import {defineConfig} from "@playwright/test";
import base from "./playwright.integrated.config";

export default defineConfig({
  ...base,
  testMatch: ["**/milestone-review.integrated.spec.ts", "**/milestone-recovery.integrated.spec.ts"],
  outputDir: "../artifacts/milestone-review",
  timeout: 90_000,
  projects: [{name:"review-sao-paulo",use:{browserName:"chromium",viewport:{width:1440,height:900},timezoneId:"America/Sao_Paulo"}}],
});
