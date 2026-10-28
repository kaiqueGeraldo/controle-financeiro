import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';

const repo=process.cwd(),out=import.meta.dirname,runtime=path.resolve(process.argv[2]??'');
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(runtime).startsWith('cpa01-'));
assert.ok(!fs.existsSync(runtime));fs.mkdirSync(runtime,{recursive:true});
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const steps=[];function run(label,args){const result=spawnSync('docker',args,{encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});const log=path.join(runtime,label+'.log');fs.writeFileSync(log,(result.stdout??'')+(result.stderr??''));steps.push({label,args,exit:result.status,log,sha256:hash(log)});assert.equal(result.status,0,label+'; see '+log);return result.stdout.trim();}
const checkout=path.join(runtime,'checkout');fs.mkdirSync(checkout);
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','.github','controle-financeiro-backend/src/test/java'],{encoding:'utf8'}).trim().split('\n');
for(const file of files){const dest=path.join(checkout,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);}
fs.copyFileSync(path.join(out,'linux-target.mjs'),path.join(runtime,'linux-target.mjs'));
const sourceDir=path.join(runtime,'sources');fs.mkdirSync(sourceDir);
const inputs=['controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionNativeSockets.java','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionNativeSocketsTest.java','controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/utils/DateUtil.java','controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/exception/BusinessRuleException.java','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/utils/DateUtilTest.java',path.relative(repo,path.join(out,'ExecucaoPlataforma.java'))];
const sources=inputs.map(file=>{const dest=path.join(sourceDir,path.basename(file));fs.copyFileSync(file,dest);assert.equal(hash(dest),hash(file));return {file,sha256:hash(file)};});
const dependenciesDir=path.join(runtime,'dependencies');fs.mkdirSync(dependenciesDir);
const previous=JSON.parse(fs.readFileSync(path.join(out,'original-verificacoes.json')));
const dependencies=previous.condition.dependencies.map(d=>{assert.equal(hash(d.file),d.sha256);const dest=path.join(dependenciesDir,path.basename(d.file));fs.copyFileSync(d.file,dest);return d;});
const image='eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b';
const nodeImage='sha256:8771dc4666e7';
let container,result;
try{
 const images=JSON.parse(run('image-inspect',['image','inspect',image,nodeImage]));
 container=run('node-source-create',['create','--name','cpa01-node-'+randomUUID(),'--network','none','--entrypoint','/bin/true',nodeImage]);
 run('node-copy',['cp',container+':/usr/local/bin/node',path.join(runtime,'node')]);
 run('node-source-remove',['rm',container]);container=undefined;
 const base=['run','--rm','--network','none','--mount',`type=bind,source=${runtime},target=/work`,'--workdir','/work','--entrypoint','sh',image,'-c'];
 run('linux-toolchain',[...base,'java -version && /work/node --version && uname -a']);
 run('linux-compile',[...base,'mkdir classes && javac --release 21 -cp "dependencies/*" -d classes sources/*.java']);
 run('linux-contracts',[...base,'cd checkout && /work/node --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs']);
 run('linux-directed',[...base,'/work/node linux-target.mjs']);
 result={at:new Date().toISOString(),topology:'Windows controller -> Docker Desktop Linux engine (WSL2) -> Linux container; inner Node controller and target JVM both Linux',hostController:process.platform,runtime,images:images.map(i=>({id:i.Id,repoDigests:i.RepoDigests,os:i.Os,architecture:i.Architecture})),nodeBinarySha256:hash(path.join(runtime,'node')),sources,dependencies,steps,result:JSON.parse(fs.readFileSync(path.join(runtime,'linux-result.json'))),nativeSupervisorLinuxCertified:false,githubActions:false,fullBackendSuiteExecuted:false};
 for(const mode of ['legacy','corrected'])for(const file of fs.readdirSync(path.join(runtime,mode+'-reports')))fs.copyFileSync(path.join(runtime,mode+'-reports',file),path.join(out,'linux-'+mode+'-'+file),fs.constants.COPYFILE_EXCL);
}catch(error){result={at:new Date().toISOString(),runtime,steps,error:error.message};throw error;}
finally{if(container)run('cleanup-node-source',['rm',container]);fs.writeFileSync(path.join(out,result.error?path.basename(runtime)+'-falha.json':'validacao-linux.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({linuxController:true,executions:result.result.executions,fullBackendSuiteExecuted:false}));
