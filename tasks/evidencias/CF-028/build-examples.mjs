// Gerador de fixtures DOCUMENTAIS. Não importa nem chama produto/API/banco.
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const known = value => ({state:'KNOWN',value});
const unknown = () => ({state:'UNKNOWN'});
const ref = (kind,n) => ({kind,tempId:id(n)});
const section = items => ({answer:items.length?'PROVIDED':'NONE',items});
const accounts = [
  {tempId:id(1),action:'INITIALIZE_DEFAULT',ref:{kind:'ACCOUNT',id:id(901)},balance:known('100.00'),deficitAcknowledged:false},
  {tempId:id(2),action:'CREATE',name:'Corrente sintética',type:'CHECKING',balance:known('1000.00'),deficitAcknowledged:false,distinctCashConfirmed:false},
  {tempId:id(3),action:'CREATE',name:'Poupança sintética',type:'SAVINGS',balance:known('200.00'),deficitAcknowledged:false,distinctCashConfirmed:false}
];
const investments = [
  {tempId:id(21),action:'CREATE',name:'Renda fixa sintética',type:'FIXED_INCOME',positionMode:'MONETARY',quantity:{state:'NOT_APPLICABLE'},cost:unknown(),valuation:{state:'KNOWN',basis:'TOTAL',amount:'500.00',date:'2026-10-09',source:'USER_DECLARED'},acquisitionDate:unknown(),historicalSource:unknown()},
  {tempId:id(22),action:'CREATE',name:'Ação sintética',type:'STOCK',positionMode:'UNIT',quantity:known('3.00000000'),cost:known('0.60'),valuation:{state:'KNOWN',basis:'TOTAL',amount:'1.00',date:'2026-10-09',source:'USER_DECLARED'},acquisitionDate:unknown(),historicalSource:unknown()}
];
const cards = [{tempId:id(31),action:'CREATE',name:'Cartão sintético',limit:known('1000.00'),closingDay:20,dueDay:28,opening:{currentCompetence:{year:2026,month:10},currentOutstanding:'200.00',currentPrincipal:known('194.00'),currentCharges:known('6.00'),credit:'0.00',creditNotNettedAcknowledged:true,futureInstallments:[
  {tempId:id(32),competence:{year:2026,month:11},amount:'50.00',principal:known('50.00'),charges:known('0.00')},
  {tempId:id(33),competence:{year:2026,month:12},amount:'50.00',principal:known('50.00'),charges:known('0.00')},
  {tempId:id(34),competence:{year:2027,month:1},amount:'50.00',principal:known('50.00'),charges:known('0.00')}
]} }];
const goals = [
  {tempId:id(41),action:'CREATE',title:'Viagem',type:'MONETARY',target:'600.00',deadline:'2027-06-30'},
  {tempId:id(42),action:'CREATE',title:'Reserva',type:'MONETARY',target:'100.00',deadline:'2026-09-30'},
  {tempId:id(43),action:'CREATE',title:'Leituras',type:'NUMERIC',target:'12.00000000',initialProgress:'4.00000000',unit:'livros',deadline:'2026-12-31'}
];
const allocations = [
  {tempId:id(51),goal:ref('GOAL',41),source:ref('ACCOUNT',2),amount:'300.00'},
  {tempId:id(52),goal:ref('GOAL',41),source:ref('INVESTMENT',21),amount:'200.00'},
  {tempId:id(53),goal:ref('GOAL',42),source:ref('ACCOUNT',3),amount:'50.00'}
];
const forecasts = [{tempId:id(61),description:'Receita prevista sintética',direction:'INCOME',amount:'80.00',dueDate:'2026-11-05',account:ref('ACCOUNT',2),category:{id:id(902)}}];
const payload = {context:{currency:'BRL',baseDate:'2026-10-09',boundaryAcknowledged:true,cashOnlyAcknowledged:true},currentStep:'REVIEW',sections:{accounts:section(accounts),cards:section(cards),investments:section(investments),goals:section(goals),allocations:section(allocations),forecasts:section(forecasts)}};
const expected = {accountsSigned:'1300.00',investmentsValue:'501.00',cardCredit:'0.00',cardDebt:'350.00',netWorth:'1451.00',reservedAccounts:'350.00',reservedInvestments:'200.00',freeAccountCash:'950.00',unallocatedInvestments:'301.00'};
const metrics = Object.fromEntries(Object.entries(expected).map(([k,v])=>[k,{state:'KNOWN',value:v,knownSubtotal:v}]));
const bySource = [
  {ref:ref('ACCOUNT',1),value:known('100.00'),reserved:'0.00',free:known('100.00'),newAllocationCapacity:known('100.00')},
  {ref:ref('ACCOUNT',2),value:known('1000.00'),reserved:'300.00',free:known('700.00'),newAllocationCapacity:known('700.00')},
  {ref:ref('ACCOUNT',3),value:known('200.00'),reserved:'50.00',free:known('150.00'),newAllocationCapacity:known('150.00')},
  {ref:ref('INVESTMENT',21),value:known('500.00'),reserved:'200.00',free:known('300.00'),newAllocationCapacity:known('300.00')},
  {ref:ref('INVESTMENT',22),value:known('1.00'),reserved:'0.00',free:known('1.00'),newAllocationCapacity:known('1.00')}
];
const summary = {baseDate:'2026-10-09',existingAsOf:'2026-10-09T15:00:00Z',scope:'SELECTED_AND_EXISTING',coverage:['accounts','investments','cards','allocations'].map(dimension=>({dimension,complete:true,missingPaths:[]})),metrics,bySource,byCard:[{ref:ref('CARD',31),debt:known('350.00'),credit:known('0.00'),committed:known('344.00'),availableLimit:known('656.00')}],byGoal:[{ref:ref('GOAL',41),type:'MONETARY',progress:'500.00',covered:known('500.00')},{ref:ref('GOAL',42),type:'MONETARY',progress:'50.00',covered:known('50.00')},{ref:ref('GOAL',43),type:'NUMERIC',progress:'4.00000000',covered:{state:'NOT_APPLICABLE'}}],deferredSections:[]};
const all = [['ACCOUNT',accounts],['INVESTMENT',investments],['CARD',cards],['INSTALLMENT',cards[0].opening.futureInstallments],['GOAL',goals],['ALLOCATION',allocations],['FORECAST',forecasts]].flatMap(([kind,items])=>items.map(item=>({tempId:item.tempId,kind,action:item.action??'CREATE',existingId:item.ref?.id??null})));
// Só ordenação/serialização de documentação; oráculos financeiros acima são literais.
function canonical(x) {
  if(Array.isArray(x)) {
    const rows=x.map(canonical);
    const key=v=>v?.tempId??(v?.kind&&v?.id?`${v.kind}/${v.id}`:v?.dimension??(v?.ref?`${v.ref.kind}/${v.ref.id??v.ref.tempId}`:typeof v==='string'?v:null));
    if(rows.every(v=>key(v)!==null)) rows.sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0);
    return rows;
  }
  if(x&&typeof x==='object') return Object.fromEntries(Object.keys(x).sort().filter(k=>k!=='existingAsOf').map(k=>[k,canonical(x[k])]));
  return x;
}
const hash = x => createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const sessionId=id(801),operationId=id(802),draftVersion='1';
const sourceSnapshot={inventoryToken:hash({accounts:[id(901)],categories:[id(902)]}),sources:[{kind:'ACCOUNT',id:id(901),revision:'0',token:hash({balance:'0.00',origin:'SYSTEM_INITIALIZED',reservations:[]})}]};
const contentHash=hash({contractVersion:1,sessionId,draftVersion,payload});
const reviewHash=hash({contentHash,sourceSnapshot,mappingPreview:all,summary});
const prepared={contractVersion:1,operationId,kind:'ONBOARDING_COMPLETE',sessionId,draftVersion,contentHash,reviewHash,sourceSnapshot,summary,mappingPreview:all,preparedAt:'2026-10-09T15:00:00Z'};
const receipt={contractVersion:1,operationId,kind:'ONBOARDING_COMPLETE',sessionId,draftVersion,contentHash,reviewHash,status:'COMPLETED',completedAt:'2026-10-09T15:01:00Z',mapping:all.map((r,i)=>({tempId:r.tempId,kind:r.kind,id:r.existingId??id(1000+i),action:r.action})),summary};
const fixture={notice:'Exemplos documentais sintéticos, não execução de produto.',existing:{account:{id:id(901),balance:'0.00',openingOrigin:'SYSTEM_INITIALIZED',version:'0',hasFinancialFacts:false},category:{id:id(902),type:'INCOME'}},draft:{contractVersion:1,expectedVersion:'0',action:'SAVE',payload},expected,expectedAfterPayment:{accountsSigned:'1100.00',cardDebt:'150.00',committed:'150.00',availableLimit:'850.00',netWorth:'1451.00',freeAccountCash:'750.00'},prepareRequest:{contractVersion:1,sessionId,expectedVersion:'1',operationId},prepareResponse:{data:prepared},completeRequest:{contractVersion:1,sessionId,expectedVersion:'1',operationId,contentHash,reviewHash,confirm:true},completeResponse:{data:receipt},recoveryResponse:{data:{contractVersion:1,operationId,kind:'ONBOARDING_COMPLETE',sessionId,state:'COMPLETED',prepared,receipt}},unknownResult:{uiState:'RESULT_UNKNOWN',reason:'Resposta perdida após commit; GET recupera receipt; nenhum novo operationId.'},conflictResponse:{error:{code:'SOURCE_CHANGED',message:'Os dados vinculados mudaram. Revise novamente.',fieldErrors:[]}},invalidVariants:[{path:'/sections/accounts/items/0/balance/value',value:'1.005',code:'DECIMAL_SCALE'},{path:'/sections/accounts/items/0/balance/value',value:'1000000000000.00',code:'DECIMAL_RANGE'},{path:'/sections/cards/items/0/opening/futureInstallments/0/competence',value:{year:2026,month:10},code:'CURRENT_INSTALLMENT_DUPLICATED'},{path:'/sections/goals/items/0/deadline',value:'2027-02-29',code:'DATE_INVALID'}]};
fixture.saveResponse={data:{contractVersion:1,sessionId,version:'1',status:'IN_PROGRESS',mode:'NEW',payload,issues:[],updatedAt:'2026-10-09T14:59:00Z',pendingIntent:null,completedReceipt:null}};
fixture.preparedRecoveryResponse={data:{contractVersion:1,operationId,kind:'ONBOARDING_COMPLETE',sessionId,state:'PREPARED',prepared,receipt:null}};
writeFileSync(new URL('./examples.json',import.meta.url),JSON.stringify(fixture,null,2)+'\n');
console.log('examples.json gerado; expected financeiro literal, sem helpers de produto.');
