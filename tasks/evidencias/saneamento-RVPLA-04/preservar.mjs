import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import{execFileSync}from'node:child_process';
const phase=process.argv[2],out=import.meta.dirname;assert.ok(['inicial','final'].includes(phase));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const mutable=new Set(['.github/scripts/owned-process.ps1','.github/scripts/owned-process.mjs','.github/scripts/owned-job-probe.ps1','tasks/evidencias/preparacao-local-adocao/counterproof-supervision.mjs','tasks/evidencias/preparacao-local-adocao/counterproofs.mjs']);
const old=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-RVPLA-03/preservacao-final.json')),hashes={};
for(const[f,h]of Object.entries(old.hashes)){if(phase==='inicial'||!mutable.has(f.replaceAll('\\','/')))assert.equal(sha(f),h,f);if(!mutable.has(f.replaceAll('\\','/')))hashes[f]=h;}
function files(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);}
for(const f of files('tasks/evidencias/revalidacao-RVPLA-03'))hashes[f]=sha(f);
const previous=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-RVPLA-03/resultados.json'));
for(const a of previous.artifacts){assert.equal(sha(a.source),a.originalSha256,a.source);hashes[a.source]=a.originalSha256;}
const readme=sha('README.md'),jar=sha('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');
assert.equal(readme,'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');assert.equal(jar,'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
if(phase==='final')for(const[f,h]of Object.entries(JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json'))).hashes))assert.equal(sha(f),h,f);
for(const ref of ['3a6e95be68678e394cd718d9d688fab1fdc428ce','eb785362a3a95dfb00a66e235890f701edecdc88'])execFileSync('git',['merge-base','--is-ancestor',ref,'HEAD']);
const git=a=>execFileSync('git',a,{encoding:'utf8'}).trim();const record={phase,at:new Date().toISOString(),head:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),readmeSha256:readme,jarSha256:jar,historical:29,migrations:16,protectedFiles:Object.keys(hashes).length,intendedMutable:[...mutable],hashes};
fs.writeFileSync(path.join(out,'preservacao-'+phase+'.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...record,hashes:undefined}));
