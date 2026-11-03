import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const [firstArg,secondArg]=process.argv.slice(2);
assert.ok(firstArg&&secondArg);
const runtimes=[firstArg,secondArg].map(value=>path.resolve(value));
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const ref=file=>({path:file,sha256:hash(file)});
const find=(directory,name)=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(directory,entry.name);
  return entry.isDirectory()?find(full,name):entry.isFile()&&entry.name===name?[full]:[];
});
const invocations=[];
for(const [index,runtime] of runtimes.entries()) {
  const directory=path.join(runtime,index===0?'atendida-01':'atendida-02');
  const prepared=read(path.join(runtime,'prepared.json'));
  const files=prepared.files.filter(item=>item.tree==='s');
  assert.equal(files.length,849);
  for(const item of files) assert.equal(hash(path.join(runtime,'s',item.copy)),item.actual,item.copy);
  const browser=path.join(directory,'browsers/Rf15RemediationBrowserTest');
  const report=read(path.join(browser,'playwright-private.json'));
  const cases=[];
  function collect(suite) {
    for(const spec of suite.specs??[]) for(const test of spec.tests) for(const result of test.results) cases.push({file:spec.file,title:spec.title,project:test.projectName,status:result.status,retry:result.retry,durationMs:result.duration,errorCategory:result.error?.message?.includes('toHaveURL')?'registration-url-timeout':'native-confirmation-file-timeout'});
    for(const child of suite.suites??[]) collect(child);
  }
  for(const suite of report.suites) collect(suite);
  assert.equal(cases.length,2);
  assert.ok(cases.every(item=>item.status==='failed'&&item.retry===0));
  const readyFiles=find(path.join(browser,'visual'),'ready.json');
  const ready=readyFiles.map(file=>({...ref(file),scenario:path.basename(path.dirname(file)),...read(file)}));
  assert.equal(ready.length,index===0?2:1);
  assert.equal(find(directory,'native-confirmed.txt').length,0);
  assert.equal(find(directory,'zoom.json').length,0);
  const humanDirectories=index===0?['human-first-occurrence','human-second-occurrence']:['human-native-proof'];
  const captures=humanDirectories.flatMap(name=>fs.readdirSync(path.join(directory,name)).map(file=>({...ref(path.join(directory,name,file)),source:'human',nativeIndicator:file.startsWith('rf15-')?(file.includes('-100')?100:200):null})));
  const xml=find(path.join(directory,'surefire'),'TEST-com.controlefinanceiro.api.Rf15RemediationBrowserTest.xml')[0];
  const execution=read(path.join(directory,'execution.json'));
  assert.equal(execution.exit,1);
  invocations.push({runtime,directory,candidate:prepared.candidate,packageManifest:ref(path.join(runtime,'prepared.json')),physicalSources:849,pathMappedJavaSources:files.filter(item=>item.pathOnly).length,execution:{...ref(path.join(directory,'execution.json')),exit:execution.exit},playwright:{...ref(path.join(browser,'playwright-private.json')),stats:report.stats,cases},ready,humanCaptures:captures,nativeConfirmationFiles:0,zoomMetricsFiles:0,traces:find(browser,'trace.zip').map(ref),persisted:ref(path.join(browser,'persisted.txt')),junitWrapper:ref(xml),interpretation:'Two Playwright failures inside one JUnit wrapper; do not add wrapper count to scenario count.'});
}
const preparation=path.join(runtimes[0],'preparation');
const latestPreservation=fs.readdirSync(runtimes[0]).filter(name=>name.startsWith('preservation-final-')).sort().at(-1);
assert.ok(latestPreservation);
const preservation=read(path.join(runtimes[0],latestPreservation));
const result={date:'2026-11-03',timezone:'America/Sao_Paulo',candidate:'f09e69a6511a5772ea9052da7509a8930ae88d17',branch:'codex/saneamento-pr3-expanded',capacity:{initial:'C autonomous native input unavailable; no repeated browser safety refusal',current:'A assisted native menu operation and human captures demonstrated; autonomous native input remains unavailable',alternativeEnvironmentIdentified:false,actualNativeZoomProof:'RF15 Chrome menu100%/200% supplied by the user; not automated native UI observation',synchronousContinuationValidated:false},environment:{os:'Windows 11 Pro',release:'10.0.26200',arch:'x64',node:'24.18.0',jdkForDrivers:'21.0.12.1+1',maven:'3.9.12',playwright:'1.63.0',next:'16.1.6',postgres:'16.15 disposable Testcontainers',chromium:'153.0.8010.12',chrome:'155.0.8059.84',displayResolution:'1920x1080 returned by Intel WMI; browser monitor not independently confirmed',systemScale:'not independently verified; ready DPR1 is not treated as OS setting proof'},preparation:{readiness:read(path.join(preparation,'readiness.json')),databaseAfter:read(path.join(preparation,'database-after.json')),lifecycle:read(path.join(preparation,'lifecycle.json')),capture:{...ref(path.join(preparation,'carteira-preparacao.png')),inspected:true,nativeZoomProof:false},credentials:'Private runtime file only; not included in this report'},invocations,results:{cf015:'Failed: first invocation missing native confirmation60s; second registration URL timeout15s before ready. No complete native acceptance.',rf15:'Failed at native confirmation60s in both invocations. Human native100%/200% proof exists; subsequent geometry/routes/actions/overlays/focus not reached.',productDefectEstablished:false,registrationCause:'Undetermined from available context. Do not attribute to product, fixture clock, warmup, network or helper without further evidence.',acUi001:'Partial native percentage evidence only; criterion remains open',cf010:'em_revisao; acceptance1 remains open',cf015:'em_revisao; no global acceptance',rr301:'Closed in its existing attribution contract; not reopened',expanded:'Prerequisites not met; full local suite not executed',merge:'Not released'},preservation:{...preservation,privateReceipt:ref(path.join(runtimes[0],latestPreservation))},next:{internal:'Diagnose the CF015 registration precondition in its exact cold reproduction; no product fix in this stage',human:'In a separately scheduled invocation, after capturing the native menu100%/200%, type200% in a human-operated local terminal to supply the original confirmation immediately; upload captures afterwards',localConfirmationLimit:'Terminal helper syntax/argument and no-write check only; not demonstrated end-to-end. Earlier GUI helpers emitted no confirmation; their cause was not captured. No third invocation performed.'},remoteActions:{push:false,prUpdate:false,remoteCi:false,merge:false,hostingChange:false,deploy:false,realDatabase:false}};
const output=path.join(import.meta.dirname,'RESULTADOS.json');
assert.ok(!fs.existsSync(output),'Never overwrite an execution receipt');
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,invocations:2,playwrightFailed:4,skipped:0,retries:0,nativeMenuProof:'human RF15',fullNativeScenariosApproved:0}));
