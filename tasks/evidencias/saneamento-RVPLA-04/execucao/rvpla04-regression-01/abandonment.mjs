import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import crypto from'node:crypto';import net from'node:net';
import{spawn,execFileSync}from'node:child_process';import{fileURLToPath}from'node:url';
const root=path.resolve(process.argv[2]),runner=path.resolve(process.argv[3]??'tasks/evidencias/preparacao-local-adocao/counterproofs.mjs'),mode=process.argv[4]??'corrected';
if(!root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla04-')))throw Error('New RVPLA03 runtime required');fs.mkdirSync(root);
const here='C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro/tasks/evidencias/saneamento-RVPLA-03',ps=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
const native=path.resolve('.github/scripts/owned-job-probe.ps1'),image='sha256:'+'0'.repeat(64),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const input='controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/migration/LegacyPreflight.java',base=fs.readFileSync(input),original=sha(base);
const classes=path.join(root,'classes');fs.mkdirSync(classes);execFileSync(path.join(process.env.JAVA_HOME,'bin/javac.exe'),['-d',classes,path.join(here,'OwnedTree.java')]);
const env={...process.env,RVPLA03_CLASSES:classes};const results=[];
function query(config){return JSON.parse(execFileSync(ps,['-NoProfile','-NonInteractive','-File',native,'-Configuration',Buffer.from(JSON.stringify(config)).toString('base64')],{encoding:'utf8',windowsHide:true}));}
const identity=pid=>query({mode:'identity',pid});
async function waitFile(file){const deadline=Date.now()+20000;while(!fs.existsSync(file)){if(Date.now()>deadline)throw Error('Missing causal barrier: '+file);await new Promise(r=>setTimeout(r,25));}return JSON.parse(fs.readFileSync(file));}
async function exit(child){if(child.exitCode!==null||child.signalCode!==null)return child.exitCode;return await Promise.race([child.done,new Promise((_,reject)=>setTimeout(()=>reject(Error('Owned process did not exit')),20000).unref())]);}
function start(dir,resume=false,entry=runner){const out=fs.openSync(path.join(dir,resume?'resume.log':'first.log'),'wx');const child=spawn(process.execPath,[entry,dir,image,...(resume?['resume']:[]),'only=preflight-hides-missing-constraint'],{env,cwd:process.cwd(),windowsHide:true,stdio:['ignore',out,out]});fs.closeSync(out);child.done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});fs.writeFileSync(path.join(dir,'owner.pid'),String(child.pid));return child;}
function setup(name,toolMode){const dir=path.join(root,name);fs.mkdirSync(path.join(dir,'checkout',path.dirname(input)),{recursive:true});fs.writeFileSync(path.join(dir,'checkout',input),base);fs.writeFileSync(path.join(dir,'inputs.json'),JSON.stringify({commit:'9bed5e20f2cc46e4c7ae721ff2390054eb6db141',inputs:[{file:input,sha256:original}]}));fs.copyFileSync(path.join(here,'tool-fixture.ps1'),path.join(dir,'tool.ps1'));fs.writeFileSync(path.join(dir,'checkout/controle-financeiro-backend/mvnw.cmd'),'@echo off\r\npowershell.exe -NoProfile -NonInteractive -File "'+path.join(dir,'tool.ps1')+'" -Root "'+dir+'" -Mode '+toolMode+'\r\nexit /b %ERRORLEVEL%\r\n');return dir;}
function checkpoints(dir){return fs.readdirSync(path.join(dir,'counterproofs/v2/preflight-hides-missing-constraint')).sort().map(n=>JSON.parse(fs.readFileSync(path.join(dir,'counterproofs/v2/preflight-hides-missing-constraint',n,'checkpoint.json'))));}
function records(dir){return fs.readdirSync(path.join(dir,'.owned-runs')).filter(n=>n.startsWith('run-')).map(n=>JSON.parse(Buffer.from(JSON.parse(fs.readFileSync(path.join(dir,'.owned-runs',n))).payload,'base64')));}
function closed(record){return query({mode:'closed',jobName:record.jobName});}
function stop(item){execFileSync(ps,['-NoProfile','-NonInteractive','-File',path.join(here,'stop-own.ps1'),'-OwnedPid',String(item.pid),'-ExpectedTicks',String(item.ticks)],{windowsHide:true,stdio:'pipe'});}
async function killOwner(child){const own=identity(child.pid);stop(own);await exit(child);return own;}
async function reuse(port){const server=net.createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});await new Promise(r=>server.close(r));}
async function interrupted(name,stage){
 const dir=setup(name,stage);let a,b,late,desc,foreign,c;let foreignInfo;
 try{
  if(stage==='before'&&mode==='corrected'){
   const foreignRoot=path.join(root,'foreign');fs.mkdirSync(foreignRoot);foreign=spawn(path.join(process.env.JAVA_HOME,'bin/java.exe'),['-cp',classes,'OwnedTree',foreignRoot,'foreign'],{windowsHide:true,stdio:'ignore'});foreign.done=new Promise(r=>foreign.once('close',r));foreignInfo=await waitFile(path.join(foreignRoot,'foreign.json'));
   const other=setup('other-legitimate','before');c=start(other);await waitFile(path.join(other,'wrapper.json'));
  }
  a=start(dir);const wrapper=await waitFile(path.join(dir,'wrapper.json'));assert.notEqual(sha(fs.readFileSync(path.join(dir,'checkout',input))),original);
  if(stage==='after'){late=await waitFile(path.join(dir,'child.json'));desc=await waitFile(path.join(dir,'descendant.json'));late.identity=identity(late.pid);desc.identity=identity(desc.pid);}
  const owner=await killOwner(a);a=null;
  b=start(dir,true);assert.equal(await exit(b),1);b=null;
  assert.equal(sha(fs.readFileSync(path.join(dir,'checkout',input))),original);assert.equal(checkpoints(dir).at(-1).state,'failed');
  fs.writeFileSync(path.join(dir,'release-first'),'after-resume');
  if(mode==='mutant'){
   late=await waitFile(path.join(dir,'late.json'));late.identity=identity(late.pid);assert.ok(fs.existsSync(path.join(dir,'late-effect.txt')));
   results.push({name,oldWrapperSurvived:true,lateJavaAfterResume:true,wrapper,owner,late});
  }else{
   const runs=records(dir);for(const r of runs)assert.equal(closed(r).absent,true);
   assert.equal(fs.existsSync(path.join(dir,'late-effect.txt')),false);assert.equal(checkpoints(dir).length,2);
   if(late){await reuse(late.port);await reuse(desc.port);}
   if(foreign){assert.equal(foreign.exitCode,null);assert.ok(identity(foreignInfo.pid));assert.equal(c.exitCode,null);fs.writeFileSync(path.join(root,'foreign/stop-java'),'done');await exit(foreign);foreign=null;fs.writeFileSync(path.join(root,'other-legitimate/stop-java'),'done');fs.writeFileSync(path.join(root,'other-legitimate/release-first'),'done');await exit(c);c=null;}
   results.push({name,owner,wrapper,child:late,descendant:desc,jobNames:runs.map(r=>r.jobName),jobsAbsent:true,noLateJavaAfterResume:true,foreignAndOtherExecutionPreserved:stage==='before',unusedSocketsReused:!!late});
  }
 }finally{
  if(mode==='mutant'&&late?.identity){stop(late.identity);}
  for(const child of [a,b,c,foreign])if(child&&child.exitCode===null&&child.signalCode===null){try{await killOwner(child);}catch{ /* Main assertions retain the failure; known helper only. */ }}
 }
}
try{
 if(mode==='mutant'||mode==='control')await interrupted('late-wrapper','before');
 else{
  await interrupted('before-java','before');await interrupted('after-java-descendant','after');
  const normal=setup('normal','normal'),n=start(normal);assert.equal(await exit(n),1);assert.equal(checkpoints(normal)[0].state,'failed');assert.equal(checkpoints(normal)[0].environmentVerified,true);for(const r of records(normal))closed(r);results.push({name:'normal',closed:true,cleanupNotProofCompletion:true});
  const partial=setup('partial-cleanup','partial'),p=start(partial);await waitFile(path.join(partial,'extra.json'));assert.equal(await exit(p),1);assert.equal(checkpoints(partial)[0].state,'restoration-pending');assert.notEqual(sha(fs.readFileSync(path.join(partial,'checkout',input))),original);for(const r of records(partial))closed(r);
  const again=start(partial,true);assert.equal(await exit(again),1);fs.writeFileSync(path.join(partial,'release-first'),'after-safe-resume');assert.equal(sha(fs.readFileSync(path.join(partial,'checkout',input))),original);assert.equal(fs.existsSync(path.join(partial,'late-effect.txt')),false);results.push({name:'partial-cleanup',blockedBeforeRestore:true,restoredOnlyAfterJobAbsent:true});
  const legacy=setup('legacy','normal');fs.mkdirSync(path.join(legacy,'counterproofs'));fs.writeFileSync(path.join(legacy,'counterproofs/results.json'),'[{"status":1}]');const l=start(legacy,true);assert.equal(await exit(l),1);assert.equal(fs.existsSync(path.join(legacy,'wrapper.json')),false);results.push({name:'legacy',blocked:true});
 }
}finally{fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({mode,results},null,2)+'\n');}
console.log(JSON.stringify({mode,cases:results.length,passed:true}));
