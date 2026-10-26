import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import net from 'node:net';
import {spawnOwned,stopOwned} from '../../../.github/scripts/owned-process.mjs';
import {snapshot,hash,writeJson} from '../../../.github/scripts/source.mjs';
const runtime=path.resolve(process.argv[2]);
assert(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));assert(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const repo=process.cwd(),here=import.meta.dirname,read=p=>JSON.parse(fs.readFileSync(p));
const pause=()=>new Promise(r=>setTimeout(r,25));
async function until(predicate,label,ms=10000){const end=Date.now()+ms;while(!predicate()){if(Date.now()>end)throw new Error('Readiness/exit deadline: '+label);await pause();}}
function run(args,env={}){const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true,maxBuffer:10*1024*1024,env:{...process.env,...env}});return {exit:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr};}
const result={at:new Date().toISOString(),runtime,head:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),node:process.version,platform:process.platform,tests:[]};
function record(name,data){result.tests.push({name,...data});writeJson(path.join(here,'proofs.json'),result);}
const scripts=path.join(runtime,'scripts');fs.cpSync('.github/scripts',scripts,{recursive:true});
const baseline=path.resolve('../controle-financeiro-runtimes/CF-034/s01');
// Same original sentinel bytes, real public CLI, original leak assertions retained
// in the independent source; closure assertions express their required inverse.
const san=path.join(runtime,'sanitization');fs.mkdirSync(san);for(const f of ['backend.log','result.json'])fs.copyFileSync(path.join(baseline,'probes/sanitization',f),path.join(san,f));
const collect=run([path.join(scripts,'publish-evidence.mjs'),san]);assert.equal(collect.exit,0);
const output=fs.readFileSync(path.join(san,'public/backend.log'),'utf8');assert(!/SENTINEL|eyJTEST/.test(output));assert(output.includes('diagnostic=keep'));
record('original-sanitization-after',{...collect,rawSha256:hash(fs.readFileSync(path.join(san,'backend.log'))),publicSha256:hash(Buffer.from(output)),output});
// Replace only the sanitizer in an isolated copy with the original algorithm.
const sanitizer=path.join(scripts,'sanitize.mjs'),fixed=fs.readFileSync(sanitizer),before=hash(fixed);
const old=spawnSync('git',['show','8d58207:.github/scripts/publish-evidence.mjs'],{encoding:'utf8'}).stdout;
const expression=old.split(/\r?\n/).find(line=>line.startsWith('const sanitize=')).slice('const sanitize='.length).replace(/;$/,'');
fs.writeFileSync(sanitizer,'export const sanitizeFile='+expression+';\n');
const mutant=path.join(runtime,'san-mutant');fs.mkdirSync(mutant);for(const f of ['backend.log','result.json'])fs.copyFileSync(path.join(san,f),path.join(mutant,f));
const leakedRun=run([path.join(scripts,'publish-evidence.mjs'),mutant]);const leaked=fs.readFileSync(path.join(mutant,'public/backend.log'),'utf8');assert.equal(leakedRun.exit,0);for(const value of ['SENTINEL_JSON','SENTINEL_BEARER','SENTINEL_COOKIE'])assert(leaked.includes(value));
fs.writeFileSync(sanitizer,fixed);assert.equal(hash(fs.readFileSync(sanitizer)),before);
const restored=path.join(runtime,'san-restored');fs.mkdirSync(restored);for(const f of ['backend.log','result.json'])fs.copyFileSync(path.join(san,f),path.join(restored,f));assert.equal(run([path.join(scripts,'publish-evidence.mjs'),restored]).exit,0);assert(!/SENTINEL/.test(fs.readFileSync(path.join(restored,'public/backend.log'),'utf8')));
record('sanitization-mutation',{originalAlgorithmRestoresThreeLeaks:true,before,mutated:hash(Buffer.from('export const sanitizeFile='+expression+';\n')),restored:hash(fs.readFileSync(sanitizer)),controlPassed:true});

