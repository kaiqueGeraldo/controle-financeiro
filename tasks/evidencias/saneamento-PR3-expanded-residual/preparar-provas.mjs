import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const runtime=path.resolve(process.argv[2]);const meta=JSON.parse(fs.readFileSync(path.join(runtime,'prepared.json')));const root=path.resolve(import.meta.dirname,'../../..');assert.equal(meta.origin,root);const subject=meta.subject;
for(const kind of ['geometry','identity'])fs.copyFileSync(path.join(import.meta.dirname,kind+'.probe.ts.txt'),path.join(subject,'f/tests/e2e/residual-'+kind+'.probe.ts'));
fs.writeFileSync(path.join(subject,'f/tests/e2e/playwright.residual-probe.config.ts'),"import {defineConfig} from '@playwright/test';\nimport base from './playwright.milestone-remediation.config';\nexport default defineConfig({...base,testMatch:['**/residual-*.probe.ts']});\n");
const relative='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/';const original=fs.readFileSync(path.join(root,relative,'MilestoneRemediationBrowserTest.java'),'utf8');
const java=original.replaceAll('MilestoneRemediationBrowserTest','ResidualObserverBrowserProbe').replaceAll('resolveSibling("controle-financeiro-frontend")','resolveSibling("f")').replace('tests/e2e/playwright.milestone-remediation.config.ts','tests/e2e/playwright.residual-probe.config.ts');fs.writeFileSync(path.join(subject,relative,'ResidualObserverBrowserProbe.java'),java);
console.log('Probes in own disposable copy; original mandatory selection unchanged');
