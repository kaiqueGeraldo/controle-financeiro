import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync,spawn,spawnSync} from 'node:child_process';
import {snapshot,sourceFor,hash,writeJson} from './source.mjs';
import {requireReportedClasses} from './ci.mjs';
import {collectPublic} from './publish-evidence.mjs';

const [mode,outArg]=process.argv.slice(2),repo=path.resolve(import.meta.dirname,'../..');
const base=path.resolve(repo,'../controle-financeiro-runtimes/CF-034')+path.sep;
const out=path.resolve(outArg??'');
assert(out.startsWith(base),'Use a dedicated external CF-034 runtime');
const sha=file=>hash(fs.readFileSync(file));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,ms,label){const end=Date.now()+ms;while(Date.now()<end){if(check())return;await pause(100);}throw new Error(label);}
function fresh(){assert(!fs.existsSync(out),'Never reuse a probe runtime');fs.mkdirSync(out,{recursive:true});}
function fixture(name,hold=false){
  const root=path.join(out,name),front=path.join(root,'controle-financeiro-frontend');
  fs.mkdirSync(front,{recursive:true});fs.cpSync(path.join(repo,'.github/scripts'),path.join(root,'.github/scripts'),{recursive:true});
  const command=hold?`import fs from 'node:fs';import {spawn} from 'node:child_process';const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});const ready={pid:process.pid,descendantPid:child.pid,started:new Date().toISOString()};fs.writeFileSync(${JSON.stringify(path.join(out,'ready-process.json'))},JSON.stringify(ready));setInterval(()=>fs.writeFileSync(${JSON.stringify(path.join(out,'heartbeat.json'))},JSON.stringify({pid:process.pid,at:Date.now()})),100);process.on('SIGTERM',()=>{child.kill('SIGTERM');process.exit(143)});setTimeout(()=>{child.kill('SIGTERM');process.exit(0)},180000);`:`process.exit(23);`;
  fs.writeFileSync(path.join(front,'probe.mjs'),command);
  writeJson(path.join(front,'package.json'),{name:'cf034-synthetic',version:'1.0.0',private:true,scripts:{lint:'node probe.mjs'}});
  writeJson(path.join(front,'package-lock.json'),{name:'cf034-synthetic',version:'1.0.0',lockfileVersion:3,requires:true,packages:{'':{name:'cf034-synthetic',version:'1.0.0'}}});
  fs.mkdirSync(path.join(root,'controle-financeiro-backend'),{recursive:true});fs.writeFileSync(path.join(root,'controle-financeiro-backend/pom.xml'),'<synthetic-probe/>');
  snapshot(root,{commit:'synthetic-contract-fixture',purpose:hold?'bounded cancellation':'expected failure; never product validation',originalTreeChanges:[]});
  return root;
}
function run(root,stage,destination){
  const child=spawnSync(process.execPath,[path.join(root,'.github/scripts/ci.mjs'),stage,root,destination],{encoding:'utf8',windowsHide:true,env:{...process.env,npm_config_offline:'true',npm_config_update_notifier:'false'},maxBuffer:1024*1024});
  assert.equal(child.error,undefined);
  return {exit:child.status,result:JSON.parse(fs.readFileSync(path.join(destination,'result.json')))};
}
function alive(pid){if(!pid)return false;try{if(process.platform==='linux'&&/\) Z /.test(fs.readFileSync(`/proc/${pid}/stat`,'utf8')))return false;process.kill(pid,0);return true;}catch(error){if(['ESRCH','ENOENT'].includes(error.code))return false;throw error;}}

