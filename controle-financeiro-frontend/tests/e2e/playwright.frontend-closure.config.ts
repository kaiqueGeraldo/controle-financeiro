import {defineConfig} from "@playwright/test";
import base from "./playwright.milestone-review.config";
export default defineConfig({...base,
 testMatch:["**/frontend-closure.integrated.spec.ts", "**/cf015.visual.integrated.spec.ts"],
 outputDir:"../artifacts/frontend-closure",
 use:{...base.use,trace:"off",video:"off"},
});
