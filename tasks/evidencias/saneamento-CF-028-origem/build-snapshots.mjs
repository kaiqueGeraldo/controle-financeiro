import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {evaluate,verifyExpected,amount} from './check-contract.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const cases=read('./cases.json').cases;
const old=read('../saneamento-CF-028-R28/cases.json');
export function canonical(v){
  if(v===null||typeof v!=='object')return v;
  if(Array.isArray(v)){
    const key=x=>typeof x==='string'?x:x.tempId??(x.kind&&x.id?x.kind+'/'+x.id:x.reservationId??x.id??x.dimension??(x.source?x.source.kind+'/'+(x.source.id??x.source.tempId):x.ref?x.ref.kind+'/'+(x.ref.id??x.ref.tempId):''));
    return [...v].sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0).map(canonical);
  }
  return Object.fromEntries(Object.keys(v).filter(k=>k!=='existingAsOf').sort().map(k=>[k,canonical(v[k])]));
}
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
function refresh(c){
  const p=c.prepareResponse.data;
  p.summary=c.summary;
  p.sourceSnapshot.inventoryToken=hash({existing:c.existing,review:c.summary.reservationReview??null});
  for(const source of p.sourceSnapshot.sources)source.token=hash({sourceId:source.id,existing:c.existing,review:c.summary.reservationReview??null});
  p.contentHash=hash({contractVersion:1,sessionId:p.sessionId,draftVersion:p.draftVersion,payload:c.draft.payload});
  p.reviewHash=hash({contentHash:p.contentHash,sourceSnapshot:p.sourceSnapshot,mappingPreview:p.mappingPreview,summary:p.summary});
  for(const value of [c.completeRequest,c.receiptResponse.data]){value.contentHash=p.contentHash;value.reviewHash=p.reviewHash;}
  c.receiptResponse.data.summary=c.summary;
  c.recoveryResponse.data.prepared=p;c.recoveryResponse.data.receipt=c.receiptResponse.data;
  return c;
}
// E16/E17/E20 sem incerteza não precisam da extensão. E18/E19 recebem prova explícita.
for(const [index,c] of old.cases.entries()){
  if(index!==2&&index!==3)continue;
  const reservationId='20000000-0000-4000-8000-000000000011',evidenceId='20000000-0000-4000-8000-000000000511';
  const nominal=index===2?amount([],['/existing/allocations/0/amount']):amount(['300.00'],['/existing/allocations/0/amount']);
  const attribution={state:'CONFIRMED',parts:[{source:c.summary.bySource[0].ref,amount:nominal}],evidenceRefs:[evidenceId]};
  const input={sources:c.summary.bySource.map(r=>({ref:r.ref,owner:'synthetic-owner',revision:'1',active:true,value:r.value})),reservations:[{reservationId,revision:'1',goal:{state:'KNOWN',value:c.summary.byGoal[0].ref},nominal,attribution}],evidence:[{id:evidenceId,revision:'1',basis:'DOMAIN_RECORD',reservationId,claim:'ASSIGNMENT',sources:[c.summary.bySource[0].ref],inventoryToken:'inventory-1',validatedAt:'2026-10-10T15:00:00Z'}],inventoryToken:'inventory-1',confirmations:[],allocations:[]};
  const result=evaluate(input);c.summary.reservationReview=result.reservationReview;c.originInputs=input;
  refresh(c);
}
// Caso completo de vínculo ausente: legado400 sem origem, A1000/B500, nenhuma nova alocação.
const base=structuredClone(old.cases[2]);
const scenario=structuredClone(cases.find(c=>c.name==='E25-known-value-unknown-link'));
scenario.allocations=[];scenario.expected.status=200;
const result=verifyExpected(scenario);
base.name='E35-missing-origin-complete';base.existing={sources:scenario.sources,reservations:scenario.reservations,evidence:scenario.evidence};base.originInputs=scenario;
delete base.components;
base.draft.payload.sections.accounts={answer:'PROVIDED',items:scenario.sources.map((s,i)=>({tempId:`40000000-0000-4000-8000-00000000000${i+1}`,action:'LINK',ref:s.ref}))};
base.draft.payload.sections.goals={answer:'PROVIDED',items:[{tempId:'40000000-0000-4000-8000-000000000011',action:'LINK',ref:scenario.reservations[0].goal.value}]};
base.summary.metrics.accountsSigned=amount(['1000.00','500.00']);base.summary.metrics.netWorth=amount(['1000.00','500.00']);
base.summary.metrics.reservedAccounts=result.reservedAccounts;base.summary.metrics.freeAccountCash=amount([],['/reservationReview/reservations/0/attribution']);
base.summary.bySource=result.bySource.map(({decision,...row})=>row);
base.summary.byGoal=[{ref:scenario.reservations[0].goal.value,type:'MONETARY',progress:amount([],['/reservationReview/reservations/0/attribution']),covered:amount([],['/reservationReview/reservations/0/attribution'])}];
base.summary.reservationReview=result.reservationReview;
base.summary.coverage.find(x=>x.dimension==='allocations').missingPaths=['/reservationReview/reservations/0/attribution'];
const p=base.prepareResponse.data;
for(const envelope of [p,base.prepareRequest,base.completeRequest,base.receiptResponse.data,base.recoveryResponse.data]){
  envelope.sessionId='40000000-0000-4000-8000-000000000700';
  envelope.operationId='40000000-0000-4000-8000-000000000701';
}
p.mappingPreview=[...base.draft.payload.sections.accounts.items.map(r=>({tempId:r.tempId,kind:'ACCOUNT',action:'LINK',existingId:r.ref.id})),...base.draft.payload.sections.goals.items.map(r=>({tempId:r.tempId,kind:'GOAL',action:'LINK',existingId:r.ref.id}))];
// Selecionados usam tempId no Summary; resolver refs de todo o snapshot consistentemente.
const idMap=new Map(p.mappingPreview.map(r=>[r.kind+'/'+r.existingId,r.tempId]));
function selected(v){
  if(!v||typeof v!=='object')return;
  if(v.kind&&v.id&&idMap.has(v.kind+'/'+v.id)){v.tempId=idMap.get(v.kind+'/'+v.id);delete v.id;}
  for(const child of Object.values(v))selected(child);
}
selected(base.summary);
base.receiptResponse.data.mapping=p.mappingPreview.map(r=>({tempId:r.tempId,kind:r.kind,id:r.existingId,action:r.action}));
p.sourceSnapshot.sources=p.mappingPreview.map(r=>({kind:r.kind,id:r.existingId,revision:'1',token:''}));
base.expectedOutcome={status:200,effect:'Sem novas alocações; reserva400 uma vez; A/B com saldo conhecido e livre/capacidade UNKNOWN.',attemptIncrease:{status:400,code:'SOURCE_RESERVATION_UNRECONCILED'}};
refresh(base);
writeFileSync(new URL('./snapshots.json',import.meta.url),JSON.stringify({scope:'Snapshots documentais atualizados; originais históricos preservados',cases:[...old.cases,base]},null,2)+'\n');
