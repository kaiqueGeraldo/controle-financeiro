// Validação DOCUMENTAL independente de código de produto. Não prova endpoints/locks.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const fixture=JSON.parse(readFileSync(resolve(here,'examples.json'),'utf8'));
const checks=[];
function check(name,fn){fn();checks.push(name);}
function units(s,scale=2){
  assert.equal(typeof s,'string','decimal deve ser string');
  assert.match(s,new RegExp(`^-?(0|[1-9][0-9]{0,11})(\\.[0-9]{1,${scale}})?$`));
  const negative=s.startsWith('-'),[whole,fraction='']=s.replace(/^-/,'').split('.');
  const n=BigInt(whole)*10n**BigInt(scale)+BigInt(fraction.padEnd(scale,'0'));
  assert(!(negative&&n===0n),'zero negativo');
  return negative?-n:n;
}
const money = n => `${n<0n?'-':''}${(n<0n?-n:n)/100n}.${String((n<0n?-n:n)%100n).padStart(2,'0')}`;
const sum = a => a.reduce((s,v)=>s+v,0n);
const leap=y=>y%4===0&&(y%100!==0||y%400===0);
const days=(y,m)=>[31,leap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1];
function date(s){assert.match(s,/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);const [y,m,d]=s.split('-').map(Number);assert(y>=1&&y<=9999&&m>=1&&m<=12&&d>=1&&d<=days(y,m));return [y,m,d];}
function reconcile(f){
  const s=f.draft.payload.sections,a=s.accounts.items,i=s.investments.items,c=s.cards.items,g=s.goals.items,r=s.allocations.items;
  const sources=new Map([...a.map(x=>[x.tempId,{kind:'ACCOUNT',value:units(x.balance.value)}]),...i.map(x=>[x.tempId,{kind:'INVESTMENT',value:units(x.valuation.amount)}])]);
  const ids=[...a,...i,...c,...g,...r,...s.forecasts.items,...c.flatMap(x=>x.opening.futureInstallments)].map(x=>x.tempId);
  assert.equal(new Set(ids).size,ids.length,'IDs duplicados');
  const reserved=new Map(),progress=new Map();
  for(const x of r){const source=sources.get(x.source.tempId);assert(source&&source.kind===x.source.kind,'fonte inválida');assert(g.some(y=>y.tempId===x.goal.tempId&&y.type==='MONETARY'),'meta inválida');const n=units(x.amount);assert(n>0n);reserved.set(x.source.tempId,(reserved.get(x.source.tempId)??0n)+n);progress.set(x.goal.tempId,(progress.get(x.goal.tempId)??0n)+n);}
  for(const [id,n] of reserved)assert(n<=sources.get(id).value,'capacidade excedida');
  let debt=0n,principal=0n,credit=0n;
  for(const card of c){const o=card.opening,current=o.currentCompetence.year*12+o.currentCompetence.month;debt+=units(o.currentOutstanding);principal+=units(o.currentPrincipal.value);credit+=units(o.credit);assert.equal(units(o.currentPrincipal.value)+units(o.currentCharges.value),units(o.currentOutstanding));for(const row of o.futureInstallments){assert(row.competence.year*12+row.competence.month>current,'corrente duplicada');assert.equal(units(row.principal.value)+units(row.charges.value),units(row.amount));debt+=units(row.amount);principal+=units(row.principal.value);}}
  const accounts=sum(a.map(x=>units(x.balance.value))),investments=sum(i.map(x=>units(x.valuation.amount)));
  const ra=sum([...reserved].filter(([id])=>sources.get(id).kind==='ACCOUNT').map(([,v])=>v)),ri=sum([...reserved].filter(([id])=>sources.get(id).kind==='INVESTMENT').map(([,v])=>v));
  const actual={accountsSigned:accounts,investmentsValue:investments,cardCredit:credit,cardDebt:debt,netWorth:accounts+investments+credit-debt,reservedAccounts:ra,reservedInvestments:ri,freeAccountCash:accounts-ra,unallocatedInvestments:investments-ri};
  for(const [k,v] of Object.entries(actual)){assert.equal(money(v),f.expected[k],k);assert.equal(f.completeResponse.data.summary.metrics[k].value,f.expected[k]);}
  assert.equal(money(principal),'344.00');assert.equal(money(units(c[0].limit.value)-principal),'656.00');
  for(const row of f.completeResponse.data.summary.byGoal){const goal=g.find(x=>x.tempId===row.ref.tempId);assert.equal(row.progress.value,goal.type==='NUMERIC'?goal.initialProgress:money(progress.get(goal.tempId)??0n));}
  for(const row of f.completeResponse.data.summary.bySource){const value=sources.get(row.ref.tempId).value,res=reserved.get(row.ref.tempId)??0n;assert.equal(row.value.value,money(value));assert.equal(row.reserved.value,money(res));assert.equal(row.free.value,money(value-res));assert.equal(row.newAllocationCapacity.value,money(value-res));}
  for(const goal of g)date(goal.deadline);
  assert.equal(i[0].cost.state,'UNKNOWN');assert.equal(i[0].quantity.state,'NOT_APPLICABLE');
  return {accounts,debt,principal,ra};
}
check('E01: entradas reconciliam nove totais, capacidade, composição e progresso',()=>reconcile(fixture));
check('E01: pagamento posterior sem nova despesa ou mudança de patrimônio',()=>{
  const {accounts,debt,principal,ra}=reconcile(fixture),p=fixture.expectedAfterPayment;
  assert.equal(money(accounts-20000n),p.accountsSigned);assert.equal(money(debt-20000n),p.cardDebt);
  assert.equal(money(principal-19400n),p.committed);assert.equal(money(100000n-principal+19400n),p.availableLimit);
  assert.equal(money(accounts-20000n+50100n-(debt-20000n)),p.netWorth);assert.equal(money(accounts-20000n-ra),p.freeAccountCash);
});
check('FIN-06: teto inclusivo, escala, Number e tokens inválidos',()=>{
  assert.equal(units('999999999999.99'),99999999999999n);assert.equal(units('999999999999.99999999',8),99999999999999999999n);
  for(const s of ['1.005','1000000000000.00','01.00','-0.00','1e2','1,00','+1.00',1])assert.throws(()=>units(s));
  assert.equal(units('0.10')+units('0.20'),30n);
  const halfUp=(a,b)=>(a+b/2n)/b;
  assert.equal(halfUp(units('1',8)*units('1.00500000',8),10n**14n),101n);
  assert.equal(halfUp(units('0.125',8)*units('10.04',8),10n**14n),126n);
  assert.equal(halfUp(100n*2n,3n),67n);assert.equal(halfUp(100n,3n),33n);
  assert.equal(halfUp(100n*100000000n,200000000n),50n);
  assert.equal(units('999999999999.99')*2n,199999999999998n);
});
check('DEC-03: meses curtos, bissexto, vencimento estritamente posterior',()=>{
  function cycle(y,m,close,due){const c=Math.min(close,days(y,m));let dy=y,dm=m,d=Math.min(due,days(y,m));if(d<=c){dm++;if(dm===13){dm=1;dy++;}d=Math.min(due,days(dy,dm));}return [[y,m,c],[dy,dm,d]];}
  assert.deepEqual(cycle(2027,2,31,30),[[2027,2,28],[2027,3,30]]);
  assert.deepEqual(cycle(2028,2,31,30),[[2028,2,29],[2028,3,30]]);
  assert.deepEqual(cycle(2027,3,31,30),[[2027,3,31],[2027,4,30]]);
  assert.deepEqual(cycle(2027,2,20,31),[[2027,2,20],[2027,2,28]]);
  assert.deepEqual(cycle(2028,2,20,31),[[2028,2,20],[2028,2,29]]);
  assert.deepEqual(cycle(2026,12,31,1),[[2026,12,31],[2027,1,1]]);
  for(const s of ['2027-02-29','2026-04-31','0000-01-01'])assert.throws(()=>date(s));date('2000-02-29');
});
check('Recibos documentais: identidade, conteúdo, mapping e replay/recuperação',()=>{
  const p=fixture.prepareResponse.data,r=fixture.completeResponse.data,c=fixture.completeRequest;
  assert.deepEqual(fixture.recoveryResponse.data.receipt,r);
  for(const k of ['operationId','sessionId','contentHash','reviewHash'])assert.equal(c[k],r[k]);
  assert.equal(c.expectedVersion,r.draftVersion);assert.deepEqual(p.summary,r.summary);
  assert.equal(new Set(r.mapping.map(x=>x.tempId)).size,r.mapping.length);
  assert.deepEqual(r.mapping.map(x=>x.tempId).sort(),p.mappingPreview.map(x=>x.tempId).sort());
  assert.equal(r.mapping.find(x=>x.action==='INITIALIZE_DEFAULT').id,fixture.existing.account.id);
  for(const k of ['contentHash','reviewHash'])assert.match(r[k],/^[0-9a-f]{64}$/);
  assert.equal(r.summary.byCard[0].debt.value,'350.00');
  assert.equal(r.summary.byCard[0].credit.value,'0.00');
  assert.equal(fixture.saveResponse.data.version,c.expectedVersion);
  assert.equal(fixture.preparedRecoveryResponse.data.receipt,null);
});
check('Hashes: conteúdo e revisão conferidos por serialização independente',()=>{
  function encode(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value)){
      const rows=[...value],key=x=>typeof x==='string'?x:x.tempId??(x.kind&&x.id?x.kind+'/'+x.id:x.dimension??(x.ref?x.ref.kind+'/'+(x.ref.tempId??x.ref.id):''));
      rows.sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0);
      return '['+rows.map(encode).join(',')+']';
    }
    return '{'+Object.keys(value).filter(k=>k!=='existingAsOf').sort().map(k=>JSON.stringify(k)+':'+encode(value[k])).join(',')+'}';
  }
  const p=fixture.prepareResponse.data,hash=x=>createHash('sha256').update(encode(x)).digest('hex');
  assert.equal(hash({contractVersion:1,sessionId:p.sessionId,draftVersion:p.draftVersion,payload:fixture.draft.payload}),p.contentHash);
  assert.equal(hash({contentHash:p.contentHash,sourceSnapshot:p.sourceSnapshot,mappingPreview:p.mappingPreview,summary:p.summary}),p.reviewHash);
  const changed=structuredClone(fixture.draft.payload);changed.sections.accounts.items[0].balance.value='100.01';
  assert.notEqual(hash({contractVersion:1,sessionId:p.sessionId,draftVersion:p.draftVersion,payload:changed}),p.contentHash);
});
check('Contraprovas documentais: cinco corrupções são detectadas',()=>{
  const mutations=[
    f=>f.expected.netWorth='2001.00', // soma indevida de reservas
    f=>f.draft.payload.sections.cards.items[0].opening.futureInstallments[0].competence.month=10,
    f=>f.draft.payload.sections.allocations.items[0].amount='1000.01',
    f=>f.draft.payload.sections.accounts.items[0].balance.value=100,
    f=>f.draft.payload.sections.goals.items[0].deadline='2027-02-29'
  ];
  for(const mutate of mutations){const copy=structuredClone(fixture);mutate(copy);assert.throws(()=>reconcile(copy));}
});
check('E14: conta negativa não é dívida duplicada; crédito é ativo',()=>assert.equal(-10000n+50000n-20000n+2000n,22000n));
check('Preservação README e links/JSON da especificação',()=>{
  const root=resolve(here,'../../..');
  assert.equal(createHash('sha256').update(readFileSync(resolve(root,'README.md'))).digest('hex'),'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
  const spec=resolve(root,'docs/sdd/specs/001-onboarding.md'),text=readFileSync(spec,'utf8');
  for(const m of text.matchAll(/```json\n([\s\S]*?)\n```/g))JSON.parse(m[1]);
  for(const m of text.matchAll(/\]\(([^)]+)\)/g))if(!m[1].includes('://'))assert(existsSync(resolve(dirname(spec),m[1])),m[1]);
});
console.log(JSON.stringify({scope:'somente documentação; sem produto/HTTP/SQL/browser',node:process.version,timezone:process.env.TZ??'host',passed:checks.length,checks,mutationsRejected:5},null,2));
