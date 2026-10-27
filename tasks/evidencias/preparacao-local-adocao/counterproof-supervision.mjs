import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync}from'node:child_process';
import {fileURLToPath}from'node:url';import {spawnOwned,stopOwned}from'../../../.github/scripts/owned-process.mjs';
const probe=fileURLToPath(new URL('../../../.github/scripts/owned-job-probe.ps1',import.meta.url));
const token='CF_COUNTERPROOF_SESSION';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function atomic(file,value){const tmp=file+'.'+crypto.randomUUID()+'.tmp',fd=fs.openSync(tmp,'wx');try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,file);}
function query(config){
 const ps=path.join(process.env.SystemRoot??'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
 const json=execFileSync(ps,['-NoProfile','-NonInteractive','-File',probe,'-Configuration',Buffer.from(JSON.stringify(config)).toString('base64')],{encoding:'utf8',timeout:15000,windowsHide:true});
 return JSON.parse(json.replace(/^\uFEFF/,''));
}
function current(execution){
 if(!process.env[token])throw Error('Counterproof worker has no owned execution');
 const value=JSON.parse(process.env[token]),root=fs.realpathSync(execution).toLowerCase();
 const envelope=JSON.parse(fs.readFileSync(path.join(execution,'.owned-runs','run-'+value.runId+'.json'))),bytes=Buffer.from(envelope.payload,'base64');
 if(envelope.version!==1||sha(bytes)!==envelope.sha256)throw Error('Invalid owned execution receipt');
 const record=JSON.parse(bytes);
 if(record.version!==1||record.root!==root||record.runId!==value.runId||record.jobName!==value.jobName)throw Error('Incompatible owned execution record');
 return record;
}
export function verifyOwnedBoundary(execution){
 const record=current(execution);
 return request(execution,record,'current');
}
function request(execution,record,mode){
 const requestId=crypto.randomUUID(),registry=path.join(execution,'.owned-runs'),reply=path.join(registry,'reply-'+requestId+'.json');
 atomic(path.join(registry,'check-'+record.runId+'-'+requestId+'.json'),{requestId,runId:record.runId,mode,workerPid:process.pid});
 const deadline=Date.now()+15000;
 while(!fs.existsSync(reply)){if(Date.now()>=deadline)throw Error('Owned controller did not confirm quiescence');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25);}
 const result=JSON.parse(fs.readFileSync(reply));if(result.error)throw Error(result.error);return result.value;
}
export async function superviseCounterproof(execution){
 if(process.platform!=='win32')throw Error('Counterproof recovery is certified only on Windows; no unverified process-group fallback');
 if(process.env[token]){
  const record=current(execution);request(execution,record,'register');
  return;
 }
 const root=fs.realpathSync(execution).toLowerCase(),registry=path.join(execution,'.owned-runs');
 const legacy=fs.existsSync(path.join(execution,'counterproofs'))&&(!fs.existsSync(registry)||!fs.readdirSync(registry).some(x=>/^run-.*\.json$/.test(x)));
 if(legacy)throw Error('Previous command ownership is unknown; do not restore or resume this legacy execution');
 fs.mkdirSync(registry,{recursive:true});
 const runId=crypto.randomUUID(),prefix='Local\\CF034-CP-'+sha(root).slice(0,24)+'-';
 const record={version:1,runId,root,owner:query({mode:'identity',pid:process.pid}),jobName:prefix+runId,jobPrefix:prefix,
  mutexName:'Local\\CF034-CP-LOCK-'+sha(root),registry,at:new Date().toISOString()};
 // Persist before creating any guardian/worker. Guardians create the named job
 // before testing this exact owner PID+birth time, closing the late-boot window.
 const payload=Buffer.from(JSON.stringify(record));
 atomic(path.join(registry,'run-'+runId+'.json'),{version:1,payload:payload.toString('base64'),sha256:sha(payload)});
 const child=spawnOwned(process.execPath,[...process.execArgv,...process.argv.slice(1)],{cwd:process.cwd(),env:{...process.env,[token]:JSON.stringify({runId,jobName:record.jobName})},ownership:record});
 const served=new Set();let baseline;
 const timer=setInterval(()=>{
  for(const file of fs.readdirSync(registry).filter(f=>f.startsWith('check-'+runId+'-')&&f.endsWith('.json')&&!served.has(f))) {
   served.add(file);let check;
   try {
    check=JSON.parse(fs.readFileSync(path.join(registry,file)));
    if(check.runId!==runId||!/^[-a-f0-9]{36}$/.test(check.requestId)||!['register','current'].includes(check.mode))throw Error('Invalid owned worker request');
    if(check.mode==='register'&&baseline)throw Error('Worker already registered');
    if(check.mode==='current'&&!baseline)throw Error('Worker roster not registered');
    const value=query({mode:check.mode,jobName:record.jobName,workerPid:check.workerPid,baseline:baseline?.members});
    if(check.mode==='register'){
     const guardian=JSON.parse(fs.readFileSync(path.join(registry,'guardian-'+runId+'.json')));
     if(!value.members.some(x=>x.startsWith(guardian.pid+':'+guardian.ticks+':')))throw Error('Guardian identity not in job roster');
     baseline=value;atomic(path.join(registry,'baseline-'+runId+'.json'),value);
    }
    atomic(path.join(registry,'reply-'+check.requestId+'.json'),{value});
   }catch(error){if(check?.requestId)atomic(path.join(registry,'reply-'+check.requestId+'.json'),{error:error.message});else cancel();}
  }
 },25);
 const cancel=()=>stopOwned(child);process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
 child.stdout.on('data',bytes=>process.stdout.write(bytes));child.stderr.on('data',bytes=>process.stderr.write(bytes));
 let status;
 try {
  status=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
  const closed=query({mode:'closed',jobName:record.jobName});
  atomic(path.join(registry,'closed-'+runId+'.json'),{runId,status,closed,at:new Date().toISOString()});
 }finally{clearInterval(timer);process.off('SIGINT',cancel);process.off('SIGTERM',cancel);}
 process.exit(status.code??1);
}
export const supervisionSources=[fileURLToPath(import.meta.url),probe,
 fileURLToPath(new URL('../../../.github/scripts/owned-process.mjs',import.meta.url)),fileURLToPath(new URL('../../../.github/scripts/owned-process.ps1',import.meta.url))];
