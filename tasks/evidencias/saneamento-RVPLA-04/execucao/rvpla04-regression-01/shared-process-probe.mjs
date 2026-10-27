import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import net from 'node:net';
import {spawn,execFileSync}from'node:child_process';import{spawnOwned}from'../../../.github/scripts/owned-process.mjs';
const root=path.resolve(process.argv[2]),here='C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro/tasks/evidencias/saneamento-RVPLA-03';
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla04-')));
const ps=path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
function identity(pid){return JSON.parse(execFileSync(ps,['-NoProfile','-NonInteractive','-File',path.resolve('.github/scripts/owned-job-probe.ps1'),'-Configuration',Buffer.from(JSON.stringify({mode:'identity',pid})).toString('base64')],{windowsHide:true,encoding:'utf8'}));}
if(process.argv[3]==='worker'){
 const c=spawnOwned(path.join(process.env.JAVA_HOME,'bin/java.exe'),['-cp',path.join(root,'classes'),'OwnedTree',root,'child'],{cwd:process.cwd(),env:process.env});
 c.stdout.resume();c.stderr.resume();fs.writeFileSync(path.join(root,'guardian.json'),JSON.stringify(identity(c.pid)));await new Promise(r=>c.once('close',r));
}else{
 fs.mkdirSync(root);fs.mkdirSync(path.join(root,'classes'));execFileSync(path.join(process.env.JAVA_HOME,'bin/javac.exe'),['-d',path.join(root,'classes'),path.join(here,'OwnedTree.java')]);
 const normal=spawnOwned(process.execPath,['-e','process.stdout.write("NORMAL_OWNED")'],{cwd:process.cwd(),env:process.env});let output='',error='';normal.stdout.on('data',b=>output+=b);normal.stderr.on('data',b=>error+=b);const code=await new Promise(r=>normal.once('close',r));fs.writeFileSync(path.join(root,'normal.json'),JSON.stringify({output,error,code},null,2)+'\n');assert.equal(code,0);assert.equal(output,'NORMAL_OWNED');
 const a=spawn(process.execPath,[import.meta.filename,root,'worker'],{windowsHide:true,stdio:'ignore'});const done=new Promise(r=>a.once('close',r));
 async function barrier(file){const end=Date.now()+20000;while(!fs.existsSync(file)){if(Date.now()>end)throw Error('Missing barrier');await new Promise(r=>setTimeout(r,25));}return JSON.parse(fs.readFileSync(file));}
 const child=await barrier(path.join(root,'child.json')),desc=await barrier(path.join(root,'descendant.json')),guardian=await barrier(path.join(root,'guardian.json')),owner=identity(a.pid),ids=[guardian,identity(child.pid),identity(desc.pid)];
 const ready=path.join(root,'wait-ready.json');
 const script='$ErrorActionPreference="Stop";$all=@('+ids.map(i=>`$p=[Diagnostics.Process]::GetProcessById(${i.pid});$h=$p.Handle;if($p.StartTime.ToUniversalTime().Ticks.ToString() -ne '${i.ticks}'){throw 'Identity mismatch'};$p`).join(';')+`);[IO.File]::WriteAllText('${ready}','{}');foreach($p in $all){if(!$p.WaitForExit(20000)){throw 'Owned descendant survived'}}`;
 const waiter=spawn(ps,['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,stdio:'inherit'}),waited=new Promise(r=>waiter.once('close',r));await barrier(ready);
 execFileSync(ps,['-NoProfile','-NonInteractive','-File',path.join(here,'stop-own.ps1'),'-OwnedPid',String(owner.pid),'-ExpectedTicks',owner.ticks],{windowsHide:true});await done;assert.equal(await waited,0);
 for(const item of [child,desc]){const socket=net.createServer();await new Promise((r,j)=>{socket.once('error',j);socket.listen(item.port,'127.0.0.1',r);});await new Promise(r=>socket.close(r));}
 fs.writeFileSync(path.join(root,'results.json'),JSON.stringify({normalExit:0,stdout:output,owner,ids,allBoundHandlesSignaled:true,unusedSocketsReused:true},null,2)+'\n');console.log('DEFAULT_SHARED_SUPERVISION_PASS');
}
