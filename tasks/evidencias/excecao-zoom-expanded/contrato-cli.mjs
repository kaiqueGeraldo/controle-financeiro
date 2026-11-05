import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'../../..'),runtime=path.resolve(process.argv[2]??'');
assert.match(path.basename(runtime),/^excecao-zoom-expanded-[a-z0-9-]+$/);
const label=process.argv[3]??'cli-contract';assert.match(label,/^cli-contract(?:-[0-9]+)?$/);
const out=path.join(runtime,label);fs.mkdirSync(out);
const sha=b=>createHash('sha256').update(b).digest('hex');
const results=[];
for(const mode of ['pass','unexpected-skip']){
 const fixture=path.join(out,mode),front=path.join(fixture,'front'),evidence=path.join(fixture,'evidence');
 fs.mkdirSync(path.join(front,'tests/e2e'),{recursive:true});fs.mkdirSync(evidence);
 fs.symlinkSync(path.join(root,'controle-financeiro-frontend/node_modules'),path.join(front,'node_modules'),process.platform==='win32'?'junction':'dir');
 const common=mode==='pass'?'test':'test.skip';
 fs.writeFileSync(path.join(front,'tests/e2e/cf015.native-zoom.integrated.spec.ts'),
  'import {test,expect} from "@playwright/test";\n'+
  'test("R10: zoom nativo 200% com ações, rolagem e foco", async ({})=>{throw Error("Deferred body must not execute");});\n'+
  common+'("Independent preparation without zoom", async ({})=>{expect(7+5).toBe(12);});\n');
 fs.writeFileSync(path.join(front,'tests/e2e/rf15-native-chrome.integrated.spec.ts'),
  'import {test,expect} from "@playwright/test";\n'+
  'test("RF15: zoom nativo Chrome 200% com ações, rolagem e foco", async ({})=>{throw Error("Deferred body must not execute");});\n'+
  'test("Normal financial control (synthetic contract only)", async ({})=>{expect(1000+500-200).toBe(1300);});\n');
 fs.writeFileSync(path.join(front,'tests/e2e/ordinary.spec.ts'),
  'import {test,expect} from "@playwright/test";\ntest("R10: zoom nativo 200% com ações, rolagem e foco", async ({})=>{expect(3).toBe(3);});\n');
 fs.writeFileSync(path.join(front,'tests/e2e/playwright.rf15.config.ts'),
  'import {defineConfig} from "@playwright/test";\nexport default defineConfig({testDir:".",workers:1,retries:0,forbidOnly:true,metadata:{zoomException:{decision:process.env.CF_ZOOM_EXCEPTION,candidate:process.env.CF_ZOOM_CANDIDATE,digest:process.env.CF_ZOOM_DIGEST,runId:process.env.CF_ZOOM_RUN,decisionSha:process.env.CF_ZOOM_DECISION_SHA}},projects:[{name:"review-sao-paulo"}]});\n');
 const env={...process.env,CF034_SUITE:'expanded',CF_ZOOM_EXCEPTION:'DEC-ZOOM-05',CF_ZOOM_CANDIDATE:'synthetic-contract-no-product-candidate',CF_ZOOM_DIGEST:sha(fs.readFileSync(path.join(front,'tests/e2e/playwright.rf15.config.ts'))),CF_ZOOM_RUN:'synthetic-'+mode,CF_ZOOM_DECISION_SHA:sha(fs.readFileSync(path.join(root,'docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md'))),CF_REVIEW_EVIDENCE:evidence,TEMP:path.join(fixture,'temp'),TMP:path.join(fixture,'temp')};
 fs.mkdirSync(env.TEMP);
 const args=[path.join(root,'.github/scripts/zoom-browser.mjs'),'test','--config','tests/e2e/playwright.rf15.config.ts'];
 const r=spawnSync(process.execPath,args,{cwd:front,env,windowsHide:true,encoding:'utf8',timeout:120000});
 fs.writeFileSync(path.join(fixture,'cli.log'),(r.stdout??'')+(r.stderr??''),{flag:'wx'});
 if(mode==='pass')assert.equal(r.status,0,r.stdout+r.stderr);else {assert.notEqual(r.status,0);assert.match(r.stderr,/Unexpected expected status/);
 const observed=JSON.parse(fs.readFileSync(path.join(evidence,'zoom-selection/results.json')));assert.equal(observed.stats.skipped,1);assert.equal(observed.stats.expected,2);}
 const manifest=JSON.parse(fs.readFileSync(path.join(evidence,'zoom-selection/manifest.json')));
 assert.equal(manifest.A.length,5);assert.equal(manifest.B.length,2);assert.equal(manifest.C.length,3);
 assert.ok(manifest.C.some(x=>x.file==='cf015.native-zoom.integrated.spec.ts'&&x.titles[0]==='Independent preparation without zoom'));
 assert.ok(manifest.C.some(x=>x.file==='rf15-native-chrome.integrated.spec.ts'&&x.titles[0]==='Normal financial control (synthetic contract only)'));
 assert.ok(manifest.C.some(x=>x.file==='ordinary.spec.ts'));
 results.push({mode,exit:r.status,A:5,B:2,C:3,logSha256:sha(fs.readFileSync(path.join(fixture,'cli.log'))),scope:'Synthetic runner contract; no product, browser or native zoom tested'});
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(results));
