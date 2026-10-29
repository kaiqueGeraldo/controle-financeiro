import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {snapshot,sourceFor} from '../../../.github/scripts/source.mjs';
import {backendSelection} from '../../../.github/scripts/suites.mjs';

const repo=process.cwd(),out=import.meta.dirname,runtime=path.resolve(process.argv[2]??'');
const candidate='193916a1778f1322f5368f66d30a83286766b147',base='434e293f76c3b6ff345fe03f2091149291316aac';
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(runtime).startsWith('revalidacao-cpa01-'));
assert.ok(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024}).trim();
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const steps=[];
function run(label,executable,args,options={}){
 const started=Date.now(),r=spawnSync(executable,args,{encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,cwd:repo,...options});
 const log=path.join(runtime,label+'.log');fs.writeFileSync(log,(r.stdout??'')+(r.stderr??'')+(r.error?.message??''),{flag:'wx'});
 const step={label,executable,args,exit:r.status,durationMs:Date.now()-started,log,sha256:hash(log)};steps.push(step);return step;
}
const success=(...args)=>{const r=run(...args);assert.equal(r.exit,0,r.label+'; see '+r.log);return r;};
let result;
try{
 assert.equal(git('rev-parse','HEAD'),candidate);
 const tmp=path.join(runtime,'tmp');fs.mkdirSync(tmp);
 const env={...process.env,TEMP:tmp,TMP:tmp,CPA_REVIEW_RUNTIME:runtime};
 const checkout=path.join(runtime,'checkout');fs.mkdirSync(checkout);
 const files=git('ls-files','.github','controle-financeiro-backend').split('\n').filter(Boolean);
 for(const file of files){assert.ok(!/(^|\/)(target|node_modules|\.git|\.env)(\/|$)/.test(file));const dest=path.join(checkout,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);assert.equal(hash(file),hash(dest));}
 const source=snapshot(checkout,{commit:candidate,branch:git('branch','--show-current'),originalTreeChanges:['M README.md (excluded)'],export:'Independent CPA-01 review; committed candidate inputs only; no package build'});
 success('candidate-contracts',process.execPath,['--test','.github/scripts/ci.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs'],{cwd:checkout,env});
 success('independent-contracts',process.execPath,['--test',path.join(out,'independentes.test.mjs')],{env});

 // Identity oracle predates the platform change; the fixed selector cannot
 // derive its own expected omission. Java source paths did not change.
 const oldSelector=path.join(runtime,'baseline-suites.mjs');fs.writeFileSync(oldSelector,execFileSync('git',['show',base+':.github/scripts/suites.mjs']));
 const baseline=await import(pathToFileURL(oldSelector));
 const expected={},observed={},windows='com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest';
 for(const suite of ['smoke','expanded']){
  expected[suite]=baseline.backendSelection(checkout,suite).selected;
  const linux=backendSelection(checkout,suite,'linux'),win=backendSelection(checkout,suite,'win32','platform-only'),allWin=backendSelection(checkout,suite,'win32');
  assert.equal(expected[suite].length,suite==='smoke'?101:116);
  assert.deepEqual(win.selected,[windows]);assert.deepEqual(linux.selected,expected[suite].filter(n=>n!==windows));
  const union=[...linux.selected,...win.selected].sort();assert.equal(new Set(union).size,union.length);assert.deepEqual(union,expected[suite]);assert.deepEqual(allWin.selected,expected[suite]);
  observed[suite]={linux,windows:win,union,missing:[],duplicates:[]};
 }
 const historical=expected.expanded.filter(n=>!expected.smoke.includes(n));assert.equal(historical.length,15);
 assert.deepEqual(observed.expanded.linux.selected.filter(n=>!observed.smoke.linux.selected.includes(n)),historical);
 const sourceDelta=git('diff','--name-status',base,candidate,'--','controle-financeiro-backend/src/test/java');assert.equal(sourceDelta.split('\n').length,1);
 save('identidades.json',{at:new Date().toISOString(),candidate,baseline:base,baselineSelectorSha256:hash(oldSelector),oracle:'Original pre-fix selector over unchanged source paths; compare full identities, plus independent arbitrary-class fixtures',sourceDelta,expected,observed,historical});
 fs.writeFileSync(path.join(runtime,'expected-identities.json'),JSON.stringify(expected));
 const oracle=path.join(runtime,'identity-oracle.mjs');
 fs.writeFileSync(oracle,`import fs from 'node:fs';import assert from 'node:assert/strict';import{backendSelection}from ${JSON.stringify(pathToFileURL(path.join(checkout,'.github/scripts/suites.mjs')).href)};const expected=JSON.parse(fs.readFileSync(${JSON.stringify(path.join(runtime,'expected-identities.json'))}));for(const suite of ['smoke','expanded']){const a=backendSelection(${JSON.stringify(checkout)},suite,'linux').selected,b=backendSelection(${JSON.stringify(checkout)},suite,'win32','platform-only').selected;assert.deepEqual([...a,...b].sort(),expected[suite]);}`);
 const selector=path.join(checkout,'.github/scripts/suites.mjs'),original=fs.readFileSync(selector),mutations=[];
 for(const [label,from,to]of [['legacy-selection','if(platform&&platform!==targetPlatform)','if(false&&platform&&platform!==targetPlatform)'],['omitted-identity','selected.push(qualified);',"if(name!=='DateUtilTest')selected.push(qualified);"]]){
  assert.ok(original.toString().includes(from));fs.writeFileSync(selector,original.toString().replace(from,to));
  const mutantSha256=hash(selector),negative=run(label,process.execPath,[oracle],{env});assert.notEqual(negative.exit,0);assert.match(fs.readFileSync(negative.log,'utf8'),/AssertionError/);
  fs.writeFileSync(selector,original);assert.equal(hash(selector),hash(path.join(repo,'.github/scripts/suites.mjs')));
  const positive=success(label+'-restored',process.execPath,[oracle],{env});mutations.push({label,mutantSha256,restoredSha256:hash(selector),negative,positive});
 }
 success('restored-contracts',process.execPath,['--test','.github/scripts/ci.test.mjs','.github/scripts/suites.test.mjs','.github/scripts/sanitize.test.mjs'],{cwd:checkout,env});sourceFor(checkout);

 const require=createRequire(path.join(repo,'controle-financeiro-frontend/package.json'));
 const yaml=require('js-yaml'),workflow=yaml.load(fs.readFileSync('.github/workflows/ci.yml','utf8'));
 const jobs=workflow.jobs;assert.equal(jobs.required.needs,'windows-native');assert.equal(jobs.expanded.needs,'required');assert.equal(jobs['windows-native'].if,undefined);assert.equal(jobs.required.if,undefined);
 assert.equal(jobs['windows-native']['runs-on'],'windows-latest');assert.equal(jobs.required['runs-on'],'ubuntu-latest');
 assert.equal(jobs['windows-native']['continue-on-error'],undefined);assert.ok(!jobs['windows-native'].strategy?.matrix);
 const rows=['success','failure','cancelled','skipped','missing','pending'].map(windowsResult=>{
  const requiredState=windowsResult==='success'?'eligible; still must execute':(['missing','pending'].includes(windowsResult)?'waiting/not executed':'skipped');
  return {windowsResult,requiredState,packageReachable:windowsResult==='success',singleRequiredContextMayAcceptSkipped:requiredState==='skipped',approvedExecutionEvidence:false};
 });
 save('workflow-contrato.json',{at:new Date().toISOString(),candidate,yamlSha256:hash('.github/workflows/ci.yml'),yamlParser:{module:require.resolve('js-yaml'),version:require('js-yaml/package.json').version},events:workflow.on,needs:{required:jobs.required.needs,expanded:jobs.expanded.needs},jobIf:{windows:jobs['windows-native'].if??null,required:jobs.required.if??null},windowsMatrix:null,rows,
  finding:'CPA-01/R1: dependency prevents package execution but required has no non-skippable status aggregation; a failed/skipped Windows job propagates skip instead of a failed required check. Effective remote required contexts are unknown.',
  proofKind:'Local static model of the present no-job-if dependency chain, grounded in official GitHub semantics; no Actions execution.',
  sources:['https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs','https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks']});

 // Re-run the original independent verifier without changing its assertions.
 const legacy=path.join(runtime,'legacy','source');fs.mkdirSync(legacy,{recursive:true});
 const legacyFiles=git('ls-tree','-r','--name-only',base,'--','.github/scripts','controle-financeiro-backend/src/test/java').split('\n').filter(Boolean);
 const proofFiles=['tasks/evidencias/consolidacao-pre-adocao/verificar.mjs','tasks/evidencias/consolidacao-pre-adocao/CondicaoLinux.java','tasks/evidencias/investigacao-startup-HQL/jfr-stream.mjs','tasks/evidencias/investigacao-startup-HQL/jfr-stream.test.mjs'];
 const legacyInputs=[];
 for(const file of [...legacyFiles,...proofFiles]){const dest=path.join(legacy,file);fs.mkdirSync(path.dirname(dest),{recursive:true});const bytes=proofFiles.includes(file)?fs.readFileSync(file):execFileSync('git',['show',base+':'+file]);fs.writeFileSync(dest,bytes);legacyInputs.push({file,sha256:hash(dest)});}
 fs.mkdirSync(path.join(legacy,'controle-financeiro-backend/target'),{recursive:true});fs.symlinkSync(path.join(repo,'controle-financeiro-backend/target/temurin21'),path.join(legacy,'controle-financeiro-backend/target/temurin21'),'junction');
 const legacyRuntime=path.join(runtime,'legacy/controle-financeiro-runtimes/preparacao-adocao/consolidacao-original');
 success('original-independent-reproduction',process.execPath,['tasks/evidencias/consolidacao-pre-adocao/verificar.mjs',legacyRuntime],{cwd:legacy,env:{...env,GIT_DIR:path.join(repo,'.git'),GIT_WORK_TREE:repo}});
 const originalResult=JSON.parse(fs.readFileSync(path.join(legacy,'tasks/evidencias/consolidacao-pre-adocao/verificacoes.json')));assert.equal(originalResult.condition.counts.skipped,1);
 save('reproducao-original.json',{at:new Date().toISOString(),legacySourceBase:base,originalVerifierAndAssertionsUnchanged:true,inputs:legacyInputs,scope:'Original selection plus simulated Linux condition on a real Windows JVM; not real Linux or remote CI',result:originalResult});

 const jdk=path.join(repo,'controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
 const windowsOut=path.join(runtime,'windows-native');
 success('windows-native',process.execPath,[path.join(checkout,'.github/scripts/ci.mjs'),'windows-native',checkout,windowsOut],{env:{...env,JAVA_HOME:jdk,PATH:path.join(jdk,'bin')+path.delimiter+process.env.PATH}});
 success('windows-collect',process.execPath,[path.join(checkout,'.github/scripts/publish-evidence.mjs'),windowsOut],{env});
 const windowsResult=JSON.parse(fs.readFileSync(path.join(windowsOut,'result.json')));
 assert.equal(windowsResult.status,'passed');assert.deepEqual(windowsResult.backend,{tests:1,failures:0,errors:0,skipped:0});
 assert.deepEqual(windowsResult.selection.selected,[windows]);
 const xml=path.join(windowsOut,'surefire/TEST-'+windows+'.xml');assert.ok(fs.readFileSync(xml,'utf8').includes('liveOwnedListenerCannotBeCertifiedReleasedOrTerminated'));
 assert.equal(fs.readdirSync(path.join(checkout,'controle-financeiro-backend/target')).filter(f=>f.endsWith('.jar')).length,0);sourceFor(checkout);
 result={at:new Date().toISOString(),candidate,runtime,controller:{platform:process.platform,node:process.version},sourceDigest:source.digest,sourceInputs:source.files.length,sourceManifest:path.join(checkout,'.ci-source.json'),sourceManifestSha256:hash(path.join(checkout,'.ci-source.json')),steps,mutations,windows:{counts:windowsResult.backend,resultSourceDigest:windowsResult.source.digest,privateXml:xml,privateXmlSha256:hash(xml)},originalSimulationReproduced:true,codeRestored:true,noNewJar:true,remoteActions:false,verdict:'Original selection defect resolved; workflow status aggregation residual CPA-01/R1 remains'};
 fs.copyFileSync(path.join(windowsOut,'public/result.json'),path.join(out,'windows-result.json'),fs.constants.COPYFILE_EXCL);
 for(const label of ['candidate-contracts','independent-contracts','restored-contracts'])fs.copyFileSync(path.join(runtime,label+'.log'),path.join(out,label+'.log'),fs.constants.COPYFILE_EXCL);
 save('execucoes-windows.json',result);console.log(JSON.stringify({windows:result.windows.counts,sourceInputs:source.files.length,mutations:mutations.length,workflowResidual:'CPA-01/R1',runtime}));
}catch(error){save('ocorrencia-execucao.json',{at:new Date().toISOString(),runtime,steps,error:error.message});throw error;}
