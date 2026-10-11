import {defineConfig} from "@playwright/test";
import base from "./playwright.milestone-review.config";
export default defineConfig({...base,
 testMatch:process.env.CF_CLOSURE_FINAL === "1" ? ["**/frontend-closure-final.integrated.spec.ts"] : process.env.CF_CLOSURE_TARGETED === "1" ? ["**/frontend-closure-targeted.integrated.spec.ts","**/frontend-closure-payment.integrated.spec.ts"] : ["**/frontend-closure.integrated.spec.ts", "**/frontend-closure-visual.integrated.spec.ts"],
 outputDir:"../artifacts/frontend-closure",
 use:{...base.use,trace:"off",video:"off"},
});
