import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const phase=process.argv[2],out=import.meta.dirname;
assert.ok(['inicial','final'].includes(phase));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
const base='acaa6ed9374f8c9a205d92955f0f4f946b17aa8a';
const mutable=new Set(['tasks/evidencias/preparacao-local-adocao/counterproofs.mjs']);
const prior=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-RVPLA-05/preservacao-final.json'));
assert.equal(prior.protectedFiles,14475);
const hashes={},authorizedDelta={};
for(const[file,hash]of Object.entries(prior.hashes)) {
  if(phase==='inicial'||!mutable.has(file.replaceAll('\\','/')))assert.equal(sha(file),hash,file);
  if(mutable.has(file.replaceAll('\\','/')))authorizedDelta[file]={before:hash,after:sha(file)};
  else hashes[file]=hash;
}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  assert.equal(e.isSymbolicLink(),false);return e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)];
});}
for(const file of files('tasks/evidencias/revalidacao-RVPLA-05'))hashes[file]=sha(file);
const runtime=JSON.parse(fs.readFileSync('tasks/evidencias/revalidacao-RVPLA-05/runtime-files.json'));
assert.equal(runtime.files,3737);
for(const item of runtime.hashes){const file=path.join(runtime.runtime,item.file);assert.equal(sha(file),item.sha256,file);hashes[file]=item.sha256;}
if(phase==='final')for(const[file,hash]of Object.entries(JSON.parse(fs.readFileSync(path.join(out,'preservacao-inicial.json'))).hashes))assert.equal(sha(file),hash,file);
const readme=sha('README.md'),jar=sha('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');
assert.equal(readme,'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
assert.equal(jar,'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
for(const ref of [base,'98869a1d7db2068bce68d27b8800e7482d8a7281','019a6ce39fdb2e7182addedacc83fd634f9c778e'])execFileSync('git',['merge-base','--is-ancestor',ref,'HEAD']);
const result={phase,at:new Date().toISOString(),base,head:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),status:git(['status','--short']),staging:git(['diff','--cached','--name-status']),previousProtectedFiles:14475,earlierRequiredFiles:11328,historical:29,migrations:16,protectedFiles:Object.keys(hashes).length,readmeSha256:readme,jarSha256:jar,authorizedDelta,hashes};
fs.writeFileSync(path.join(out,'preservacao-'+phase+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...result,hashes:undefined}));
