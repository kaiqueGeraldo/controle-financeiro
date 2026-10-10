// Fixtures documentais: entradas e resultados literais; não importa o verificador.
import {writeFileSync} from 'node:fs';
const id=n=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ref=n=>({kind:'ACCOUNT',id:id(n)});
const known=value=>({state:'KNOWN',value});
const amount=value=>({state:'KNOWN',value,knownSubtotal:value,outsideIndividualRange:false,missingPaths:[]});
const unknown={state:'UNKNOWN',value:null,knownSubtotal:null,outsideIndividualRange:null,missingPaths:['/legacy/amount']};
const source=(n,value)=>({ref:ref(n),owner:'synthetic-owner',revision:'1',active:true,value:known(value)});
const A=source(1,'1000.00'),B=source(2,'500.00'),C=source(3,'800.00');
const evidence=(r,claim,sources)=>({id:id(r+500),revision:'1',basis:'DOMAIN_RECORD',reservationId:id(r),claim,sources:sources.map(ref),inventoryToken:'inventory-1',validatedAt:'2026-10-10T15:00:00Z'});
function reservation(n,state,sources=[],value=null){
  let attribution;
  if(state==='CONFIRMED')attribution={state,parts:sources.map(s=>({source:ref(s),amount:value===null?structuredClone(unknown):amount(value)})),evidenceRefs:[id(n+500)]};
  if(state==='CANDIDATES')attribution={state,sources:sources.map(ref),evidenceRefs:[id(n+500)]};
  if(state==='UNBOUNDED')attribution={state,excluded:[]};
  return {reservationId:id(n),revision:'1',goal:known({kind:'GOAL',id:id(n+100)}),nominal:value===null?structuredClone(unknown):amount(value),attribution};
}
const rA=reservation(11,'CONFIRMED',[1]);
const rAB=reservation(11,'CANDIDATES',[1,2],'400.00');
const rBC=reservation(12,'CANDIDATES',[2,3]);
const rAll=reservation(11,'UNBOUNDED',[],'400.00');
const eA=evidence(11,'ASSIGNMENT',[1]),eAB=evidence(11,'EXHAUSTIVE_CANDIDATES',[1,2]),eBC=evidence(12,'EXHAUSTIVE_CANDIDATES',[2,3]);
// Expected rows: source number, reserved state/subtotal, free value (null unknown), blocking reservation numbers.
const blocked=(n,ids,subtotal=null)=>[n,subtotal===null?'UNKNOWN':'PARTIAL',subtotal,null,ids];
const free=(n,value,reserved='0.00')=>[n,'KNOWN',reserved,value,[]];
const close=n=>({reservationId:id(n),expectedRevision:'1',action:'CLOSE',currentSituationConfirmed:true});
const assign=(n,parts)=>({reservationId:id(n),expectedRevision:'1',action:'ASSIGN',goal:{kind:'GOAL',id:id(n+100)},parts:parts.map(([s,value])=>({source:ref(s),amount:value})),currentSituationConfirmed:true});
const cases=[
  {name:'E21-known-origin',sources:[A,B],reservations:[rA],evidence:[eA],expected:{rows:[blocked(1,[11]),free(2,'500.00')],reservedAccounts:null,nominalOnce:null,status:200,reason:'Origem A comprovada; valor desconhecido só bloqueia A.'}},
  {name:'E22-limited-candidates',sources:[A,B,C],reservations:[rAB],evidence:[eAB],allocations:[{source:ref(3),amount:'100.00'}],expected:{rows:[blocked(1,[11]),blocked(2,[11]),free(3,'700.00','100.00')],reservedAccounts:'500.00',nominalOnce:'400.00',status:200,reason:'A/B candidatas; C excluída por prova exaustiva, alocação100 válida.'}},
  {name:'E23-unbounded',sources:[A,B,C],reservations:[rAll],evidence:[],expected:{rows:[blocked(1,[11]),blocked(2,[11]),blocked(3,[11])],reservedAccounts:'400.00',nominalOnce:'400.00',status:200,reason:'Origem individual indeterminada entre contas; total400 conhecido, concluir sem alocar.'}},
  {name:'E24-overlap-close-one',sources:[A,B,C],reservations:[rAB,rBC],evidence:[eAB,eBC],confirmations:[close(11)],expected:{rows:[free(1,'1000.00'),blocked(2,[12]),blocked(3,[12])],reservedAccounts:null,nominalOnce:null,status:200,reason:'Encerrar11 libera A; B/C ainda afetadas por12.'}},
  {name:'E25-known-value-unknown-link',sources:[A,B],reservations:[rAB],evidence:[eAB],allocations:[{source:ref(2),amount:'500.00'}],expected:{rows:[blocked(1,[11]),blocked(2,[11])],reservedAccounts:'400.00',nominalOnce:'400.00',status:400,reason:'B pode conter400:500 novo não autorizado; nenhum efeito.'}},
  {name:'E26-partial-source',sources:[A,B],reservations:[reservation(10,'CONFIRMED',[1],'300.00'),rA],evidence:[evidence(10,'ASSIGNMENT',[1]),eA],expected:{rows:[blocked(1,[11],'300.00'),free(2,'500.00')],reservedAccounts:null,nominalOnce:null,status:200,reason:'Saldo1000 e reserva300 comprovados não certificam livre700.'}},
  {name:'E27-close-no-history',sources:[A,B],reservations:[rAll],evidence:[],confirmations:[close(11)],allocations:[{source:ref(2),amount:'500.00'}],expected:{rows:[free(1,'1000.00'),free(2,'0.00','500.00')],reservedAccounts:'500.00',nominalOnce:'0.00',status:200,reason:'Encerramento atual explícito, sem caixa/histórico fictício; B pode destinar500.'}},
  {name:'E28-new-source-before-prepare',sources:[A,B,{...C,createdAfterDraft:true}],reservations:[rAll],evidence:[],allocations:[{source:ref(3),amount:'10.00'}],expected:{rows:[blocked(1,[11]),blocked(2,[11]),blocked(3,[11])],reservedAccounts:'400.00',nominalOnce:'400.00',status:400,reason:'Fonte nova também potencialmente afetada; novo ID não comprova independência.'}},
  {name:'E29-stale-evidence',sources:[A,B,C],reservations:[rAB],evidence:[eAB],preparedToken:'inventory-1',currentToken:'inventory-2',allocations:[{source:ref(3),amount:'100.00'}],expected:{rows:[blocked(1,[11]),blocked(2,[11]),blocked(3,[11])],reservedAccounts:null,nominalOnce:'400.00',status:409,reason:'Independência antiga não vale no inventário novo; SOURCE_CHANGED antes de efeitos.'}},
  {name:'E30-confirm-two-sources',sources:[A,B],reservations:[rAll],evidence:[],confirmations:[assign(11,[[1,'250.00'],[2,'150.00']])],expected:{rows:[free(1,'750.00','250.00'),free(2,'350.00','150.00')],reservedAccounts:'400.00',nominalOnce:'400.00',status:200,reason:'Declaração atual completa confirma duas partes; saldos1000/500 preservados.'}},
  {name:'E31-no-sources-is-not-closed',sources:[],reservations:[rAll],evidence:[],expected:{rows:[],reservedAccounts:null,nominalOnce:'400.00',status:200,reason:'Inventário sem fontes não encerra11; futura fonte herda risco.'}},
  {name:'E32-proven-exclusion',sources:[A,B,C],reservations:[{...rAll,attribution:{state:'UNBOUNDED',excluded:[{source:ref(3),evidenceRefs:[id(511)]}]}}],evidence:[evidence(11,'EXCLUSION',[3])],allocations:[{source:ref(3),amount:'100.00'}],expected:{rows:[blocked(1,[11]),blocked(2,[11]),free(3,'700.00','100.00')],reservedAccounts:'500.00',nominalOnce:'400.00',status:200,reason:'C excluída explicitamente só desta reserva; restante universo continua incerto.'}},
  {name:'E33-archived-and-stale-confirmation',sources:[{...A,active:false},B],reservations:[{...rA,revision:'2'}],evidence:[eA],confirmations:[close(11)],expected:{rows:[blocked(1,[11]),free(2,'500.00')],reservedAccounts:null,nominalOnce:null,status:409,reason:'Arquivar A não apaga risco; confirmação v1 não encerra reserva v2.'}},
  {name:'E34-correct-draft-confirmation',sources:[A,B],reservations:[rAll],evidence:[],removedDraftConfirmation:close(11),expected:{rows:[blocked(1,[11]),blocked(2,[11])],reservedAccounts:'400.00',nominalOnce:'400.00',status:200,reason:'SAVE corrigido remove CLOSE antes de prepare, restaura pendência sem efeito.'}}
];
for(const c of cases){c.inventoryToken='inventory-1';c.confirmations??=[];c.allocations??=[];c.expected.financialTransactions=0;c.expected.balances=c.sources.map(s=>s.value.value);}
writeFileSync(new URL('./cases.json',import.meta.url),JSON.stringify({scope:'Entradas sintéticas, saídas esperadas literais; sem runtime',cases},null,2)+'\n');
