import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {evaluate,verifyExpected,amount,key,money} from './check-contract.mjs';
import {decimal,validateAmount} from '../saneamento-CF-028-R28/summary-contract.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const fixture=JSON.parse(read('./cases.json')),snapshots=JSON.parse(read('./snapshots.json'));
const files=['./cases.json','./snapshots.json','./build-cases.mjs','./build-snapshots.mjs','./check-contract.mjs','./verify.mjs','../../../docs/sdd/specs/001-onboarding.md'];
const hashes=()=>Object.fromEntries(files.map(p=>[p,sha(readFileSync(new URL(p,import.meta.url)))]));
const before=hashes(),checks=[],counterproofs=[];
const check=(name,f)=>{f();checks.push(name);};
check('E21–E34: conjuntos, totais sem duplicação, permissões, declaração e versões',()=>fixture.cases.forEach(c=>verifyExpected(c)));
check('Pareceres, provas anteriores, fixtures históricas e README preservados',()=>{
  for(const p of JSON.parse(read('./baseline.json')).protected)assert.equal(sha(readFileSync(new URL('../../../'+p.path,import.meta.url))).toUpperCase(),p.sha256);
});
check('E01 e E16–E20: verificadores anteriores intactos',()=>{
  for(const path of ['tasks/evidencias/CF-028/verify.mjs','tasks/evidencias/saneamento-CF-028-R28/verify.mjs'])assert.equal(JSON.parse(execFileSync(process.execPath,[path],{encoding:'utf8'})).passed,9);
});
function bindInputs(c){
  for(const row of c.summary.bySource){
    let value;
    const cmd=c.draft.payload.sections.accounts.items.find(a=>a.tempId===row.ref.tempId);
    if(cmd.action==='CREATE')value=cmd.balance.value;
    else value=c.existing.accounts.find(a=>a.id===cmd.ref.id).value;
    assert.equal(row.value.value,value,'INPUT_SOURCE_BINDING');
  }
  if(c.name.startsWith('E16')){
    let sum=0n;
    for(const a of c.draft.payload.sections.allocations.items){
      decimal(a.amount,{individual:true});sum+=decimal(a.amount);
      const row=c.summary.bySource.find(s=>key(s.ref)===key(a.source));assert.equal(row.reserved.value,a.amount,'INPUT_ALLOCATION_BINDING');
    }
    assert.equal(c.summary.byGoal[0].progress.value,money(sum),'INPUT_GOAL_SUM');
    assert.equal(c.summary.byGoal[0].covered.value,'1999999999999.98');
  }
}
check('E16–E20 revalidados a partir das entradas e atribuição explícita E18/E19',()=>{
  for(const c of snapshots.cases.slice(0,5)){
    bindInputs(c);
    if(c.originInputs){
      const evaluated=evaluate(c.originInputs);
      assert.deepEqual(c.summary.reservationReview,evaluated.reservationReview);
      for(const [i,row] of evaluated.bySource.entries())for(const field of ['reserved','free','newAllocationCapacity'])for(const scalar of ['state','value','knownSubtotal'])assert.equal(row[field][scalar],c.summary.bySource[i][field][scalar]);
    }
  }
  const corrupt=structuredClone(snapshots.cases[0]);corrupt.draft.payload.sections.accounts.items[0].balance.value='1.00';
  assert.throws(()=>bindInputs(corrupt),/INPUT_SOURCE_BINDING/);
});
function encode(v){
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v)){
    const sortKey=x=>typeof x==='string'?x:x.tempId??(x.kind&&x.id?x.kind+'/'+x.id:x.reservationId??x.id??x.dimension??(x.source?key(x.source):x.ref?key(x.ref):''));
    return '['+[...v].sort((a,b)=>sortKey(a)<sortKey(b)?-1:sortKey(a)>sortKey(b)?1:0).map(encode).join(',')+']';
  }
  return '{'+Object.keys(v).filter(k=>k!=='existingAsOf').sort().map(k=>JSON.stringify(k)+':'+encode(v[k])).join(',')+'}';
}
check('Snapshots E16–E20/E35: prepare, complete, receipt, GET e hashes',()=>{
  for(const c of snapshots.cases){
    const p=c.prepareResponse.data,r=c.receiptResponse.data,cmd=c.completeRequest;
    assert.deepEqual(p.summary,c.summary);assert.deepEqual(r.summary,c.summary);
    assert.deepEqual(c.recoveryResponse.data.prepared,p);assert.deepEqual(c.recoveryResponse.data.receipt,r);
    for(const field of ['operationId','sessionId','contentHash','reviewHash'])assert.equal(cmd[field],r[field]);
    assert.equal(sha(encode({contractVersion:1,sessionId:p.sessionId,draftVersion:p.draftVersion,payload:c.draft.payload})),p.contentHash);
    assert.equal(sha(encode({contentHash:p.contentHash,sourceSnapshot:p.sourceSnapshot,mappingPreview:p.mappingPreview,summary:p.summary})),p.reviewHash);
    for(const row of c.summary.bySource)for(const f of ['reserved','free','newAllocationCapacity'])validateAmount(row[f],{signed:f==='free',capacity:f==='newAllocationCapacity'});
  }
  const c=snapshots.cases.at(-1);assert.equal(c.expectedOutcome.status,200);
  assert.equal(c.summary.metrics.netWorth.value,'1500.00');assert.equal(c.summary.metrics.reservedAccounts.value,'400.00');
  assert.equal(c.summary.byGoal[0].progress.state,'UNKNOWN');
  assert(c.summary.bySource.every(s=>s.free.value===null&&s.value.state==='KNOWN'));
});
check('Contraprovas isoladas contra resultados literais',()=>{
  const tests=[
    ['origem ausente tratada como reserva ausente',2,c=>c.reservations=[],null,/SOURCE_PROPAGATION/],
    ['escolha arbitrária de A',1,c=>{c.reservations[0].attribution.sources.splice(1);c.evidence[0].sources.splice(1);},null,/SOURCE_PROPAGATION/],
    ['liberação indevida de candidata',1,null,r=>r.bySource[1].decision.state='ALLOWED',/PERMISSION/],
    ['bloqueio indevido de independente',1,null,r=>r.bySource[2].decision.state='BLOCKED',/INDEPENDENT_ALLOWED/],
    ['encerrar uma elimina outra pendência',3,c=>c.reservations.splice(1),null,/SOURCE_PROPAGATION/],
    ['unknown convertido em zero',2,null,r=>r.bySource[0].free=amount([]),/SOURCE_PROPAGATION/],
    ['finalização aceita alocação proibida',4,null,r=>r.status=200,/FINALIZATION/],
    ['encerramento produz histórico financeiro',6,null,r=>r.financialTransactions.push({type:'INCOME',amount:'400.00'}),/NO_FAKE_HISTORY/]
  ];
  for(const [name,index,mutateInput,mutateOutput,pattern] of tests){
    const c=structuredClone(fixture.cases[index]);verifyExpected(c);
    if(mutateInput)mutateInput(c);const result=evaluate(c);if(mutateOutput)mutateOutput(result);
    assert.throws(()=>verifyExpected(c,result),pattern);counterproofs.push({name,cause:pattern.source});
  }
  const src=read('./check-contract.mjs').replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
  const mutant=src.replace("let status=c.preparedToken&&c.preparedToken!==token?409:200;","let status=200;");assert.notEqual(mutant,src);
  assert.throws(()=>vm.runInNewContext(mutant+'\nverifyExpected(c)',{c:fixture.cases[8],assert,decimal,validateAmount,structuredClone}),/FINALIZATION/);
  counterproofs.push({name:'versão/inventário ignorado',cause:'FINALIZATION'});
});
check('Evidência inválida não limita risco; candidatas vazias e owner alheio rejeitados',()=>{
  let c=structuredClone(fixture.cases[1]);c.evidence=[];
  const r=evaluate(c);assert.equal(r.status,400);assert(r.bySource.every(s=>s.decision.state==='BLOCKED'));
  c=structuredClone(fixture.cases[1]);c.reservations[0].attribution.sources=[];assert.throws(()=>evaluate(c),/EMPTY_CANDIDATES/);
  c=structuredClone(fixture.cases[1]);c.sources[0].owner='other-owner';assert.throws(()=>evaluate(c),/OWNERSHIP/);
});
const after=hashes();assert.deepEqual(after,before);
console.log(JSON.stringify({scope:'Somente contrato documental; nenhum runtime/HTTP/SQL',passed:checks.length,checks,cases:fixture.cases.map(c=>({name:c.name,status:c.expected.status,reason:c.expected.reason})),counterproofs,preservation:{before,after,unchanged:true}},null,2));
