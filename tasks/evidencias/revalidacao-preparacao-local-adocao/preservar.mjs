import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const out=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i,'$1'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
const phase=process.argv[2];assert.ok(['inicial','final'].includes(phase));
const prior=JSON.parse(fs.readFileSync('tasks/evidencias/preparacao-local-adocao/preservation.json'));
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const protectedFiles=new Set([...prior.runtimeFiles.map(x=>path.join(prior.historicalRuntime,x.file)),...prior.migrations.map(x=>x.file)]);
for(const dir of ['preparacao-local-adocao','revisao-preparacao-local-adocao','saneamento-preparacao-local-adocao']) {
  for(const f of files('tasks/evidencias/'+dir))protectedFiles.add(f);
}
const runtime=path.resolve('../controle-financeiro-runtimes/preparacao-adocao');
for(const folder of fs.readdirSync(runtime).filter(n=>/^(?:p0[1-5]|revisao-|saneamento-)/.test(n))) {
  const root=path.join(runtime,folder);
  // Preserve receipts/logs/checkpoints; caches, libraries and generated classes are not release artifacts.
  function walk(dir) {for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if(e.isDirectory()){if(!['checkout','node_modules','.git','agent'].includes(e.name))walk(path.join(dir,e.name));}
    else if(/\.(?:json|jsonl|log|xml|txt|mjs|ps1)$/.test(e.name))protectedFiles.add(path.join(dir,e.name));
  }}
  walk(root);
}
const packageRoot=path.join(runtime,'p05'),manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,'inputs.json')));
protectedFiles.add(path.join(packageRoot,'package/api.jar'));
for(const x of manifest.inputs){const f=path.join(packageRoot,'checkout',x.file);assert.equal(sha(f),x.sha256);protectedFiles.add(f);}
for(const x of prior.runtimeFiles)assert.equal(sha(path.join(prior.historicalRuntime,x.file)),x.sha256);
for(const x of prior.migrations)assert.equal(sha(x.file),x.sha256);
assert.equal(sha('README.md'),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
assert.equal(sha(path.join(packageRoot,'package/api.jar')),'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
const hashes=Object.fromEntries([...protectedFiles].sort().map(f=>[f,sha(f)]));
if(phase==='final'){const before=JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json')));for(const [f,h] of Object.entries(before.hashes))assert.equal(sha(f),h,f);}
for(const c of ['07c396371029d9942b8667e5c638c04a9e6aeb4b','aa068d17aba41855c3f5f5fb5385b6dfd2babc4a','24844b5'])execFileSync('git',['merge-base','--is-ancestor',c,'HEAD']);
const record={phase,at:new Date().toISOString(),branch:git(['branch','--show-current']),head:git(['rev-parse','HEAD']),status:git(['status','--porcelain=v2']),staging:git(['diff','--cached','--name-status']),readmeSha256:sha('README.md'),historicalFiles:prior.runtimeFiles.length,migrations:prior.migrations.length,packageInputs:manifest.inputs.length,jarSha256:sha(path.join(packageRoot,'package/api.jar')),protectedFiles:protectedFiles.size,hashes};
fs.writeFileSync(path.join(out,'preservacao-'+phase+'.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...record,hashes:undefined,status:record.status,staging:record.staging}));
