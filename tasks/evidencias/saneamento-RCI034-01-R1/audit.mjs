import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {hash,writeJson} from '../../../.github/scripts/source.mjs';
const here=import.meta.dirname,sha=p=>hash(fs.readFileSync(p)),read=p=>JSON.parse(fs.readFileSync(p));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const baseline=read(path.join(here,'baseline-inputs.json')),proofs=read(path.join(here,'proofs.json')),runtime=proofs.root;
const reference='tasks/evidencias/revalidacao-CF-034-saneamento/preservation-before.json',inventory=read(reference);
assert.equal(inventory.length,4323);const implementation=new Set(['.github/scripts/sanitize.mjs','.github/scripts/sanitize.test.mjs']);
const missing=inventory.filter(f=>!fs.existsSync(f.path));assert.deepEqual(missing,[]);
const changes=inventory.map(f=>({...f,observedSha256:sha(f.path)})).filter(f=>f.sha256!==f.observedSha256);
assert(changes.every(f=>implementation.has(f.path.replaceAll('\\','/'))));assert.equal(changes.length,2);
const expected='6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca';assert.equal(sha('README.md'),baseline.readmeSha256);assert.equal(sha('README.md'),expected);
assert.equal(sha(baseline.originalProbe.path),baseline.originalProbe.sha256);
writeJson(path.join(here,'preservation-final.json'),{at:new Date().toISOString(),reference,referenceSha256:sha(reference),checked:inventory.length,historicalAndOtherFilesIdentical:inventory.length-changes.length,implementationChanges:changes,missing,unexplainedChanges:[],readme:{initial:baseline.readmeSha256,final:sha('README.md'),outsideCommits:true},originalResidualProbeUnchanged:true,note:'Task state files are outside the old inventory; their two changes are explicit in the Git diff. All prior inventory manifests/evidence remain byte-identical.'});
const accepted=['ci.mjs','owned-process.mjs','owned-process.ps1','cancel.mjs','cancellation.mjs'];
const acceptedFiles=accepted.map(name=>{const file='.github/scripts/'+name,entry=inventory.find(f=>f.path===file);assert(entry);assert.equal(sha(file),entry.sha256);return {file,sha256:sha(file)};});
for(const file of ['.github/scripts/publish-evidence.mjs','.github/workflows/ci.yml','tasks/evidencias/CF-034/collect.mjs'])assert.equal(git('diff','418a648','--',file),'');
assert.equal(git('diff','418a648','--','controle-financeiro-backend','controle-financeiro-frontend','tasks/evidencias/revalidacao-CF-034-saneamento','docs/sdd/decisoes/004-liberacao-local-CF-034.md'),'');
const publications=[];
for(const [folder,expectedFiles] of [[path.join(runtime,'output-nested/public'),['collection.json','lint.log','result.json']],[path.join(runtime,'durable-nested/runs/runner'),['collection.json','control.json','lint.log','result.json']]]){
  const names=fs.readdirSync(folder).sort();assert.deepEqual(names,expectedFiles);
  for(const name of names)assert(!/SENTINEL|eyJTEST/.test(fs.readFileSync(path.join(folder,name),'utf8')));
  publications.push({path:folder,files:names.map(file=>({file,sha256:sha(path.join(folder,file))})),manifest:read(path.join(folder,'collection.json'))});
}
for(const folder of [path.join(runtime,'output-quote/public'),path.join(runtime,'durable-quote/runs/runner')])assert(!fs.existsSync(folder));
const originalContract=path.resolve('../controle-financeiro-runtimes/CF-034/r101/probe/no-secret-contract.mjs'),contract=fs.readFileSync(originalContract,'utf8');
const oldInput=path.resolve('../controle-financeiro-runtimes/CF-034/r101/probe/runner-output/public/lint.log'),newInput=path.join(runtime,'restored/nested-message-in-log/public/backend.log');
const rebound=contract.replace(JSON.stringify(oldInput),JSON.stringify(newInput));assert.notEqual(rebound,contract);
const assertion=text=>text.slice(text.indexOf('assert(!'));assert.equal(assertion(rebound),assertion(contract));
const file=path.join(runtime,'restored-independent-contract.mjs');fs.writeFileSync(file,rebound);const restored=spawnSync(process.execPath,[file],{encoding:'utf8',windowsHide:true});assert.equal(restored.status,0,restored.stderr);
const oldSanitizer=execFileSync('git',['show','418a648:.github/scripts/sanitize.mjs']),oldRawEntry=inventory.find(f=>f.path==='.github/scripts/sanitize.mjs');
const oldNormalized=hash(oldSanitizer);let oldRepresentation='byte-identical';
if(oldNormalized!==baseline.sanitizerSha256){
  const witness=inventory.find(f=>f.path.replaceAll('\\','/').endsWith('/scripts/sanitize.mjs')&&f.path!=='.github/scripts/sanitize.mjs'&&f.sha256===oldRawEntry.sha256);assert(witness);
  assert.equal(sha(witness.path),oldRawEntry.sha256);assert.equal(hash(Buffer.from(fs.readFileSync(witness.path,'utf8').replaceAll('\r\n','\n'))),oldNormalized);oldRepresentation={witness:witness.path,transformation:'CRLF to LF exactly reproduces base object'};
}
const code=[...implementation].map(file=>{
  const exercised=path.join(runtime,'scripts',path.basename(file));assert.equal(sha(file),sha(exercised));const blob=execFileSync('git',['show','HEAD:'+file]),versionedSha256=hash(blob);
  const representation=sha(file)===versionedSha256?'byte-identical':hash(Buffer.from(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')))===versionedSha256?'CRLF to LF exactly reproduces versioned bytes':undefined;assert(representation);
  return {file,workspaceSha256:sha(file),exercisedSha256:sha(exercised),versionedSha256,representation};
});
const jar=path.resolve('../controle-financeiro-runtimes/CF-034/11/evidence-01/api-0.0.1.jar');assert.equal(sha(jar),'28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8');
const logDir=path.join(here,'logs');fs.mkdirSync(logDir,{recursive:true});
for(const name of ['tests.log','tests-final.log','tests-release.log','tests-complete.log','proofs.log','proofs-complete.log','audit-syntax-failure.log','audit-allowlist-failure.log'])fs.copyFileSync(path.resolve('../controle-financeiro-runtimes/CF-034/r102',name),path.join(logDir,name));
writeJson(path.join(here,'audit.json'),{at:new Date().toISOString(),base:'418a648ba06786f2d0d78a0ed03baf4df0dd1d6d',branch:git('branch','--show-current'),codeHead:git('rev-parse','HEAD'),originalTreeChanges:git('status','--short'),versions:{node:process.version,npm:execFileSync(process.execPath,[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'--version'],{encoding:'utf8'}).trim()},code,originalProbe:baseline.originalProbe,oldSanitizer:{initialRawSha256:oldRawEntry.sha256,versionedSha256:oldNormalized,representation:oldRepresentation},acceptedCancellationFilesUnchanged:acceptedFiles,cancellationRetested:false,collectorsAndWorkflowUnchanged:true,publications,restoredIndependentContract:{originalSha256:hash(contract),relocatedSha256:hash(rebound),assertionUnchanged:true,exit:restored.status,stdout:restored.stdout,stderr:restored.stderr},oldJar:{path:jar,source:'a5ad7a64794abca1cc852b11cc1bf79a156dafde',sha256:sha(jar),newBuild:false},logs:fs.readdirSync(logDir).map(file=>({file,sha256:sha(path.join(logDir,file))})),limits:'No remote upload, product compilation, financial suite, bank, native Ctrl+C, Actions/Linux or container cancellation certified.'});
console.log(JSON.stringify({checked:inventory.length,identical:inventory.length-changes.length,implementationChanges:changes.length,missing:0,originalProbeUnchanged:true,acceptedCancellationUntouched:true,restoredContractExit:restored.status}));
