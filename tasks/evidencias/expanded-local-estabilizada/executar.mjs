import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {sourceFor} from '../../../.github/scripts/source.mjs';
const [runtimeArg,jdkArg]=process.argv.slice(2);assert.ok(runtimeArg&&jdkArg);
const root=path.resolve(import.meta.dirname,'../../..'),runtime=fs.realpathSync.native(runtimeArg),jdk=fs.realpathSync.native(jdkArg);
const report={label:'Expanded local do recorte autorizado pela DEC-ZOOM-05',started:new Date().toISOString(),steps:[],status:'running'};
const write=()=>fs.writeFileSync(path.join(runtime,'flow.json'),JSON.stringify(report,null,2)+'\n');
assert.equal(fs.existsSync(path.join(runtime,'flow.json')),false);
const env={...process.env};for(const key of Object.keys(env))if(/^(SPRING_|JWT_|RESEND_|BRAPI_|DATABASE_URL|BACKEND_API_URL|JDBC_|PGHOST|PGDATABASE|PGUSER|PGPASSWORD|DOCKER_|TESTCONTAINERS_|CF_ZOOM_)/.test(key)||['RF15_RVA_ONLY','GITHUB_ACTIONS'].includes(key))delete env[key];
const pathKey=Object.keys(env).find(key=>key.toLowerCase()==='path');env[pathKey]=path.join(jdk,'bin')+path.delimiter+env[pathKey];
Object.assign(env,{JAVA_HOME:jdk,MAVEN_ARGS:'--offline',DOCKER_HOST:'npipe:////./pipe/dockerDesktopLinuxEngine',DOCKER_CONTEXT:'desktop-linux',TESTCONTAINERS_HOST_OVERRIDE:'127.0.0.1',TESTCONTAINERS_REUSE_ENABLE:'false',CF034_SUITE:'expanded',PLAYWRIGHT_BROWSERS_PATH:'0',CF_EXPANDED_LOCAL_RUNTIME:runtime});
function command(name,executable,args,cwd=root){
 const step={name,command:[executable,...args],cwd,started:new Date().toISOString(),finished:null,exit:null};report.steps.push(step);write();
 const fd=fs.openSync(path.join(runtime,name+'.log'),'wx');
 const result=spawnSync(executable,args,{cwd,env,windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 Object.assign(step,{finished:new Date().toISOString(),exit:result.status,error:result.error?.message});write();
 assert.equal(result.status,0,name+' failed; inspect private '+name+'.log');
 console.log(name+': passed');
}
try{
 const candidateParent=path.join(runtime,'expanded-local-s');
 command('prepare',process.execPath,[path.join(root,'tasks/evidencias/revisao-expanded-plataformas-docker/preparar-proxima.mjs'),candidateParent]);
 const candidate=path.join(candidateParent,'candidate'),source=sourceFor(candidate);
 const scripts=['tasks/evidencias/revisao-expanded-plataformas-docker/preparar-proxima.mjs','tasks/evidencias/revisao-expanded-plataformas-docker/runtime-path.mjs','tasks/evidencias/expanded-local-estabilizada/executar.mjs','tasks/evidencias/expanded-local-estabilizada/preflight-windows.mjs','tasks/evidencias/expanded-local-estabilizada/frontend-linux.mjs'];
 report.source={commit:source.commit,productTestInputsCommit:source.reviewedInputCommit,digest:source.digest,files:source.files.length,executionScriptsCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scripts:scripts.map(file=>({file,sha256:createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}))};write();
 command('preflight',process.execPath,[path.join(import.meta.dirname,'preflight-windows.mjs'),runtime,jdk,'01']);
 command('contracts-windows',process.execPath,['--test',...['ci','suites','sanitize','required','zoom-coverage','paths','components'].map(name=>'.github/scripts/'+name+'.test.mjs')],candidate);
 command('frontend-linux',process.execPath,[path.join(import.meta.dirname,'frontend-linux.mjs'),candidate,path.join(runtime,'linux-native')]);
 command('expanded-windows',process.execPath,[path.join(candidate,'.github/scripts/ci.mjs'),'all',candidate,path.join(runtime,'windows-expanded')]);
 report.status='passed';
}catch(error){report.status='failed';report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{report.finished=new Date().toISOString();write();}
