// Modelo executável DOCUMENTAL, não implementação de produto nem prova HTTP/SQL.
import assert from 'node:assert/strict';
import {decimal,validateAmount} from '../saneamento-CF-028-R28/summary-contract.mjs';
export const key=r=>r.kind+'/'+(r.id??r.tempId);
const sum=values=>values.reduce((a,v)=>a+decimal(v,{signed:true}),0n);
export const money=n=>`${n<0n?'-':''}${(n<0n?-n:n)/100n}.${String((n<0n?-n:n)%100n).padStart(2,'0')}`;
export function amount(values,missing=[]){
  const value=money(sum(values));
  return {state:missing.length?(values.length?'PARTIAL':'UNKNOWN'):'KNOWN',value:missing.length?null:value,knownSubtotal:missing.length&&!values.length?null:value,outsideIndividualRange:missing.length&&!values.length?null:(sum(values)<0n?-sum(values):sum(values))>99999999999999n,missingPaths:missing};
}
export function evaluate(input){
  const c=structuredClone(input),sources=c.sources,reservations=c.reservations,evidence=c.evidence;
  const token=c.currentToken??c.inventoryToken;
  assert.equal(new Set(sources.map(s=>key(s.ref))).size,sources.length,'SOURCE_DUPLICATE');
  const byKey=new Map(sources.map(s=>[key(s.ref),s]));
  for(const s of sources){assert.equal(s.owner,'synthetic-owner','OWNERSHIP');decimal(s.value.value,{signed:s.ref.kind==='ACCOUNT',individual:true});}
  const exists=r=>{assert(byKey.has(key(r)),'REFERENCE_NOT_FOUND');return byKey.get(key(r));};
  function proven(refs,r,claim,scope){
    return refs.length>0&&refs.every(id=>evidence.some(e=>e.id===id&&e.reservationId===r.reservationId&&e.claim===claim&&e.inventoryToken===token&&JSON.stringify(e.sources.map(key).sort())===JSON.stringify(scope.map(key).sort())));
  }
  let status=c.preparedToken&&c.preparedToken!==token?409:200;
  const confirmationResults=[];
  assert.equal(new Set(c.confirmations.map(x=>x.reservationId)).size,c.confirmations.length,'CONFIRMATION_DUPLICATE');
  for(const conf of c.confirmations){
    const r=reservations.find(r=>r.reservationId===conf.reservationId);assert(r,'REFERENCE_NOT_FOUND');
    if(r.revision!==conf.expectedRevision){status=409;continue;}
    assert.equal(conf.currentSituationConfirmed,true,'CONFIRMATION_REQUIRED');
    if(status===409)continue;
    let claim,refs;
    if(conf.action==='CLOSE'){r.attribution={state:'CLOSED',evidenceRefs:[r.reservationId+'-declaration']};r.nominal=amount([]);claim='CLOSURE';refs=[];}
    else{
      assert.equal(conf.action,'ASSIGN','CONFIRMATION_ACTION');assert(conf.parts.length>0,'CONFIRMATION_EMPTY');
      assert.equal(conf.goal.kind,'GOAL','MONETARY_GOAL');assert.deepEqual(conf.goal,r.goal.value,'GOAL_REFERENCE');
      assert.equal(new Set(conf.parts.map(p=>key(p.source))).size,conf.parts.length,'DUPLICATE_REFERENCE');
      for(const p of conf.parts){exists(p.source);assert(decimal(p.amount,{individual:true})>0n,'PART_AMOUNT');}
      r.nominal=amount(conf.parts.map(p=>p.amount));r.attribution={state:'CONFIRMED',parts:conf.parts.map(p=>({source:p.source,amount:amount([p.amount])})),evidenceRefs:[r.reservationId+'-declaration']};claim='ASSIGNMENT';refs=conf.parts.map(p=>p.source);
    }
    const previousRevision=r.revision;r.revision=String(BigInt(r.revision)+1n);
    // Identidade documental determinística; fixtures completas substituem por UUID.
    const evidenceId=r.reservationId.replace(/^2/,'3');r.attribution.evidenceRefs=[evidenceId];
    evidence.push({id:evidenceId,revision:'1',basis:'CURRENT_DECLARATION',reservationId:r.reservationId,claim,sources:refs,inventoryToken:token,validatedAt:'2026-10-10T15:01:00Z'});
    confirmationResults.push({reservationId:r.reservationId,action:conf.action,previousRevision,resultingRevision:r.revision});
  }
  const rows=new Map(sources.map(s=>[key(s.ref),{source:s,values:[],risks:[]} ]));
  const totalValues=[],totalMissing=[];
  for(const r of reservations){
    validateAmount(r.nominal);let a=r.attribution;
    if(a.state==='CONFIRMED'&&!proven(a.evidenceRefs,r,'ASSIGNMENT',a.parts.map(p=>p.source)))a={state:'UNBOUNDED',excluded:[]};
    if(a.state==='CANDIDATES'){
      assert(a.sources.length>0,'EMPTY_CANDIDATES');assert.equal(new Set(a.sources.map(key)).size,a.sources.length,'DUPLICATE_CANDIDATE');
      if(!proven(a.evidenceRefs,r,'EXHAUSTIVE_CANDIDATES',a.sources))a={state:'UNBOUNDED',excluded:[]};
    }
    r.attribution=a;let affected=[];
    if(a.state==='CLOSED'){assert(proven(a.evidenceRefs,r,'CLOSURE',[]),'CLOSURE_PROOF');assert.equal(r.nominal.value,'0.00','CLOSED_ZERO');continue;}
    if(a.state==='CONFIRMED'){
      assert(a.parts.length>0,'PARTS_EMPTY');
      const componentValues=[],componentMissing=[];
      for(const p of a.parts){
        const s=exists(p.source),row=rows.get(key(s.ref));validateAmount(p.amount);
        if(p.amount.knownSubtotal!==null){decimal(p.amount.knownSubtotal,{individual:true});row.values.push(p.amount.knownSubtotal);componentValues.push(p.amount.knownSubtotal);if(s.ref.kind==='ACCOUNT')totalValues.push(p.amount.knownSubtotal);}
        if(p.amount.state!=='KNOWN'){affected.push(s.ref);componentMissing.push(r.reservationId);if(s.ref.kind==='ACCOUNT')totalMissing.push(r.reservationId);}
      }
      const nominal=amount(componentValues,[...new Set(componentMissing)]);
      for(const f of ['state','value','knownSubtotal'])assert.equal(r.nominal[f],nominal[f],'PARTS_RECONCILE');
    }else if(a.state==='CANDIDATES'){
      affected=a.sources;for(const ref of affected)exists(ref);
      if(affected.every(ref=>ref.kind==='ACCOUNT')){
        if(r.nominal.knownSubtotal!==null)totalValues.push(r.nominal.knownSubtotal);
        if(r.nominal.state!=='KNOWN')totalMissing.push(r.reservationId);
      }else totalMissing.push(r.reservationId);
    }else{
      assert.equal(a.state,'UNBOUNDED','ATTRIBUTION_REQUIRED');
      const excluded=a.excluded.filter(e=>proven(e.evidenceRefs,r,'EXCLUSION',[e.source])).map(e=>key(e.source));
      affected=sources.filter(s=>!excluded.includes(key(s.ref))).map(s=>s.ref);totalMissing.push(r.reservationId);
    }
    for(const ref of affected)rows.get(key(ref)).risks.push(r.reservationId);
  }
  const output=[];
  for(const {source:s,values,risks} of rows.values()){
    const ids=[...new Set(risks)].sort(),reserved=amount(values,ids.map(r=>'/reservationReview/reservations/'+reservations.findIndex(item=>item.reservationId===r)+'/attribution'));
    const free=ids.length?amount([],reserved.missingPaths):amount([money(decimal(s.value.value,{signed:true})-sum(values))]);
    const capacity=decimal(s.value.value,{signed:true})<=0n?amount([]):free.state==='KNOWN'?amount([money(decimal(free.value,{signed:true})>0n?decimal(free.value,{signed:true}):0n)]):amount([],free.missingPaths);
    const reason=ids.length?'RESERVATION_UNCERTAIN':!s.active?'SOURCE_INELIGIBLE':capacity.state!=='KNOWN'?'CAPACITY_UNAVAILABLE':capacity.value==='0.00'?'NO_CAPACITY':null;
    output.push({ref:s.ref,value:s.value,reserved,free,newAllocationCapacity:capacity,decision:{source:s.ref,blockingReservationIds:ids,state:reason?'BLOCKED':'ALLOWED',reason}});
  }
  for(const cmd of c.allocations){
    const row=output.find(r=>key(r.ref)===key(cmd.source));assert(row,'REFERENCE_NOT_FOUND');assert(decimal(cmd.amount,{individual:true})>0n,'ALLOCATION_AMOUNT');
    if(status===200&&(row.decision.state==='BLOCKED'||decimal(cmd.amount)>decimal(row.newAllocationCapacity.value)))status=400;
  }
  if(status===200)for(const cmd of c.allocations){
    const row=output.find(r=>key(r.ref)===key(cmd.source));
    row.reserved=amount([money(decimal(row.reserved.value)+decimal(cmd.amount))]);
    row.free=amount([money(decimal(row.free.value,{signed:true})-decimal(cmd.amount))]);row.newAllocationCapacity=amount([row.free.value]);
    if(row.free.value==='0.00')row.decision={...row.decision,state:'BLOCKED',reason:'NO_CAPACITY'};
    totalValues.push(cmd.amount);
  }
  return {status,code:status===409?'SOURCE_CHANGED':status===400?'SOURCE_RESERVATION_UNRECONCILED':null,bySource:output,reservedAccounts:amount(totalValues,[...new Set(totalMissing)]),reservationReview:{reservations,evidence,decisions:output.map(r=>r.decision),confirmations:confirmationResults},financialTransactions:[],balances:sources.map(s=>s.value.value)};
}
export function verifyExpected(c,result=evaluate(c)){
  assert.equal(result.status,c.expected.status,'FINALIZATION');
  assert.deepEqual(result.balances,c.expected.balances,'BALANCE_UNCHANGED');
  assert.equal(result.financialTransactions.length,c.expected.financialTransactions,'NO_FAKE_HISTORY');
  const rows=result.bySource.map(r=>[Number(r.ref.id.slice(-12)),r.reserved.state,r.reserved.knownSubtotal,r.free.value,r.decision.blockingReservationIds.map(id=>Number(id.slice(-12)))]);
  assert.deepEqual(rows,c.expected.rows,'SOURCE_PROPAGATION');
  assert.equal(result.reservedAccounts.value,c.expected.reservedAccounts,'NO_DOUBLE_COUNT');
  const nominal=result.reservationReview.reservations;
  assert.equal(nominal.every(r=>r.nominal.state==='KNOWN')?money(sum(nominal.map(r=>r.nominal.value))):null,c.expected.nominalOnce,'NOMINAL_ONCE');
  for(const r of result.bySource){
    validateAmount(r.reserved);validateAmount(r.free,{signed:true});validateAmount(r.newAllocationCapacity,{capacity:true});
    if(r.decision.blockingReservationIds.length){assert.equal(r.decision.state,'BLOCKED','PERMISSION');assert.equal(r.decision.reason,'RESERVATION_UNCERTAIN','PERMISSION');assert.equal(r.free.state,'UNKNOWN','NO_FALSE_ZERO');}
    else if(r.newAllocationCapacity.state==='KNOWN'&&decimal(r.newAllocationCapacity.value)>0n&&c.sources.find(s=>key(s.ref)===key(r.ref)).active)assert.equal(r.decision.state,'ALLOWED','INDEPENDENT_ALLOWED');
  }
  return result;
}
