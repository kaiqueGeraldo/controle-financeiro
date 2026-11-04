import { artifactDirectory } from "./support/artifacts.cjs";
import {defineConfig} from "@playwright/test";
import base from "./playwright.milestone-review.config";
export default defineConfig({...base,
 testMatch:["**/milestone-remediation.integrated.spec.ts", "**/milestone-recovery.integrated.spec.ts"],
 outputDir:artifactDirectory("milestone-remediation", "../artifacts/milestone-remediation"),
});
