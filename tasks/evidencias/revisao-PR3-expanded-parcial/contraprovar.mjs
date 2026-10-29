import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const origin=path.resolve(import.meta.dirname,'../../..');
const [runtimeArg,kind]=process.argv.slice(2),runtime=path.resolve(runtimeArg);
const sourceDirectory=JSON.parse(fs.readFileSync(path.join(runtime,'inputs-candidate.json'))).sourceDirectory??'subject';
const subject=path.join(runtime,sourceDirectory);
assert.match(path.basename(runtime),/^revisao-pr3-parcial-/);
assert.ok(fs.existsSync(path.join(runtime,'candidate-directed/execution.json')),'wait for positive run to finish');
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
const java='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/';
const files=kind==='fixture'?['Cf014HistoryReviewTest','Cf014HistoryDiagnosticTest'].map(n=>java+n+'.java'):kind==='auth'?[java+'infra/security/ReviewerAuthBrowserProbe.java']:kind==='opening'?['f/tests/e2e/milestone-review.integrated.spec.ts']:[];
assert.ok(files.length);
const saved=files.map(file=>({file,bytes:fs.readFileSync(path.join(subject,file))}));
const steps=[];
function run(label,tests,grep){
 const r=spawnSync(process.execPath,[path.join(import.meta.dirname,'executar.mjs'),'maven',runtime,label,...tests],{cwd:origin,env:{...process.env,REVIEW_GREP:grep??'',REVIEW_ORDER:'alphabetical'},windowsHide:true,stdio:'inherit'});
 steps.push({label,exit:r.status});return r.status;
}
let failure;
try {
 if(kind==='fixture'){
  for(const f of saved)fs.writeFileSync(path.join(subject,f.file),execFileSync('git',['show','1c4173f2:'+f.file],{cwd:origin}));
  // Preserve the original assertion methods and reproduce the complete causal chain.
  const historical=fs.readFileSync(path.join(origin,'tasks/evidencias/saneamento-PR3-expanded/probe-original.java.txt'),'utf8');
  const chain=historical.slice(0,historical.indexOf('    @Test void independentContextsInBothOrders()')).replace('class Pr3FixtureIsolationProbe','class ReviewerOriginalChainProbe')+'}\n';
  fs.writeFileSync(path.join(subject,java+'ReviewerOriginalChainProbe.java'),chain);
  assert.equal(run('fixture-original-chain',['ReviewerOriginalChainProbe']),0);
  assert.equal(run('fixture-shared-mutant',['Pr3FixtureIsolationProbe']),1);
  const xml=fs.readFileSync(path.join(runtime,'fixture-shared-mutant/surefire/TEST-com.controlefinanceiro.api.Pr3FixtureIsolationProbe.xml'),'utf8');
  assert.match(xml,/errors="0"/);assert.match(xml,/not to be equal to/);
 }else if(kind==='auth'){
  const changed=saved[0].bytes.toString().replace('Clock.systemUTC()','Clock.fixed(Instant.parse("2026-09-30T15:00:00Z"),ZoneId.of("America/Sao_Paulo"))');
  assert.notEqual(changed,saved[0].bytes.toString());fs.writeFileSync(path.join(subject,files[0]),changed);
  assert.equal(run('auth-old-clock',['ReviewerAuthBrowserProbe']),1);
  const d=read(path.join(runtime,'auth-old-clock/browsers/ReviewerAuthBrowserProbe/diagnostics-private.json'));
  assert.ok(d.events.some(e=>e.kind==='response'&&e.path==='/api/auth/login'&&e.status===200));
  assert.ok(d.events.some(e=>e.kind==='response'&&e.path==='/'&&e.status===307));
  assert.equal(d.state.path,'/auth');assert.ok(!d.cookies.some(c=>c.name==='token'));
 }else{
  const t=saved[0].bytes.toString(),start=t.indexOf('  // These opening fixtures'),end=t.indexOf('  const r=await page.request.post',start);
  assert.ok(start>=0&&end>start);fs.writeFileSync(path.join(subject,files[0]),t.slice(0,start)+t.slice(end));
  assert.equal(run('opening-numeric',['ReviewerOpeningBrowserProbe'],'UI04 visual dirigido'),1);
  const log=fs.readFileSync(path.join(runtime,'opening-numeric/browsers/ReviewerOpeningBrowserProbe/playwright.log'),'utf8');
  assert.match(log,/investments: 400/);assert.match(log,/openingQuantity/);
 }
}catch(error){failure=error.stack;}finally{
 for(const f of saved){fs.writeFileSync(path.join(subject,f.file),f.bytes);assert.equal(hash(fs.readFileSync(path.join(subject,f.file))),hash(f.bytes));}
}
if(!failure){
 const selection=kind==='fixture'?['Pr3FixtureIsolationProbe']:kind==='auth'?['ReviewerAuthBrowserProbe']:['ReviewerOpeningBrowserProbe'];
 try{assert.equal(run(kind+'-restored',selection,kind==='opening'?'UI04 visual dirigido':undefined),0);}catch(e){failure=e.stack;}
}
fs.writeFileSync(path.join(runtime,kind+'-counterproof.json'),JSON.stringify({kind,scope:'isolated external subject only; source worktree untouched',steps,files:saved.map(f=>({file:f.file,sha256:hash(f.bytes),restored:true})),failure},null,2)+'\n',{flag:'wx'});
if(failure)throw Error(failure);
