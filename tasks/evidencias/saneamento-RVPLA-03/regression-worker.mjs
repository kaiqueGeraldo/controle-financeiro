import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {superviseCounterproof,verifyOwnedBoundary} from '../preparacao-local-adocao/counterproof-supervision.mjs';
const runtime=path.resolve(process.argv[2]);
if(!runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla03-')))throw Error('New RVPLA03 runtime required');
await superviseCounterproof(runtime);
const back=path.join(runtime,'checkout/controle-financeiro-backend');
const tests=path.join(back,'src/test/java/com/controlefinanceiro/api/migration');
fs.copyFileSync('tasks/evidencias/revalidacao-preparacao-local-adocao/PortLifecycleProbeTest.java',path.join(tests,'PortLifecycleProbeTest.java'));
const jar=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');
const image='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1';
const original='AdoptionRuntimeTest#releasedProcessPreservesAuthOwnershipAndEffectsThenCanFreezeAgain+readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart+enabledJobsActuallyRunButDisabledJobsLeaveNoLockOrSideEffect';
const receipts=[],sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function run(name,major,selection,kind='jar') {
 verifyOwnedBoundary(runtime);
 const log=path.join(runtime,name+'.log'),fd=fs.openSync(log,'wx');
 const args=['/d','/c','mvnw.cmd','--batch-mode','-Duser.timezone=UTC','-Dcf017.postgres.major='+major,'-Dtest='+selection,'-Dcf034.reportsDirectory='+path.join(runtime,name+'-reports'),kind==='jar'?'-Dpreparation.jar='+jar:'-Dpreparation.image='+image,'test'];
 console.log('START '+name);let result;
 try{result=spawnSync(process.env.ComSpec??'cmd.exe',args,{cwd:back,env:process.env,stdio:['ignore',fd,fd]});}finally{fs.closeSync(fd);}
 verifyOwnedBoundary(runtime);
 receipts.push({name,major,selection,kind,exit:result.status,error:result.error?.message,args,logSha256:sha(fs.readFileSync(log)),at:new Date().toISOString()});
 fs.writeFileSync(path.join(runtime,'regression.json'),JSON.stringify(receipts,null,2)+'\n');
 console.log('END '+name+' exit='+result.status);
 return result.status;
}
run('pg16',16,'AdoptionPortAllocationTest,PortLifecycleProbeTest');
run('pg17',17,original+',AdoptionPortAllocationTest,PortLifecycleProbeTest');
run('linux',17,original+',PortLifecycleProbeTest#ownedListenerEndsWhileUnrelatedReadyServiceSurvives','image');
const source=path.join(tests,'AdoptionRuntimeTest.java'),bytes=fs.readFileSync(source);
const mutant=bytes.toString().replace('port = 0;','try (var socket = new java.net.ServerSocket(0)) { port = socket.getLocalPort(); }').replace('image == null ? 0 : 8080','image == null ? port : 8080');
assert.notEqual(mutant,bytes.toString());let status;
try{fs.writeFileSync(source,mutant);status=run('port-mutant',17,'AdoptionPortAllocationTest');}finally{fs.writeFileSync(source,bytes);}
assert.equal(sha(fs.readFileSync(source)),sha(bytes));
const detected=status!==0&&/Tests run: 1, Failures: 1, Errors: 0, Skipped: 0/.test(fs.readFileSync(path.join(runtime,'port-mutant.log'),'utf8'))&&/Port \d+ was already in use/.test(fs.readFileSync(path.join(runtime,'port-mutant.log'),'utf8'));
const control=run('port-restored',17,'AdoptionPortAllocationTest');
fs.writeFileSync(path.join(runtime,'port-mutation.json'),JSON.stringify({before:sha(bytes),mutant:sha(mutant),restored:sha(fs.readFileSync(source)),detected,control,jarSha256:sha(fs.readFileSync(jar)),image},null,2)+'\n');
assert.equal(detected,true);assert.equal(control,0);
