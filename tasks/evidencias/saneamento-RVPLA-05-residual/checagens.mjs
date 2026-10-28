import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawn,spawnSync,execFileSync} from 'node:child_process';

const root=path.resolve(process.argv[2]),scope=process.argv[3]??'environment';
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-')));
assert.equal(fs.existsSync(root),false);fs.mkdirSync(root);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const source='tasks/evidencias/preparacao-local-adocao/',input='controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/migration/LegacyPreflight.java';
const bytes=fs.readFileSync(input),originalHash=sha(bytes),results=[];
const modules=['.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1','.github/scripts/owned-job-probe.ps1','.github/scripts/owned-command.mjs',...['counterproofs.mjs','counterproof-supervision.mjs','counterproof-checkpoint.mjs','counterproof-observation.mjs'].map(f=>source+f)];
const java=path.join(process.env.JAVA_HOME,'bin/java.exe'),javac=path.join(process.env.JAVA_HOME,'bin/javac.exe');
const javaSource=path.join(root,'GuardJava.java');
fs.writeFileSync(javaSource,'import java.nio.file.*;class GuardJava{public static void main(String[]a)throws Exception{Path r=Path.of(a[0]);Files.writeString(r.resolve("java-ready"),Long.toString(ProcessHandle.current().pid()));while(!Files.exists(r.resolve("release-java")))Thread.sleep(25);}}');
execFileSync(javac,['-d',root,javaSource]);
const ps=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
const identity=pid=>JSON.parse(execFileSync(ps,['-NoProfile','-NonInteractive','-File',path.resolve('.github/scripts/owned-job-probe.ps1'),'-Configuration',Buffer.from(JSON.stringify({mode:'identity',pid})).toString('base64')],{encoding:'utf8',windowsHide:true}));
async function barrier(file){const end=Date.now()+20000;while(!fs.existsSync(file)){if(Date.now()>end)throw Error('Missing test barrier '+file);await new Promise(r=>setTimeout(r,25));}}
const oracle=path.join(root,'expected.mjs');
fs.writeFileSync(oracle,"import fs from'node:fs';import assert from'node:assert/strict';const r=JSON.parse(fs.readFileSync(process.argv[2]));assert.equal(r.mavenCalled,false,'ENVIRONMENT_GUARD_ALLOWED_EFFECT');assert.equal(r.inputIsOriginal,true);assert.equal(r.attemptCount,0);\n");
const environmentCases=[
  {name:'active-container',kind:'docker-active'},
  {name:'docker-error',kind:'docker-error',resume:true},
  {name:'java-active',kind:'java'},
  {name:'cim-error',kind:'cim-error'},
  {name:'mutant-docker-check-removed',kind:'docker-active',mutant:'docker'},
  {name:'mutant-java-check-removed',kind:'java',mutant:'java'},
];
assert.ok(['environment','fence'].includes(scope));
const cases=scope==='environment'?environmentCases:[
  {name:'unmanaged-worker-child',kind:'unmanaged'},
  {name:'mutant-last-fence-removed',kind:'unmanaged',mutant:'fence'},
];
for(const spec of cases) {
  const dir=path.join(root,spec.name),snapshot=path.join(dir,'snapshot');fs.mkdirSync(dir);
  for(const file of modules){const to=path.join(snapshot,file);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(file,to);}
  const runner=path.join(snapshot,source+'counterproofs.mjs'),before=fs.readFileSync(runner);let candidate=before.toString();
  const broker=path.join(snapshot,source+'counterproof-supervision.mjs'),brokerBefore=fs.readFileSync(broker);let brokerCandidate=brokerBefore.toString();
  if(spec.kind==='cim-error')candidate=candidate.replace('Get-CimInstance Win32_Process -ErrorAction Stop','Get-CimInstance RVPLA05ResidualMissingClass -ErrorAction Stop');
  if(spec.mutant==='docker')candidate=candidate.replace("if ($LASTEXITCODE -ne 0 -or $taskDockerText) { throw 'API containers may still be active or inspection failed' }; ",'');
  if(spec.mutant==='java')candidate=candidate.replace('if ($taskFound.Count -gt 0) { exit 3 }','');
  if(spec.kind==='unmanaged')candidate=candidate.replace('await superviseCounterproof(execution);',"await superviseCounterproof(execution);\nimport {spawn as testSpawn} from 'node:child_process';\nconst testUnmanaged=testSpawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});fs.writeFileSync(path.join(execution,'unmanaged-child.pid'),String(testUnmanaged.pid));");
  if(spec.mutant==='fence'){brokerCandidate=brokerCandidate.replace('    boundary(check.workerPid);','    // isolated counterproof: final pre-command fence omitted');assert.notEqual(brokerCandidate,brokerBefore.toString());}
  if(spec.kind==='cim-error'||spec.mutant)assert.notEqual(candidate,before.toString());
  const file=path.join(dir,'checkout',input);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);
  fs.writeFileSync(path.join(dir,'inputs.json'),JSON.stringify({commit:'acaa6ed9374f8c9a205d92955f0f4f946b17aa8a',inputs:[{file:input,sha256:originalHash}]}));
  fs.writeFileSync(path.join(dir,'checkout/controle-financeiro-backend/mvnw.cmd'),'@echo off\r\necho effect>"'+path.join(dir,'maven-called')+'"\r\nexit /b 42\r\n');
  const bin=path.join(dir,'bin');fs.mkdirSync(bin);const fakeDocker=path.join(bin,'docker.cmd');
  function docker(mode){fs.writeFileSync(fakeDocker,'@echo off\r\necho called>>"'+path.join(dir,'docker-called')+'"\r\n'+(mode==='docker-active'?'echo synthetic-active-api-id\r\n':'')+'exit /b '+(mode==='docker-error'?7:0)+'\r\n');}
  docker(spec.kind);
  const env={...process.env,PATH:bin+path.delimiter+process.env.PATH};let foreign,done,foreignIdentity;
  function run(name,resume=false){const fd=fs.openSync(path.join(dir,name+'.log'),'wx');try{return spawnSync(process.execPath,[runner,dir,'sha256:'+'0'.repeat(64),...(resume?['resume']:[]),'only=preflight-hides-missing-constraint'],{env,windowsHide:true,stdio:['ignore',fd,fd]}).status;}finally{fs.closeSync(fd);}}
  let record;
  try {
    fs.writeFileSync(runner,candidate);
    fs.writeFileSync(broker,brokerCandidate);
    if(spec.kind==='java'){
      foreign=spawn(java,['-cp',root,'GuardJava',dir],{windowsHide:true,stdio:'ignore'});done=new Promise(r=>foreign.once('close',r));
      await barrier(path.join(dir,'java-ready'));foreignIdentity=identity(foreign.pid);
    }
    const status=run('first');assert.equal(status,1);
    const dockerCalled=fs.existsSync(path.join(dir,'docker-called'));
    if(spec.kind==='unmanaged'&&!spec.mutant)assert.equal(dockerCalled,false,'Fresh boundary must reject BEFORE checker launch');
    else assert.equal(dockerCalled,true,'Checker must reach synthetic Docker');
    const attempts=path.join(dir,'counterproofs/v2/preflight-hides-missing-constraint');
    const observed={status,dockerCalled,mavenCalled:fs.existsSync(path.join(dir,'maven-called')),inputIsOriginal:sha(fs.readFileSync(file))===originalHash,attemptCount:fs.existsSync(attempts)?fs.readdirSync(attempts).length:0};
    const resultFile=path.join(dir,'observed.json');fs.writeFileSync(resultFile,JSON.stringify(observed));
    const expected=spawnSync(process.execPath,[oracle,resultFile],{encoding:'utf8'});fs.writeFileSync(path.join(dir,'oracle.log'),expected.stdout+expected.stderr);
    assert.equal(expected.status,spec.mutant?1:0);
    if(spec.mutant)assert.match(expected.stderr,/ENVIRONMENT_GUARD_ALLOWED_EFFECT/);
    if(foreign){assert.equal(foreign.exitCode,null);assert.deepEqual(identity(foreign.pid),foreignIdentity);}
    record={...spec,...observed,oracleExit:expected.status,sourceBefore:sha(before),sourceExecuted:sha(candidate),brokerBefore:sha(brokerBefore),brokerExecuted:sha(brokerCandidate),foreignIdentity};
    if(spec.resume){
      docker('empty');assert.equal(run('resume',true),1);assert.ok(fs.existsSync(path.join(dir,'maven-called')));
      const names=fs.readdirSync(attempts);assert.deepEqual(names,['0001']);const cp=JSON.parse(fs.readFileSync(path.join(attempts,'0001/checkpoint.json')));
      assert.equal(cp.state,'failed');assert.equal(cp.restorationVerified,true);assert.equal(cp.environmentVerified,true);assert.equal(sha(fs.readFileSync(file)),originalHash);
      record.reexecution={attempts:1,state:cp.state,effectReexecuted:true,skipped:false,restored:true};
    }
  }finally{
    if(foreign){fs.writeFileSync(path.join(dir,'release-java'),'test owns lifecycle');assert.equal(await done,0);}
    fs.writeFileSync(runner,before);assert.equal(sha(fs.readFileSync(runner)),sha(before));
    fs.writeFileSync(broker,brokerBefore);assert.equal(sha(fs.readFileSync(broker)),sha(brokerBefore));
  }
  record.sourceRestored=sha(fs.readFileSync(runner));results.push(record);
  record.brokerRestored=sha(fs.readFileSync(broker));
  fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify({name:spec.name,oracleExit:record.oracleExit,mavenCalled:record.mavenCalled,reexecution:record.reexecution}));
}
