import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';import {performance} from 'node:perf_hooks';
const root='/work/s/controle-financeiro-frontend',base='/work/diag',results=path.join(base,'results');fs.mkdirSync(results,{recursive:true});
const group=['tests/component/cards-planning-audit.test.tsx','src/screens/private/onboarding/screen.test.tsx','tests/component/auth-settings-accessibility.test.tsx','tests/component/cf026-contracts.test.tsx','tests/component/cf015-recovery-expanded.test.tsx','tests/component/rf15-causal.test.tsx'];
const read=file=>{try{return fs.readFileSync(file,'utf8').trim();}catch{return null;}};
function sample(pid){
 const records=[];for(const entry of fs.readdirSync('/proc').filter(f=>/^\d+$/.test(f))){const text=read('/proc/'+entry+'/status');if(!text)continue;records.push({pid:+entry,ppid:+text.match(/^PPid:\s+(\d+)/m)?.[1],name:text.match(/^Name:\s+(.+)/m)?.[1],rssKb:+text.match(/^VmRSS:\s+(\d+)/m)?.[1]||0});}
 const own=new Set([pid]);let changed=true;while(changed){changed=false;for(const p of records)if(own.has(p.ppid)&&!own.has(p.pid)){own.add(p.pid);changed=true;}}
 return {at:new Date().toISOString(),cpuStat:read('/sys/fs/cgroup/cpu.stat'),cpuPressure:read('/sys/fs/cgroup/cpu.pressure'),memoryPressure:read('/sys/fs/cgroup/memory.pressure'),memoryCurrent:read('/sys/fs/cgroup/memory.current'),memoryEvents:read('/sys/fs/cgroup/memory.events'),procCpu:read('/proc/stat')?.split('\n')[0],load:read('/proc/loadavg'),memory:read('/proc/meminfo')?.split('\n').filter(s=>/^(MemTotal|MemAvailable|SwapTotal|SwapFree):/.test(s)),descendants:records.filter(p=>own.has(p.pid))};
}
function preserve(directory,target){
 if(!fs.existsSync(directory))return;fs.mkdirSync(target,{recursive:true});
 for(const file of fs.readdirSync(directory)){const from=path.join(directory,file),to=path.join(target,file);if(fs.existsSync(to)){if(!fs.readFileSync(from).equals(fs.readFileSync(to)))throw new Error('Previously preserved evidence changed: '+file);}else fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);}
}
const mode=process.argv[2]??'initial';
const runs=mode==='initial'?[
{id:'A-cards',files:[group[0]],filter:'lista longa mantém a ação de pagamento fora da área rolável'},
{id:'A-onboarding',files:[group[1]],filter:'compares conflict snapshots and does not silently choose the server'},
{id:'B-cards',files:[group[0]]},{id:'B-onboarding',files:[group[1]]},{id:'C-group',files:group}
]:mode==='D'?[{id:'D-group-workers2',files:group,workers:2}]:[];
if(!runs.length)throw new Error('Unknown experiment group');
for(const run of runs){
 const json=path.join(results,run.id+'.json'),log=path.join(results,run.id+'.log');
 if(fs.existsSync(json)||fs.existsSync(log))throw new Error('Never reuse experiment output');
 const args=['node_modules/vitest/vitest.mjs','run','--config','tests/component/vitest.config.mts',...run.files,'--reporter=default','--reporter=json','--reporter=/work/diag/reporter.mjs','--outputFile='+json];
 if(run.filter)args.push('--testNamePattern',run.filter);
 if(run.workers)args.push('--maxWorkers='+run.workers);
 const env={...process.env,TZ:'America/Sao_Paulo',CF_TEST_TIMEZONE:'America/Sao_Paulo',CF_DIAG_RUN:run.id};
 const started=new Date().toISOString(),start=performance.now(),fd=fs.openSync(log,'wx');
 const child=spawn(process.execPath,args,{cwd:root,env,stdio:['ignore',fd,fd]});
 const samples=[sample(child.pid)],timer=setInterval(()=>samples.push(sample(child.pid)),500);
 const outcome=await new Promise(resolve=>{child.once('error',error=>resolve({exit:null,error:error.message}));child.once('close',(exit,signal)=>resolve({exit,signal}));});
 clearInterval(timer);fs.closeSync(fd);samples.push(sample(child.pid));
 const result=fs.existsSync(json)?JSON.parse(fs.readFileSync(json,'utf8')):null;
 const record={id:run.id,started,finished:new Date().toISOString(),durationMs:performance.now()-start,command:[process.execPath,...args],cwd:root,inputs:'originals + diagnostic instrumentation.json',filter:run.filter??null,workersOverride:run.workers??null,node:process.version,cpuAvailable:os.availableParallelism(),cpuCount:os.cpus().length,memoryTotal:os.totalmem(),cpuMax:read('/sys/fs/cgroup/cpu.max'),cpuset:read('/sys/fs/cgroup/cpuset.cpus.effective'),memoryMax:read('/sys/fs/cgroup/memory.max'),...outcome,counts:result?{total:result.numTotalTests,passed:result.numPassedTests,failed:result.numFailedTests,filteredOrSkipped:result.numPendingTests,todo:result.numTodoTests}:null,files:result?.testResults.map(f=>({name:f.name,status:f.status,start:f.startTime,end:f.endTime})),samples};
 fs.writeFileSync(path.join(results,run.id+'-execution.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 preserve(results,'/evidence/results');preserve(path.join(base,'traces'),'/evidence/traces');
 console.log(JSON.stringify({id:run.id,...outcome,durationMs:record.durationMs,counts:record.counts}));
}
