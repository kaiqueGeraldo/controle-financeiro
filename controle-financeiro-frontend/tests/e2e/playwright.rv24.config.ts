import { artifactDirectory } from "./support/artifacts";
import { defineConfig } from "@playwright/test";
import base from "./playwright.milestone-review.config";
export default defineConfig({ ...base, testMatch: ["**/rv24-creation.integrated.spec.ts"], outputDir: artifactDirectory("rv24", "../artifacts/rv24") });
