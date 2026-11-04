import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {spawnSync,execFileSync} from "node:child_process";import {sourceFor,hash} from "../../../.github/scripts/source.mjs";
const [arg,jdkArg]=process.argv.slice(2),runtime=fs.realpathSync.native(arg),jdk=fs.realpathSync.native(jdkArg),root=path.resolve(import.meta.dirname,"../../.."),candidate=path.join(runtime,"expanded-local-s/candidate");
const linux=JSON.parse(fs.readFileSync(path.join(runtime,"linux-02/flow.json")));assert.equal(linux.status,"passed");assert.equal(linux.observerValidation.uniqueIds,626);assert.equal(linux.restoredSourceDigest,linux.baseDigest);
const source=sourceFor(candidate);assert.equal(source.digest,linux.baseDigest);
const report={label:"Expanded local do recorte autorizado pela DEC-ZOOM-05",started:new Date().toISOString(),source:{commit:source.commit,digest:source.digest},executionHead:execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim(),steps:[],status:"running",linuxProof:"linux-02/flow.json",linuxProofSha:hash(fs.readFileSync(path.join(runtime,"linux-02/flow.json")))};
assert.equal(fs.existsSync(path.join(runtime,"continuacao.json")),false);const save=()=>fs.writeFileSync(path.join(runtime,"continuacao.json"),JSON.stringify(report,null,2)+"\n");
const env={...process.env};for(const key of Object.keys(env))if(/^(SPRING_|JWT_|RESEND_|BRAPI_|DATABASE_URL|BACKEND_API_URL|JDBC_|PGHOST|PGDATABASE|PGUSER|PGPASSWORD|DOCKER_|TESTCONTAINERS_|CF_ZOOM_)/.test(key)||["RF15_RVA_ONLY","GITHUB_ACTIONS"].includes(key))delete env[key];
const pathKey=Object.keys(env).find(k=>k.toLowerCase()==="path");env[pathKey]=path.join(jdk,"bin")+path.delimiter+env[pathKey];
Object.assign(env,{JAVA_HOME:jdk,MAVEN_ARGS:"--offline",DOCKER_HOST:"npipe:////./pipe/dockerDesktopLinuxEngine",DOCKER_CONTEXT:"desktop-linux",TESTCONTAINERS_HOST_OVERRIDE:"127.0.0.1",TESTCONTAINERS_REUSE_ENABLE:"false",CF034_SUITE:"expanded",PLAYWRIGHT_BROWSERS_PATH:"0",CF_EXPANDED_LOCAL_RUNTIME:runtime});
function command(name,args,cwd=root){const step={name,command:[process.execPath,...args],cwd,started:new Date().toISOString()};report.steps.push(step);save();const fd=fs.openSync(path.join(runtime,name+".log"),"wx");const r=spawnSync(process.execPath,args,{cwd,env,windowsHide:true,stdio:["ignore",fd,fd]});fs.closeSync(fd);Object.assign(step,{exit:r.status,error:r.error?.message,finished:new Date().toISOString()});save();assert.equal(r.status,0,name+" failed; stop dependent gates");console.log(name+": passed");}
try{
 command("preflight",[path.join(root,"tasks/evidencias/expanded-local-estabilizada/preflight-windows.mjs"),runtime,jdk,"01"]);
 command("contracts-windows",["--test","--test-reporter=tap",...["ci","suites","sanitize","required","zoom-coverage","paths","components"].map(n=>".github/scripts/"+n+".test.mjs")],candidate);
 command("expanded-windows",[path.join(candidate,".github/scripts/ci.mjs"),"all",candidate,path.join(runtime,"windows-expanded")]);
 report.status="passed";
}catch(error){report.status="failed";report.error=error.stack;process.exitCode=1;console.error(error.message);}
finally{report.finished=new Date().toISOString();save();}