// Reuse the original required-report/failure fixture loop without changing its
// assertions. Only the subprocess CLI path selects the isolated corrected scripts.
const original=fs.readFileSync('tasks/evidencias/revisao-CF-034/review.mjs','utf8');
const loop=original.slice(original.indexOf(" for(const mode of ['child-failure','missing-report'])"),original.indexOf(" write(path.join(here,'probes.json')"));
const imports=`import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {snapshot} from ${JSON.stringify(pathToFileURL(path.resolve('.github/scripts/source.mjs')).href)};const runtime=${JSON.stringify(runtime)},repo=${JSON.stringify(repo)},result={};const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\\n');const read=p=>JSON.parse(fs.readFileSync(p));const run=(args,cwd,env)=>{args[0]=${JSON.stringify(path.join(scripts,'ci.mjs'))};const r=spawnSync(process.execPath,args,{cwd,env,encoding:'utf8',windowsHide:true});return {exit:r.status,stdout:r.stdout,stderr:r.stderr};};`;
const regression=path.join(runtime,'original-regressions.mjs');fs.writeFileSync(regression,imports+loop+`write(${JSON.stringify(path.join(runtime,'regressions.json'))},result);`);
const regressionRun=run([regression]);assert.equal(regressionRun.exit,0,regressionRun.stderr);record('original-failure-regressions',{...regressionRun,cases:read(path.join(runtime,'regressions.json'))});

// Repackage only in an isolated copy with historical receipts, no new build/test.
const copy=path.join(baseline,'probes/checkout'),jar=path.join(copy,'controle-financeiro-backend/target/api-0.0.1.jar');
const bytes=fs.readFileSync(jar),jarBefore=hash(bytes);const altered=Buffer.from(bytes);altered[altered.length-1]^=1;fs.writeFileSync(jar,altered);
try{const out=path.join(runtime,'jar-tamper'),r=run([path.join(scripts,'ci.mjs'),'package',copy,out]);assert.equal(r.exit,1);const report=read(path.join(out,'result.json'));assert.match(report.error,/Package changed/);assert(!report.artifact);record('jar-tamper',{...r,report,originalSha256:jarBefore,mutatedSha256:hash(altered),meaning:'historical package/receipts copied; no new compilation'});}
finally{fs.writeFileSync(jar,bytes);assert.equal(hash(fs.readFileSync(jar)),jarBefore);}

