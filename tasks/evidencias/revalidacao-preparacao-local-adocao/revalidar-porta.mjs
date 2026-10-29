import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync}from'node:child_process';
import {hash}from'../preparacao-local-adocao/counterproof-checkpoint.mjs';
const root=path.resolve(process.argv[2]);assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-')));
const back=path.join(root,'checkout/controle-financeiro-backend'),tests=path.join(back,'src/test/java/com/controlefinanceiro/api/migration');
fs.copyFileSync('tasks/evidencias/revalidacao-preparacao-local-adocao/PortLifecycleProbeTest.java',path.join(tests,'PortLifecycleProbeTest.java'));
const jar=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar'),image='sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1';
const originalCases='AdoptionRuntimeTest#releasedProcessPreservesAuthOwnershipAndEffectsThenCanFreezeAgain+readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart+enabledJobsActuallyRunButDisabledJobsLeaveNoLockOrSideEffect';const receipts=[];
function run(name,major,selection,mode='jar') {
 const log=path.join(root,name+'.log'),fd=fs.openSync(log,'wx'),args=['/d','/c','mvnw.cmd','--batch-mode','-Duser.timezone=UTC','-Dcf017.postgres.major='+major,'-Dtest='+selection,'-Dcf034.reportsDirectory='+path.join(root,name+'-reports'),mode==='jar'?'-Dpreparation.jar='+jar:'-Dpreparation.image='+image,'test'];
 console.log('START '+name);let r;try{r=spawnSync(process.env.ComSpec??'cmd.exe',args,{cwd:back,stdio:['ignore',fd,fd],env:process.env});}finally{fs.closeSync(fd);}
 receipts.push({name,major,selection,mode,exit:r.status,args,logSha256:hash(fs.readFileSync(log))});fs.writeFileSync(path.join(root,'porta-execucoes.json'),JSON.stringify(receipts,null,2)+'\n');console.log('END '+name+' exit='+r.status);return r.status;
}
run('porta-pg17',17,originalCases+',AdoptionPortAllocationTest,PortLifecycleProbeTest');
run('porta-pg16',16,'AdoptionPortAllocationTest,PortLifecycleProbeTest');
run('porta-image',17,originalCases+',PortLifecycleProbeTest#ownedListenerEndsWhileUnrelatedReadyServiceSurvives','image');
const source=path.join(tests,'AdoptionRuntimeTest.java'),bytes=fs.readFileSync(source);
const mutant=bytes.toString().replace('port = 0;','try (var socket = new java.net.ServerSocket(0)) { port = socket.getLocalPort(); }').replace('image == null ? 0 : 8080','image == null ? port : 8080');assert.notEqual(mutant,bytes.toString());
let status;try{fs.writeFileSync(source,mutant);status=run('porta-mutante',17,'AdoptionPortAllocationTest');}finally{fs.writeFileSync(source,bytes);}
assert.equal(hash(fs.readFileSync(source)),hash(bytes));const log=fs.readFileSync(path.join(root,'porta-mutante.log'),'utf8');
const mutationDetected=status!==0&&/Tests run: 1, Failures: 1, Errors: 0, Skipped: 0/.test(log)&&/Port \d+ was already in use/.test(log);
const restoredExit=run('porta-restaurada',17,'AdoptionPortAllocationTest');
fs.writeFileSync(path.join(root,'porta-mutacao.json'),JSON.stringify({before:hash(bytes),mutant:hash(mutant),restored:hash(fs.readFileSync(source)),mutationDetected,restoredExit,jarSha256:hash(fs.readFileSync(jar)),image},null,2)+'\n');
assert.equal(mutationDetected,true);assert.equal(restoredExit,0);