if(mode==='contracts'){
  fresh();
  const failedRoot=fixture('failed-subprocess'),failed=run(failedRoot,'all',path.join(out,'failed-gate'));
  assert.equal(failed.exit,1);assert.match(failed.result.error,/lint failed/);
  assert.deepEqual(failed.result.steps.map(s=>s.name),['install','lint']);assert.equal(failed.result.artifact,undefined);
  const reports=path.join(out,'missing-report');fs.mkdirSync(reports);fs.writeFileSync(path.join(reports,'TEST-unrelated.xml'),'<testsuite tests="1" failures="0" errors="0" skipped="0"/>');
  assert.throws(()=>requireReportedClasses(reports,['mandatory.ProbeTest']),/Mandatory classes have no report/);
  const root=fixture('tampered-package'),source=sourceFor(root),jar=path.join(root,'controle-financeiro-backend/target/probe.jar');fs.mkdirSync(path.dirname(jar));
  const bytes=Buffer.from('synthetic package bytes; not a Java application');fs.writeFileSync(jar,bytes);const before=sha(jar);
  for(const name of ['frontend','backend','e2e'])writeJson(path.join(root,`.ci-${name}.json`),{status:'passed',source:source.digest,...(name==='backend'?{jar:'probe.jar',jarSha256:before}:{})});
  const changed=Buffer.from(bytes);changed[0]^=1;fs.writeFileSync(jar,changed);let tampered;
  try{tampered=run(root,'package',path.join(out,'tampered-gate'));assert.equal(tampered.exit,1);assert.match(tampered.result.error,/Package changed/);assert.equal(tampered.result.artifact,undefined);}
  finally{fs.writeFileSync(jar,bytes);assert.equal(sha(jar),before);}
  const accepted=path.join(out,'sentinels');fs.mkdirSync(accepted);
  fs.writeFileSync(path.join(accepted,'backend.log'),'diagnostic=keep\n'+JSON.stringify({password:'CF034_SENTINEL_JSON'})+'\nAuthorization: Bearer CF034_SENTINEL_BEARER\nCookie: sid=CF034_SENTINEL_COOKIE\nINFO '+JSON.stringify({message:JSON.stringify({password:'CF034_SENTINEL_ESCAPED'}),diagnostic:'keep'}));
  writeJson(path.join(accepted,'result.json'),{status:'passed',scope:'synthetic sanitizer probe only'});collectPublic(accepted);
  for(const file of fs.readdirSync(path.join(accepted,'public')))assert(!fs.readFileSync(path.join(accepted,'public',file),'utf8').includes('CF034_SENTINEL'));
  const rejected=path.join(out,'ambiguous');fs.mkdirSync(rejected);fs.writeFileSync(path.join(rejected,'backend.log'),"password='prefix CF034_SENTINEL_AMBIGUOUS\ndiagnostic=keep");
  const collect=spawnSync(process.execPath,[path.join(repo,'.github/scripts/publish-evidence.mjs'),rejected],{encoding:'utf8',windowsHide:true});
  assert.equal(collect.status,1);assert(!fs.existsSync(path.join(rejected,'public')));assert(!(collect.stdout+collect.stderr).includes('CF034_SENTINEL'));
  writeJson(path.join(out,'result.json'),{status:'passed',scope:'synthetic expected-failure experiments; not product tests',subprocess:{exit:failed.exit,steps:failed.result.steps.map(s=>({name:s.name,exit:s.exit})),blocked:['backend','e2e','package']},missingReport:{required:'mandatory.ProbeTest',detected:true,mechanism:'real requireReportedClasses validator; not a Maven execution'},tamperedPackage:{exit:tampered.exit,error:tampered.result.error,before,after:sha(jar),restored:true,approvedArtifact:false},sanitization:{formats:['JSON password','opaque Bearer','cookie','prefixed escaped JSON'],downloadCheck:'pending platform download',ambiguous:{exit:collect.status,publicDirectory:false,rawFallback:false,consoleDisclosure:false}},sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim()});
  collectPublic(out);console.log('Synthetic failures detected; downstream publication blocked; controls restored.');
}else if(mode==='start-cancellation'){
  fresh();assert.equal(process.platform,'linux','Cancellation probe is for Actions/Linux');
  const runId=randomUUID(),root=fixture('cancel-fixture',true),evidence=path.join(out,'cancel-gate');
  const child=spawn(process.execPath,[path.join(root,'.github/scripts/ci.mjs'),'all',root,evidence],{detached:true,stdio:'ignore',env:{...process.env,npm_config_offline:'true',npm_config_update_notifier:'false'}});child.unref();
  writeJson(path.join(out,'owner.json'),{runId,runnerPid:child.pid,root,evidence});
  try{
    await until(()=>fs.existsSync(path.join(out,'ready-process.json')),30000,'Synthetic test process did not start');
    const container=execFileSync('docker',['run','--detach','--network','none','--label',`cf034.run=${runId}`,'--tmpfs','/var/lib/postgresql/data','--env','POSTGRES_HOST_AUTH_METHOD=trust','postgres:16-alpine'],{encoding:'utf8'}).trim();
    assert(/^[a-f0-9]{64}$/.test(container));writeJson(path.join(out,'owner.json'),{runId,runnerPid:child.pid,root,evidence,container});
    const deadline=Date.now()+30000;let ready=false;while(Date.now()<deadline){if(spawnSync('docker',['exec',container,'pg_isready','-U','postgres'],{stdio:'ignore'}).status===0){ready=true;break;}await pause(200);}assert(ready,'PostgreSQL readiness failed');
    const processReady=JSON.parse(fs.readFileSync(path.join(out,'ready-process.json')));assert(alive(processReady.pid)&&alive(processReady.descendantPid));
    writeJson(path.join(out,'ready.json'),{runId,...processReady,runnerPid:child.pid,postgres:{container,network:'none',readiness:'pg_isready success',data:'synthetic; tmpfs; no published ports'},nextStep:'bounded hold; externally cancel this workflow run'});console.log('CF034_CANCEL_READY: synthetic runner, child, descendant and isolated PostgreSQL started.');
  }catch(error){console.error('Cancellation preparation failed; cleanup step must run.');throw error;}
}else if(mode==='hold-cancellation'){
  assert(fs.existsSync(path.join(out,'ready.json')));await pause(180000);throw new Error('External cancellation did not occur within the bounded experiment');
}else if(mode==='cleanup-cancellation'){
  const owner=JSON.parse(fs.readFileSync(path.join(out,'owner.json'))),errors=[];
  let result,ready,containerRemoved=false;
  try{
    const control=JSON.parse(fs.readFileSync(path.join(owner.evidence,'control.json')));
    writeJson(path.join(owner.evidence,'cancel.request.json'),{runId:control.runId});
    await until(()=>fs.existsSync(path.join(owner.evidence,'result.json')),15000,'Runner did not acknowledge cancellation');
    result=JSON.parse(fs.readFileSync(path.join(owner.evidence,'result.json')));
    ready=JSON.parse(fs.readFileSync(path.join(out,'ready-process.json')));
    await until(()=>!alive(ready.pid)&&!alive(ready.descendantPid),10000,'Synthetic process tree still alive');
    assert.equal(result.status,'cancelled');assert(!result.steps.some(s=>['backend','e2e'].includes(s.name)));
    assert(!fs.existsSync(path.join(owner.evidence,'package-manifest.json')));
  }catch{errors.push('Process cancellation/blocked-stage contract was not fully observed; inspect platform logs.');}
  // Resource removal is attempted independently even if process observation fails.
  try{
    if(owner.container){
      const label=execFileSync('docker',['inspect','--format','{{ index .Config.Labels "cf034.run" }}',owner.container],{encoding:'utf8'}).trim();assert.equal(label,owner.runId);
      execFileSync('docker',['rm','--force',owner.container],{stdio:'ignore'});
      containerRemoved=spawnSync('docker',['inspect',owner.container],{stdio:'ignore'}).status!==0;assert(containerRemoved);
    }else errors.push('No owned PostgreSQL container was recorded.');
  }catch{errors.push('Owned container cleanup could not be confirmed.');}
  writeJson(path.join(out,'result.json'),{status:errors.length?'failed':'passed',scope:'cleanup observation before runner disposal; platform run conclusion inspected separately',runId:owner.runId,runnerStatus:result?.status??'unobserved',steps:result?.steps.map(s=>s.name)??[],childAlive:ready?alive(ready.pid):null,descendantAlive:ready?alive(ready.descendantPid):null,containerRemoved,approvedArtifact:fs.existsSync(path.join(owner.evidence,'package-manifest.json')),errors,vmDisposal:'not observed; no claim about processes after runner disposal'});collectPublic(out);
  if(errors.length)process.exitCode=1;
  console.log(errors.length?'Cleanup evidence incomplete; no cancellation approval.':'Observed own process termination and container removal; downstream gates and package absent.');
}else throw new Error('contracts|start-cancellation|hold-cancellation|cleanup-cancellation');
