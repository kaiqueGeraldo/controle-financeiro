import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..');
// Execute only after the directed JVM finished; never mutate a running suite.
assert.ok(fs.existsSync(path.join(runtime,'directed-affected/execution.json')));
const names=['Cf014HistoryReviewTest','Cf014HistoryDiagnosticTest'];
const files=names.map(name=>({name,file:path.join(root,'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api',name+'.java')}));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const f of files){f.bytes=fs.readFileSync(f.file);f.sha256=hash(f.bytes);}
const receipt=path.join(runtime,'fixture-counterproof.json'),steps=[];
function run(label){
 const r=spawnSync(process.execPath,[path.join(import.meta.dirname,'executar.mjs'),runtime,label,'Pr3FixtureIsolationProbe'],{cwd:root,encoding:'utf8',windowsHide:true,timeout:8*60*1000});
 steps.push({label,exit:r.status,error:r.error?.message});return r.status;
}
try {
 for(const f of files)fs.writeFileSync(f.file,execFileSync('git',['show',`1c4173f2:controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/${f.name}.java`],{cwd:root}));
 assert.equal(run('shared-fixture-mutant'),1);
 const xml=fs.readFileSync(path.join(runtime,'shared-fixture-mutant/surefire/TEST-com.controlefinanceiro.api.Pr3FixtureIsolationProbe.xml'),'utf8');
 assert.match(xml,/<testsuite\b[^>]*errors="0"/);assert.match(xml,/not to be equal to/);
} finally {
 for(const f of files){fs.writeFileSync(f.file,f.bytes);assert.equal(hash(fs.readFileSync(f.file)),f.sha256);}
 fs.writeFileSync(receipt,JSON.stringify({files:files.map(f=>({name:f.name,sha256:f.sha256,restored:true})),steps},null,2)+'\n');
}
assert.equal(run('restored-fixture-control'),0);
fs.writeFileSync(receipt,JSON.stringify({files:files.map(f=>({name:f.name,sha256:f.sha256,restored:true})),steps},null,2)+'\n');
console.log(JSON.stringify({steps,restored:true}));
