import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {sourceFor,snapshot,hash} from "../../../.github/scripts/source.mjs";
import {componentInputs} from "../../../.github/scripts/component-reuse.mjs";
import {spawnOwned} from "../../../.github/scripts/owned-process.mjs";
import {mavenInvocation,requireBackendReports} from "../../../.github/scripts/ci.mjs";
import {verifyDirectory} from "../../../.github/scripts/zoom-coverage.mjs";
const [permArg,shortArg,phase]=process.argv.slice(2),permanent=fs.realpathSync.native(permArg),short=fs.realpathSync.native(shortArg),repo=path.resolve(import.meta.dirname,"../../.."),candidate=path.join(short,"s"),front=path.join(candidate,"controle-financeiro-frontend"),back=path.join(candidate,"controle-financeiro-backend");
assert.ok(["prepare","focused","remaining"].includes(phase));
assert.equal(fs.realpathSync.native(short),path.resolve(short));assert.ok(short.length<25);
const read=f=>JSON.parse(fs.readFileSync(f)),out=path.join(short,phase);assert.ok(!fs.existsSync(out));fs.mkdirSync(out);
const report={label:"Expanded local do recorte autorizado pela DEC-ZOOM-05",phase,started:new Date().toISOString(),steps:[],status:"running",out,permanent,short};
const save=()=>fs.writeFileSync(path.join(short,phase+".json"),JSON.stringify(report,null,2)+"\n");
const initial=read(path.join(permanent,"initial.json"));
const prior=path.resolve(repo,"../../controle-financeiro-runtimes/preparacao-adocao/componentes-completo-20261103-01"),priorWin=path.resolve(repo,"../../controle-financeiro-runtimes/preparacao-adocao/componentes-completo-w");
const jdk=path.resolve(repo,"../../controle-financeiro/controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1");
const mavenHome="C:/Users/Aluga.com/.m2/wrapper/dists/apache-maven-3.9.12/59fe215c0ad6947fea90184bf7add084544567b927287592651fda3782e0e798";
const env={...process.env};
for(const key of Object.keys(env))if(/^(SPRING_|JWT_|RESEND_|BRAPI_|DATABASE_URL|BACKEND_API_URL|JDBC_|PGHOST|PGDATABASE|PGUSER|PGPASSWORD|DOCKER_|TESTCONTAINERS_|CF_ZOOM_)/.test(key)||["RF15_RVA_ONLY","GITHUB_ACTIONS"].includes(key))delete env[key];
const pk=Object.keys(env).find(k=>k.toLowerCase()==="path");env[pk]=path.join(jdk,"bin")+path.delimiter+env[pk];
const temp=path.join(short,"t");fs.mkdirSync(temp,{recursive:true});
Object.assign(env,{JAVA_HOME:jdk,MAVEN_ARGS:"--offline",DOCKER_HOST:"npipe:////./pipe/dockerDesktopLinuxEngine",DOCKER_CONTEXT:"desktop-linux",TESTCONTAINERS_HOST_OVERRIDE:"127.0.0.1",TESTCONTAINERS_REUSE_ENABLE:"false",CF034_SUITE:"expanded",PLAYWRIGHT_BROWSERS_PATH:"0",CF_EXPANDED_LOCAL_RUNTIME:short,CF_MAVEN_HOME:mavenHome,CF_MAVEN_BACKEND:back,CF_MAVEN_ARGFILE_ROOT:out,CF_SOURCE_ROOT:candidate,CF_TEST_ARTIFACTS:path.join(out,"artifacts"),TEMP:temp,TMP:temp,CF_COMPONENT_REUSE:path.join(short,"reuse")});
async function command(name,exe,args,cwd=repo,extra={}){
 const step={name,command:[exe,...args],cwd,started:new Date().toISOString(),exit:null};report.steps.push(step);save();
 const log=fs.createWriteStream(path.join(out,name+".log"),{flags:"wx"});
 const exit=await new Promise((resolve,reject)=>{const child=spawnOwned(exe,args,{cwd,env:{...env,...extra},shell:false,windowsHide:true});step.ownerPid=child.pid;save();child.stdout.on("data",d=>log.write(d));child.stderr.on("data",d=>log.write(d));child.once("error",reject);child.once("close",(code,signal)=>{step.signal=signal;log.end(()=>resolve(code));});});
 Object.assign(step,{exit,finished:new Date().toISOString()});save();assert.equal(exit,0,name+" failed; inspect first occurrence");console.log(name+": passed");
}
async function maven(name,args,extra={}){
 Object.assign(process.env,{JAVA_HOME:jdk,MAVEN_ARGS:"--offline",CF_MAVEN_HOME:mavenHome,CF_MAVEN_BACKEND:back,CF_MAVEN_ARGFILE_ROOT:out});
 const invocation=mavenInvocation("win32",args,{argfile:true});
 await command(name,invocation.executable,invocation.args,back,extra);
}
function coherent(label){const source=sourceFor(candidate);report.integrity??=[];report.integrity.push({label,at:new Date().toISOString(),files:source.files.length,digest:source.digest});save();return source;}
try{
 if(phase==="prepare"){
  assert.ok(!fs.existsSync(candidate));fs.mkdirSync(candidate);
  const files=execFileSync("git",["ls-files","-z"],{cwd:repo,encoding:"utf8"}).split("\0").filter(Boolean).filter(f=>f.startsWith(".github/")||f.startsWith("controle-financeiro-backend/")||f.startsWith("controle-financeiro-frontend/")||["docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md","tasks/evidencias/CF-028/examples.json","tasks/evidencias/saneamento-CF-028-origem/snapshots.json"].includes(f));
  for(const file of files){const dest=path.join(candidate,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(repo,file),dest);assert.equal(hash(fs.readFileSync(dest)),hash(fs.readFileSync(path.join(repo,file))));}
  const commit=execFileSync("git",["rev-parse","HEAD"],{cwd:repo,encoding:"utf8"}).trim();
  const source=snapshot(candidate,{commit,branch:initial.branch,originalTreeChanges:[],export:"fresh current tracked inputs to short physical root; no dependencies or previous artifacts copied"});
  report.source={commit,digest:source.digest,files:source.files.length};
  const oldRoot=path.join(prior,"expanded-local-s/candidate"),original=read(path.join(oldRoot,".ci-source.json"));assert.deepEqual(componentInputs(source),componentInputs(original));
  const reuse=path.join(short,"reuse");fs.mkdirSync(reuse);const oldResult=read(path.join(prior,"windows-expanded/result.json"));
  fs.writeFileSync(path.join(reuse,"component-reuse.json"),JSON.stringify({root:oldRoot,sourceManifest:path.join(oldRoot,".ci-source.json"),controller:path.join(prior,"windows-expanded/result.json"),report:path.join(prior,"windows-expanded/components.json"),audit:path.join(prior,"windows-expanded/component-audit.json"),node:oldResult.node,platform:"win32",exit:0,runId:oldResult.runId},null,2)+"\n",{flag:"wx"});
  const linux=read(path.join(repo,"tasks/evidencias/componentes-completo-instrumentado/RODADA.json"));assert.equal(linux.result.uniqueIds,626);assert.equal(linux.result.exit,0);
  report.componentReuse={closureSha256:hash(JSON.stringify(componentInputs(source))),linuxOriginal:linux.rawProofs,unchangedClosure:true,reason:"Only E2E configs/helper, backend evidence destinations and operational CI changed; Vitest sources/config/package/lock all exact"};
  const tests=["ci","suites","sanitize","required","zoom-coverage","paths","components"].map(n=>".github/scripts/"+n+".test.mjs");
  await command("contracts",process.execPath,["--test","--test-reporter=tap",...tests],candidate);
  await command("frontend",process.execPath,[path.join(candidate,".github/scripts/ci.mjs"),"frontend",candidate,path.join(short,"fe")]);
  coherent("after-frontend");
  const control=path.join(short,"browser-control.mjs");fs.copyFileSync(path.join(import.meta.dirname,"browser-control.mjs"),control);
  await command("browser-control",process.execPath,[control,front,out,path.join(priorWin,"c/controle-financeiro-frontend/node_modules/playwright-core/.local-browsers/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe")],front,{DEBUG:"pw:browser"});
  await command("preflight",process.execPath,[path.join(repo,"tasks/evidencias/expanded-local-estabilizada/preflight-windows.mjs"),short,jdk,"01"]);
  const controlClasses=["com.controlefinanceiro.api.Pr3BrowserEvidenceProbe","com.controlefinanceiro.api.Rf15RemediationBrowserTest","com.controlefinanceiro.api.infra.security.UserIsolationBrowserIntegrationTest"];
  await maven("minimum",["-Duser.timezone=UTC","-Dspring.test.context.cache.maxSize=4","-Dtest="+controlClasses.join(","),"-DfailIfNoTests=true","-Dsurefire.failIfNoSpecifiedTests=true","-Dcf034.reportsDirectory="+path.join(out,"surefire"),"-Dcf.browser.evidence="+path.join(out,"browsers"),"-Dcf023.frontend.runtime="+path.join(out,"p23"),"-Dreview.grep=RF15-01: criação mobile por nome e teclado","test"]);
  report.minimum=requireBackendReports(path.join(out,"surefire"),{selected:controlClasses});
  coherent("after-minimum-controls");
 }else{
  const preparation=read(path.join(short,"prepare.json"));if(preparation.status!=="passed"){const approval=read(path.join(short,"minimum-approved.json"));assert.equal(approval.status,"passed");assert.equal(sourceFor(candidate).digest,approval.source.digest);for(const p of approval.proofs)assert.equal(hash(fs.readFileSync(p.file)),p.sha256);report.minimumReuse={file:path.join(short,"minimum-approved.json"),sha256:hash(fs.readFileSync(path.join(short,"minimum-approved.json")))};}const source=coherent("before-"+phase);report.source={commit:source.commit,digest:source.digest,files:source.files.length};
  if(phase==="focused"){
   const selected=read(path.join(permanent,"focused-selection.json"));assert.equal(selected.length,15);
   const context={candidate:source.commit,digest:source.digest,runId:"focused-15-01",decisionSha:hash(fs.readFileSync(path.join(candidate,"docs/sdd/decisoes/005-excecao-temporaria-zoom-expanded.md")))};
   await maven("focused-15",["-Duser.timezone=UTC","-Dspring.test.context.cache.maxSize=4","-Dtest="+selected.join(","),"-DfailIfNoTests=true","-Dsurefire.failIfNoSpecifiedTests=true","-Dcf034.reportsDirectory="+path.join(out,"surefire"),"-Dcf.browser.evidence="+path.join(out,"browsers"),"-Dcf023.frontend.runtime="+path.join(out,"p23"),"test"],{CF_ZOOM_EXCEPTION:"DEC-ZOOM-05",CF_ZOOM_CANDIDATE:context.candidate,CF_ZOOM_DIGEST:context.digest,CF_ZOOM_RUN:context.runId,CF_ZOOM_DECISION_SHA:context.decisionSha,CF_BROWSER_DIAGNOSTICS:"1"});
   report.backend=requireBackendReports(path.join(out,"surefire"),{selected});
   report.rf15=verifyDirectory(path.join(out,"browsers/Rf15RemediationBrowserTest/zoom-selection"),context);
  }else{
   assert.equal(read(path.join(short,"focused.json")).status,"passed");
   await command("remaining",process.execPath,[path.join(candidate,".github/scripts/ci.mjs"),"remaining",candidate,path.join(short,"all")]);
   report.result=read(path.join(short,"all/result.json"));
  }
  coherent("after-"+phase);
 }
 report.status="passed";
}catch(error){report.status="failed";report.error=error.stack;process.exitCode=1;console.error(error.message);}
finally{report.finished=new Date().toISOString();save();fs.copyFileSync(path.join(short,phase+".json"),path.join(permanent,path.basename(short)+"-"+phase+".json"));console.log(JSON.stringify({phase,status:report.status,error:report.error}));}
