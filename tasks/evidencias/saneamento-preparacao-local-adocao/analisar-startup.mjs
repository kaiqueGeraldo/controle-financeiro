import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const run=path.resolve(process.argv[2]);
if(!run.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/saneamento-')))throw Error('Sanitation runtime required');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const timeline=JSON.parse(fs.readFileSync(path.join(run,'timeline.json')));
const analysis=timeline.map(record=>{
 const log=fs.readFileSync(path.join(run,record.mode,'process.log'),'utf8'),lines=log.split(/\r?\n/);
 const agent=log.match(/BOOT_AGENT\|(\d+)\|(\d+)/),base=agent?Number(agent[1]):0,wall=agent?Number(agent[2]):0;
 const ms=nano=>(Number(nano)-base)/1e6+wall-Date.parse(record.wallStartUtc);
 let method='unknown';const stacks=new Map(),queries=[];
 for(const line of lines){
  const at=line.indexOf('BOOT_');if(at<0)continue;const p=line.slice(at).split('|');
  if(p[0]==='BOOT_METHOD')method=p[2];
  if(p[0]==='BOOT_QUERY_BEGIN') {const stack=stacks.get(p[2])??[];stack.push({start:p[1],hash:p[3],length:Number(p[4]),method});stacks.set(p[2],stack);}
  if(p[0]==='BOOT_QUERY_END'){const stack=stacks.get(p[2])??[],begin=stack.pop();if(!begin)throw Error('Unmatched query event');
   if(!stack.length)queries.push({...begin,origin:p[2],ms:Number(p[4])/1e6,startMs:ms(begin.start),endMs:ms(p[1]),result:p[5]});}
 }
 if([...stacks.values()].some(x=>x.length))throw Error('Incomplete query trace');
 const hql=queries.filter(x=>x.origin.endsWith('.forHql')),hibernate=queries.filter(x=>x.origin.endsWith('.createQuery'));
 const markers={jvm:'Starting ControleFinanceiroApiApplication',repositories:'Finished Spring Data repository scanning',webInitialized:'Tomcat initialized',dbConnected:'Added connection',jpaValidated:'Initialized JPA EntityManagerFactory',queryPreparation:'HQL parser will be used',webStarted:'Tomcat started on port',dispatcher:'Initializing Servlet'};
 const milestones=Object.fromEntries(Object.entries(markers).map(([name,marker])=>{
  const line=lines.find(line=>line.includes(marker)),timestamp=line?.match(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}/)?.[0];
  return [name,timestamp?Date.parse(timestamp.replace(' ','T')+(record.mode==='native'?'-03:00':'Z'))-Date.parse(record.wallStartUtc):null];
 }));
 const counts={};for(const q of hql)counts[q.hash]=(counts[q.hash]??0)+1;
 return {mode:record.mode,readyMs:record.readyMs,originalBudgetPassed:record.budgetPassed,milestones,
  hql:{calls:hql.length,distinctHashes:Object.keys(counts).length,totalMs:hql.reduce((n,q)=>n+q.ms,0),maxMs:Math.max(...hql.map(q=>q.ms)),
   firstStartMs:hql[0]?.startMs,lastEndMs:hql.at(-1)?.endMs,repeatedHashes:Object.entries(counts).filter(([,n])=>n>1),slowest:[...hql].sort((a,b)=>b.ms-a.ms).slice(0,8)},
  hibernateValidation:{outerCalls:hibernate.length,totalMs:hibernate.reduce((n,q)=>n+q.ms,0),maxMs:Math.max(...hibernate.map(q=>q.ms))},
  queries,logSha256:sha(path.join(run,record.mode,'process.log')),instrumentationErrors:log.includes('[Byte Buddy] ERROR')};
});
const selectedFile=path.join(run,fs.existsSync(path.join(run,'jfr-selected-depth64.json'))?'jfr-selected-depth64.json':'jfr-selected.json');
const events=JSON.parse(fs.readFileSync(selectedFile,'utf8').replace(/^\uFEFF/,'')).recording.events;
const detail=path.join(run,'jfr-detail.json');if(fs.existsSync(detail))events.push(...JSON.parse(fs.readFileSync(detail,'utf8').replace(/^\uFEFF/,'')).recording.events);
const counts={},mainCategories={},leaves={};
for(const e of events){counts[e.type]=(counts[e.type]??0)+1;if(e.type!=='jdk.ExecutionSample'||e.values.sampledThread?.javaName!=='main')continue;
 const frames=e.values.stackTrace?.frames??[],names=frames.map(f=>f.method.type.name+'.'+f.method.name),all=names.join('\n');
 const category=/net\/bytebuddy/.test(all)?'diagnostic-agent':/springframework\/data\/jpa\/repository\/query\/HqlParser/.test(all)?'spring-data-hql':/hibernate\/grammars\/hql/.test(all)?'hibernate-hql':/org\/antlr/.test(all)?'antlr-owner-not-in-stack':/ClassLoader|BuiltinClassLoader|defineClass/.test(all)?'class-loading':/postgresql/.test(all)?'jdbc':'other';
 mainCategories[category]=(mainCategories[category]??0)+1;leaves[names[0]]=(leaves[names[0]]??0)+1;
}
const cpu=events.filter(e=>e.type==='jdk.CPULoad').map(e=>e.values);
const durationMs=s=>Number(String(s).match(/^PT([\d.]+)S$/)?.[1]??0)*1000;
const gc=events.filter(e=>e.type==='jdk.GarbageCollection');
const parked=events.filter(e=>e.type==='jdk.ThreadPark'&&e.values.eventThread?.javaName==='main');
const socket=events.filter(e=>e.type==='jdk.SocketRead'&&e.values.eventThread?.javaName==='main');
const summary={analysis,jfr:{file:'agent/image.jfr',sha256:sha(path.join(run,'agent/image.jfr')),bytes:fs.statSync(path.join(run,'agent/image.jfr')).size,selectedEventsFile:path.basename(selectedFile),selectedEventsSha256:sha(selectedFile),eventCounts:counts,
 mainCpuSamples:mainCategories,topMainLeafFrames:Object.entries(leaves).sort((a,b)=>b[1]-a[1]).slice(0,8),
 cpuSamples:cpu.length,machineTotalMean:cpu.reduce((n,x)=>n+x.machineTotal,0)/cpu.length,jvmUserMean:cpu.reduce((n,x)=>n+x.jvmUser,0)/cpu.length,
 gcEvents:gc.length,gcTotalMs:gc.reduce((n,e)=>n+durationMs(e.values.duration),0),
 mainParkCount:parked.length,mainParkTotalMs:parked.reduce((n,e)=>n+durationMs(e.values.duration),0),mainSocketReadCount:socket.length,mainSocketReadTotalMs:socket.reduce((n,e)=>n+durationMs(e.values.duration),0)},
 nativeJfr:{bytes:fs.statSync(path.join(run,'native.jfr')).size,valid:false,reason:'Windows Process.destroy did not flush dumponexit; empty recording is not evidence'},
 limitation:'Two instrumented observations did not reproduce the historical HQL budget overrun. Agent/JFR add work and may change JIT/class loading. Samples are not exact CPU-time attribution; no production correction or SLO inferred.'};
fs.writeFileSync(path.join(run,'startup-analysis-final.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({processes:analysis.map(x=>({mode:x.mode,readyMs:x.readyMs,hqlCalls:x.hql.calls,hqlMs:x.hql.totalMs,hqlMaxMs:x.hql.maxMs,hibernateMs:x.hibernateValidation.totalMs,milestones:x.milestones})),jfr:summary.jfr,nativeJfr:summary.nativeJfr}));
