import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {snapshot} from '../../../.github/scripts/source.mjs';
const runtime=path.resolve(process.argv[2]);
assert(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/CF-034')+path.sep));
assert(!fs.existsSync(runtime));
const front=path.join(runtime,'checkout/controle-financeiro-frontend');fs.mkdirSync(front,{recursive:true});
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
write(path.join(front,'package.json'),{name:'bounded-cancel-probe',version:'1.0.0',scripts:{lint:'node sentinel.mjs'}});
write(path.join(front,'package-lock.json'),{name:'bounded-cancel-probe',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'bounded-cancel-probe',version:'1.0.0'}}});
// Bounded sentinel exits on its own. It creates no network/database resources.
fs.writeFileSync(path.join(front,'sentinel.mjs'),`import fs from 'node:fs';const start=Date.now();const file=process.env.CF034_SENTINEL;fs.writeFileSync(file,JSON.stringify({pid:process.pid,start,at:Date.now()}));const timer=setInterval(()=>{fs.writeFileSync(file,JSON.stringify({pid:process.pid,start,at:Date.now()}));if(Date.now()-start>12000){clearInterval(timer);}},100);`);
const checkout=path.join(runtime,'checkout');snapshot(checkout,{commit:'synthetic-cancellation-probe',originalTreeChanges:[]});
const marker=path.join(runtime,'sentinel.json'),out=path.join(runtime,'output');
const child=spawn(process.execPath,['.github/scripts/ci.mjs','all',checkout,out],{env:{...process.env,CF034_SENTINEL:marker,npm_config_offline:'true',npm_config_cache:path.join(runtime,'npm-cache')},windowsHide:true,stdio:['ignore','pipe','pipe']});
let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
const exit=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
const pause=()=>new Promise(r=>setTimeout(r,100));
const deadline=Date.now()+30000;
while(!fs.existsSync(marker)&&Date.now()<deadline&&child.exitCode===null)await pause();
assert(fs.existsSync(marker),'sentinel must be running before cancellation');
const before=JSON.parse(fs.readFileSync(marker));const killed=child.kill('SIGTERM');const parentExit=await exit;
const checkUntil=Date.now()+1500;while(Date.now()<checkUntil)await pause();
const after=JSON.parse(fs.readFileSync(marker));const survived=after.at>before.at+1000;
// Do not kill unknown PIDs. Wait for the sentinel's explicit self-termination.
while(Date.now()<before.start+14000)await pause();
let alive;try{process.kill(before.pid,0);alive=true;}catch{alive=false;}
const result={at:new Date().toISOString(),runtime,parentPid:child.pid,sentinelPid:before.pid,killed,parentExit,before,after,childContinuedAfterParentExit:survived,sentinelAliveAtEnd:alive,resultFileExists:fs.existsSync(path.join(out,'result.json')),stdout,stderr,limit:'Windows SIGTERM termination of runner only; no claim about GitHub runner process-tree cleanup'};
write('tasks/evidencias/revisao-CF-034/cancellation.json',result);
assert(survived,'candidate unexpectedly cleaned up child; reassess finding');assert.equal(alive,false);
console.log('Cancellation gap reproduced; bounded sentinel ended naturally.');