const actor=`import fs from 'node:fs';import path from 'node:path';import net from 'node:net';import {spawn} from 'node:child_process';const dir=process.env.PROBE_DIR,role=process.argv[2]??'parent';const start=Date.now();let server,timer;function ready(){fs.writeFileSync(path.join(dir,role+'.ready.json'),JSON.stringify({pid:process.pid,ppid:process.ppid,start,port:server?.address().port}));timer=setInterval(()=>fs.writeFileSync(path.join(dir,role+'.beat'),String(Date.now())),50);}if(role==='parent'){spawn(process.execPath,[import.meta.filename,'grand'],{env:process.env,stdio:['ignore','inherit','inherit']});ready();}else{server=net.createServer();server.listen(0,'127.0.0.1',ready);}setTimeout(()=>{fs.writeFileSync(path.join(dir,role+'.natural'),'natural timeout');clearInterval(timer);server?.close();},20000);process.on('message',()=>process.exit(0));`;
const observer=`param([string]$Config)\n$c=Get-Content -Raw -LiteralPath $Config | ConvertFrom-Json\nAdd-Type -TypeDefinition @"\nusing System;using System.Runtime.InteropServices;public static class ExitObserver { [DllImport("kernel32.dll",SetLastError=true)] public static extern IntPtr OpenProcess(uint rights,bool inherit,int pid);[DllImport("kernel32.dll")] public static extern uint WaitForSingleObject(IntPtr handle,uint ms);[DllImport("kernel32.dll")] public static extern bool GetExitCodeProcess(IntPtr handle,out uint code);[DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr handle);}\n"@\n$handles=@();foreach($idValue in $c.ids){$h=[ExitObserver]::OpenProcess(0x101000,$false,$idValue);if($h -eq [IntPtr]::Zero){throw 'Cannot observe owned process'};$handles+=@{pid=$idValue;handle=$h}}\nSet-Content -LiteralPath $c.ready -Value 'handles-open'\n$results=@();foreach($entry in $handles){$wait=[ExitObserver]::WaitForSingleObject($entry.handle,5000);[uint32]$code=0;[void][ExitObserver]::GetExitCodeProcess($entry.handle,[ref]$code);$results+=@{pid=$entry.pid;wait=$wait;exit=$code};[void][ExitObserver]::CloseHandle($entry.handle)}\nConvertTo-Json -InputObject @($results) | Set-Content -LiteralPath $c.output\n`;
fs.writeFileSync(path.join(runtime,'observe.ps1'),observer);
async function cancelCase(name,{early=false,mutate=false}={}){
  const dir=path.join(runtime,name),front=path.join(dir,'checkout/controle-financeiro-frontend');fs.mkdirSync(front,{recursive:true});
  writeJson(path.join(front,'package.json'),{name:'cancel-proof',version:'1.0.0',scripts:{lint:'node actor.mjs parent',typecheck:'node next.mjs'}});
  writeJson(path.join(front,'package-lock.json'),{name:'cancel-proof',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'cancel-proof',version:'1.0.0'}}});
  fs.writeFileSync(path.join(front,'actor.mjs'),actor);fs.writeFileSync(path.join(front,'next.mjs'),`import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(path.join(dir,'NEXT-GATE'))},'unsafe advancement');`);
  const checkout=path.dirname(front);snapshot(checkout,{commit:'synthetic-cancel-only',originalTreeChanges:[]});const out=path.join(dir,'output');
  const unrelated=spawn(process.execPath,[path.join(front,'actor.mjs'),'unrelated'],{env:{...process.env,PROBE_DIR:dir},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
  const unrelatedExit=new Promise(resolve=>unrelated.once('exit',code=>resolve(code)));
  await until(()=>fs.existsSync(path.join(dir,'unrelated.ready.json')),'unrelated ready');
  const job=path.join(scripts,'owned-process.ps1'),jobBytes=fs.readFileSync(job),jobHash=hash(jobBytes);
  if(mutate)fs.writeFileSync(job,jobBytes.toString().replace('limits.Basic.Flags=0x2000','limits.Basic.Flags=0'));
  const child=spawn(process.execPath,[path.join(scripts,'ci.mjs'),'all',checkout,out],{env:{...process.env,PROBE_DIR:dir,npm_config_offline:'true',npm_config_cache:path.join(runtime,'npm-cache')},windowsHide:true});
  let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);const exit=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
  await until(()=>fs.existsSync(path.join(out,'control.json')),'runner control');
  let observed,observerChild,observerExit,identities=[];
  if(!early){
    await until(()=>['parent','grand'].every(n=>fs.existsSync(path.join(dir,n+'.ready.json'))),'two owned ready',15000);
    identities=['parent','grand'].map(n=>({role:n,...read(path.join(dir,n+'.ready.json'))}));assert.equal(identities[1].ppid,identities[0].pid);
    const config={ids:identities.map(i=>i.pid),ready:path.join(dir,'observer.ready'),output:path.join(dir,'observed-exits.json')};writeJson(path.join(dir,'observe.json'),config);
    observerChild=spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',path.join(runtime,'observe.ps1'),'-Config',path.join(dir,'observe.json')],{windowsHide:true});
    let errors='';observerChild.stderr.on('data',d=>errors+=d);observerExit=new Promise(resolve=>observerChild.once('close',code=>resolve({code,errors})));
    await until(()=>fs.existsSync(config.ready),'open process handles');
  }
  const requested=Date.now();const request=run([path.join(scripts,'cancel.mjs'),out]);assert.equal(request.exit,0);
  // Same execution token, repeated cancellation has no additional side effects.
  assert.equal(run([path.join(scripts,'cancel.mjs'),out]).exit,0);
  const runnerExit=await exit;assert.equal(runnerExit.code,130);const report=read(path.join(out,'result.json'));assert.equal(report.status,'cancelled');assert(!report.artifact);assert(!fs.existsSync(path.join(dir,'NEXT-GATE')));assert(!report.steps.some(s=>['typecheck','backend','e2e','build'].includes(s.name)));
  assert.equal(unrelated.exitCode,null);unrelated.send('finish');assert.equal(await unrelatedExit,0);
  if(!early){assert.equal((await observerExit).code,0);observed=read(path.join(dir,'observed-exits.json'));if(mutate)assert(observed.some(o=>o.wait===258&&o.exit===259));else assert(observed.every(o=>o.wait===0&&o.exit!==259));}
  if(mutate){await until(()=>identities.every(i=>fs.existsSync(path.join(dir,i.role+'.natural'))),'bounded mutant natural end',22000);}
  else assert(!identities.some(i=>fs.existsSync(path.join(dir,i.role+'.natural'))));
  if(!early&&!mutate){const server=net.createServer();await new Promise((resolve,reject)=>server.once('error',reject).listen(identities[1].port,'127.0.0.1',resolve));await new Promise(resolve=>server.close(resolve));}
  fs.writeFileSync(job,jobBytes);assert.equal(hash(fs.readFileSync(job)),jobHash);
  record(name,{runnerExit,report,stdout,stderr,identities,observed,elapsedMs:Date.now()-requested,jobHash,restoredJobHash:hash(fs.readFileSync(job)),unrelatedPreserved:true,ownedPortReleased:!early&&!mutate,mutate,early});
}
const completed=spawnOwned(process.execPath,['-e','console.log(JSON.stringify(process.argv.slice(1)));process.exitCode=17;','space value','quote"value','slash\\'],{cwd:runtime,env:process.env,windowsHide:true});let normal='';completed.stdout.on('data',d=>normal+=d);const completedCode=await new Promise(resolve=>completed.once('close',resolve));assert.equal(completedCode,17);assert.deepEqual(JSON.parse(normal),['space value','quote"value','slash\\']);stopOwned(completed);stopOwned(completed);record('already-exited-and-argument-transport',{exit:completedCode,argumentsPreserved:true,repeatedStopSafe:true});
await cancelCase('active-child-grandchild');await cancelCase('during-startup',{early:true});await cancelCase('cancel-mutant',{mutate:true});await cancelCase('cancel-restored');

