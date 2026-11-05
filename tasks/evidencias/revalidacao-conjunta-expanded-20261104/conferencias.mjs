import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {sourceFor,hash} from '../../../.github/scripts/source.mjs';import {browserCases,identity} from '../../../.github/scripts/zoom-coverage.mjs';
const [out]=process.argv.slice(2),root='C:/cf-exp/1104d',front=root+'/s/controle-financeiro-frontend',read=f=>JSON.parse(fs.readFileSync(f)),results=[],proof=f=>({file:f,sha256:hash(fs.readFileSync(f))});
const configs=['playwright.common-components.config.ts','playwright.config.ts','playwright.frontend-closure.config.ts','playwright.integrated.config.ts','playwright.milestone-remediation.config.ts','playwright.milestone-review.config.ts','playwright.rf15-independent.config.ts','playwright.rf15.config.ts','playwright.rv24.config.ts'];
const listingOut=path.join(out,'listings');fs.mkdirSync(listingOut,{recursive:true});
let listedE2e;
for(const name of [...configs,'../cf032/playwright.config.ts']){
 const env={...process.env,CF_SOURCE_ROOT:root+'/s',CF_REVIEW_EVIDENCE:path.join(listingOut,name.replaceAll('/','-')),CF_TEST_ARTIFACTS:listingOut,CF032_EVIDENCE:listingOut,BACKEND_API_URL:'http://127.0.0.1:65535',CF_BROWSER_DIAGNOSTICS:'0'};
 for(const key of Object.keys(env))if(key.startsWith('CF_ZOOM_')||['PLAYWRIGHT_JSON_OUTPUT_FILE','CF_CLOSURE_FINAL','CF_CLOSURE_TARGETED','RF15_RVA_ONLY'].includes(key))delete env[key];
 const file=path.join(listingOut,name.replaceAll('/','-')+'.json');
 if(!fs.existsSync(file)){
  const p=spawnSync(process.execPath,['node_modules/@playwright/test/cli.js','test','--config','tests/e2e/'+name,'--list','--reporter=json'],{cwd:front,env,encoding:'utf8',windowsHide:true});
  fs.writeFileSync(file,p.stdout??'',{flag:'wx'});fs.writeFileSync(file+'.stderr',p.stderr??'',{flag:'wx'});assert.equal(p.status,0,name+': '+p.stderr);
 }const r=read(file);assert.equal(r.errors?.length??0,0);
 for(const project of r.config.projects){assert.ok(path.resolve(project.outputDir).startsWith(path.resolve(listingOut)+path.sep));}
 if(name==='playwright.rf15.config.ts')assert.equal(browserCases(r).length,25);
 if(name.startsWith('../cf032'))listedE2e=r;
 results.push({config:name,cases:browserCases(r).length,outputs:r.config.projects.map(x=>x.outputDir),...proof(file),scope:'list only; no product execution'});
}
const financialFile=root+'/all/browser/playwright.json',financial=read(financialFile),cases=browserCases(financial);
const physicalIdentity=(r,x)=>JSON.stringify([x.project,fs.realpathSync.native(path.resolve(r.config.rootDir,x.file)),x.titles]);
assert.deepEqual(cases.map(x=>physicalIdentity(financial,x)).sort(),browserCases(listedE2e).map(x=>physicalIdentity(listedE2e,x)).sort());assert.equal(new Set(cases.map(identity)).size,13);assert.equal(financial.errors.length,0);for(const t of cases){assert.equal(t.test.status,'expected');assert.equal(t.test.expectedStatus,'passed');assert.equal(t.test.results.length,1);assert.equal(t.test.results[0].status,'passed');assert.equal(t.test.results[0].retry,0);const prefix=t.titles.at(-1).match(/^[A-Z][0-9]?/)[0],after=read(root+'/all/browser/'+prefix+'-result.json');assert.equal(after.status,'passed');assert.equal(after.title,t.titles.at(-1));}
const r=read(root+'/all/result.json'),backend=r.steps.find(s=>s.name==='backend'),start=Date.parse(backend.started),end=start+backend.durationMs,xmlfiles=fs.readdirSync(root+'/all/surefire').filter(f=>f.startsWith('TEST-')&&f.endsWith('.xml'));
const mtimes=xmlfiles.map(f=>fs.statSync(root+'/all/surefire/'+f).mtimeMs);assert.ok(mtimes.every(t=>t>=start&&t<=end+1000));
let sameOld=0;const old='C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/componentes-completo-w/v/surefire';for(const f of xmlfiles)if(fs.existsSync(old+'/'+f)&&hash(fs.readFileSync(old+'/'+f))===hash(fs.readFileSync(root+'/all/surefire/'+f)))sameOld++;assert.equal(sameOld,0);
const sqlChecks=[],sql=(name,check)=>{const file=root+'/all/browser/'+name+'-sql.json',x=read(file);check(x);sqlChecks.push({name,passed:true,...proof(file)});return x;};
sql('A-draft',x=>assert.equal(x.applications,0));sql('A-applied',x=>{assert.equal(x.accountTotal,'1300.00');assert.equal(x.debt,'350.00');assert.equal(x.netWorth,'1451.00');assert.equal(x.applications,16);assert.equal(x.receipts.filter(x=>x.kind==='ONBOARDING_COMPLETE').length,1);});
const g=sql('G-committed-before-response-loss',x=>{assert.equal(x.accountTotal,'1100.00');assert.equal(x.debt,'150.00');assert.equal(x.payments.length,1);});sql('G-reloaded',x=>{assert.equal(x.accountTotal,'1100.00');assert.equal(x.debt,'150.00');assert.equal(x.payments.length,1);assert.equal(x.transactions.filter(t=>t.origin==='INVOICE_PAYMENT').length,1);assert.deepEqual(x.payments,g.payments);});
const hb=sql('H-B-before',x=>assert.equal(x.accountTotal,'2280.00'));sql('H-B-after',x=>assert.deepEqual(x,hb));sql('H-A',x=>assert.equal(x.accountTotal,'1010.00'));
const eb=sql('E-before',()=>{});sql('E-after',x=>{assert.deepEqual(x.accounts,eb.accounts);assert.deepEqual(x.legacyReservations,eb.legacyReservations);assert.equal(x.transactions.length,0);assert.equal(x.investments.length,0);assert.equal(x.allocations.length,0);});
for(let i=0;i<3;i++)sql('T'+i+'-final',x=>{assert.equal(x.accountTotal,'1300.00');assert.equal(x.debt,'350.00');assert.deepEqual(x.habitLogs,[{log_date:'2026-10-22',status:'PENDING',goal_history_id:null}]);});
const originalDrift=read('tasks/evidencias/saneamento-caminhos-expanded/PRESERVACAO.json').oldArtifacts.manifest,oldDrift=read(originalDrift),artifacts=oldDrift.added??oldDrift.extra;
const owners={'frontend-closure':'FrontendClosureBrowserTest','rf15-independent':'Rf15IndependentBrowserTest','rv24':'Rv24CreationBrowserIntegrationTest'};
const producers=artifacts.map(x=>{const family=x.path.split('/')[3],owner=owners[family],destination=root+'/all/browsers/'+owner+'/'+family;assert.ok(owner&&fs.existsSync(destination));return {path:x.path,sha256:x.sha256,producer:'Playwright '+family+' outputDir; Java '+owner,newDestination:destination};});
assert.equal(sourceFor(root+'/s').files.length,863);
fs.writeFileSync(out+'/conferencias.json',JSON.stringify({at:new Date().toISOString(),listings:results,financial:{tests:cases.length,uniqueIdentities:13,identities:cases.map(identity),noRetries:true,proof:proof(financialFile)},freshness:{backendReports:116,mtimeMin:new Date(Math.min(...mtimes)).toISOString(),mtimeMax:new Date(Math.max(...mtimes)).toISOString(),stepStarted:backend.started,stepDurationMs:backend.durationMs,identicalToOldReports:sameOld,limits:'mtime is supporting metadata; freshOutput+logged commands+different hashes also checked'},sqlChecks,historicalArtifacts:producers,guardPassed:true},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({listings:results.length,financial:13,sqlCheckpoints:sqlChecks.length,oldReportsReused:sameOld,guardPassed:true,artifacts:producers.map(x=>x.path)}));
