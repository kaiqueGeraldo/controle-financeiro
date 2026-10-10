// Reutiliza o oráculo do revisor anterior em memória; arquivo histórico intacto.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {evaluate,verifyExpected,amount} from '../saneamento-CF-028-origem/check-contract.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const read=p=>readFileSync(resolve(root,p),'utf8');
const sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const history=['tasks/evidencias/revisao-CF-028','tasks/evidencias/revalidacao-CF-028-R28','tasks/evidencias/revalidacao-CF-028-origem'];
const paths=[...new Set(['README.md',...git('diff','--name-only','bbbe8c3..a7bc256').split(/\r?\n/),...git('ls-files',...history).split(/\r?\n/)])];
const hashes=()=>Object.fromEntries(paths.map(p=>[p,sha(p)]));
const before=hashes();
assert.equal(git('diff','bbbe8c3..a7bc256','--',...history),'','Historical review changed');
const delivered=JSON.parse(execFileSync(process.execPath,['tasks/evidencias/saneamento-CF-028-totais/verify.mjs'],{cwd:root,encoding:'utf8'}));
assert.equal(delivered.counterproofs.length,4);assert(delivered.counterproofs.every(c=>c.cause==='DIMENSION_TOTAL'));
assert.equal(delivered.controls.length,6);
const oldURL=pathToFileURL(resolve(root,'tasks/evidencias/revalidacao-CF-028-origem/verify.mjs'));
let source=read('tasks/evidencias/revalidacao-CF-028-origem/verify.mjs');
const negative="assert.notEqual(result.reservedAccounts.value,expected);\n  assert.throws(()=>assert.equal(result.reservedAccounts.value,expected,'DIMENSION_TOTAL'),/DIMENSION_TOTAL/);";
assert(source.includes(negative));
source=source.replace(negative,"assert.equal(result.reservedAccounts.value,expected,'DIMENSION_TOTAL');\n  assert.equal(result.reservedAccounts.state,'KNOWN','DIMENSION_STATE');\n  assert.equal(result.reservedAccounts.knownSubtotal,expected);\n  assert.deepEqual(result.reservedAccounts.missingPaths,[]);");
source=source.replace(/^import .*;\r?\n/gm,'').replace('fileURLToPath(import.meta.url)','fileURLToPath(oldURL)').replaceAll('dimensionFindings','acceptedTotals');
let independent;
// Plain document values cross VM realms: clone both to the same realm before strict comparison.
const vmAssert=Object.assign((...args)=>assert(...args),assert,{deepEqual:(a,b,message)=>assert.deepEqual(structuredClone(a),structuredClone(b),message)});
vm.runInNewContext(source,{oldURL,assert:vmAssert,readFileSync,resolve,dirname,fileURLToPath,pathToFileURL,execFileSync,createHash,vm,evaluate,verifyExpected,amount,structuredClone,process,URL,console:{log:s=>{independent=JSON.parse(s);}}});
assert.equal(independent.acceptedTotals.length,4);
// Compare every fixture field, allowing only four totals and E23 explanatory reason.
const path='tasks/evidencias/saneamento-CF-028-origem/cases.json';
const oldCases=JSON.parse(git('show','bbbe8c3:'+path));
const current=JSON.parse(read(path));
for(const i of [2,7,11,13]){
  assert.equal(current.cases[i].expected.reservedAccounts,i===11?'500.00':'400.00');
  current.cases[i].expected.reservedAccounts=oldCases.cases[i].expected.reservedAccounts;
}
current.cases[2].expected.reason=oldCases.cases[2].expected.reason;
assert.deepEqual(current,oldCases,'Other fixture fields changed');
// Known subtotal with unknown nominal remainder stays partial even for ACCOUNT-only universe.
const partial=structuredClone(current.cases[2]);
partial.reservations[0].nominal={state:'PARTIAL',value:null,knownSubtotal:'123.45',outsideIndividualRange:false,missingPaths:['/legacy/remaining']};
const partialResult=evaluate(partial).reservedAccounts;
assert.equal(partialResult.state,'PARTIAL');assert.equal(partialResult.value,null);assert.equal(partialResult.knownSubtotal,'123.45');
const after=hashes();assert.deepEqual(after,before);
console.log(JSON.stringify({scope:'Aceite documental dirigido; nenhum runtime validado',base:git('rev-parse','a7bc256'),interval:'bbbe8c3..a7bc256',delivered,independent,fixtureDeltaOnlyFourTotalsAndReason:true,partialNominalControl:partialResult,historicalReviewsUnchanged:true,preservation:{before,after,unchanged:true}},null,2));
