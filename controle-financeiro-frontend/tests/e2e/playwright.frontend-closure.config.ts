import { artifactDirectory } from "./support/artifacts.mjs";
import {defineConfig} from "@playwright/test";
import base from "./playwright.milestone-review.config";
export default defineConfig({...base,
 testMatch:process.env.CF_CLOSURE_FINAL === "1" ? ["**/frontend-closure-final.integrated.spec.ts"] : process.env.CF_CLOSURE_TARGETED === "1" ? ["**/frontend-closure-targeted.integrated.spec.ts","**/frontend-closure-payment.integrated.spec.ts"] : ["**/frontend-closure.integrated.spec.ts", "**/frontend-closure-visual.integrated.spec.ts"],
 outputDir:artifactDirectory("frontend-closure", "../artifacts/frontend-closure"),
 reporter:process.env.CF_BROWSER_DIAGNOSTICS==="1" ? [["line"],["json",{outputFile:artifactDirectory("reports","../artifacts/frontend-reports")+"/playwright.json"}]] : base.reporter,
 use:{...base.use,trace:"off",video:"off"},
});
