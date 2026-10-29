import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..');
assert.equal(JSON.parse(fs.readFileSync(path.join(runtime,'after-auth-compiled/execution.json'))).exit,0);
const file=path.join(root,'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/infra/security/UserIsolationBrowserIntegrationTest.java');
const bytes=fs.readFileSync(file),hash=b=>createHash('sha256').update(b).digest('hex'),sha256=hash(bytes),steps=[];
const mutated=bytes.toString().replace('Clock.systemUTC()','Clock.fixed(Instant.parse("2026-09-30T15:00:00Z"),ZoneId.of("America/Sao_Paulo"))');
assert.notEqual(mutated,bytes.toString());
function run(label){const r=spawnSync(process.execPath,[path.join(import.meta.dirname,'executar.mjs'),runtime,label,'UserIsolationBrowserIntegrationTest'],{cwd:root,windowsHide:true,encoding:'utf8',timeout:8*60*1000});steps.push({label,exit:r.status,error:r.error?.message});return r.status;}
const receipt=path.join(runtime,'auth-counterproof.json');
try {
 fs.writeFileSync(file,mutated);assert.equal(run('auth-clock-mutant'),1);
 const diag=JSON.parse(fs.readFileSync(path.join(runtime,'auth-clock-mutant/browsers/UserIsolationBrowserIntegrationTest/diagnostics-private.json')));
 assert.ok(diag.events.some(x=>x.kind==='response'&&x.path==='/api/auth/login'&&x.status===200));
 assert.ok(diag.events.some(x=>x.kind==='response'&&x.path==='/'&&x.status===307));
 assert.equal(diag.state.path,'/auth');assert.ok(!diag.cookies.some(c=>c.name==='token'));
} finally {
 fs.writeFileSync(file,bytes);assert.equal(hash(fs.readFileSync(file)),sha256);
 fs.writeFileSync(receipt,JSON.stringify({sourceSha256:sha256,restored:true,steps},null,2)+'\n');
}
assert.equal(run('auth-restored-control'),0);
fs.writeFileSync(receipt,JSON.stringify({sourceSha256:sha256,restored:true,steps},null,2)+'\n');
console.log(JSON.stringify({steps,restored:true}));
