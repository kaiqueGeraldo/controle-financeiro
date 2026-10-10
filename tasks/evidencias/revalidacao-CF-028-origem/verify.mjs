// Revisão documental independente: oráculos literais de conjuntos e aritmética exata.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {evaluate,verifyExpected,amount} from '../saneamento-CF-028-origem/check-contract.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const directory='tasks/evidencias/saneamento-CF-028-origem';
const read=p=>readFileSync(resolve(root,p),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const files=[...new Set([...git('diff','--name-only','1c54533..dc02cd1').split(/\r?\n/),'README.md',...git('ls-files','tasks/evidencias/CF-028','tasks/evidencias/revisao-CF-028','tasks/evidencias/saneamento-CF-028-R28','tasks/evidencias/revalidacao-CF-028-R28').split(/\r?\n/)])];
const hashes=()=>Object.fromEntries(files.map(p=>[p,sha(readFileSync(resolve(root,p)))]));
const before=hashes();
const delivered=JSON.parse(execFileSync(process.execPath,[directory+'/verify.mjs'],{cwd:root,encoding:'utf8'}));
assert.equal(delivered.passed,7);assert.equal(delivered.cases.length,14);assert.equal(delivered.counterproofs.length,9);
const cases=JSON.parse(read(directory+'/cases.json')).cases;
const snapshots=JSON.parse(read(directory+'/snapshots.json')).cases;
// Expected sets derived on paper from §5.1, independent of expected/evaluate.
const sets=[[[11],[]],[[11],[11],[]],[[11],[11],[11]],[[],[12],[12]],[[11],[11]],[[11],[]],[[],[]],[[11],[11],[11]],[[11],[11],[11]],[[],[]],[],[[11],[11],[]],[[11],[]],[[11],[11]]];
const statuses=[200,200,200,200,400,200,200,400,409,200,200,200,409,200];
const idNumber=id=>Number(id.slice(-12));
const setResults=cases.map((c,i)=>{
  const r=evaluate(c);
  const actual=r.bySource.map(s=>s.decision.blockingReservationIds.map(idNumber));
  assert.deepEqual(actual,sets[i]);assert.equal(r.status,statuses[i]);
  for(const s of r.bySource)if(s.decision.blockingReservationIds.length){assert.equal(s.free.state,'UNKNOWN');assert.equal(s.decision.state,'BLOCKED');}
  assert.deepEqual(r.balances,c.sources.map(s=>s.value.value));
  return {case:c.name,blockers:actual,status:r.status};
});
// Regenerate entire fixtures in memory: stability only, not semantic oracle.
for(const name of ['build-cases.mjs','build-snapshots.mjs']){
  const moduleURL=pathToFileURL(resolve(root,directory,name));
  const body=read(directory+'/'+name).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','').replaceAll('import.meta.url','moduleURL');
  let destination,generated;
  vm.runInNewContext(body,{moduleURL,URL,readFileSync,createHash,structuredClone,evaluate,verifyExpected,amount,writeFileSync:(p,s)=>{destination=p;generated=s;}});
  assert.equal(generated,readFileSync(destination,'utf8'));
}
// Independent decimal parser: fixed cents, no executor decimal/amount arithmetic.
const cents=s=>{assert.match(s,/^-?\d+\.\d{2}$/);return BigInt(s.replace('.',''));};
const money=n=>`${n<0n?'-':''}${(n<0n?-n:n)/100n}.${String((n<0n?-n:n)%100n).padStart(2,'0')}`;
const sum=a=>a.reduce((n,s)=>n+cents(s),0n);
const e01=JSON.parse(read('tasks/evidencias/CF-028/examples.json')).draft.payload.sections;
const accounts=sum(e01.accounts.items.map(x=>x.balance.value));
const investments=sum(e01.investments.items.map(x=>x.valuation.amount));
const debt=sum(e01.cards.items.flatMap(x=>[x.opening.currentOutstanding,...x.opening.futureInstallments.map(i=>i.amount)]));
const credit=sum(e01.cards.items.map(x=>x.opening.credit));
const reserves=sum(e01.allocations.items.map(x=>x.amount));
assert.equal(accounts+investments+credit-debt,145100n);assert.equal(debt,35000n);assert.equal(reserves,55000n);
const [e16,e17,e18,e19,e20,e35]=snapshots;
const wide=sum(e16.draft.payload.sections.allocations.items.map(x=>x.amount));
assert.equal(wide,199999999999998n);assert.equal(cents(e16.summary.byGoal[0].covered.value),wide);
assert.equal(sum(e16.draft.payload.sections.accounts.items.map(x=>x.balance.value)),wide);
assert.equal(e16.summary.byGoal[0].covered.outsideIndividualRange,true);
assert.equal(cents(e17.existing.accounts[0].value)-cents(e17.existing.allocations[0].amount),-wide);
assert.equal(cents(e17.summary.bySource[0].free.value),-wide);
assert.equal(e18.summary.bySource[0].reserved.state,'UNKNOWN');
assert.equal(e18.originInputs.reservations[0].attribution.state,'CONFIRMED');
assert.equal(e19.summary.metrics.reservedAccounts.knownSubtotal,'300.00');
assert.equal(e19.summary.metrics.freeAccountCash.knownSubtotal,'500.00');
assert.equal(e19.summary.metrics.freeAccountCash.value,null);
assert.equal(e20.summary.bySource[0].reserved.value,'0.00');
assert.equal(e20.summary.byGoal[1].covered.state,'NOT_APPLICABLE');
assert.equal(e35.summary.metrics.reservedAccounts.value,'400.00');
assert.equal(e35.summary.metrics.netWorth.value,'1500.00');
assert.equal(e35.summary.byGoal[0].progress.state,'UNKNOWN');
// Independent canonical serializer with the specific evidence sort mandated by §5.1.
const ref=x=>x.kind+'/'+(x.id??x.tempId);
function canonical(v,field=''){
  if(v===null||typeof v!=='object')return v;
  if(Array.isArray(v)){
    const key=x=>typeof x==='string'?x:field==='evidence'?x.id:field==='reservations'||field==='confirmations'?x.reservationId:x.tempId??(x.kind&&x.id?ref(x):x.id??x.dimension??(x.source?ref(x.source):x.ref?ref(x.ref):''));
    return [...v].sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:0).map(x=>canonical(x));
  }
  return Object.fromEntries(Object.keys(v).filter(k=>k!=='existingAsOf').sort().map(k=>[k,canonical(v[k],k)]));
}
const hash=v=>sha(JSON.stringify(canonical(v)));
for(const c of snapshots){
  const p=c.prepareResponse.data;
  assert.equal(hash({contractVersion:1,sessionId:p.sessionId,draftVersion:p.draftVersion,payload:c.draft.payload}),p.contentHash);
  assert.equal(hash({contentHash:p.contentHash,sourceSnapshot:p.sourceSnapshot,mappingPreview:p.mappingPreview,summary:p.summary}),p.reviewHash);
  assert.deepEqual(c.recoveryResponse.data.prepared,p);assert.deepEqual(c.recoveryResponse.data.receipt,c.receiptResponse.data);
}
// Remaining gap: complete universe has only ACCOUNT; no unknown type/tombstone in inputs.
// Enumerate all possible single-source placements. Every world has the same account total.
const dimensionFindings=[];
for(const index of [2,7,11,13]){
  const c=cases[index],r=c.reservations[0];
  assert.equal(r.attribution.state,'UNBOUNDED');assert.equal(r.nominal.state,'KNOWN');
  const excluded=new Set(r.attribution.excluded.map(x=>ref(x.source)));
  const possible=c.sources.filter(x=>!excluded.has(ref(x.ref)));
  assert(possible.length>0);assert(possible.every(x=>x.ref.kind==='ACCOUNT'));
  const result=evaluate(c);
  const added=result.status===200?sum(c.allocations.map(x=>x.amount)):0n;
  const worlds=possible.map(x=>({source:ref(x.ref),accountTotal:money(cents(r.nominal.value)+added)}));
  assert.equal(new Set(worlds.map(w=>w.accountTotal)).size,1);
  const expected=worlds[0].accountTotal;
  assert.notEqual(result.reservedAccounts.value,expected);
  assert.throws(()=>assert.equal(result.reservedAccounts.value,expected,'DIMENSION_TOTAL'),/DIMENSION_TOTAL/);
  dimensionFindings.push({case:c.name,expectedState:'KNOWN',expected,actual:result.reservedAccounts,worlds});
}
// Legitimate controls: bounded same-type nominal once; genuine cross-type uncertainty remains unknown.
assert.equal(evaluate(cases[4]).reservedAccounts.value,'400.00');
const mixed=structuredClone(cases[2]);mixed.sources[2].ref.kind='INVESTMENT';
assert.equal(evaluate(mixed).reservedAccounts.state,'UNKNOWN');
// Necessary composition boundaries omitted from the delivered fourteen.
const overlap=structuredClone(cases[11]);overlap.allocations=[];
overlap.reservations.push(structuredClone(cases[3].reservations[1]));overlap.evidence.push(structuredClone(cases[3].evidence[1]));
assert.deepEqual(evaluate(overlap).bySource.map(s=>s.decision.blockingReservationIds.map(idNumber)),[[11],[11,12],[12]]);
const assigned=structuredClone(cases[3]);assigned.confirmations=structuredClone(cases[9].confirmations);
assert.deepEqual(evaluate(assigned).bySource.map(s=>s.decision.blockingReservationIds.map(idNumber)),[[],[12],[12]]);
const zero=structuredClone(cases[2]);zero.sources[0].value.value='0.00';zero.sources[0].active=false;
assert.equal(evaluate(zero).bySource[0].newAllocationCapacity.value,'0.00');
assert.equal(evaluate(zero).bySource[0].decision.reason,'RESERVATION_UNCERTAIN');
const after=hashes();assert.deepEqual(after,before);
console.log(JSON.stringify({scope:'Somente documento; reproduzir uma divergência não a aprova',base:git('rev-parse','dc02cd1'),interval:'1c54533..dc02cd1',delivered,setResults,entireGeneratorsMatch:true,sixIndependentHashes:'passed',arithmetic:{E01:{netWorth:money(accounts+investments+credit-debt),debt:money(debt),reserved:money(reserves)},E16:money(wide),E17:money(-wide),E18_E20:'preserved',E35:'1500.00 / 400.00'},extraCompositionControls:'passed',dimensionFindings,dimensionControls:['CANDIDATES ACCOUNT only: KNOWN400','UNBOUNDED ACCOUNT/INVESTMENT: UNKNOWN'],preservation:{before,after,unchanged:true}},null,2));
