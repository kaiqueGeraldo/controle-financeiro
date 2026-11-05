import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..'),s=path.join(runtime,'s');
const b='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/';
let java=fs.readFileSync(path.join(s,b,'MilestoneRemediationBrowserTest.java'),'utf8').replaceAll('MilestoneRemediationBrowserTest','RevalidationIdentityProbe').replace('tests/e2e/playwright.milestone-remediation.config.ts','tests/e2e/playwright.revalidation.config.ts');
fs.writeFileSync(path.join(s,b,'RevalidationIdentityProbe.java'),java,{flag:'wx'});
fs.copyFileSync(path.join(import.meta.dirname,'identity-probe.ts.txt'),path.join(s,'f/tests/e2e/revalidation.identity.probe.ts'));
fs.writeFileSync(path.join(s,'f/tests/e2e/playwright.revalidation.config.ts'),"import {defineConfig} from '@playwright/test';import base from './playwright.milestone-review.config';export default defineConfig({...base,testMatch:['**/revalidation.identity.probe.ts']});\n",{flag:'wx'});
console.log('Independent identity probe prepared; candidate test files untouched.');
