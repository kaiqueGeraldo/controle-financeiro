import { defineConfig } from "@playwright/test";
import base from "./playwright.milestone-review.config";
export default defineConfig({ ...base, testMatch: ["**/rv24-creation.integrated.spec.ts"], outputDir: "../artifacts/rv24" });
