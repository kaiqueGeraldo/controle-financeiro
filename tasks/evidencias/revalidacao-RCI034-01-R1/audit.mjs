import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {sanitizeText} from '../../../.github/scripts/sanitize.mjs';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
const here=import.meta.dirname,sha=p=>hash(fs.readFileSync(p)),read=p=>JSON.parse(fs.readFileSync(p));
const root=path.resolve(process.argv[2]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root);
const sourcePath='tasks/evidencias/revalidacao-CF-034-saneamento/sanitization.mjs',source=fs.readFileSync(sourcePath,'utf8');
const adapter=source.replace("'../../../.github/scripts/source.mjs'",JSON.stringify(pathToFileURL(path.resolve('.github/scripts/source.mjs')).href));assert.notEqual(adapter,source);
fs.writeFileSync(path.join(root,'original.mjs'),adapter);const temp=path.join(root,'temp');fs.mkdirSync(temp);
const observed=spawnSync(process.execPath,[path.join(root,'original.mjs'),path.join(root,'original-output')],{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024,env:{...process.env,TEMP:temp,TMP:temp,npm_config_offline:'true',npm_config_cache:path.join(root,'npm-cache')}});
const out=path.join(root,'original-output/runner-output/public/lint.log');
assert.equal(observed.status,1);assert.match(observed.stderr,/assert\(published\.includes\('SENTINEL_NESTED_MESSAGE'\)\)/);assert(!fs.readFileSync(out,'utf8').includes('SENTINEL_NESTED_MESSAGE'));
const proofs=read(path.join(here,'proofs.json')),runtime=proofs.root;
const publications=[];
for(const dir of [path.join(runtime,'output-nested/public'),path.join(runtime,'durable-nested/runs/runner')]){
 const files=fs.readdirSync(dir).map(file=>{const bytes=fs.readFileSync(path.join(dir,file));assert(!/SENTINEL|eyJTEST/.test(bytes.toString('utf8')));return {file,sha256:hash(bytes),bytes:bytes.length};});
 publications.push({path:dir,files});
}
assert(!fs.existsSync(path.join(runtime,'output-quote/public')));assert(!fs.existsSync(path.join(runtime,'durable-quote/runs/runner')));
const code=['sanitize.mjs','sanitize.test.mjs'].map(name=>{
 const file='.github/scripts/'+name,workspace=fs.readFileSync(file),blob=execFileSync('git',['show','ea00a06:'+file]),exercised=path.join(runtime,'scripts',name);
 assert.equal(sha(exercised),hash(workspace));const equal=hash(blob)===hash(workspace);assert(equal||hash(Buffer.from(workspace.toString('utf8').replaceAll('\r\n','\n')))===hash(blob));
 return {file,workspaceSha256:hash(workspace),exercisedSha256:sha(exercised),versionedSha256:hash(blob),representation:equal?'byte-identical':'CRLF to LF exactly reproduces candidate blob'};
});
const unchanged=['.github/scripts/ci.mjs','.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1','.github/scripts/cancel.mjs','.github/scripts/cancellation.mjs','.github/scripts/publish-evidence.mjs','.github/workflows/ci.yml','tasks/evidencias/CF-034/collect.mjs'];
for(const p of unchanged)assert.equal(execFileSync('git',['diff','418a648..ea00a06','--',p],{encoding:'utf8'}),'');
const jar='../controle-financeiro-runtimes/CF-034/11/evidence-01/api-0.0.1.jar';assert.equal(sha(jar),'28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8');
const stress=[];
for(const units of [32768,65536]){
 const s=('INFO "diagnostic" : "keep"; password_policy=keep; ').repeat(units)+'\npassword=R1RV_LONG_SECRET\ndiagnostic=keep';const start=performance.now(),output=sanitizeText(s);const ms=performance.now()-start;
 assert(!output.includes('R1RV_LONG_SECRET'));assert(output.includes('diagnostic'));assert(ms<5000,'representative token-dense record exceeded 5s');stress.push({bytes:Buffer.byteLength(s),ms,sha256:hash(output),secretRemoved:true});
}
writeJson(path.join(here,'audit.json'),{head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtime:root,originalObserver:{source:sourcePath,sourceSha256:hash(source),adapterSha256:hash(adapter),onlyImportRelocated:true,exit:observed.status,stdout:observed.stdout,stderr:observed.stderr,reason:'Original full reproduction asserts that the known defect EXISTS. It now fails on that exact assertion after real collection. Original eight-case loop and negative-secret contract are independently used unchanged in proofs.json.'},publications,code,unchanged:unchanged.map(file=>({file,sha256:sha(file)})),historicalJar:{path:jar,source:'a5ad7a64794abca1cc852b11cc1bf79a156dafde',sha256:sha(jar),newBuild:false},stress,readme:sha('README.md')});
console.log('Public files, source identity, observer polarity and representative token-dense records verified.');
