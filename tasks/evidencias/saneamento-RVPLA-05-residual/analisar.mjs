import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const phase=process.argv[2],results=[];
assert.ok(['antes','depois'].includes(phase));
for(const input of process.argv.slice(3)) {
  const root=path.resolve(input),measurement=JSON.parse(fs.readFileSync(path.join(root,'results.json')));
  const rows=fs.readFileSync(path.join(root,'trace.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const b=rows.find(r=>r.event==='spawned'&&r.resume&&r.executable.toLowerCase().startsWith('node'));
  const end=rows.find(r=>r.event==='child-close'&&r.pid===b.pid&&r.childPid===b.childPid),origin=BigInt(b.ns);
  const ms=ns=>Number(BigInt(ns)-origin)/1e6,total=ms(end.ns);
  const own=rows.filter(r=>r.pid===b.childPid),worker=rows.find(r=>r.event==='process-start'&&r.role==='worker'&&BigInt(r.ns)>origin&&BigInt(r.ns)<BigInt(end.ns));
  const participants=new Set([b.childPid,worker?.pid]),intervals=[];
  function add(category,start,finish,detail={}){
    const from=Math.max(0,start),to=Math.min(total,finish);
    if(to>=from)intervals.push({category,fromMs:from,toMs:to,...detail});
  }
  const queries=own.filter(r=>r.event==='execFileSync-end').map(r=>{
    const start=own.findLast(x=>x.event==='execFileSync-start'&&x.mode===r.mode&&x.jobName===r.jobName&&BigInt(x.ns)<BigInt(r.ns));
    const value={mode:r.mode,jobName:r.jobName,fromMs:ms(start.ns),toMs:ms(r.ns),elapsedMs:r.ms};
    add('consultas externas',value.fromMs,value.toMs,{mode:r.mode,jobName:r.jobName});return value;
  });
  const commandSpans=own.filter(r=>r.event==='spawned'&&r.kind==='command').map(r=>{
    const start=own.findLast(x=>x.event==='spawn-start'&&x.jobName===r.jobName&&BigInt(x.ns)<=BigInt(r.ns));
    const close=own.find(x=>x.event==='child-close'&&x.childPid===r.childPid);
    const value={pid:r.childPid,tool:r.tool,jobName:r.jobName,fromMs:ms(start.ns),toMs:close?ms(close.ns):total,censored:!close};
    add('comandos contidos',value.fromMs,value.toMs,{tool:r.tool,pid:r.childPid,censored:!close});return value;
  });
  const controllerStart=own.find(r=>r.event==='process-start');
  if(controllerStart)add('inicialização',0,ms(controllerStart.ns));
  const guardian=own.find(r=>r.event==='spawned'&&r.kind==='worker');
  const guardianStart=guardian&&own.findLast(r=>r.event==='spawn-start'&&r.jobName===guardian.jobName&&BigInt(r.ns)<=BigInt(guardian.ns));
  if(guardianStart&&worker)add('inicialização',ms(guardianStart.ns),ms(worker.ns));
  const workerEnd=rows.find(r=>r.pid===worker?.pid&&r.event==='process-exit');
  const guardianEnd=guardian&&own.find(r=>r.event==='child-close'&&r.childPid===guardian.childPid);
  if(workerEnd&&guardianEnd)add('fechamento worker/guardião',ms(workerEnd.ns),ms(guardianEnd.ns));
  const lastQuery=queries.at(-1);
  if(lastQuery?.mode==='closed'&&lastQuery.jobName===guardian?.jobName)add('retorno do controller',lastQuery.toMs,total);
  const files=rows.filter(r=>participants.has(r.pid)&&BigInt(r.ns)>=origin&&BigInt(r.ns)<=BigInt(end.ns)&&['file-read','file-write','atomic-publish','fsync'].includes(r.event));
  for(const r of files)add('I/O fora das etapas acima',ms(r.ns)-(r.ms??0),ms(r.ns),{event:r.event,file:r.file});
  const publications=rows.filter(r=>r.pid===worker?.pid&&r.event==='atomic-publish'&&r.file.includes('.owned-runs')&&path.basename(r.file).startsWith('mailbox-'));
  const communication=[];
  for(const r of publications){
    const request=JSON.parse(fs.readFileSync(path.join(root,'execution',r.file)));
    const reply=rows.find(x=>x.pid===worker.pid&&x.event==='file-read'&&x.file.endsWith('reply-'+request.requestId+'.json')&&BigInt(x.ns)>BigInt(r.ns));
    if(!reply)continue;
    add('comunicação/ponte fora das etapas acima',ms(r.ns),ms(reply.ns),{requestId:request.requestId,mode:request.mode});
    communication.push({mode:request.mode,sequence:request.sequence,requestId:request.requestId,publishedMs:ms(r.ns),receivedMs:ms(reply.ns)});
  }
  // Partition the wall clock. Earlier categories own overlap; nested I/O/IPC
  // is never added again on top of query/command durations.
  const points=[...new Set([0,total,...intervals.flatMap(r=>[r.fromMs,r.toMs])])].sort((a,b)=>a-b),exclusive={};
  for(let i=1;i<points.length;i++){
    const mid=(points[i-1]+points[i])/2,owner=intervals.find(r=>r.fromMs<=mid&&r.toMs>=mid)?.category??'parcela não explicada';
    exclusive[owner]=(exclusive[owner]??0)+points[i]-points[i-1];
  }
  assert.ok(Math.abs(Object.values(exclusive).reduce((a,b)=>a+b,0)-total)<0.001);
  const nativeProfiles=[];
  if(fs.existsSync(path.join(root,'metrics')))for(const file of fs.readdirSync(path.join(root,'metrics'))){
    const phases=fs.readFileSync(path.join(root,'metrics',file),'utf8').trim().split('\n').map(s=>{const[phase,ticks,freq]=s.split('\t');return{phase,ms:ms(BigInt(ticks)*1000000000n/BigInt(freq))};});
    const enter=phases.find(p=>p.phase==='script-enter'),ready=phases.find(p=>p.phase==='type-ready'),reply=phases.findLast(p=>p.phase==='reply-ready');
    const query=queries.find(q=>enter.ms>=q.fromMs&&enter.ms<=q.toMs);if(!query||!ready||!reply)continue;
    nativeProfiles.push({pid:Number(file.split('.')[0]),mode:query.mode,spawnAndStartupMs:enter.ms-query.fromMs,addTypeMs:ready.ms-enter.ms,configurationNativeAndSerializationMs:reply.ms-ready.ms,shutdownMs:query.toMs-reply.ms,totalMs:query.toMs-query.fromMs,phases});
  }
  const timeline=rows.filter(r=>participants.has(r.pid)&&BigInt(r.ns)>=origin&&BigInt(r.ns)<=BigInt(end.ns)&&(['spawn-start','spawned','child-close','execFileSync-start','execFileSync-end','process-start','process-exit'].includes(r.event)||(r.event==='atomic-publish'&&r.state)||r.event==='file-write')).map(r=>({...r,relativeMs:ms(r.ns)}));
  results.push({runtime:path.basename(root),measurement,exclusiveMs:exclusive,reconciledMs:Object.values(exclusive).reduce((a,b)=>a+b,0),queries,commandSpans,communication,nativeProfiles,timeline,overheadNote:'Append overhead reported per process; captured wall clock includes instrumentation. Missing exit on interrupted actors is unknown, not zero. Native time is wall clock, not CPU.'});
}
fs.writeFileSync(path.join(import.meta.dirname,'tempos-'+phase+'.json'),JSON.stringify(results,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(results.map(r=>({runtime:r.runtime,totalMs:r.measurement.resumeCloseMs,queries:r.queries.length,commands:r.commandSpans.length,exclusiveMs:r.exclusiveMs,nativeProfiles:r.nativeProfiles.map(({phases,...p})=>p)}))));