// Original abrupt-parent probe runs unchanged except import/output relocation.
let abrupt=fs.readFileSync('tasks/evidencias/revisao-CF-034/cancellation.mjs','utf8').replace("'../../../.github/scripts/source.mjs'",JSON.stringify(pathToFileURL(path.resolve('.github/scripts/source.mjs')).href)).replace("['.github/scripts/ci.mjs'",'['+JSON.stringify(path.join(scripts,'ci.mjs'))).replace("write('tasks/evidencias/revisao-CF-034/cancellation.json',result)",'write('+JSON.stringify(path.join(runtime,'abrupt.json'))+',result)');
const abruptFile=path.join(runtime,'original-abrupt.mjs');fs.writeFileSync(abruptFile,abrupt);const abruptRun=run([abruptFile,path.join(runtime,'abrupt')]);assert.equal(abruptRun.exit,1);const abruptReport=read(path.join(runtime,'abrupt.json'));assert.equal(abruptReport.childContinuedAfterParentExit,false);assert.equal(abruptReport.sentinelAliveAtEnd,false);assert.equal(abruptReport.resultFileExists,false);
record('original-abrupt-after',{...abruptRun,report:abruptReport,meaning:'original finding assertion now rejects; hard-killed runner cannot write final report'});

// Durable collector actual output, in an isolated relocated copy (history untouched).
const durable=path.join(runtime,'durable');fs.mkdirSync(durable);let durableScript=fs.readFileSync('tasks/evidencias/CF-034/collect.mjs','utf8').replaceAll(/(['"])\.\.\/\.\.\/\.\.\/(\.github\/scripts\/[^'"]+)\1/g,(_,q,f)=>q+pathToFileURL(path.resolve(f)).href+q);
const durableFile=path.join(durable,'collect.mjs');fs.writeFileSync(durableFile,durableScript);const d=run([durableFile,san,'sanitized']);assert.equal(d.exit,0,d.stderr);assert(!/SENTINEL/.test(fs.readFileSync(path.join(durable,'runs/sanitized/result.json'),'utf8')));record('durable-collector',{...d,files:fs.readdirSync(path.join(durable,'runs/sanitized'))});
console.log('Directed proofs, mutations, restored controls and original probes completed.');
