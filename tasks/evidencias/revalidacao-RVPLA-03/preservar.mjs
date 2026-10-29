import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import crypto from'node:crypto';import{execFileSync}from'node:child_process';
const out='tasks/evidencias/revalidacao-RVPLA-03',phase=process.argv[2];assert.ok(['inicial','final'].includes(phase));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
const previous=JSON.parse(fs.readFileSync('tasks/evidencias/saneamento-RVPLA-03/preservacao-final.json')),hashes={...previous.hashes};
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(d,e.name)):[path.join(d,e.name)]);
for(const [f,h]of Object.entries(hashes))assert.equal(sha(f),h,f);
for(const f of [...files('tasks/evidencias/saneamento-RVPLA-03'),...['.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1','.github/scripts/owned-job-probe.ps1','tasks/evidencias/preparacao-local-adocao/counterproofs.mjs','tasks/evidencias/preparacao-local-adocao/counterproof-supervision.mjs']])hashes[f]=sha(f);
const manifest=JSON.parse(fs.readFileSync('tasks/evidencias/saneamento-RVPLA-03/resultados-final.json'));
for(const item of manifest.artifacts){assert.equal(sha(item.source),item.originalSha256,item.source);assert.equal(sha(path.join('tasks/evidencias/saneamento-RVPLA-03',item.target)),item.collectedSha256);hashes[item.source]=item.originalSha256;}
assert.equal(sha('README.md'),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
const jar='../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar';assert.equal(sha(jar),'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
if(phase==='final')for(const[f,h]of Object.entries(JSON.parse(fs.readFileSync(out+'/preservacao-inicial.json')).hashes))assert.equal(sha(f),h,f);
for(const c of ['9bed5e20f2cc46e4c7ae721ff2390054eb6db141','0b4c659877f579da6529c13c4e531769494f25be','24844b5'])execFileSync('git',['merge-base','--is-ancestor',c,'HEAD']);
const record={phase,at:new Date().toISOString(),head:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),status:git(['status','--porcelain=v2']),staging:git(['diff','--cached','--name-status']),readmeSha256:sha('README.md'),jarSha256:sha(jar),historicalFiles:29,migrations:16,priorArtifacts:manifest.artifacts.length,protectedFiles:Object.keys(hashes).length,hashes};
fs.writeFileSync(out+'/preservacao-'+phase+'.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...record,hashes:undefined}));
