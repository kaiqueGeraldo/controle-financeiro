import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const root=path.resolve(process.argv[2]);
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(root).startsWith('startup-hql-'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const jar=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar');
assert.equal(sha(jar),'b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b');
const javaHome=path.resolve('controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const args=['/d','/c','mvnw.cmd','--batch-mode','--offline','-Duser.timezone=UTC','-Dcf017.postgres.major=17',
 '-Dtest=StartupHqlProbeTest','-Dsurefire.rerunFailingTestsCount=0',`-Dcf034.reportsDirectory=${path.join(root,'reports')}`,
 `-Dpreparation.jar=${jar}`,`-Dhql.runtime=${root}`,'test'];
const log=path.join(root,'experimentos.log');
const fd=fs.openSync(log,'wx'),start=performance.now(),at=new Date().toISOString();
let result;
try {result=spawnSync(process.env.ComSpec??'cmd.exe',args,{cwd:path.join(root,'checkout/controle-financeiro-backend'),
 windowsHide:true,stdio:['ignore',fd,fd],env:{...process.env,JAVA_HOME:javaHome,PATH:javaHome+'/bin;'+process.env.PATH}});}
finally {fs.closeSync(fd);}
const receipt={start:at,end:new Date().toISOString(),elapsedMs:performance.now()-start,status:result.status,error:result.error?.message,args,jarSha256:sha(jar),logSha256:sha(log)};
fs.writeFileSync(path.join(root,'execution-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(receipt));
process.exitCode=result.status??1;
