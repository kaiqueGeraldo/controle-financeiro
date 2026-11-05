import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..'),hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f));
const counts=xml=>Object.fromEntries(['tests','failures','errors','skipped'].map(k=>[k,Number(xml.match(new RegExp('\\b'+k+'="(\\d+)"'))?.[1])]));
const runs=[];
for(const entry of fs.readdirSync(runtime,{withFileTypes:true})){
 const file=path.join(runtime,entry.name,'execution.json');if(!entry.isDirectory()||!fs.existsSync(file))continue;
 const run=read(file),reports=run.reports.map(r=>{const f=path.join(runtime,entry.name,'surefire',r.file);assert.equal(hash(f),r.sha256);return {file:r.file,sha256:r.sha256,...counts(fs.readFileSync(f,'utf8').match(/<testsuite\b[^>]*>/)[0])};});
 assert.equal(hash(path.join(runtime,entry.name,'maven.log')),run.logSha256);assert.equal(hash(path.join(runtime,entry.name,'inputs.json')),run.inputsSha256);
 const browser=[];const directory=path.join(runtime,entry.name,'browsers');
 if(fs.existsSync(directory))for(const owner of fs.readdirSync(directory)){
  const report=path.join(directory,owner,'playwright-private.json'),log=path.join(directory,owner,'playwright.log');
  if(!fs.existsSync(report))continue;
  const data=read(report),cases=[];function visit(s){for(const spec of s.specs??[])for(const t of spec.tests??[])for(const r of t.results??[])cases.push({title:spec.title,status:r.status,duration:r.duration,failures:(r.errors??[]).map(e=>e.message?.replace(/\u001b\[[0-9;]*m/g,'').slice(0,1800))});for(const child of s.suites??[])visit(child);}visit(data);
  browser.push({owner,stats:data.stats,reportSha256:hash(report),logSha256:fs.existsSync(log)?hash(log):null,cases});
 }
 const notReached=['counter-income','counter-gain','counter-reserve'].includes(entry.name);
 runs.push({label:entry.name,started:run.started,at:run.at,exit:run.exit,args:run.args,reportRecordSha256:hash(file),logSha256:run.logSha256,inputsSha256:run.inputsSha256,reports,browser,classification:notReached?'review preparation error: anchored grep selected no Playwright cases; not a causal counterproof':entry.name==='restored-and-boundaries'?'restored original controls; visual false positives reproduced; independent wrong-signature probe used an incorrect automatic-redirect assumption':'directed execution or causal counterproof'});
}
const checks=read(path.join(runtime,'checks.json'));assert.equal(checks.exit,0);const ci=fs.readFileSync(path.join(runtime,'ci-contracts.log'),'utf8');assert.match(ci,/# tests 32/);assert.match(ci,/# fail 0/);assert.match(ci,/# skipped 0/);
const mutations=[];
for(const file of fs.readdirSync(runtime).filter(f=>f.startsWith('mutation-')&&f.endsWith('.json'))){
 const m=read(path.join(runtime,file)),kind=m.kind,r=read(path.join(runtime,'restored-'+kind+'.json'));assert.equal(r.restored,true);assert.equal(hash(path.join(runtime,'s',m.file)),m.before);mutations.push({...m,restored:true,restorationSha256:hash(path.join(runtime,'restored-'+kind+'.json'))});
}
const base='965b93c77bce6cde0c4473272901817d221466a1',candidate='4f22d41f5208aca16d334b3d5abbcd5de2841086';
const {backendSelection}=await import(pathToFileURL(path.join(root,'.github/scripts/suites.mjs')));const selection={linux:backendSelection(root,'expanded','linux'),windows:backendSelection(root,'expanded','win32'),windowsNative:backendSelection(root,'expanded','win32','platform-only')};assert.equal(selection.linux.selected.length,115);assert.equal(selection.windows.selected.length,116);assert.equal(selection.windowsNative.selected.length,1);
const binding=JSON.parse(fs.readFileSync(path.join(root,'tasks/evidencias/saneamento-PR3-expanded-residual/RESULTADOS.json'))).criticalSourceBinding.map(b=>{let bytes=fs.readFileSync(path.join(root,b.file));const file=b.file.replace('controle-financeiro-frontend/','f/');if(b.file.endsWith('.java'))bytes=Buffer.from(bytes.toString().replaceAll('resolveSibling("controle-financeiro-frontend")','resolveSibling("f")'));const expected=createHash('sha256').update(bytes).digest('hex');assert.equal(hash(path.join(runtime,'s',file)),expected);return {file:b.file,currentSha256:hash(path.join(root,b.file)),disposableSha256:expected,onlyPhysicalPathAdaptation:b.file.endsWith('.java')};});
const result={reviewDate:'2026-11-01 America/Sao_Paulo',base,candidate,branch:'codex/saneamento-pr3-expanded',worktree:root,runtime,sourceBinding:binding,runs:runs.sort((a,b)=>a.started.localeCompare(b.started)),independentGeometry:read(path.join(runtime,'geometry-independent.json')),geometryPixels:read(path.join(runtime,'geometry-pixels.json')),historical:read(path.join(runtime,'historical-details.json')),preservation:read(path.join(runtime,'audit-final.json')),checks:{...checks,contracts:32,ciLogSha256:hash(path.join(runtime,'ci-contracts.log')),typecheck:'historical typecheck reused, source-bound; new compiled Next builds also typecheck physical product sources'},mutations,selection,remote:read(path.join(import.meta.dirname,'REMOTO.json')),expandedIntegralExecuted:false,jarBuilt:false,actions:{implementationChanged:false,pushed:false,prUpdated:false,ciDispatched:false,merged:false,hostingChanged:false,deployed:false,realDatabaseAccessed:false}};
result.livePixels=read(path.join(runtime,'live-pixels.json'));
result.financialOracles=read(path.join(runtime,'financial-oracles.json'));
result.resourceClosure=read(path.join(runtime,'resource-closure.json'));
result.ownBoundaryProbeCorrection=read(path.join(runtime,'boundary-probe-correction.json'));
const restored=path.join(runtime,'restored-and-boundaries/browsers');
for(const [field,owner,file]of [['liveGeometry','RevalidationVisualProbe','live-geometry.json'],['credentialBoundaries','RevalidationCredentialBoundaryProbe','credential-boundaries.json']]){result[field]=read(path.join(field==='credentialBoundaries'?path.join(runtime,'credential-boundaries-corrected/browsers'):restored,owner,file));}
fs.writeFileSync(path.join(import.meta.dirname,'RESULTADOS.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({runs:result.runs.length,selection:{linux:115,windows:116},geometryFalsePositives:result.independentGeometry.unexpected.length,mutationsRestored:mutations.length,checks:32,resultsPath:path.join(import.meta.dirname,'RESULTADOS.json')}));
