// Regressão documental dirigida: expected por mundos possíveis, não pelo avaliador.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {evaluate,amount} from '../saneamento-CF-028-origem/check-contract.mjs';
import {decimal,validateAmount} from '../saneamento-CF-028-R28/summary-contract.mjs';
const directory='tasks/evidencias/saneamento-CF-028-origem/';
const read=p=>readFileSync(p,'utf8');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex').toUpperCase();
const cases=JSON.parse(read(directory+'cases.json')).cases;
const oldSource=execFileSync('git',['show','bbbe8c3:'+directory+'check-contract.mjs'],{encoding:'utf8'}).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
const oldEvaluate=c=>vm.runInNewContext(oldSource+'\nevaluate(c)',{c,assert,decimal,validateAmount,structuredClone});
const protectedPaths=JSON.parse(read('tasks/evidencias/saneamento-CF-028-totais/baseline.json')).hashes;
const changedAllowed=['build-cases.mjs','cases.json','check-contract.mjs','README.md','verification.json'].map(p=>directory+p);
const during=[...protectedPaths.map(p=>p.path),'docs/sdd/specs/001-onboarding.md', 'tasks/evidencias/saneamento-CF-028-totais/verify.mjs'];
const hashes=()=>Object.fromEntries(during.map(p=>[p,sha(p)]));
const before=hashes(),findings=[],counterproofs=[];
const money=n=>`${n/100n}.${String(n%100n).padStart(2,'0')}`;
const cents=s=>{assert.match(s,/^\d+\.\d{2}$/);return BigInt(s.replace('.',''));};
for(const [index,literal] of [[2,'400.00'],[7,'400.00'],[11,'500.00'],[13,'400.00']]){
  const c=cases[index],reservation=c.reservations[0];
  const excluded=new Set(reservation.attribution.excluded.map(e=>e.source.id));
  const sources=c.sources.filter(s=>!excluded.has(s.ref.id));
  assert(sources.length>0&&sources.every(s=>s.ref.kind==='ACCOUNT'));
  assert.equal(reservation.nominal.state,'KNOWN');
  const added=c.expected.status===200?c.allocations.reduce((n,a)=>n+cents(a.amount),0n):0n;
  // Atribuir a cada origem possível é só contramodelo: nenhuma é escolhida como verdadeira.
  const worlds=sources.map(s=>({source:s.ref.id,total:money(cents(reservation.nominal.value)+added)}));
  assert(worlds.every(w=>w.total===literal),'INDEPENDENT_WORLDS');
  const result=evaluate(c);assert.deepEqual(result.reservedAccounts,{state:'KNOWN',value:literal,knownSubtotal:literal,outsideIndividualRange:false,missingPaths:[]},'DIMENSION_TOTAL');
  assert.equal(c.expected.reservedAccounts,literal);
  const original=oldEvaluate(c);
  assert.throws(()=>assert.equal(original.reservedAccounts.value,literal,'DIMENSION_TOTAL'),/DIMENSION_TOTAL/);
  findings.push({case:c.name,before:original.reservedAccounts,after:result.reservedAccounts,worlds});
  counterproofs.push({case:c.name,mutation:'Ramo anterior UNBOUNDED adiciona lacuna incondicional',cause:'DIMENSION_TOTAL'});
}
// A única alteração semântica nos 14 resultados é reservedAccounts nos quatro casos.
for(const c of cases){
  const current=evaluate(c),previous=oldEvaluate(c);
  delete current.reservedAccounts;delete previous.reservedAccounts;
  assert.equal(JSON.stringify(current),JSON.stringify(previous),'ONLY_DIMENSION_CHANGED');
}
const mixed=structuredClone(cases[2]);mixed.sources[2].ref.kind='INVESTMENT';
assert.equal(evaluate(mixed).reservedAccounts.state,'UNKNOWN','MIXED_UNKNOWN');
const partial=structuredClone(mixed);
partial.reservations.push(structuredClone(cases[5].reservations[0]));partial.evidence.push(structuredClone(cases[5].evidence[0]));
const subtotal=evaluate(partial).reservedAccounts;
assert.equal(subtotal.state,'PARTIAL');assert.equal(subtotal.knownSubtotal,'300.00');assert.equal(subtotal.value,null);
const unknownAmount=structuredClone(cases[2]);unknownAmount.reservations[0].nominal=amount([],['/unknown']);
assert.equal(evaluate(unknownAmount).reservedAccounts.state,'UNKNOWN','NOMINAL_UNKNOWN');
assert.equal(evaluate(cases[10]).reservedAccounts.state,'UNKNOWN','EMPTY_UNIVERSE');
assert.equal(evaluate(cases[8]).status,409);assert.equal(evaluate(cases[8]).reservedAccounts.state,'UNKNOWN','STALE_INVENTORY');
// Universo realmente misto torna-se só ACCOUNT após exclusão comprovada do investimento.
const excludedInvestment=structuredClone(cases[11]);
excludedInvestment.sources[2].ref.kind='INVESTMENT';excludedInvestment.reservations[0].attribution.excluded[0].source.kind='INVESTMENT';excludedInvestment.evidence[0].sources[0].kind='INVESTMENT';excludedInvestment.allocations=[];
assert.equal(evaluate(excludedInvestment).reservedAccounts.value,'400.00','AFTER_EXCLUSIONS');
const runs=['tasks/evidencias/CF-028/verify.mjs','tasks/evidencias/saneamento-CF-028-R28/verify.mjs',directory+'verify.mjs'].map(p=>JSON.parse(execFileSync(process.execPath,[p],{encoding:'utf8'})));
assert.deepEqual(runs.map(r=>r.passed),[9,9,7]);
for(const p of protectedPaths)if(!changedAllowed.includes(p.path))assert.equal(sha(p.path),p.sha256,'PRESERVED '+p.path);
const after=hashes();assert.deepEqual(after,before);
console.log(JSON.stringify({scope:'Somente documento; sem runtime/HTTP/SQL',findings,counterproofs,controls:['universo misto UNKNOWN','misto com reserva300 comprovada PARTIAL300','nominal desconhecido UNKNOWN','E31 sem fontes UNKNOWN','E29 obsoleto409/UNKNOWN','tipo após exclusões KNOWN400'],allOtherOutputFieldsPreserved:true,runs:runs.map(r=>({passed:r.passed,scope:r.scope})),historicalProofsAndSnapshotsPreserved:true,preservation:{before,after,unchanged:true}},null,2));
