// Fixtures documentais completas; números esperados LITERAIS, não obtidos do validador.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const original=JSON.parse(readFileSync(new URL('../CF-028/examples.json',import.meta.url),'utf8'));
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const K=(value,outsideIndividualRange=false)=>({state:'KNOWN',value,knownSubtotal:value,outsideIndividualRange,missingPaths:[]});
const U=path=>({state:'UNKNOWN',value:null,knownSubtotal:null,outsideIndividualRange:null,missingPaths:[path]});
const P=(subtotal,path)=>({state:'PARTIAL',value:null,knownSubtotal:subtotal,outsideIndividualRange:false,missingPaths:[path]});
const NA=()=>({state:'NOT_APPLICABLE',value:null,knownSubtotal:null,outsideIndividualRange:null,missingPaths:[]});
const F=value=>({state:'KNOWN',value});
const ref=(kind,n)=>({kind,id:id(n)});
const account=(n,value)=>({id:id(n),kind:'ACCOUNT',value,version:'1'});
const goal=(n,type='MONETARY')=>({id:id(n),type,target:type==='MONETARY'?'999999999999.99':'12.00000000',deadline:'2026-09-30'});
const source=(n,value,reserved,free,capacity)=>({ref:ref('ACCOUNT',n),value:F(value),reserved,free,newAllocationCapacity:capacity});
const target=(n,progress,covered,type='MONETARY')=>({ref:ref('GOAL',n),type,progress,covered});
function summary(accounts,reserved,free,bySource,byGoal,missing=[]){
  return {baseDate:'2026-10-10',existingAsOf:'2026-10-10T15:00:00Z',scope:'SELECTED_AND_EXISTING',coverage:['accounts','investments','cards','allocations'].map(dimension=>({dimension,complete:dimension!=='allocations'||missing.length===0,missingPaths:dimension==='allocations'?missing:[]})),metrics:{accountsSigned:accounts,investmentsValue:K('0.00'),cardCredit:K('0.00'),cardDebt:K('0.00'),netWorth:accounts,reservedAccounts:reserved,reservedInvestments:K('0.00'),freeAccountCash:free,unallocatedInvestments:K('0.00')},bySource,byCard:[],byGoal,deferredSections:[]};
}
const gap='/existing/allocations/0/amount',ngap='/existing/goals/1/progress';
const cases=[
  {name:'E16-R28-01A',existing:{accounts:[],goals:[],allocations:[]},components:{sourceReservations:[['999999999999.99'],['999999999999.99']],goalProgress:[['999999999999.99','999999999999.99']],goalCovered:[['999999999999.99','999999999999.99']]},summary:summary(K('1999999999999.98',true),K('1999999999999.98',true),K('0.00'),[source(1,'999999999999.99',K('999999999999.99'),K('0.00'),K('0.00')),source(2,'999999999999.99',K('999999999999.99'),K('0.00'),K('0.00'))],[target(11,K('1999999999999.98',true),K('1999999999999.98',true))]),expectedOutcome:{status:200,effect:'Duas aberturas e reservas válidas; sem renda/histórico; soma exata ampla.'}},
  {name:'E17-R28-01B',existing:{accounts:[account(1,'-999999999999.99')],goals:[goal(11)],allocations:[{sourceId:id(1),goalId:id(11),amount:'999999999999.99',provenance:'KNOWN'}]},components:{sourceReservations:[['999999999999.99']],goalProgress:[['999999999999.99']],goalCovered:[['0.00']]},summary:summary(K('-999999999999.99'),K('999999999999.99'),K('-1999999999999.98',true),[source(1,'-999999999999.99',K('999999999999.99'),K('-1999999999999.98',true),K('0.00'))],[target(11,K('999999999999.99'),K('0.00'))]),expectedOutcome:{status:200,effect:'Complemento sem alterar reserva; déficit preservado.',attemptIncrease:{status:400,code:'RESERVATION_EXCEEDS_SOURCE'}}},
  {name:'E18-R28-02',existing:{accounts:[account(1,'1000.00')],goals:[goal(11),goal(12,'NUMERIC')],allocations:[{sourceId:id(1),goalId:id(11),amount:null,provenance:'UNKNOWN',path:gap}]},components:{sourceReservations:[[null]],goalProgress:[[null],[null]],goalCovered:[[null]]},summary:summary(K('1000.00'),U(gap),U(gap),[source(1,'1000.00',U(gap),U(gap),U(gap))],[target(11,U(gap),U(gap)),target(12,U(ngap),NA(),'NUMERIC')],[gap,ngap]),expectedOutcome:{status:200,effect:'LINK preserva legado sem inferir reserva/progresso.',attemptIncrease:{status:400,code:'SOURCE_RESERVATION_UNRECONCILED'},attemptReleaseUnknown:{status:400,code:'ALLOCATION_UNRECONCILED'}}},
  {name:'E19-R28-02-PARTIAL',existing:{accounts:[account(1,'1000.00'),account(2,'500.00')],goals:[goal(11)],allocations:[{sourceId:id(1),goalId:id(11),amount:null,provenance:'PARTIAL',knownComponents:['300.00'],missingPaths:[gap]}]},components:{sourceReservations:[['300.00',null],[]],goalProgress:[['300.00',null]],goalCovered:[[null]]},summary:summary(K('1500.00'),P('300.00',gap),P('500.00',gap),[source(1,'1000.00',P('300.00',gap),U(gap),U(gap)),source(2,'500.00',K('0.00'),K('500.00'),K('500.00'))],[target(11,P('300.00',gap),U(gap))],[gap]),expectedOutcome:{status:200,effect:'Nenhuma alteração nos vínculos; subtotal livre somente da fonteB.',attemptIncrease:{status:400,code:'SOURCE_RESERVATION_UNRECONCILED'}}},
  {name:'E20-R28-02-ZERO',existing:{accounts:[account(1,'1000.00')],goals:[goal(11),goal(12,'NUMERIC')],allocations:[]},components:{sourceReservations:[[]],goalProgress:[[],['0.00000000']],goalCovered:[[]]},summary:summary(K('1000.00'),K('0.00'),K('1000.00'),[source(1,'1000.00',K('0.00'),K('1000.00'),K('1000.00'))],[target(11,K('0.00'),K('0.00')),target(12,K('0.00000000'),NA(),'NUMERIC')]),expectedOutcome:{status:200,effect:'Zero é comprovado; capacidade1000 conhecida.'}}
];
// Fatos legados numéricos explícitos: desconhecimento não equivale a zero.
cases[2].existing.goals[1].progress={state:'UNKNOWN',value:null};
cases[4].existing.goals[1].progress=F('0.00000000');
function canonical(value){
  if(Array.isArray(value)){
    const key=x=>typeof x==='string'?x:x.tempId??(x.kind&&x.id?x.kind+'/'+x.id:x.dimension??(x.ref?x.ref.kind+'/'+(x.ref.tempId??x.ref.id):''));
    return [...value].sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0).map(canonical);
  }
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(k=>k!=='existingAsOf').sort().map(k=>[k,canonical(value[k])]));
  return value;
}
const hash=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
for(const [idx,c] of cases.entries()){
  const payload=structuredClone(original.draft.payload);
  payload.context.baseDate='2026-10-10';
  for(const key of Object.keys(payload.sections))payload.sections[key]={answer:'NONE',items:[]};
  const mappingPreview=[];
  const link=(key,kind,records)=>{
    payload.sections[key]={answer:'PROVIDED',items:records.map((r,i)=>{const tempId=id(100+mappingPreview.length);mappingPreview.push({tempId,kind,action:'LINK',existingId:r.id});return {tempId,action:'LINK',ref:{kind,id:r.id}};})};
  };
  if(idx===0){
    payload.sections.accounts={answer:'PROVIDED',items:[1,2].map(n=>({tempId:id(n),action:'CREATE',name:'Conta sintética '+n,type:'CHECKING',balance:F('999999999999.99'),deficitAcknowledged:false,distinctCashConfirmed:false}))};
    payload.sections.goals={answer:'PROVIDED',items:[{tempId:id(11),action:'CREATE',title:'Meta sintética',type:'MONETARY',target:'999999999999.99',deadline:'2026-09-30'}]};
    payload.sections.allocations={answer:'PROVIDED',items:[1,2].map(n=>({tempId:id(20+n),goal:{kind:'GOAL',tempId:id(11)},source:{kind:'ACCOUNT',tempId:id(n)},amount:'999999999999.99'}))};
    for(const [key,kind] of [['accounts','ACCOUNT'],['goals','GOAL'],['allocations','ALLOCATION']])for(const row of payload.sections[key].items)mappingPreview.push({tempId:row.tempId,kind,action:'CREATE',existingId:null});
    for(const row of [...c.summary.bySource,...c.summary.byGoal]){row.ref.tempId=row.ref.id;delete row.ref.id;}
  }else{
    link('accounts','ACCOUNT',c.existing.accounts);link('goals','GOAL',c.existing.goals);
    // Selecionados LINK devem manter tempId no resumo congelado.
    for(const row of [...c.summary.bySource,...c.summary.byGoal]){const m=mappingPreview.find(x=>x.existingId===row.ref.id);row.ref.tempId=m.tempId;delete row.ref.id;}
  }
  const sessionId=id(800+idx*10),operationId=id(801+idx*10),draftVersion='1';
  const sourceSnapshot={inventoryToken:hash(c.existing),sources:[...c.existing.accounts.map(x=>({kind:'ACCOUNT',id:x.id,revision:x.version,token:hash({account:x,allocations:c.existing.allocations})})),...c.existing.goals.map(x=>({kind:'GOAL',id:x.id,revision:'1',token:hash({goal:x,allocations:c.existing.allocations})}))]};
  const contentHash=hash({contractVersion:1,sessionId,draftVersion,payload});
  const reviewHash=hash({contentHash,sourceSnapshot,mappingPreview,summary:c.summary});
  const prepared={contractVersion:1,operationId,kind:'ONBOARDING_COMPLETE',sessionId,draftVersion,contentHash,reviewHash,sourceSnapshot,summary:c.summary,mappingPreview,preparedAt:'2026-10-10T15:00:00Z'};
  const receipt={contractVersion:1,operationId,kind:'ONBOARDING_COMPLETE',sessionId,draftVersion,contentHash,reviewHash,status:'COMPLETED',completedAt:'2026-10-10T15:01:00Z',mapping:mappingPreview.map((x,i)=>({tempId:x.tempId,kind:x.kind,id:x.existingId??id(1000+i),action:x.action})),summary:c.summary};
  c.draft={contractVersion:1,expectedVersion:'0',action:'SAVE',payload};
  c.prepareRequest={contractVersion:1,sessionId,expectedVersion:'1',operationId};
  c.prepareResponse={data:prepared};
  c.completeRequest={contractVersion:1,sessionId,expectedVersion:'1',operationId,contentHash,reviewHash,confirm:true};
  c.receiptResponse={data:receipt};
  c.recoveryResponse={data:{contractVersion:1,operationId,kind:'ONBOARDING_COMPLETE',sessionId,state:'COMPLETED',prepared,receipt}};
}
writeFileSync(new URL('./cases.json',import.meta.url),JSON.stringify({scope:'Documental, sem execução de produto',cases},null,2)+'\n');
console.log('Cinco cenários completos R28 gerados com valores esperados literais.');
