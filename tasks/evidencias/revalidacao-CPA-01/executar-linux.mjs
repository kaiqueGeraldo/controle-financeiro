import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const repo=process.cwd(),out=import.meta.dirname,runtime=path.resolve(process.argv[2]??'');
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(runtime).startsWith('revalidacao-cpa01-'));
const linux=path.join(runtime,'linux');assert.ok(!fs.existsSync(linux));fs.mkdirSync(linux);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const steps=[],executionId=crypto.randomUUID();
function run(label,args){const started=Date.now(),r=spawnSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:60000,maxBuffer:16*1024*1024});const log=path.join(linux,label+'.log');fs.writeFileSync(log,(r.stdout??'')+(r.stderr??'')+(r.error?.message??''),{flag:'wx'});const step={label,args,exit:r.status,durationMs:Date.now()-started,log,sha256:hash(log)};steps.push(step);assert.equal(r.status,0,label+'; see '+log);return r.stdout;}
try{
 const previous=JSON.parse(fs.readFileSync('tasks/evidencias/saneamento-CPA-01/validacao-linux.json'));
 const previousNode=path.join(previous.runtime,'node');assert.equal(hash(previousNode),previous.nodeBinarySha256);fs.copyFileSync(previousNode,path.join(linux,'node'));
 const files=execFileSync('git',['ls-files','.github','controle-financeiro-backend/src/test/java'],{encoding:'utf8'}).trim().split('\n');
 for(const file of files){const dest=path.join(linux,'checkout',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);assert.equal(hash(file),hash(dest));}
 for(const file of ['baseline-suites.mjs','expected-identities.json'])fs.copyFileSync(path.join(runtime,file),path.join(linux,file));
 fs.copyFileSync(path.join(out,'alvo-linux.mjs'),path.join(linux,'alvo-linux.mjs'));
 const sources=path.join(linux,'sources'),legacy=path.join(linux,'legacy-source'),deps=path.join(linux,'dependencies');for(const folder of [sources,legacy,deps,path.join(linux,'tmp')])fs.mkdirSync(folder);
 const inputs=['controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionNativeSockets.java','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionNativeSocketsTest.java','controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/utils/DateUtil.java','controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/exception/BusinessRuleException.java','controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/utils/DateUtilTest.java',path.relative(repo,path.join(out,'ExecutarJUnit.java'))];
 const inputHashes=inputs.map(file=>{fs.copyFileSync(file,path.join(sources,path.basename(file)));return {file,sha256:hash(file)};});
 const legacyFile=path.join(legacy,'AdoptionNativeSocketsTest.java');fs.writeFileSync(legacyFile,execFileSync('git',['show','434e293f76c3b6ff345fe03f2091149291316aac:controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionNativeSocketsTest.java']));
 const dependencies=JSON.parse(fs.readFileSync('tasks/evidencias/consolidacao-pre-adocao/verificacoes.json')).condition.dependencies;
 for(const dependency of dependencies){assert.equal(hash(dependency.file),dependency.sha256);fs.copyFileSync(dependency.file,path.join(deps,path.basename(dependency.file)));}
 const image='eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b';
 const inspected=JSON.parse(run('image-inspect',['image','inspect',image]))[0];
 const args=script=>['run','--rm','--name','review-cpa01-'+crypto.randomUUID(),'--label','cf.review.cpa01='+executionId,'--network','none','--mount',`type=bind,source=${linux},target=/work`,'--workdir','/work','--env','TMPDIR=/work/tmp','--entrypoint','sh',image,'-c',script];
 run('toolchain',args('java -version && /work/node --version && uname -a'));
 run('compile',args('mkdir classes legacy-classes && javac --release 21 -cp "dependencies/*" -d classes sources/*.java && javac --release 21 -cp "classes:dependencies/*" -d legacy-classes legacy-source/*.java'));
 run('contracts',args('cd checkout && /work/node --test .github/scripts/ci.test.mjs .github/scripts/suites.test.mjs .github/scripts/sanitize.test.mjs'));
 run('directed',args('/work/node alvo-linux.mjs'));
 const remaining=run('owned-containers-final',['ps','-aq','--filter','label=cf.review.cpa01='+executionId]).trim();assert.equal(remaining,'');
 const result=JSON.parse(fs.readFileSync(path.join(linux,'linux-result.json')));
 save('execucoes-linux.json',{at:new Date().toISOString(),candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtime:linux,topology:'Windows host -> Docker Desktop Linux engine -> real Linux Node controller and Java21 JVM',image:{id:inspected.Id,os:inspected.Os,architecture:inspected.Architecture},nodeReusedReadOnly:{origin:previousNode,sha256:hash(previousNode)},inputs:inputHashes,legacyTest:{gitBase:'434e293f76c3b6ff345fe03f2091149291316aac',sha256:hash(legacyFile)},dependencies,steps,result,remainingOwnedContainers:0,noDatabase:true,noProductService:true,remoteActions:false});
 for(const file of ['contracts.log','toolchain.log','directed.log'])fs.copyFileSync(path.join(linux,file),path.join(out,'linux-'+file),fs.constants.COPYFILE_EXCL);
 for(const mode of ['legacy','corrected'])for(const file of fs.readdirSync(path.join(linux,mode+'-reports')))fs.copyFileSync(path.join(linux,mode+'-reports',file),path.join(out,'linux-'+mode+'-'+file),fs.constants.COPYFILE_EXCL);
 console.log(JSON.stringify({controller:result.controller,counts:result.executions.map(e=>({mode:e.mode,counts:e.counts,rejection:e.rejection})),remainingOwnedContainers:0}));
}catch(error){save('ocorrencia-linux.json',{at:new Date().toISOString(),runtime:linux,executionId,steps,error:error.message});throw error;}
