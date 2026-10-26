import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {snapshot,hash,writeJson} from '../../../.github/scripts/source.mjs';
const root=path.resolve(process.argv[2]);assert(root.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(root));fs.mkdirSync(root);
const scripts=path.join(root,'scripts');fs.cpSync('.github/scripts',scripts,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p));
const pause=()=>new Promise(r=>setTimeout(r,25));
async function until(fn,label,timeout=15000){const end=Date.now()+timeout;while(!fn()){if(Date.now()>end)throw new Error('Deadline: '+label);await pause();}}
const run=args=>{const p=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true});return {exit:p.status,stdout:p.stdout,stderr:p.stderr};};
const actor=`import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';const dir=process.env.PROBE_DIR,role=process.argv[2],start=Date.now();if(role==='child')spawn(process.execPath,[import.meta.filename,'descendant'],{env:process.env,stdio:'inherit'});fs.writeFileSync(path.join(dir,role+'.ready'),JSON.stringify({pid:process.pid,parent:process.ppid,start}));const timer=setInterval(()=>fs.writeFileSync(path.join(dir,role+'.beat'),String(Date.now())),50);setTimeout(()=>{fs.writeFileSync(path.join(dir,role+'.natural'),'expired');clearInterval(timer);},45000);process.on('message',()=>process.exit(0));`;
// Retain process handles before the action, avoiding PID-reuse inference.
const observer=path.join(root,'observer.ps1');fs.writeFileSync(observer,`param([string]$Config)
$ErrorActionPreference='Stop'
$c=Get-Content -Raw -LiteralPath $Config | ConvertFrom-Json
$owned=@();foreach($idValue in $c.ids){$p=Get-Process -Id $idValue;[void]$p.Handle;$owned+=@{id=$idValue;process=$p}}
Set-Content -LiteralPath $c.ready -Value ready
$rows=@();foreach($p in $owned){$ended=$p.process.WaitForExit(5000);$rows+=@{pid=$p.id;ended=$ended;exit=if($ended){$p.process.ExitCode}else{259}}}
ConvertTo-Json -InputObject @($rows) | Set-Content -LiteralPath $c.output
`);
const results=[];
for(const mode of ['uuid','abrupt']){
 const dir=path.join(root,mode),front=path.join(dir,'checkout/controle-financeiro-frontend');fs.mkdirSync(front,{recursive:true});
 writeJson(path.join(front,'package.json'),{name:'independent-owned-tree',version:'1.0.0',scripts:{lint:'node actor.mjs child',typecheck:'node next.mjs'}});writeJson(path.join(front,'package-lock.json'),{name:'independent-owned-tree',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'independent-owned-tree',version:'1.0.0'}}});fs.writeFileSync(path.join(front,'actor.mjs'),actor);fs.writeFileSync(path.join(front,'next.mjs'),`import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(path.join(dir,'NEXT'))},'forbidden');`);
 const checkout=path.dirname(front);snapshot(checkout,{commit:'independent-uuid-tree',originalTreeChanges:[]});const out=path.join(dir,'output');
 const unrelated=spawn(process.execPath,[path.join(front,'actor.mjs'),'unrelated'],{env:{...process.env,PROBE_DIR:dir},windowsHide:true,stdio:['ignore','ignore','ignore','ipc']});const unrelatedExit=new Promise(r=>unrelated.once('exit',r));
 const runner=spawn(process.execPath,[path.join(scripts,'ci.mjs'),'all',checkout,out],{env:{...process.env,PROBE_DIR:dir,npm_config_offline:'true',npm_config_cache:path.join(root,'npm-cache')},windowsHide:true});let stdout='',stderr='';runner.stdout.on('data',d=>stdout+=d);runner.stderr.on('data',d=>stderr+=d);const exited=new Promise(r=>runner.once('exit',(code,signal)=>r({code,signal})));
 try{
  await until(()=>['child','descendant','unrelated'].every(r=>fs.existsSync(path.join(dir,r+'.ready'))),'all actors ready',25000);
  const identities=['child','descendant'].map(role=>({role,...read(path.join(dir,role+'.ready'))}));assert.equal(identities[1].parent,identities[0].pid);
  const control=read(path.join(out,'control.json'));let wrongUuid;
  if(mode==='uuid'){
   const before=Number(fs.readFileSync(path.join(dir,'child.beat')));writeJson(path.join(out,'cancel.request.json'),{runId:'00000000-0000-4000-8000-000000000000'});
   await until(()=>Number(fs.readFileSync(path.join(dir,'child.beat')))>before+250,'heartbeat after obsolete UUID');assert.equal(runner.exitCode,null);wrongUuid={ignored:true,actualRunId:control.runId,requested:'00000000-0000-4000-8000-000000000000'};
  }
  const config={ids:identities.map(i=>i.pid),ready:path.join(dir,'observer.ready'),output:path.join(dir,'observed.json')};writeJson(path.join(dir,'observer.json'),config);
  const witness=spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',observer,'-Config',path.join(dir,'observer.json')],{windowsHide:true});let witnessError='';witness.stderr.on('data',d=>witnessError+=d);const witnessExit=new Promise(r=>witness.once('close',r));await until(()=>fs.existsSync(config.ready),'handles retained');
  const beforeCancel=Date.now();let request;
  if(mode==='uuid'){request=run([path.join(scripts,'cancel.mjs'),out]);assert.equal(request.exit,0);assert.equal(run([path.join(scripts,'cancel.mjs'),out]).exit,0);}else runner.kill('SIGTERM');
  const exit=await exited;assert.equal(await witnessExit,0,witnessError);const observed=read(config.output);assert(observed.every(p=>p.ended));assert(!identities.some(i=>fs.existsSync(path.join(dir,i.role+'.natural'))));assert(!fs.existsSync(path.join(dir,'NEXT')));assert.equal(unrelated.exitCode,null);assert(!fs.existsSync(path.join(dir,'unrelated.natural')));
  let terminal;
  if(mode==='uuid'){assert.equal(exit.code,130);terminal=read(path.join(out,'result.json'));assert.equal(terminal.status,'cancelled');assert.equal(terminal.runId,control.runId);assert(!terminal.artifact);const bytes=fs.readFileSync(path.join(out,'result.json'));const repeat=run([path.join(scripts,'cancel.mjs'),out]);assert.equal(repeat.exit,0);assert.match(repeat.stdout,/already finished/);assert.equal(hash(fs.readFileSync(path.join(out,'result.json'))),hash(bytes));}else assert(!fs.existsSync(path.join(out,'result.json')));
  const collected=run([path.join(scripts,'publish-evidence.mjs'),out]);assert.equal(collected.exit,0);const collection=read(path.join(out,'public/collection.json'));if(mode==='abrupt')assert.match(collection.gateResult,/missing; incomplete/);
  unrelated.send('finish');assert.equal(await unrelatedExit,0);
  results.push({mode,identities,control,wrongUuid,exit,observed,elapsedAfterAction:Date.now()-beforeCancel,unrelatedPreserved:true,unrelatedFinalExit:0,naturalExpiration:false,nextGateAbsent:true,terminal,collected,collection,stdout,stderr});
 }finally{if(unrelated.exitCode===null&&unrelated.connected)unrelated.send('finish');if(runner.exitCode===null&&runner.signalCode===null&&fs.existsSync(path.join(out,'control.json')))run([path.join(scripts,'cancel.mjs'),out]);}
}
// Establishment failure must not fall back to an unsupervised child.
const job=path.join(scripts,'owned-process.ps1'),originalJob=fs.readFileSync(job);const anchor='!AssignProcessToJobObject(job,Process.GetCurrentProcess().Handle)';assert(originalJob.includes(anchor));
const {spawnOwned}=await import(pathToFileURL(path.join(scripts,'owned-process.mjs')).href);let failClosed;
try{
 fs.writeFileSync(job,originalJob.toString().replace(anchor,'true'));
 const marker=path.join(root,'UNPROTECTED-CHILD');const child=spawnOwned(process.execPath,['-e',`require('fs').writeFileSync(${JSON.stringify(marker)},'started')`],{cwd:root,env:process.env,windowsHide:true});let stderr='';child.stderr.on('data',d=>stderr+=d);const exit=await new Promise(r=>child.once('close',r));assert.notEqual(exit,0);assert(!fs.existsSync(marker));assert.match(stderr,/Cannot establish owned Windows job/);failClosed={exit,childNotStarted:true,error:'Cannot establish owned Windows job'};
}finally{fs.writeFileSync(job,originalJob);assert.equal(hash(fs.readFileSync(job)),hash(originalJob));}
const nonexistent=run([path.join(scripts,'cancel.mjs'),path.join(root,'nonexistent')]);assert.notEqual(nonexistent.exit,0);assert(!fs.existsSync(path.join(root,'nonexistent')));
writeJson(path.join(import.meta.dirname,'uuid-tree.json'),{at:new Date().toISOString(),runtime:root,results,establishmentFailure:{...failClosed,originalHash:hash(originalJob),restoredHash:hash(fs.readFileSync(job))},nonexistentRequest:{exit:nonexistent.exit,noDirectoryCreated:true},limits:'Windows only; no Ctrl+C, Actions, Linux or Docker cleanup inference'});
console.log('Independent UUID/abrupt child-descendant controls and Job establishment failure passed.');
