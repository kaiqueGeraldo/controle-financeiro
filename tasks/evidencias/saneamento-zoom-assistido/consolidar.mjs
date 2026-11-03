import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const parent=path.resolve(process.argv[2]??'');
assert.equal(path.basename(parent),'preparacao-adocao');
const out=import.meta.dirname;
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const ref=file=>({path:file,sha256:hash(file)});
const runtime=n=>path.join(parent,'zoom-assistido-20261103-0'+n);
const modes={1:'Observer error: duplicate tracing start, before registration',2:'Cold original UI URL timeout; registration/login/session HTTP200; Compiling observed',3:'Compiled readiness + original CF015 preparation passed; no native zoom',4:'Additional observer parser error before tests; no native zoom',5:'Both preparations and correct invoice/12th purchase passed; no native zoom'};
function cases(json,rows=[]) {
  for(const suite of json.suites??[])cases(suite,rows);
  for(const spec of json.specs??[]) for(const test of spec.tests??[])for(const result of test.results??[])
    rows.push({title:spec.title,project:test.projectName,status:result.status,retry:result.retry,durationMs:result.duration});
  return rows;
}
const runs=[];
for(let n=1;n<=5;n++) {
  const root=runtime(n),directory=path.join(root,'diagnostico-frio'),browser=path.join(directory,'browsers/Rf15RemediationBrowserTest');
  const entry={runtime:root,classification:modes[n],prepared:ref(path.join(root,'prepared.json')),
    execution:read(path.join(directory,'execution.json')),executionReceipt:ref(path.join(directory,'execution.json')),
    fullNativeScenarioExecuted:false,preparationCases:[],artifacts:[]};
  const report=path.join(browser,'playwright-private.json');
  if(fs.existsSync(report)) {const data=read(report);entry.stats=data.stats;entry.preparationCases=cases(data);}
  for(const name of ['database-before.json','database-after.json']) {
    const file=path.join(browser,name);if(fs.existsSync(file))entry[name.replace('.json','')]=read(file);
  }
  const readiness=path.join(directory,'readiness/compilation-readiness.json');
  if(fs.existsSync(readiness)){entry.readiness=read(readiness);entry.artifacts.push(ref(readiness));}
  for(const item of [path.join(directory,'maven.log'),path.join(browser,'playwright.log'),path.join(directory,'selection.txt')])
    if(fs.existsSync(item))entry.artifacts.push(ref(item));
  function evidence(dir) {
    if(!fs.existsSync(dir))return;
    for(const item of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,item.name);
      if(item.isDirectory())evidence(file);
      else if(/\.(png|zip)$/.test(item.name)||['ready.json','diagnosis.json'].includes(item.name))entry.artifacts.push(ref(file));
    }
  }
  evidence(path.join(browser,'artifacts'));evidence(path.join(browser,'visual'));
  entry.preparations={};
  for(const scenario of ['native-zoom-cf015','native-zoom-rf15-chrome']) {
    const dir=path.join(browser,'visual',scenario),file=path.join(dir,'diagnosis.json');
    if(!fs.existsSync(file))continue;
    const data=read(file);
    entry.preparations[scenario]={registered:data.registered,preparationReady:data.preparationReady,
      url:data.browserState?.url,browserNow:data.browserState?.browserNow,
      authResponses:data.events.filter(item=>item.type==='response').map(item=>({path:item.path,status:item.status,at:item.at})),
      ready:fs.existsSync(path.join(dir,'ready.json'))?read(path.join(dir,'ready.json')):null,
      diagnosis:ref(file),scope:data.scope};
  }
  runs.push(entry);
}
const first=runtime(1),native=runtime(6);
const latest=dir=>fs.readdirSync(dir).filter(name=>/^preservation-final-\d+\.json$/.test(name)).sort().at(-1);
const baseline=read(path.join(first,'initial.json'));
const oldReport=read(path.resolve(out,'../validacao-zoom-nativo/RESULTADOS.json'));
const result={date:'2026-11-03',timezone:'America/Sao_Paulo',branch:'codex/saneamento-pr3-expanded',
  initialHead:'02bd83f4262db9292de1f7b402b1fae5cbb6847a',productCandidate:'f09e69a6511a5772ea9052da7509a8930ae88d17',
  preparationCommit:'fda5167487c03aa791dd1d35ffbc671a0eb89f57',protocolCommit:'117d3c6982958d2276aa5ee94973adb97be6a71d',
  historicalRootCause:'Inconclusive: old trace lacked browser network/DOM; later success does not retroactively explain it',
  demonstratedReproductionCause:'Development readiness only covered /auth; private compilation still pending after successful registration/login/session and 15s URL oracle',
  applicationTimeoutsChanged:false,human60sMeaning:'Local continuation file after DPR ratio; not application response or chat upload SLA',
  protocol:{unitTests:14,unitResult:'passed',browserIntegrationTests:5,browserResult:'passed',syntheticNativeProof:false,
    unitArtifact:ref(path.join(first,'protocol-tests-final.tap')),browserArtifact:ref(path.join(first,'adapter-lifecycle-final.tap')),
    priorRaceFailurePreserved:ref(path.join(first,'protocol-tests.tap')),
    humanTerminalEndToEndExecuted:false},
  runs,nativePreparedPackage:{runtime:native,candidate:read(path.join(native,'prepared.json')).candidate,
    prepared:ref(path.join(native,'prepared.json')),adapted:ref(path.join(native,'assisted-package.json')),
    compilation:read(path.join(native,'compile/execution.json')),list:ref(path.join(native,'selection/list.txt')),
    cold:!fs.existsSync(path.join(native,'s/f/.next')),nativeRunStarted:false,
    assertions:'Functional suffix byte-identical in both native specs; structural fixture passed'},
  nativeProofs:{newProofs:[],priorRF15Preserved:true,priorCF015SufficientNativeProof:false,
    humanCaptures:oldReport.invocations.flatMap(run=>run.humanCaptures)},
  states:{A:'Both preparations validated; historical registration cause remains delimited',
    B:'Protocol validated synthetically and with real disposable browser; actual human terminal/native flow pending',
    C:'Historical RF15 native100%/200% proof preserved; no new native proof',
    D:'CF015 full native scenario remains partial; post-resume N04-N11 not executed',
    E:'RF15 full native scenario remains partial; post-resume N04-N11 not executed',
    F:'Candidate ready for scoped independent review and assisted continuation; expanded/global acceptance not ready'},
  preservation:{initialTracked:baseline.files.length,original1112Preserved:true,
    currentFiles:ref(path.join(first,latest(first))),preparedPackageFiles:ref(path.join(native,latest(native))),
    historical:read(path.join(first,'historical-runtime-final.json')),readmes:baseline.summary.readmes,
    protected:baseline.summary,restoredAutomatically:false},
  resources:read(path.join(first,'resources-final.json')),
  excludedActions:['push','PR update','remote CI','merge','hosting change','deploy','real database','expanded integral'],
  finalGitReceipt:path.join(first,'git-final.json')};
assert.equal(result.nativePreparedPackage.compilation.exit,0);
assert.equal(result.nativePreparedPackage.cold,true);
assert.equal(runs[4].execution.exit,0);
assert.equal(Object.keys(runs[4].preparations).length,2);
assert.ok(Object.values(runs[4].preparations).every(item=>item.preparationReady));
assert.equal(result.resources.ownProcesses.length,0);
assert.equal(result.resources.runningOwnContainers.length,0);
fs.writeFileSync(path.join(out,'RESULTADOS.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({preparations:2,protocolTests:19,fullNativeScenarios:0,originalTrackedPreserved:baseline.files.length,nativeCandidate:result.nativePreparedPackage.candidate}));
