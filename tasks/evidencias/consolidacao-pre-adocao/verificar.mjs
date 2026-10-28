import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {backendSelection} from '../../../.github/scripts/suites.mjs';
import {junitCounts,requireCounts,requireReportedClasses} from '../../../.github/scripts/ci.mjs';

const out=path.resolve('tasks/evidencias/consolidacao-pre-adocao');
const runtime=path.resolve(process.argv[2]??'');
const allowed=path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep;
assert.ok(runtime.startsWith(allowed)&&path.basename(runtime).startsWith('consolidacao-'));
assert.ok(!fs.existsSync(runtime),'Use a fresh external execution');
fs.mkdirSync(runtime,{recursive:true});
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const steps=[];
function command(label,file,args,env={}){
 const result=spawnSync(file,args,{encoding:'utf8',windowsHide:true,env:{...process.env,...env},maxBuffer:16*1024*1024});
 const log=path.join(runtime,label+'.log');fs.writeFileSync(log,(result.stdout??'')+(result.stderr??'')+(result.error?.message??''),{flag:'wx'});
 const step={label,executable:file,args,exit:result.status,log,sha256:hash(log)};steps.push(step);
 if(result.status!==0)throw Error(label+' failed; preserve '+log);
 return result.stdout;
}
try{
 // Risk: shared consumers/collectors in the unchanged workflow must retain
 // failure propagation, counts, source binding and fail-closed sanitization.
 command('contratos-ci-sanitizacao',process.execPath,['--test','.github/scripts/ci.test.mjs','.github/scripts/sanitize.test.mjs'],{TEMP:runtime,TMP:runtime});
 // Risk: record the diagnostic parser's actual coverage independently of startup.
 command('leitor-jfr',process.execPath,['--test','tasks/evidencias/investigacao-startup-HQL/jfr-stream.test.mjs'],{TEMP:runtime,TMP:runtime});
 const selections={};for(const suite of ['smoke','expanded']){
  const value=backendSelection(process.cwd(),suite);
  const name='com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest';
  assert.ok(value.selected.includes(name));
  selections[suite]={selectedClasses:value.selected.length,deferred:value.deferred,windowsOnlyClassSelected:true};
 }
 const sourceRoot='controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration';
 const sourceFiles=['AdoptionNativeSockets.java','AdoptionNativeSocketsTest.java'];
 const sources=path.join(runtime,'sources'),classes=path.join(runtime,'classes');fs.mkdirSync(sources);fs.mkdirSync(classes);
 const inputs=sourceFiles.map(name=>{const file=path.join(sourceRoot,name),copy=path.join(sources,name);fs.copyFileSync(file,copy);assert.equal(hash(copy),hash(file));return {file,sha256:hash(file),copy};});
 const main=path.join(out,'CondicaoLinux.java');
 const repository=path.join(os.homedir(),'.m2/repository');
 const coordinates=[
  ['org/junit/jupiter','junit-jupiter-api','6.0.2'],['org/junit/jupiter','junit-jupiter-engine','6.0.2'],
  ['org/junit/platform','junit-platform-commons','6.0.2'],['org/junit/platform','junit-platform-engine','6.0.2'],
  ['org/junit/platform','junit-platform-launcher','6.0.2'],['org/apiguardian','apiguardian-api','1.1.2'],
  ['org/opentest4j','opentest4j','1.3.0'],['org/assertj','assertj-core','3.27.6'],
  ['com/fasterxml/jackson/core','jackson-databind','2.20.2'],['com/fasterxml/jackson/core','jackson-core','2.20.2'],
  ['com/fasterxml/jackson/core','jackson-annotations','2.20'],
 ];
 const dependencies=coordinates.map(([group,name,version])=>{const file=path.join(repository,group,name,version,`${name}-${version}.jar`);assert.ok(fs.existsSync(file),file);return {name,version,file,sha256:hash(file)};});
 const classpath=dependencies.map(d=>d.file).join(path.delimiter);
 const jdk=path.resolve('controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1/bin');
 command('java-version',path.join(jdk,'java.exe'),['-version']);
 command('compile-condition',path.join(jdk,'javac.exe'),['--release','21','-cp',classpath,'-d',classes,main,...inputs.map(i=>i.copy)]);
 const reports=path.join(runtime,'condition-reports');
 command('junit-condition',path.join(jdk,'java.exe'),['-cp',classes+path.delimiter+classpath,'CondicaoLinux',reports]);
 const counts=junitCounts(reports);
 requireReportedClasses(reports,['com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest']);
 let rejection;try{requireCounts(counts,'backend');}catch(e){rejection=e.message;}
 assert.ok(rejection?.includes('skipped'));
 const positive=requireCounts({tests:1,failures:0,errors:0,skipped:0},'review-control');
 const result={at:new Date().toISOString(),candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  environment:{platform:process.platform,node:process.version,jdk:'Existing Temurin21; see java-version.log',nativeLinuxExecuted:false,servicesStarted:false,remoteCiExecuted:false},
  selections,condition:{originalSources:inputs,dependencies,counts,gateRejection:rejection,positiveControl:positive,
   interpretation:'Confirmed composition failure: real JUnit condition evaluated with os.name=Linux on Windows, then summary bridged to the exact existing gate. Not a native Linux or remote Surefire execution.'},
  steps,status:'review-checks-completed; candidate has CPA-01/P2',runtime};
 fs.writeFileSync(path.join(out,'verificacoes.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 fs.copyFileSync(path.join(runtime,'contratos-ci-sanitizacao.log'),path.join(out,'contratos-ci-sanitizacao.log'),fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(path.join(runtime,'leitor-jfr.log'),path.join(out,'leitor-jfr.log'),fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(path.join(runtime,'junit-condition.log'),path.join(out,'junit-condition.log'),fs.constants.COPYFILE_EXCL);
 fs.writeFileSync(path.join(runtime,'result.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({selections,counts,gateRejection:rejection,status:result.status}));
}catch(error){
 fs.writeFileSync(path.join(runtime,'failure.json'),JSON.stringify({at:new Date().toISOString(),steps,error:error.message},null,2)+'\n',{flag:'wx'});
 throw error;
}
