import { defineConfig } from "@playwright/test";
import path from "node:path";
const evidence=process.env.CF032_EVIDENCE;
if(!evidence||!/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.BACKEND_API_URL??""))throw new Error("Requires the CF032 disposable Java harness");
export default defineConfig({
  testDir: ".",testMatch:"journeys.spec.ts",workers:1,fullyParallel:false,retries:0,forbidOnly:true,
  timeout:120_000,expect:{timeout:12_000},outputDir:path.join(evidence,"artifacts"),
  reporter:[["line"],["json",{outputFile:path.join(evidence,"playwright.json")}]],
  webServer:{command:"node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3142",cwd:process.cwd(),url:"http://127.0.0.1:3142/auth",reuseExistingServer:false,timeout:60_000},
  use:{baseURL:"http://127.0.0.1:3142",locale:"pt-BR",timezoneId:"America/Sao_Paulo",viewport:{width:1440,height:900},reducedMotion:"no-preference",screenshot:"only-on-failure",trace:"off",video:"off"},
});
