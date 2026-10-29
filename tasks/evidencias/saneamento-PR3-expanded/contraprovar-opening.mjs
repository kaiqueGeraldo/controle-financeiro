import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..');
const json=label=>JSON.parse(fs.readFileSync(path.join(runtime,label,'browsers/IntegratedMilestoneBrowserReviewTest/playwright-private.json')));
function specs(suites){return suites.flatMap(s=>[...(s.specs??[]),...specs(s.suites??[])]);}
assert.ok(specs(json('after-opening').suites).some(s=>s.title.startsWith('UI04 ')&&s.ok),'real creation and visual consumer must pass first');
const file=path.join(root,'controle-financeiro-frontend/tests/e2e/milestone-review.integrated.spec.ts'),bytes=fs.readFileSync(file);
const hash=b=>createHash('sha256').update(b).digest('hex'),sha256=hash(bytes),text=bytes.toString();
const start=text.indexOf('  // These opening fixtures'),end=text.indexOf('  const r=await page.request.post',start);assert.ok(start>=0&&end>start);
const steps=[],receipt=path.join(runtime,'opening-counterproof.json');
function run(label){const r=spawnSync(process.execPath,[path.join(import.meta.dirname,'executar.mjs'),runtime,label,'IntegratedMilestoneBrowserReviewTest'],{cwd:root,windowsHide:true,encoding:'utf8',timeout:8*60*1000,env:{...process.env,PR3_REVIEW_GREP:'UI04 visual dirigido'}});steps.push({label,exit:r.status,error:r.error?.message});return r.status;}
try {
 fs.writeFileSync(file,text.slice(0,start)+text.slice(end));assert.equal(run('opening-number-mutant'),1);
 const failures=specs(json('opening-number-mutant').suites).flatMap(s=>s.tests.flatMap(t=>t.results.flatMap(r=>r.errors??[])));
 assert.ok(failures.some(e=>e.message.includes('openingQuantity')&&e.message.includes('400')),'must fail for rejected numeric opening, not preparation');
} finally {
 fs.writeFileSync(file,bytes);assert.equal(hash(fs.readFileSync(file)),sha256);
 fs.writeFileSync(receipt,JSON.stringify({sourceSha256:sha256,restored:true,steps},null,2)+'\n');
}
assert.equal(run('opening-restored-control'),0);
fs.writeFileSync(receipt,JSON.stringify({sourceSha256:sha256,restored:true,steps},null,2)+'\n');
console.log(JSON.stringify({steps,restored:true}));
