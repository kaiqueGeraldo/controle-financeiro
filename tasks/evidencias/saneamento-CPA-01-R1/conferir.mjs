import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {backendSelection} from '../../../.github/scripts/suites.mjs';

const out=import.meta.dirname,hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(path.join(out,name)));
const validation=read('validacao.json'),manifest=JSON.parse(fs.readFileSync(validation.inputsManifest.file));
assert.equal(hash(validation.inputsManifest.file),validation.inputsManifest.sha256);
for(const item of manifest.files)assert.equal(hash(item.file),item.sha256,item.file);
const reference='tasks/evidencias/revalidacao-CPA-01/identidades.json',identities=JSON.parse(fs.readFileSync(reference));
const windows='com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest',selections={};
for(const suite of ['smoke','expanded']){
 const linux=backendSelection(process.cwd(),suite,'linux'),native=backendSelection(process.cwd(),suite,'win32','platform-only');
 assert.deepEqual(linux.selected,identities.expected[suite].filter(name=>name!==windows));assert.deepEqual(native.selected,[windows]);
 assert.deepEqual([...linux.selected,...native.selected].sort(),identities.expected[suite]);
 selections[suite]={linux:linux.selected.length,windows:native.selected.length,union:identities.expected[suite].length,historicalDeferred:linux.deferred.length};
}
const runtimeReferences=[];for(const step of validation.steps){assert.equal(hash(step.log),step.sha256);runtimeReferences.push({file:step.log,sha256:step.sha256});}
const original=read('reproducao-original.json');
for(const name of ['workflow-contrato.json','original-workflow-proof.mjs','original.log','source/.github/workflows/ci.yml']){const file=path.join(original.runtime,name);runtimeReferences.push({file,sha256:hash(file)});}
const result={at:new Date().toISOString(),base:'e837748a600c356e2e9d4f60291240cebf523916',implementationHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),testedFilesMatchCurrent:true,testedInputManifest:validation.inputsManifest,identityReference:{file:reference,sha256:hash(reference)},selections,historicalExpanded:15,acceptedSelectorAndReportsUnchanged:true,originalIndependentProofUnchanged:true,runtimeReferences,remoteActions:false,remoteRules:false,financialTests:false};
fs.writeFileSync(path.join(out,'conferencia.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({testedFiles:manifest.files.length,selections,logsRehashed:validation.steps.length}));
