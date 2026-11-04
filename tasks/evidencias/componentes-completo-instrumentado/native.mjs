import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {spawn,execFileSync} from "node:child_process";
import {hash,sourceFor} from "/work/s/.github/scripts/source.mjs";
import {requireComponentCoverage} from "/work/s/.github/scripts/components.mjs";
import {componentSummary,requireCounts} from "/work/s/.github/scripts/ci.mjs";
const root="/work/s",front=root+"/controle-financeiro-frontend",out="/evidence/linux"+(process.env.CF_OBS_PREP_ATTEMPT?"-"+process.env.CF_OBS_PREP_ATTEMPT:""),obs="/work/obs";
fs.mkdirSync(out,{recursive:true});
const source=sourceFor(root), report={started:new Date().toISOString(),source,steps:[],status:"running"};
const save=()=>fs.writeFileSync(out+"/flow.json",JSON.stringify(report,null,2)+"\n");
const env={...process.env,CF034_SUITE:"expanded",PLAYWRIGHT_BROWSERS_PATH:"0",NEXT_TELEMETRY_DISABLED:"1",BACKEND_API_URL:"http://127.0.0.1:65535"};
const npm=fs.realpathSync(execFileSync("which",["npm"],{encoding:"utf8"}).trim());
async function command(name,executable,args,cwd=front,extra={},expected=0) {
  const entry={name,command:[executable,...args],cwd,extra,started:new Date().toISOString(),exit:null};report.steps.push(entry);save();
  const log=fs.createWriteStream(out+"/"+name+".log",{flags:"wx"});
  const code=await new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{cwd,env:{...env,...extra},stdio:["ignore","pipe","pipe"]});entry.pid=child.pid;save();
    child.stdout.on("data",d=>log.write(d));child.stderr.on("data",d=>log.write(d));
    child.once("error",reject);child.once("close",(code,signal)=>{entry.signal=signal;log.end(()=>resolve(code));});
  });
  entry.exit=code;entry.finished=new Date().toISOString();save();
  assert.equal(code,expected,name+" failed; preserve first occurrence");
  console.log(name+": completed");
}
const tests=["ci","suites","sanitize","required","zoom-coverage","paths","components"].map(n=>".github/scripts/"+n+".test.mjs");
let sampleTimer,sampleBusy=false,samples=0;
async function sample() {
 if(sampleBusy)return;sampleBusy=true;const begin=process.hrtime.bigint();
 try {
  const processes=[];
  for(const pid of fs.readdirSync("/proc").filter(p=>/^\d+$/.test(p))) {
    try {const stat=fs.readFileSync("/proc/"+pid+"/stat","utf8"),end=stat.lastIndexOf(")"),fields=stat.slice(end+2).split(" ");
      const cmd=fs.readFileSync("/proc/"+pid+"/cmdline","utf8").replaceAll("\0"," ").slice(0,400);
      processes.push({pid:Number(pid),name:stat.slice(stat.indexOf("(")+1,end),ppid:Number(fields[1]),utime:Number(fields[11]),stime:Number(fields[12]),rssPages:Number(fields[21]),cmd});
    } catch {}
  }
  const cgroup={};for(const name of ["cpu.max","cpu.stat","cpu.pressure","memory.max","memory.current","memory.peak","memory.events","memory.pressure","pids.current","pids.max"])try{cgroup[name]=fs.readFileSync("/sys/fs/cgroup/"+name,"utf8");}catch{}
  const snapshot={at:Date.now(),uptime:fs.readFileSync("/proc/uptime","utf8"),load:fs.readFileSync("/proc/loadavg","utf8"),cpu:fs.readFileSync("/proc/stat","utf8").split("\n")[0],memory:fs.readFileSync("/proc/meminfo","utf8"),cgroup,processes,samplerNs:Number(process.hrtime.bigint()-begin)};
  await fs.promises.appendFile(out+"/resources.jsonl",JSON.stringify(snapshot)+"\n");samples++;
 } finally {sampleBusy=false;}
}
try {
 await command("contracts",process.execPath,["--test","--test-reporter=tap",...tests],root);
 const contract=fs.readFileSync(out+"/contracts.log","utf8");assert.match(contract,/# tests 43/);assert.match(contract,/# fail 0/);assert.match(contract,/# skipped 0/);
 await command("install",process.execPath,[npm,"ci","--no-audit","--no-fund"]);
 await command("lint",process.execPath,[npm,"run","lint","--","--max-warnings=0"]);
 await command("typecheck",process.execPath,[npm,"run","typecheck"]);
 await command("unit",process.execPath,[npm,"test"]);
 const unit=fs.readFileSync(out+"/unit.log","utf8"),unitCounts=[...unit.matchAll(/# tests (\d+)/g)].map(m=>Number(m[1]));
 assert.equal(unitCounts.length,3);assert.equal(unitCounts.reduce((a,b)=>a+b,0),18);assert.ok(![...unit.matchAll(/# (?:skipped|todo|cancelled|fail) (\d+)/g)].some(m=>Number(m[1])));
 fs.symlinkSync(front+"/node_modules",obs+"/node_modules","dir");
 const smoke=obs+"/smoke";fs.mkdirSync(smoke);
 fs.writeFileSync(smoke+"/observer.test.ts",'import {test,expect} from "vitest"; test("synthetic one",()=>expect(1).toBe(1));test("synthetic two",()=>expect(2).toBe(2));test("synthetic expected error",()=>expect(3).toBe(4));\n');
 fs.writeFileSync(smoke+"/vitest.config.mts",'import {defineConfig} from "vitest/config";export default defineConfig({test:{root:"/work/obs/smoke",include:["*.test.ts"],setupFiles:["/work/obs/setup.mjs","/work/obs/cleanup-setup.mjs"]}});\n');
 await command("observer-preparation",process.execPath,["node_modules/vitest/vitest.mjs","run","--config",smoke+"/vitest.config.mts","--reporter=default","--reporter=json","--reporter="+obs+"/reporter.mjs","--outputFile="+out+"/smoke.json"],front,{CF_OBS_OUT:out+"/smoke"},1);
 const smokeResult=JSON.parse(fs.readFileSync(out+"/smoke/observer.json"));assert.equal(smokeResult.collected.length,3);assert.equal(smokeResult.completed.length,3);assert.equal(new Set(smokeResult.completed.map(x=>x.id)).size,3);assert.ok(smokeResult.completed.every(x=>x.observation?.pid>0));assert.equal(smokeResult.completed.filter(x=>x.result.state==="failed").length,1);
 await command("instrument",process.execPath,[obs+"/instrument.mjs"],root);
 const delta=JSON.parse(fs.readFileSync("/evidence/instrumentation.json")),observedFiles=source.files.map(f=>({...f,sha256:delta.find(d=>d.path===f.path)?.after??f.sha256}));
 const observedDigest=hash(JSON.stringify(observedFiles));
 report.context={candidate:source.commit,digest:observedDigest,runId:path.basename(process.env.CF_COMPONENT_RUNTIME)};report.baseDigest=source.digest;
 report.conditions={node:process.version,vitest:JSON.parse(fs.readFileSync(front+"/node_modules/vitest/package.json")).version,lockSha:hash(fs.readFileSync(front+"/package-lock.json")),cpuCount:(await import("node:os")).availableParallelism(),cpuInfo:(await import("node:os")).cpus().map(x=>x.model),memory:(await import("node:os")).totalmem(),filesystem:execFileSync("stat",["-f","-c","%T",root],{encoding:"utf8"}).trim(),timers:"Vitest real timers; testTimeout default5000/hook10000; fixedNow metadata does not install fake timers; setup source unmodified",timeoutOverrides:false,retries:0};
 save();await sample();sampleTimer=setInterval(()=>{void sample();},1000);
 fs.writeFileSync(out+"/component-attempt-start.json",JSON.stringify({at:new Date().toISOString(),sourceCommit:source.commit,baseDigest:source.digest,observedDigest,soleLinuxFullAttempt:true})+"\n",{flag:"wx"});
 await command("components",process.execPath,["node_modules/vitest/vitest.mjs","run","--config",obs+"/vitest.config.mts","--reporter=default","--reporter=json","--reporter=./tests/component/audit-reporter.mjs","--reporter="+obs+"/reporter.mjs","--outputFile="+out+"/components.json"],front,{TZ:"America/Sao_Paulo",CF_TEST_TIMEZONE:"America/Sao_Paulo",CF_COMPONENT_AUDIT:out+"/component-audit.json",CF_COMPONENT_CONTEXT:JSON.stringify(report.context),CF_OBS_OUT:out+"/observation"});
 const json=JSON.parse(fs.readFileSync(out+"/components.json")),audit=JSON.parse(fs.readFileSync(out+"/component-audit.json")),observer=JSON.parse(fs.readFileSync(out+"/observation/observer.json"));
 report.summary=componentSummary(json,root);requireCounts(report.summary.counts,"components");
 report.coverage=requireComponentCoverage(json,audit,report.context,front);
 assert.equal(json.numTotalTests,626);assert.equal(json.testResults.length,71);assert.equal(json.success,true);
 const expected=JSON.parse(fs.readFileSync("/evidence/expected-selection.json"));
 const actual=json.testResults.flatMap(f=>f.assertionResults.map(t=>JSON.stringify([path.relative(front,f.name).split(path.sep).join("/"),t.fullName]))).sort();
 const expectedIds=expected.identities??expected.sortedIdentities??expected.selection;
 assert.deepEqual(actual,expectedIds);
 for(const list of [observer.collected,observer.completed,observer.events.filter(x=>x.event==="start"),observer.events.filter(x=>x.event==="end")])assert.equal(new Set(list.map(x=>x.id)).size,626);
 const ids=list=>list.map(x=>x.id).sort();assert.deepEqual(ids(observer.collected),ids(observer.completed));assert.deepEqual(ids(observer.collected),ids(observer.events.filter(x=>x.event==="start")));assert.deepEqual(ids(observer.collected),ids(observer.events.filter(x=>x.event==="end")));
 assert.equal(observer.remainingActive.length,0);assert.equal(observer.errors.length,0);assert.equal(observer.reason,"passed");
 assert.equal(observer.moduleEvents.filter(x=>x.event==="start").length,71);assert.equal(observer.moduleEvents.filter(x=>x.event==="end").length,71);
 assert.ok(observer.completed.every(x=>x.result.state==="passed"&&x.observation?.pid>0&&x.diagnostic.retryCount===0&&x.diagnostic.repeatCount===0));
 report.observerValidation={uniqueIds:626,files:71,startedEnded:true,metadataComplete:true,selectionSha:hash(JSON.stringify(actual)),pids:[...new Set(observer.completed.map(x=>x.observation.pid))]};
 report.status="components-passed";
} catch(error) {report.status="failed";report.error=error.stack;process.exitCode=1;console.error(error.stack);}
finally {
 clearInterval(sampleTimer);while(sampleBusy)await new Promise(r=>setTimeout(r,10));if(samples)await sample();
 // Restore only the two recorded observation overlays, byte-for-byte from verified current inputs.
 if(fs.existsSync("/evidence/instrumentation.json"))for(const d of JSON.parse(fs.readFileSync("/evidence/instrumentation.json"))){assert.equal(hash(fs.readFileSync(root+"/"+d.path)),d.after);fs.copyFileSync("/inputs/"+d.path,root+"/"+d.path);assert.equal(hash(fs.readFileSync(root+"/"+d.path)),d.before);}
 report.restoredSourceDigest=sourceFor(root).digest;report.samples=samples;save();
}
if(report.status==="components-passed"){
 try {await command("build",process.execPath,[npm,"run","build"]);await command("browser-install",process.execPath,[npm,"run","test:e2e:install"]);report.status="passed";report.buildId=fs.readFileSync(front+"/.next/BUILD_ID","utf8").trim();}
 catch(error){report.status="failed";report.error=error.stack;process.exitCode=1;}
}
report.finished=new Date().toISOString();save();console.log(JSON.stringify({status:report.status,error:report.error,summary:report.summary,coverage:report.coverage}));
