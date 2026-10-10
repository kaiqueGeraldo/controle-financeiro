import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {decimal, validateAmount, reconcileParts} from '../saneamento-CF-028-R28/summary-contract.mjs';
const here=dirname(fileURLToPath(import.meta.url)), root=resolve(here,'../../..');
const r28=resolve(here,'../saneamento-CF-028-R28');
const read=p=>readFileSync(resolve(root,p),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const changed=execFileSync('git',['diff','--name-only','ef5cfae..4dc5f67'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
const protectedFiles=[...changed,'README.md',...execFileSync('git',['ls-files','tasks/evidencias/revisao-CF-028'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/)];
const hashes=()=>Object.fromEntries(protectedFiles.map(p=>[p,sha(readFileSync(resolve(root,p)))]));
const before=hashes();
const runs=['tasks/evidencias/CF-028/verify.mjs','tasks/evidencias/saneamento-CF-028-R28/verify.mjs'].map(p=>JSON.parse(execFileSync(process.execPath,[resolve(root,p)],{cwd:root,encoding:'utf8'})));
// Intercept generator writes in memory: examine the entire fixtures without touching delivery.
for (const [directory,name] of [['tasks/evidencias/CF-028','build-examples.mjs'],['tasks/evidencias/saneamento-CF-028-R28','build-cases.mjs']]) {
    const moduleURL=new URL('file:///'+resolve(root,directory,name).replaceAll('\\','/'));
    const source=read(directory+'/'+name).replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.url','moduleURL');
    let destination, generated;
    vm.runInNewContext(source,{moduleURL,URL,readFileSync,createHash,structuredClone,console:{log(){}},writeFileSync:(p,b)=>{destination=p;generated=b;}});
    assert.equal(generated,readFileSync(destination,'utf8'));
}
const cases=JSON.parse(read('tasks/evidencias/saneamento-CF-028-R28/cases.json')).cases;
const src=read('tasks/evidencias/saneamento-CF-028-R28/verify.mjs');
const body=src.slice(src.indexOf('function validateCase'),src.indexOf("check('E16"));
const fmt=n=>`${n<0n?'-':''}${(n<0n?-n:n)/100n}.${String((n<0n?-n:n)%100n).padStart(2,'0')}`;
const validate=c=>vm.runInNewContext(body+'\nvalidateCase(c)',{c,assert,decimal,validateAmount,reconcileParts,fmt});
const K=(value,outsideIndividualRange=false)=>({state:'KNOWN',value,knownSubtotal:value,outsideIndividualRange,missingPaths:[]});
const mutations=[
    ['agregado arredondado',0,c=>c.summary.byGoal[0].covered=K('2000000000000.00',true),/SUM_MISMATCH/],
    ['unknown como zero',2,c=>c.summary.bySource[0].reserved=K('0.00'),/COMPLETENESS/],
    ['subtotal como total',3,c=>c.summary.metrics.freeAccountCash=K('500.00'),/COMPLETENESS/],
    ['estado removido',2,c=>delete c.summary.byGoal[0].progress.state,/AMOUNT_FIELDS/],
    ['capacidade incorreta',4,c=>c.summary.bySource[0].newAllocationCapacity=K('999.00'),/CAPACITY_RECONCILIATION/],
    ['parcela invalida',0,c=>c.draft.payload.sections.accounts.items[0].balance.value='1000000000000.00',/INDIVIDUAL_RANGE/]
];
const causes=[];
for (const [name,index,mutate,pattern] of mutations) {
    validate(structuredClone(cases[index]));
    const copy=structuredClone(cases[index]);mutate(copy);
    let error;try {validate(copy);} catch(e) {error=e;}
    assert(error);assert.match(error.message,pattern);causes.push({name,cause:error.message.split('\n')[0],legitimateControl:'passed'});
}
const helper=read('tasks/evidencias/saneamento-CF-028-R28/summary-contract.mjs').replace(/^import .*;\r?\n/m,'').replaceAll('export ','');
for(const [name,needle,replacement,probe,pattern] of [
    ['teto individual em agregado','if(individual) assert','if(true) assert',"decimal('1999999999999.98')",/INDIVIDUAL_RANGE/],
    ['teto individual removido','if(individual) assert','if(false) assert',"assert.throws(()=>decimal('1000000000000.00',{individual:true}),/INDIVIDUAL_RANGE/)",/Missing expected exception/]
]) {
    vm.runInNewContext(helper+'\n'+probe,{assert});
    let error;try {vm.runInNewContext(helper.replace(needle,replacement)+'\n'+probe,{assert});}catch(e){error=e;}
    assert(error);assert.match(error.message,pattern);causes.push({name,cause:error.message,legitimateControl:'passed'});
}
// These are verifier coverage probes, not claims that the textual contract allows them.
const mismatch=structuredClone(cases[0]);mismatch.draft.payload.sections.accounts.items[0].balance.value='1.00';validate(mismatch);
const unattributed=structuredClone(cases[3]);delete unattributed.existing.allocations[0].sourceId;validate(unattributed);
// Broad sums and quantity remain valid readings; inputs do not inherit aggregate range.
validateAmount(K('100999999999998.99',true));
validateAmount(K('1000000000000.00000000',true),{scale:8});
assert.throws(()=>decimal('1000000000000.00000000',{scale:8,individual:true}),/INDIVIDUAL_RANGE/);
assert.throws(()=>reconcileParts(K('1999999999999.99',true),['999999999999.99','999999999999.99']),/SUM_MISMATCH/);
const after=hashes();assert.deepEqual(after,before);
console.log(JSON.stringify({scope:'Documental; sem runtime',runs,generatorsMatchEntireFixtures:true,causes,coverageLimits:['E16 draft balance1.00 with unchanged source summary survives validateCase','E19 missing existing allocation sourceId survives validateCase; no source ambiguity oracle'],broadAggregateControls:'passed',protectedFiles:{before,after,unchanged:true}},null,2));
