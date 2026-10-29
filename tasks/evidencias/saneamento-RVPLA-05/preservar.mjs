import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
const phase=process.argv[2],out=import.meta.dirname;assert.ok(['inicial','final'].includes(phase));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const mutable=new Set(['.github/scripts/owned-job-probe.ps1','.github/scripts/owned-process.ps1','.github/scripts/owned-process.mjs','tasks/evidencias/preparacao-local-adocao/counterproof-supervision.mjs','tasks/evidencias/preparacao-local-adocao/counterproofs.mjs']);
const previous=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-RVPLA-04/preservacao-final.json'));assert.equal(previous.protectedFiles,9554);const hashes={};
for(const[f,h]of Object.entries(previous.hashes)){if(phase==='inicial'||!mutable.has(f.replaceAll('\\','/')))assert.equal(sha(f),h,f);if(!mutable.has(f.replaceAll('\\','/')))hashes[f]=h;}
function files(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);}
for(const f of files('tasks/evidencias/revalidacao-RVPLA-04'))hashes[f]=sha(f);
const review=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-RVPLA-04/resultados.json'));for(const a of review.artifacts){assert.equal(sha(a.source),a.originalSha256,a.source);hashes[a.source]=a.originalSha256;}
const readme=sha('README.md'),jar=sha('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');assert.equal(readme,'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');assert.equal(jar,'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
if(phase==='final')for(const[f,h]of Object.entries(JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json'))).hashes))assert.equal(sha(f),h,f);
for(const ref of ['9c27881ca0506b0206c59d9e0e9fd1723efa83d9','32d445e32c47ca16bd840aaa7b99fe46f919150b'])execFileSync('git',['merge-base','--is-ancestor',ref,'HEAD']);
const authorizedDelta=Object.fromEntries([...mutable].map(f=>[f,{before:previous.hashes[f],after:sha(f),changed:previous.hashes[f]!==sha(f)}]));
if(phase==='final')assert.deepEqual(Object.keys(authorizedDelta).filter(f=>authorizedDelta[f].changed).sort(),['.github/scripts/owned-process.ps1','tasks/evidencias/preparacao-local-adocao/counterproof-supervision.mjs']);
const git=a=>execFileSync('git',a,{encoding:'utf8'}).trim(),receipt={phase,at:new Date().toISOString(),head:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),inventoriedBaseFiles:9554,earlierRequiredFiles:5854,historical:29,migrations:16,readmeSha256:readme,jarSha256:jar,protectedFiles:Object.keys(hashes).length,intendedMutable:[...mutable],authorizedDelta,hashes};fs.writeFileSync(path.join(out,'preservacao-'+phase+'.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...receipt,hashes:undefined}));
