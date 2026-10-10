import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {decimal,validateAmount,reconcileParts} from './summary-contract.mjs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const cases=JSON.parse(read('./cases.json')).cases;
const base=JSON.parse(read('./baseline.json'));
const protectedFiles=['./cases.json','./summary-contract.mjs','./build-cases.mjs','./verify.mjs','../../../docs/sdd/specs/001-onboarding.md'];
const hashesBefore=Object.fromEntries(protectedFiles.map(path=>[path,sha(readFileSync(new URL(path,import.meta.url)))]));
const checks=[],counterproofs=[];
const check=(name,fn)=>{fn();checks.push(name);};
const K=(value,outsideIndividualRange=false)=>({state:'KNOWN',value,knownSubtotal:value,outsideIndividualRange,missingPaths:[]});
const P=(s)=>({state:'PARTIAL',value:null,knownSubtotal:s,outsideIndividualRange:false,missingPaths:['/missing']});
const U=()=>({state:'UNKNOWN',value:null,knownSubtotal:null,outsideIndividualRange:null,missingPaths:['/missing']});
const fmt=n=>`${n<0n?'-':''}${(n<0n?-n:n)/100n}.${String((n<0n?-n:n)%100n).padStart(2,'0')}`;
function validateCase(c){
  const s=c.summary;
  for(const [key,row] of Object.entries(s.metrics))validateAmount(row,{signed:['accountsSigned','netWorth','freeAccountCash','unallocatedInvestments'].includes(key)});
  for(const [index,row] of s.bySource.entries()){
    const value=decimal(row.value.value,{signed:true,individual:true});
    const parts=c.components.sourceReservations[index];
    for(const part of parts)if(part!==null)decimal(part,{individual:true});
    reconcileParts(row.reserved,parts);
    validateAmount(row.free,{signed:true});validateAmount(row.newAllocationCapacity,{capacity:true});
    if(row.reserved.state==='KNOWN'){
      const free=value-decimal(row.reserved.value);
      assert.equal(row.free.state,'KNOWN','FREE_STATE');assert.equal(row.free.value,fmt(free),'FREE_RECONCILIATION');
      assert.equal(row.newAllocationCapacity.state,'KNOWN','CAPACITY_STATE');
      assert.equal(row.newAllocationCapacity.value,fmt(free>0n?free:0n),'CAPACITY_RECONCILIATION');
    }else{
      assert.equal(row.free.state,'UNKNOWN','FREE_UNKNOWN');
      assert.equal(row.newAllocationCapacity.state,value<=0n?'KNOWN':'UNKNOWN','CAPACITY_UNKNOWN');
      if(value<=0n)assert.equal(row.newAllocationCapacity.value,'0.00');
    }
  }
  for(const [index,row] of s.byGoal.entries()){
    const opts={scale:row.type==='NUMERIC'?8:2};
    reconcileParts(row.progress,c.components.goalProgress[index],opts);
    validateAmount(row.covered,{na:row.type==='NUMERIC'});
    if(row.type==='NUMERIC')assert.equal(row.covered.state,'NOT_APPLICABLE');
    else reconcileParts(row.covered,c.components.goalCovered[index]);
  }
  reconcileParts(s.metrics.accountsSigned,s.bySource.map(r=>r.value.value),{signed:true});
  reconcileParts(s.metrics.netWorth,s.bySource.map(r=>r.value.value),{signed:true}); // Estes casos não têm outros ativos/passivos.
  reconcileParts(s.metrics.reservedAccounts,c.components.sourceReservations.flat());
  reconcileParts(s.metrics.freeAccountCash,s.bySource.map(r=>r.free.state==='KNOWN'?r.free.value:null),{signed:true});
  assert.equal(c.expectedOutcome.status,200);
  assert.deepEqual(c.prepareResponse.data.summary,s,'PREPARE_SNAPSHOT');
  assert.deepEqual(c.receiptResponse.data.summary,s,'RECEIPT_SNAPSHOT');
  assert.deepEqual(c.recoveryResponse.data.receipt,c.receiptResponse.data,'RECOVERY_SNAPSHOT');
  const p=c.prepareResponse.data,r=c.receiptResponse.data,cmd=c.completeRequest;
  for(const key of ['operationId','sessionId','contentHash','reviewHash'])assert.equal(cmd[key],r[key]);
  assert.equal(cmd.expectedVersion,r.draftVersion);
  assert.equal(new Set(r.mapping.map(x=>x.tempId)).size,r.mapping.length);
  assert.deepEqual(r.mapping.map(x=>x.tempId).sort(),p.mappingPreview.map(x=>x.tempId).sort());
  for(const row of c.draft.payload.sections.accounts.items)if(row.balance)decimal(row.balance.value,{signed:true,individual:true});
  for(const row of c.draft.payload.sections.allocations.items)decimal(row.amount,{individual:true});
}
check('E16–E20: schema, estados, soma/capacidade e envelopes completos',()=>cases.forEach(validateCase));
check('E16–E20: hashes de conteúdo/revisão conferidos nos snapshots',()=>{
  function encode(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value)){
      const key=x=>typeof x==='string'?x:x.tempId??(x.kind&&x.id?x.kind+'/'+x.id:x.dimension??(x.ref?x.ref.kind+'/'+(x.ref.tempId??x.ref.id):''));
      return '['+[...value].sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0).map(encode).join(',')+']';
    }
    return '{'+Object.keys(value).filter(k=>k!=='existingAsOf').sort().map(k=>JSON.stringify(k)+':'+encode(value[k])).join(',')+'}';
  }
  for(const c of cases){
    const p=c.prepareResponse.data;
    assert.equal(sha(encode({contractVersion:1,sessionId:p.sessionId,draftVersion:p.draftVersion,payload:c.draft.payload})),p.contentHash);
    assert.equal(sha(encode({contentHash:p.contentHash,sourceSnapshot:p.sourceSnapshot,mappingPreview:p.mappingPreview,summary:p.summary})),p.reviewHash);
  }
});
check('Oráculos literais R28-01, sem teto indevido ou arredondamento',()=>{
  assert.equal(cases[0].summary.byGoal[0].covered.value,'1999999999999.98');
  assert.equal(cases[1].summary.bySource[0].free.value,'-1999999999999.98');
  assert.equal(decimal('999999999999.99',{individual:true})*2n,199999999999998n);
  assert.equal(decimal('999999999999.99',{individual:true})*(-2n),-199999999999998n);
  assert.throws(()=>decimal('1000000000000.00',{individual:true}),/INDIVIDUAL_RANGE/);
  reconcileParts(K('1999999999999.98',true),['999999999999.99','999999999999.99']);
  assert.throws(()=>reconcileParts(K('1999999999999.99',true),['999999999999.99','999999999999.99']),/SUM_MISMATCH/);
});
check('Conhecido zero, parcial zero, desconhecido e não aplicável não se confundem',()=>{
  reconcileParts(K('0.00'),[]);reconcileParts(K('0.00'),['0.00']);
  reconcileParts(P('0.00'),['0.00',null]);reconcileParts(U(),[null]);
  assert.throws(()=>reconcileParts(K('0.00'),[null]),/COMPLETENESS/);
  assert.throws(()=>reconcileParts(K('300.00'),['300.00',null]),/COMPLETENESS/);
  for(const mutate of [r=>r.value='0.00',r=>r.knownSubtotal='0.00',r=>r.outsideIndividualRange=false]){const r=U();mutate(r);assert.throws(()=>validateAmount(r));}
  const absent=K('0.00');absent.value=null;assert.throws(()=>validateAmount(absent),/KNOWN_VALUE/);
  const partial=P('300.00');partial.missingPaths=[];assert.throws(()=>validateAmount(partial),/PARTIAL_MISSING/);
  const missing=U();delete missing.state;assert.throws(()=>validateAmount(missing),/AMOUNT_FIELDS/);
  assert.throws(()=>validateAmount({state:'NOT_APPLICABLE',value:null,knownSubtotal:null,outsideIndividualRange:null,missingPaths:[]}));
});
check('Sinais/escala e capacidades: precisão válida por campo',()=>{
  for(const token of ['1.001','01.00','1e12','+1.00','-0.00','1,00',1])assert.throws(()=>decimal(token));
  validateAmount(K('-1999999999999.98',true),{signed:true});
  assert.throws(()=>validateAmount(K('-1.00')));
  validateAmount(K('1000000000000.00000000',true),{scale:8});
  assert.throws(()=>validateAmount(K('1.000000001'),{scale:8}));
  assert.throws(()=>validateAmount(K('1000000000000.00',true),{capacity:true}),/CAPACITY_RANGE/);
  validateAmount(K('999999999999.99'),{capacity:true});
});
check('R28-02: bloqueio localizado sem destruir conhecimento de patrimônio',()=>{
  const unknown=cases[2],partial=cases[3],zero=cases[4];
  assert.equal(unknown.summary.metrics.netWorth.value,'1000.00');
  assert.equal(unknown.expectedOutcome.attemptIncrease.code,'SOURCE_RESERVATION_UNRECONCILED');
  assert.equal(unknown.expectedOutcome.attemptReleaseUnknown.code,'ALLOCATION_UNRECONCILED');
  assert.equal(partial.summary.metrics.reservedAccounts.knownSubtotal,'300.00');
  assert.equal(partial.summary.metrics.freeAccountCash.knownSubtotal,'500.00');
  assert.equal(partial.summary.metrics.freeAccountCash.value,null);
  assert.equal(zero.summary.bySource[0].newAllocationCapacity.value,'1000.00');
});
check('Contraprovas isoladas de representação/semântica',()=>{
  const mutations=[
    ['agregado arredondado',0,c=>c.summary.byGoal[0].covered=K('2000000000000.00',true),/SUM_MISMATCH/],
    ['unknown substituído por zero',2,c=>c.summary.bySource[0].reserved=K('0.00'),/COMPLETENESS/],
    ['subtotal promovido a total',3,c=>c.summary.metrics.freeAccountCash=K('500.00'),/COMPLETENESS/],
    ['estado removido',2,c=>delete c.summary.byGoal[0].progress.state,/AMOUNT_FIELDS/],
    ['capacidade adulterada N2',4,c=>c.summary.bySource[0].newAllocationCapacity=K('999.00'),/CAPACITY_RECONCILIATION/],
    ['parcela inválida',0,c=>c.draft.payload.sections.accounts.items[0].balance.value='1000000000000.00',/INDIVIDUAL_RANGE/]
  ];
  for(const [name,index,mutate,pattern] of mutations){const copy=structuredClone(cases[index]);mutate(copy);assert.throws(()=>validateCase(copy),pattern);counterproofs.push(name);}
  const src=read('./summary-contract.mjs').replace(/^import .*;\r?\n/m,'').replaceAll('export ','');
  const variants=[
    ['reaplicar teto individual ao agregado',src.replace('if(individual) assert','if(true) assert'),"decimal('1999999999999.98')",true],
    ['remover teto individual',src.replace('if(individual) assert','if(false) assert'),"assert.throws(()=>decimal('1000000000000.00',{individual:true}),/INDIVIDUAL_RANGE/)",true]
  ];
  for(const [name,mutant,probe] of variants){assert.notEqual(mutant,src);assert.throws(()=>vm.runInNewContext(mutant+'\n'+probe,{assert}));counterproofs.push(name);}
});
check('Preservação dos cinco artefatos independentes e README raiz',()=>{
  for(const p of base.independentProofs)assert.equal(sha(readFileSync(new URL('../revisao-CF-028/'+p.file,import.meta.url))).toUpperCase(),p.sha256);
  assert.equal(sha(readFileSync(new URL('../../../README.md',import.meta.url))).toUpperCase(),base.readme);
});
check('E01 e identidade: números/contentHash preservados; reviewHash mudou explicitamente',()=>{
  const old=JSON.parse(execFileSync('git',['show','ef5cfae:tasks/evidencias/CF-028/examples.json'],{encoding:'utf8'}));
  const now=JSON.parse(read('../CF-028/examples.json'));
  assert.deepEqual(now.expected,old.expected);assert.deepEqual(now.expectedAfterPayment,old.expectedAfterPayment);
  assert.deepEqual(now.draft,old.draft);assert.equal(now.completeRequest.operationId,old.completeRequest.operationId);
  assert.equal(now.completeRequest.contentHash,old.completeRequest.contentHash);
  assert.notEqual(now.completeRequest.reviewHash,old.completeRequest.reviewHash);
  for(const row of Object.values(now.completeResponse.data.summary.metrics))validateAmount(row);
});
const hashesAfter=Object.fromEntries(protectedFiles.map(path=>[path,sha(readFileSync(new URL(path,import.meta.url)))]));
assert.deepEqual(hashesAfter,hashesBefore,'COUNTERPROOFS_FILE_PRESERVATION');
console.log(JSON.stringify({scope:'documental; sem runtime/HTTP/banco',passed:checks.length,checks,counterproofs,originalProofHashesPreserved:true,counterproofFiles:{before:hashesBefore,after:hashesAfter,unchanged:true}},null,2));
