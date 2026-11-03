import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const root=path.resolve(import.meta.dirname,'../../..');
const main=path.resolve(root,'../../controle-financeiro');
const evidence=import.meta.dirname;
const runtime=path.resolve(process.argv[3]??process.env.CF_EXPANDED_LOCAL_RUNTIME??path.resolve(root,'../../controle-financeiro-runtimes/preparacao-adocao/expanded-local-20261103-01'));
const parent=path.dirname(runtime);
const jdk=path.join(main,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const expectedHead='f6297df873b5120d610f0b951f706c8981351cfb';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const run=(cmd,args,cwd=root)=>execFileSync(cmd,args,{cwd,encoding:'utf8',windowsHide:true}).trim();
const git=(...args)=>run('git',args);
const state=cwd=>({head:run('git',['rev-parse','HEAD'],cwd),branch:run('git',['branch','--show-current'],cwd),status:run('git',['status','--porcelain=v1'],cwd),readme:hash(path.join(cwd,'README.md'))});
const docker=(...args)=>run('docker',['--context','desktop-linux',...args]);
const resources=()=>({containers:docker('ps','-aq').split('\n').filter(Boolean).sort(),networks:docker('network','ls','-q').split('\n').filter(Boolean).sort(),volumes:docker('volume','ls','-q').split('\n').filter(Boolean).sort()});
const reviewed=path.join(root,'tasks/evidencias/revisao-expanded-plataformas-docker');
const inputFile=path.join(parent,'saneamento-expanded-plataformas-01/inputs/.ci-source.json');

function preserved(){
  const older=path.join(parent,'excecao-zoom-expanded-20261103-01');
  const initial=read(path.join(older,'initial.json'));
  const oldFinal=read(path.join(older,'preservation-final-1793724101715.json'));
  const baseline=read(initial.references[0].file);
  const deltas=new Map(oldFinal.authorizedChanges.map(f=>[f.file,f]));
  let unchanged=0;
  for(const f of baseline.files)if(!deltas.has(f.file)){assert.equal(hash(path.join(root,f.file)),f.sha256,f.file);unchanged++;}
  assert.equal(unchanged,1113);
  for(const f of oldFinal.authorizedChanges)assert.equal(hash(f.archived),f.before,f.archived);
  for(const f of initial.references)assert.equal(hash(f.file),f.sha256,f.file);
  const history=read(initial.references[1].file);
  for(const f of history.files)assert.equal(hash(f.file),f.sha256,f.file);
  const protectedFiles=read(initial.references[4].file);
  for(const f of protectedFiles.protected97)assert.equal(hash(path.resolve(main,f.file)),f.sha256,f.file);
  const prior=read(path.join(root,'tasks/evidencias/saneamento-expanded-plataformas/PRESERVACAO.json'));
  assert.equal(hash(prior.receipt.path),prior.receipt.sha256);
  for(const f of prior.authorizedChanges)assert.equal(hash(f.archived),f.before,f.archived);
  for(const f of read(path.join(root,'tasks/evidencias/excecao-zoom-expanded/RESULTADOS.json')).evidence)assert.equal(hash(f.path),f.sha256,f.path);
  const refs=read(path.join(reviewed,'REFERENCIAS.json')).refs;
  for(const f of refs)assert.equal(hash(f.path),f.sha256,f.path);
  const assisted=path.join(parent,'zoom-assistido-20261103-06');
  const prepared=read(path.join(assisted,'prepared.json'));
  const adapted=read(path.join(assisted,'assisted-package.json'));
  const patches=new Map(adapted.changes.map(f=>[f.relative,f]));
  let assistedFiles=0;
  for(const f of prepared.files.filter(f=>f.tree==='s')){const p=patches.get(f.copy);if(p){assert.equal(p.original,f.actual);assert.equal(hash(p.archived),f.actual);}assert.equal(hash(path.join(assisted,'s',f.copy)),p?.actual??f.actual);assistedFiles++;}
  for(const f of adapted.extras){assert.equal(hash(path.join(assisted,'s',f.relative)),f.sha256);assistedFiles++;}
  const files=git('ls-files','-z').split('\0').filter(Boolean).map(file=>({file,sha256:hash(path.join(root,file))}));
  const inputs=read(inputFile);
  assert.equal(inputs.commit,'0aac7ccd25934ec022939464486da9fb28610279');
  assert.equal(inputs.files.length,860);
  assert.equal(sha(JSON.stringify(inputs.files)),inputs.digest);
  assert.equal(inputs.digest,'d7453567d9e08a02bd33846b0c739fed15be55d3117faf9598a720fa44d2d660');
  for(const f of inputs.files){assert.equal(hash(path.join(root,f.path)),f.sha256,f.path);assert.equal(hash(path.join(path.dirname(inputFile),f.path)),f.sha256,f.path);}
  return {at:new Date().toISOString(),main:state(main),worktree:state(root),unchanged1113:unchanged,archived11:deltas.size,historicalArtifacts:history.files.length,protected97:protectedFiles.protected97.length,assistedFiles,independentReferences:refs.length,inputs:{commit:inputs.commit,digest:inputs.digest,fileCount:inputs.files.length,manifest:inputFile,manifestSha256:hash(inputFile)},files};
}

if(process.argv[2]==='final'){
  const before=read(path.join(runtime,'preservation-initial.json'));
  const after=preserved();
  const allowed=new Set(['tasks/05-release/CF-034-gates-ci.md','tasks/05-release/CF-036-publicacao.md']);
  const changes=[];
  for(const f of before.files){const actual=hash(path.join(root,f.file));if(actual!==f.sha256){assert.ok(allowed.has(f.file),f.file);changes.push({file:f.file,before:f.sha256,after:actual});}}
  assert.equal(after.main.head,before.main.head);
  assert.equal(after.main.branch,before.main.branch);
  assert.equal(after.main.status,before.main.status);
  assert.equal(after.main.readme,before.main.readme);
  assert.equal(after.worktree.readme,before.worktree.readme);
  assert.equal(git('diff',expectedHead,'--','.github','controle-financeiro-backend','controle-financeiro-frontend','docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md','tasks/evidencias/CF-028/examples.json','tasks/evidencias/saneamento-CF-028-origem/snapshots.json'),'');
  const cleanup=resources();
  assert.deepEqual(cleanup,read(path.join(runtime,'resources-initial.json')));
  write(path.join(runtime,'preservation-final.json'),after);
  write(path.join(runtime,'resources-final.json'),cleanup);
  const summary={at:after.at,inputCandidate:expectedHead,initialTracked:before.files.length,unchangedTracked:before.files.length-changes.length,authorizedDocumentationChanges:changes,unchanged1113:after.unchanged1113,archived11:after.archived11,historicalArtifacts:after.historicalArtifacts,protected97:after.protected97,assistedFiles:after.assistedFiles,independentReferences:after.independentReferences,readmes:{main:after.main.readme,worktree:after.worktree.readme},main:after.main,worktree:after.worktree,implementationDelta:[],cleanup:{resourcesBeforeAfterEqual:true,createdContainers:[],createdDatabases:[],createdNetworks:[],createdVolumes:[],startedApplicationServers:[],cleanupNeeded:false,processProof:'The synchronous preparation subprocess returned exit 1 before candidate export or runner; see invocation.json and final process check.'},receipts:['preservation-initial.json','preservation-final.json','resources-initial.json','resources-final.json','invocation.json','preparation.stdout.log','preparation.stderr.log'].map(file=>({path:path.join(runtime,file),sha256:hash(path.join(runtime,file))}))};
  write(path.join(evidence,'PRESERVACAO.json'),summary);
  console.log(JSON.stringify({phase:'final',tracked:summary.initialTracked,changes:changes.map(f=>f.file),unchanged1113:summary.unchanged1113,archived11:summary.archived11,readmes:summary.readmes,cleanupEqual:true}));
}else{
  assert.equal(process.argv[2],'run');
  assert.ok(!fs.existsSync(runtime),'Runtime must be new; do not retry');
  assert.equal(git('rev-parse','HEAD'),expectedHead);
  assert.equal(git('branch','--show-current'),'codex/saneamento-pr3-expanded');
  assert.equal(git('status','--porcelain=v1'),'');
  git('merge-base','--is-ancestor','2c6bb04a',expectedHead);
  const initial=preserved();
  assert.equal(initial.main.readme,'6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
  const baseline=resources();
  const daemon=docker('info','--format','{{.ID}}');
  assert.equal(daemon,'2455a676-938f-48d8-a0ef-67c98474314d');
  const version=JSON.parse(docker('version','--format','{{json .}}'));
  const context=JSON.parse(docker('context','inspect','desktop-linux','--format','{{json .Endpoints.docker}}'));
  const javaVersion=spawnSync(path.join(jdk,'bin/java.exe'),['-version'],{encoding:'utf8',windowsHide:true});
  assert.equal(javaVersion.status,0);
  const {backendSelection}=await import(pathToFileURL(path.join(root,'.github/scripts/suites.mjs')));
  const windows=backendSelection(root,'expanded','win32');
  const linux=backendSelection(root,'expanded','linux');
  const native=backendSelection(root,'expanded','win32','platform-only');
  const historical=read(path.join(reviewed,'SELECAO.json'));
  assert.equal(windows.selected.length,116);
  assert.equal(linux.selected.length,115);
  assert.equal(native.selected.length,1);
  assert.deepEqual([...new Set([...linux.selected,...native.selected])].sort(),windows.selected);
  assert.deepEqual(windows.selected,historical.java.universe);
  write(path.join(evidence,'SELECAO.json'),{candidate:expectedHead,inputs:initial.inputs,classification:'planned/current source identity check; no Java tests executed',universe:windows.selected,common:linux.selected,windowsOnly:native.selected,selectedWindows:windows.selected,routedWindows:windows.routed,deferredJava:windows.deferred,unionEqualsUniverse:true,distinctPlannedClasses:116,executedClasses:0,executedCases:0,windowsContractExecution:'included once in full Windows selection; no separate run',rf15:{classification:'reviewed prior identity inventory only; no new browser listing or results',reviewedEvidence:'../revisao-expanded-plataformas-docker/SELECAO.json',A:historical.rf15.A,B:historical.rf15.B,C:historical.rf15.C,newExecuted:0}});
  const preparation=path.join(reviewed,'preparar-proxima.mjs');
  const prepared=fs.readFileSync(preparation,'utf8');
  assert.ok(prepared.includes("assert.ok(path.basename(runtime).startsWith('revisao-plataformas-docker-'));"));
  write(path.join(evidence,'TOPOLOGIA.json'),{at:new Date().toISOString(),runner:{platform:process.platform,node:process.version,executable:process.execPath},plannedJvm:{platform:'Windows amd64',jdk,version:(javaVersion.stdout+javaVersion.stderr).trim()},docker:{daemonId:daemon,context:'desktop-linux',endpoint:context.Host,version},plannedDatabase:{image:'postgres:16-alpine',platform:'Linux amd64',hostUsedByJvm:'127.0.0.1',namePrefix:'cf_test_',guardUnchanged:true,ryuk:'enabled',reuse:false},plannedFrontend:'Windows; Linux 626/71 is prior evidence only',browser:'not started; planned Chromium on Windows',currentCheck:'read-only daemon/endpoint/version only; dynamic Ryuk/PG/guard/JDBC preflight not reached because preparation is known to reject the authorized path',realDatabaseAccess:false,connectionStringsUsed:[],environmentPolicy:'Only inherited variable names inspected; sensitive/provider/database variables removed from preparation subprocess; no values recorded'});
  const env={...process.env};
  const removed=[];
  for(const key of Object.keys(env))if(/^(SPRING_|RESEND_|BRAPI_|JWT_|DATABASE_URL|JDBC_|PGHOST|PGDATABASE|PGUSER|PGPASSWORD|CF_ZOOM_)/.test(key)){removed.push(key);delete env[key];}
  const executable='powershell.exe';
  const args=['-NoProfile','-NonInteractive','-File',path.join(reviewed,'proxima-rodada.ps1'),'-Runtime',runtime,'-Java21',jdk];
  const started=new Date().toISOString();
  const result=spawnSync(executable,args,{cwd:root,env,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
  const finished=new Date().toISOString();
  // The prepared command must fail before creating its destination. Only now
  // create a private directory to preserve this attempt's receipts and originals.
  const destinationCreatedByPreparedCommand=fs.existsSync(runtime);
  if(!destinationCreatedByPreparedCommand)fs.mkdirSync(runtime,{recursive:true});
  fs.writeFileSync(path.join(runtime,'preparation.stdout.log'),result.stdout??'',{flag:'wx'});
  fs.writeFileSync(path.join(runtime,'preparation.stderr.log'),result.stderr??'',{flag:'wx'});
  const invocation={candidate:expectedHead,inputs:initial.inputs,executable,args,cwd:root,started,finished,exit:result.status,error:result.error?.message,removedEnvironmentNames:removed,destinationCreatedByPreparedCommand,preparedCommandSha256:hash(path.join(reviewed,'proxima-rodada.ps1')),preparerSha256:hash(preparation),runnerStarted:false,exportCreated:false};
  write(path.join(runtime,'invocation.json'),invocation);
  write(path.join(runtime,'preservation-initial.json'),initial);
  write(path.join(runtime,'resources-initial.json'),baseline);
  assert.equal(result.status,1);
  assert.equal(destinationCreatedByPreparedCommand,false);
  const combined=(result.stdout??'')+(result.stderr??'');
  assert.ok(combined.includes("path.basename(runtime).startsWith('revisao-plataformas-docker-')"),'Expected exact first failure, no reinterpretation');
  assert.equal(fs.existsSync(path.join(runtime,'candidate')),false);
  assert.equal(fs.existsSync(path.join(runtime,'windows-expanded')),false);
  const {sanitizeText}=await import(pathToFileURL(path.join(root,'.github/scripts/sanitize.mjs')));
  fs.writeFileSync(path.join(evidence,'FALHA-PREPARO.log'),sanitizeText(combined),{flag:'wx'});
  write(path.join(evidence,'EXECUCAO.json'),{...invocation,classification:'harness/preparation path contract',status:'blocked before source export',label:'Expanded local do recorte autorizado pela DEC-ZOOM-05',actualProductTests:0,actualJavaClasses:0,actualRf15Journeys:0,actualFinancialJourneys:0,artifact:null,retries:0,subsequentGates:'not reached; no CI runner result.json exists',currentDaemonCheck:'passed; dynamic preflight not reached',privateRuntime:runtime,originalLogs:['preparation.stdout.log','preparation.stderr.log'].map(f=>({path:path.join(runtime,f),sha256:hash(path.join(runtime,f))})),proposedPatch:'CORRECAO-PROPOSTA.patch; not applied or executed'});
  const oldLine="assert.ok(path.basename(runtime).startsWith('revisao-plataformas-docker-'));";
  const newLine="assert.ok(['revisao-plataformas-docker-','expanded-local-'].some(prefix=>path.basename(runtime).startsWith(prefix)));";
  const patch='diff --git a/tasks/evidencias/revisao-expanded-plataformas-docker/preparar-proxima.mjs b/tasks/evidencias/revisao-expanded-plataformas-docker/preparar-proxima.mjs\n--- a/tasks/evidencias/revisao-expanded-plataformas-docker/preparar-proxima.mjs\n+++ b/tasks/evidencias/revisao-expanded-plataformas-docker/preparar-proxima.mjs\n@@ -2,3 +2,3 @@\n const root=path.resolve(import.meta.dirname,\'../../..\'),runtime=path.resolve(process.argv[2]);\n-'+oldLine+'\n+'+newLine+'\n assert.ok(!fs.existsSync(runtime),\'Runtime must be new\');\n';
  fs.writeFileSync(path.join(evidence,'CORRECAO-PROPOSTA.patch'),patch,{flag:'wx'});
  console.log(JSON.stringify({exit:result.status,firstFailure:'prepared runtime basename refuses expanded-local-*',runnerStarted:false,productTests:0,javaPlanned:116,common:115,windowsOnly:native.selected,rf15Planned:23,patchApplied:false,privateRuntime:runtime}));
}
