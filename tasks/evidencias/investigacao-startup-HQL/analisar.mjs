import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {eventsFromChunks} from './jfr-stream.mjs';

const root=path.resolve(process.argv[2]);
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao')+path.sep)&&path.basename(root).startsWith('startup-hql-'));
const out='tasks/evidencias/investigacao-startup-HQL';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const javaHome=path.resolve('controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1');
const names=['native-control','image-control','native-instrumented','image-instrumented'];
const markers={spring:'Starting ControleFinanceiroApiApplication',repositories:'Finished Spring Data repository scanning',webInitialized:'Tomcat initialized',dbConnected:'Added connection',jpaValidated:'Initialized JPA EntityManagerFactory',queryPreparation:'HQL parser will be used',webStarted:'Tomcat started on port',springStarted:'Started ControleFinanceiroApiApplication',dispatcher:'Initializing Servlet'};
const records=[];
function invokeJfr(args,file){
 if(fs.existsSync(file))return; // Re-analyse immutable extraction after a parser failure; no new JVM start.
 const fd=fs.openSync(file,'wx');let p;
 try{p=spawnSync(path.join(javaHome,'bin/jfr.exe'),args,{windowsHide:true,stdio:['ignore',fd,'pipe']});}finally{fs.closeSync(fd);}
 assert.equal(p.status,0,p.stderr?.toString());
}
const duration=s=>Number(/^PT([\d.]+)S$/.exec(String(s))?.[1]??0)*1000;
for(const name of names){
 const folder=path.join(root,name),r=JSON.parse(fs.readFileSync(path.join(folder,'observation.json')));
 const text=fs.readFileSync(path.join(folder,'process.log'),'utf8'),lines=text.split(/\r?\n/);
 const image=name.startsWith('image'),pid=Number(text.match(/with PID (\d+)/)?.[1]);
 assert.equal(pid,image?1:r.clientPid,'Application PID must match its own Process/log (or JVM1 in named Docker)');
 const milestones=Object.fromEntries(Object.entries(markers).map(([key,marker])=>{
  const line=lines.find(l=>l.includes(marker)),timestamp=line?.match(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}/)?.[0];
  return [key,timestamp?Date.parse(timestamp.replace(' ','T')+(image?'Z':'-03:00'))-Date.parse(r.creationWallUtc):null];
 }));
 const samples=r.samples,validCpu=samples.filter(s=>s.hostCpuLoad>0);
 const resource={samples:samples.length,hostCpuLoadMin:Math.min(...validCpu.map(s=>s.hostCpuLoad)),hostCpuLoadMax:Math.max(...validCpu.map(s=>s.hostCpuLoad)),
  freeMemoryMin:Math.min(...samples.map(s=>s.hostFreeMemoryBytes)),freeMemoryMax:Math.max(...samples.map(s=>s.hostFreeMemoryBytes)),
  clientCpuLastMs:samples.at(-1)?.clientCpuMs,clientCpuIsApplicationCpu:!image,observerWorkTotalMs:samples.reduce((n,s)=>n+s.observerWorkMs,0),observerWorkMaxMs:Math.max(...samples.map(s=>s.observerWorkMs))};
 const record={name,pid,clientPid:r.clientPid,creationWallUtc:r.creationWallUtc,startReturnedMs:r.startReturnedMs,gateStartMs:r.gateStartMs,gateElapsedMs:r.gateElapsedMs,readinessMs:r.readinessMs,
  originalAwaitReturnedSuccess:r.originalAwaitReturnedSuccess,within40SecondsFromGate:r.within40SecondsFromGate,within40SecondsFromCreation:r.within40SecondsFromCreation,
  milestones,jpaToBindMs:milestones.webStarted-milestones.jpaValidated,bindToReadyMs:r.readinessMs-milestones.webStarted,
  port:r.port,liveness:r.liveness,livenessObservedMs:r.livenessObservedMs,functionalUnauthenticatedAccounts:r.functionalUnauthenticatedAccounts,
  functionalObservedMs:r.functionalObservedMs,closeMs:r.closeMs,cleanupConfirmed:r.cleanupConfirmed,aliveAfterCleanup:r.aliveAfterCleanup,
  exitAfterCleanup:r.exitAfterCleanup,logSha256:sha(path.join(folder,'process.log')),resource};
 if(r.instrumented){
  const agent=text.match(/BOOT_AGENT\|(\d+)\|(\d+)/);assert.ok(agent,'Agent must have started');
  const offset=Number(agent[2])-Date.parse(r.creationWallUtc),nanoBase=BigInt(agent[1]);
  const elapsed=n=>Number(BigInt(n)-nanoBase)/1e6+offset;
  const stacks=new Map(),queries=[];let method='unknown';
  for(const line of lines){
   const at=line.indexOf('BOOT_');if(at<0)continue;const p=line.slice(at).split('|');
   if(p[0]==='BOOT_METHOD')method=p[2];
   if(p[0]==='BOOT_QUERY_BEGIN'){const stack=stacks.get(p[2])??[];stack.push({start:p[1],hash:p[3],length:Number(p[4]),method});stacks.set(p[2],stack);}
   if(p[0]==='BOOT_QUERY_END'){
    const stack=stacks.get(p[2])??[],begin=stack.pop();assert.ok(begin,'Unmatched query event');assert.equal(begin.hash,p[3]);
    if(!stack.length)queries.push({...begin,origin:p[2],ms:Number(p[4])/1e6,startMs:elapsed(begin.start),endMs:elapsed(p[1]),result:p[5]});
   }
  }
  assert.ok([...stacks.values()].every(s=>!s.length),'Incomplete trace');
  const aggregate=origin=>{
   const qs=queries.filter(q=>q.origin.endsWith(origin)),counts={};
   for(const q of qs)counts[q.hash]=(counts[q.hash]??0)+1;
   return {calls:qs.length,distinctHashes:Object.keys(counts).length,totalMs:qs.reduce((n,q)=>n+q.ms,0),maxMs:Math.max(...qs.map(q=>q.ms)),firstStartMs:qs[0]?.startMs,lastEndMs:qs.at(-1)?.endMs,
    repeatedHashes:Object.entries(counts).filter(([,n])=>n>1),slowest:[...qs].sort((a,b)=>b.ms-a.ms).slice(0,8)};
  };
  record.hql=aggregate('.forHql');record.hibernateValidation=aggregate('.createQuery');record.queries=queries;
  assert.ok(!text.includes('[Byte Buddy] ERROR'),'Agent transformation error');
  const jfr=path.join(root,'agent',name+'.jfr'),selected=path.join(folder,'jfr-selected.json'),summary=path.join(folder,'jfr-summary.txt');
  assert.equal(r.jfrDumpExit,0);assert.ok(fs.statSync(jfr).size>0);
  invokeJfr(['summary',jfr],summary);
  const eventTypes='jdk.ExecutionSample,jdk.CPULoad,jdk.GarbageCollection,jdk.GCPhasePause,jdk.ThreadPark,jdk.JavaMonitorEnter,jdk.SocketRead,jdk.FileRead,jdk.ClassLoadingStatistics,jdk.Compilation';
  invokeJfr(['print','--json','--stack-depth','64','--events',eventTypes,jfr],selected);
  const events=[];let selectedCount=0;
  for await(const event of eventsFromChunks(fs.createReadStream(selected,{encoding:'utf8',highWaterMark:65536}))){
   selectedCount++;
   if(eventTypes.split(',').includes(event.type))events.push(event);
  }
  // Exclude post-readiness requests, dump and cleanup from the startup analysis.
  const startupEnd=Date.parse(r.creationWallUtc)+r.readinessMs;
  const inStartup=events.filter(e=>Date.parse(e.values.startTime)<=startupEnd);
  const counts={},categories={},leaves={};
  for(const e of inStartup){
   counts[e.type]=(counts[e.type]??0)+1;
   if(e.type!=='jdk.ExecutionSample'||e.values.sampledThread?.javaName!=='main')continue;
   const frames=e.values.stackTrace?.frames??[],ns=frames.map(f=>f.method.type.name+'.'+f.method.name),all=ns.join('\n');
   const category=/net\/bytebuddy/.test(all)?'agent':/springframework\/data\/jpa\/repository\/query\/HqlParser/.test(all)?'spring-data-hql':/hibernate\/grammars\/hql/.test(all)?'hibernate-hql':/org\/antlr/.test(all)?'antlr-owner-not-in-stack':/ClassLoader|BuiltinClassLoader|defineClass/.test(all)?'class-loading':/postgresql/.test(all)?'jdbc':'other';
   categories[category]=(categories[category]??0)+1;leaves[ns[0]]=(leaves[ns[0]]??0)+1;
  }
  const sum=(type,filter=()=>true)=>{const es=inStartup.filter(e=>e.type===type&&filter(e));return {count:es.length,totalMs:es.reduce((n,e)=>n+duration(e.values.duration),0),maxMs:Math.max(0,...es.map(e=>duration(e.values.duration)))};};
  const cpu=inStartup.filter(e=>e.type==='jdk.CPULoad').map(e=>e.values);
  record.jfr={file:jfr,sha256:sha(jfr),bytes:fs.statSync(jfr).size,dumpMs:r.jfrDumpMs,allExtractedEvents:selectedCount,analysedEvents:events.length,startupSelectedEvents:inStartup.length,eventTypes,
   startupCutoffUtc:new Date(startupEnd).toISOString(),counts,mainSampleCategories:categories,topMainLeafFrames:Object.entries(leaves).sort((a,b)=>b[1]-a[1]).slice(0,8),
   gc:sum('jdk.GarbageCollection'),gcPause:sum('jdk.GCPhasePause'),mainPark:sum('jdk.ThreadPark',e=>e.values.eventThread?.javaName==='main'),
   mainMonitor:sum('jdk.JavaMonitorEnter',e=>e.values.eventThread?.javaName==='main'),mainSocketRead:sum('jdk.SocketRead',e=>e.values.eventThread?.javaName==='main'),mainFileRead:sum('jdk.FileRead',e=>e.values.eventThread?.javaName==='main'),
   cpuSamples:cpu.length,jvmUserMean:cpu.reduce((n,x)=>n+x.jvmUser,0)/cpu.length,machineTotalMean:cpu.reduce((n,x)=>n+x.machineTotal,0)/cpu.length};
 }
 records.push(record);
}
assert.ok(fs.readFileSync(path.join(root,'image-jar-sha256.txt'),'utf8').includes('b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b'));
const result={at:new Date().toISOString(),records,classification:'E: historical startup overruns remain inconclusive; four new observations meet 40s without a causal fix',
 limitations:'Fresh JVMs, not OS-cold caches. Fixed sequential order confounds cache warming with instrumentation. JFR sampling/thresholds do not give exact CPU attribution or prove absence of all waits. Gate and creation clocks are separate. No product change or new package.'};
fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(records.map(({queries,jfr,...r})=>({...r,hql:r.hql&&{...r.hql,slowest:r.hql.slowest.slice(0,1)},jfr:jfr&&{...jfr,topMainLeafFrames:undefined}})),null,2));
