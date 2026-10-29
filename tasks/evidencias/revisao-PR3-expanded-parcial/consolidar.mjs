import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),original=path.resolve(root,'../..');
const [firstArg,secondArg,phase='checkpoint']=process.argv.slice(2),runtimes=[path.resolve(firstArg),path.resolve(secondArg)];
const read=f=>JSON.parse(fs.readFileSync(f)),sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const git=(wd,...args)=>execFileSync('git',args,{cwd:wd,encoding:'utf8',windowsHide:true}).trim();
const xmlCounts=text=>{const s=text.match(/<testsuite\b[^>]*>/)?.[0];assert.ok(s);return Object.fromEntries(['tests','failures','errors','skipped'].map(k=>[k,Number(s.match(new RegExp(`\\b${k}="(\\d+)"`))?.[1])]));};
const invocations=[];
for(const runtime of runtimes)for(const label of fs.readdirSync(runtime)){
 const dir=path.join(runtime,label),record=path.join(dir,'execution.json');if(!fs.existsSync(record))continue;
 const r=read(record),log=path.join(dir,'execution.log');assert.equal(sha(log),r.logSha256);
 const reports=(r.reports??[]).map(p=>{const f=path.join(dir,'surefire',p.file);assert.equal(sha(f),p.sha256);return {file:p.file,sha256:p.sha256,counts:xmlCounts(fs.readFileSync(f,'utf8'))};});
 const browsers=[];const b=path.join(dir,'browsers');
 if(fs.existsSync(b))for(const owner of fs.readdirSync(b)){
  const json=path.join(b,owner,'playwright-private.json'),logFile=path.join(b,owner,'playwright.log');
  if(fs.existsSync(json)){
   const data=read(json);function specs(suites){return suites.flatMap(s=>[...(s.specs??[]),...specs(s.suites??[])]);}
   browsers.push({owner,sha256:sha(json),stats:data.stats,scenarios:specs(data.suites??[]).map(s=>({title:s.title,ok:s.ok,statuses:s.tests.flatMap(t=>t.results.map(r=>r.status))}))});
  }else if(fs.existsSync(logFile)){
   const text=fs.readFileSync(logFile,'utf8'),diagFile=path.join(b,owner,'diagnostics-private.json');
   const item={owner,logSha256:sha(logFile),passed:text.match(/(\d+) passed \(/)?.[1],failed:text.match(/(\d+) failed/)?.[1],functionalPass:text.includes('PASS UI→BFF→Spring→PostgreSQL')};
   if(fs.existsSync(diagFile)){
    const d=read(diagFile);item.auth={sha256:sha(diagFile),path:d.state.path,cookies:d.cookies.map(c=>({name:c.name,expires:c.expires,tokenExpiration:c.tokenExpiration})),responses:d.events.filter(e=>e.kind==='response'&&['/api/auth/register','/api/auth/login','/api/auth/user','/','/auth','/api/accounts/position'].includes(e.path)).map(e=>({path:e.path,status:e.status}))};
   }browsers.push(item);
  }
 }
 const inputFile=path.join(dir,'inputs.json'),inputs=read(inputFile);
 const deviations=inputs.filter(f=>{const name=f.file.startsWith('f/')?'controle-financeiro-frontend/'+f.file.slice(2):f.file;return fs.existsSync(path.join(root,name))&&sha(path.join(root,name))!==f.sha256;}).map(f=>f.file);
 const independentInputs=inputs.filter(f=>/Reviewer.*\.java$|reviewer-visual|playwright\.reviewer/.test(f.file));
 const nodeLog=fs.readFileSync(log,'utf8'),nodeCounts=r.args.includes('--test')?Object.fromEntries(['tests','pass','fail','skipped'].map(k=>[k,Number(nodeLog.match(new RegExp(`(?:#|ℹ)\\s*${k} (\\d+)`))?.[1])])):undefined;
 invocations.push({runtime:path.basename(runtime),label,started:r.started,finished:r.finished,exit:r.exit,error:r.error,subject:r.subject,candidate:r.candidate,args:r.args,recordSha256:sha(record),logSha256:sha(log),inputsSha256:sha(inputFile),inputCount:inputs.length,deviationsFromWorktree:deviations,independentInputs,nodeCounts,reports,browsers});
}
const counters=[];
for(const runtime of runtimes)for(const name of ['fixture','auth','opening']){
 const f=path.join(runtime,name+'-counterproof.json');if(fs.existsSync(f)){const data=read(f);counters.push({...data,runtime:path.basename(runtime),receiptSha256:sha(f)});}
}
const manifestFile=path.join(original,'tasks/evidencias/validacao-remota-consolidacao/preservacao-inicial.json');
const protectedFiles=read(manifestFile).files;assert.equal(protectedFiles.length,97);
for(const f of protectedFiles)assert.equal(sha(path.resolve(original,f.file)),f.sha256,f.file);
const remediationManifest=path.join(root,'tasks/evidencias/saneamento-PR3-expanded/inventario.json');
const remediationFiles=read(remediationManifest).files;
for(const f of remediationFiles)assert.equal(sha(path.join(root,f.file)),f.sha256,f.file);
const mainReadme=sha(path.join(original,'README.md')),worktreeReadme=sha(path.join(root,'README.md'));
assert.equal(mainReadme,'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
assert.equal(worktreeReadme,'e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0');
const changedImplementation=git(root,'diff','26dce7db','--','controle-financeiro-backend','controle-financeiro-frontend','.github','docs/sdd','.gitignore');assert.equal(changedImplementation,'');
const historical=path.join(runtimes[1],'historical-audit-private.json'),h=read(historical);
const closureFile=path.join(runtimes[1],'resource-closure.json'),closure=fs.existsSync(closureFile)?read(closureFile):undefined;
if(phase==='final'){assert.ok(closure);assert.equal(closure.ownedProcesses.length,0);assert.equal(closure.liveOwnedContainers.length,0);assert.ok(counters.length===3&&counters.every(c=>c.files.every(f=>f.restored)));}
const result={at:new Date(),phase,base:'1c4173f2e9a8bd459a9f2ecd4acf2d803245be88',candidate:'26dce7dbc98b140d22095b6948c539e01fc1128c',reviewHead:git(root,'rev-parse','HEAD'),branch:git(root,'branch','--show-current'),invocations,counters,historical:{receiptSha256:sha(historical),runs:h.runs.length,reports:h.runs.reduce((n,r)=>n+r.reports.length,0),traces:h.traces.length,boundSources:h.sources.length,remoteFailures:h.remote.failures.length,remoteRawXmlOrTraces:h.remote.rawXmlOrTraces,productGatesDependenciesDeltaEmpty:h.gatesDiff===''},resources:closure?{receiptSha256:sha(closureFile),ownProcesses:closure.ownedProcesses.length,ownContainerIds:closure.containerIdsFromOwnLogs.length,liveOwnContainers:closure.liveOwnedContainers.length,temporaryAliasReleased:closure.temporaryAliasReleased}:undefined,visual:{summarySha256:sha(path.join(import.meta.dirname,'VISUAL.json')),pixelDecodingSha256:sha(path.join(runtimes[1],'pixel-decoding.json'))},preservation:{checked:97,differences:[],manifestSha256:sha(manifestFile),remediationManifest:{checked:remediationFiles.length,sha256:sha(remediationManifest),differences:[]},mainReadme,worktreeReadme,mainHead:git(original,'rev-parse','HEAD'),mainStatus:git(original,'status','--short'),worktrees:git(root,'worktree','list','--porcelain'),implementationDiffEmpty:true},limits:{countsArePerInvocation:true,fullExpandedExecuted:false,remoteCIExecuted:false,remoteFailureResolved:false,productOrHarnessFixedInSourceCheckout:false,packageBuilt:false,realDatabaseAccessed:false}};
fs.writeFileSync(path.join(import.meta.dirname,'RESULTADOS.json'),JSON.stringify(result,null,2)+'\n');
if(phase==='final')fs.writeFileSync(path.join(runtimes[1],'preservation-final-review.json'),JSON.stringify(result.preservation,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({phase,invocations:invocations.map(i=>({runtime:i.runtime,label:i.label,exit:i.exit,counts:i.reports.map(r=>r.counts),browsers:i.browsers.map(b=>({owner:b.owner,stats:b.stats,passed:b.passed,failed:b.failed,functionalPass:b.functionalPass}))})),counterproofs:counters.map(c=>({kind:c.kind,steps:c.steps,restored:c.files.every(f=>f.restored),failure:c.failure})),protected:97}));
