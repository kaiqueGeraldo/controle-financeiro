import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {spawnOwned,stopOwned} from '../../../.github/scripts/owned-process.mjs';

const probe=fileURLToPath(new URL('../../../.github/scripts/owned-job-probe.ps1',import.meta.url));
const commandRunner=fileURLToPath(new URL('../../../.github/scripts/owned-command.mjs',import.meta.url));
const token='CF_COUNTERPROOF_SESSION';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function atomic(file,value) {
  const tmp=file+'.'+crypto.randomUUID()+'.tmp',fd=fs.openSync(tmp,'wx');
  try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  fs.renameSync(tmp,file);
}
function receipt(file,record) {
  const payload=Buffer.from(JSON.stringify(record));
  atomic(file,{version:1,payload:payload.toString('base64'),sha256:sha(payload)});
}
function query(config) {
  const ps=path.join(process.env.SystemRoot??'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
  const json=execFileSync(ps,['-NoProfile','-NonInteractive','-File',probe,'-Configuration',Buffer.from(JSON.stringify(config)).toString('base64')],{encoding:'utf8',timeout:15000,windowsHide:true});
  return JSON.parse(json.replace(/^\uFEFF/,''));
}
function current(execution) {
  if(!process.env[token])throw Error('Counterproof worker has no owned execution');
  const value=JSON.parse(process.env[token]),root=fs.realpathSync(execution).toLowerCase();
  const envelope=JSON.parse(fs.readFileSync(path.join(execution,'.owned-runs','run-'+value.runId+'.json'))),bytes=Buffer.from(envelope.payload,'base64');
  if(envelope.version!==1||sha(bytes)!==envelope.sha256)throw Error('Invalid owned execution receipt');
  const record=JSON.parse(bytes);
  if(record.version!==1||record.contract!==3||record.root!==root||record.runId!==value.runId||record.jobName!==value.jobName)throw Error('Incompatible owned execution record');
  return record;
}
function request(execution,record,mode,command) {
  const requestId=crypto.randomUUID(),registry=path.join(execution,'.owned-runs'),reply=path.join(registry,'reply-'+requestId+'.json');
  const check={requestId,runId:record.runId,mode,workerPid:process.pid,command};
  atomic(path.join(registry,'check-'+record.runId+'-'+requestId+'.json'),check);
  atomic(path.join(registry,'mailbox-'+record.runId+'.json'),check);
  // Maven had no invocation deadline. Its startup/test budgets stay inside it.
  // Controller death closes the private worker-job pipe.
  const deadline=mode==='command'?Infinity:Date.now()+15000;
  while(!fs.existsSync(reply)) {
    if(Date.now()>=deadline)throw Error('OWNED_OPERATIONAL_ERROR: controller did not confirm quiescence');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);
  }
  const result=JSON.parse(fs.readFileSync(reply));
  if(result.error)throw Object.assign(Error(result.error.message),{kind:result.error.kind});
  return result.value;
}
export function verifyOwnedBoundary(execution) {
  const value=request(execution,current(execution),'current');
  if(value.status!=='quiescent'||!value.noCommandDescendants)throw Error('OWNED_INSPECTION_INCONCLUSIVE: incomplete quiescence receipt');
  return value;
}
export function runOwnedCommand(execution,executable,args,options={}) {
  return request(execution,current(execution),'command',{executable,args,...options});
}
function classify(error) {
  const detail=String(error.stderr??error.message).replace(/\s+/g,' ').slice(0,4000);
  const kind=detail.includes('OWNED_GROUP_ACTIVE')?'active':detail.includes('OWNED_INSPECTION_INCONCLUSIVE')?'inconclusive':'operational';
  return {kind,message:kind+': '+detail};
}
export async function superviseCounterproof(execution) {
  if(process.platform!=='win32')throw Error('Counterproof recovery is certified only on Windows; no unverified process-group fallback');
  if(process.env[token]){request(execution,current(execution),'register');return;}
  const root=fs.realpathSync(execution).toLowerCase(),registry=path.join(execution,'.owned-runs');
  if(fs.existsSync(path.join(execution,'counterproofs'))&&(!fs.existsSync(registry)||!fs.readdirSync(registry).some(x=>/^run-.*\.json$/.test(x))))throw Error('Previous command ownership is unknown; do not restore or resume this legacy execution');
  fs.mkdirSync(registry,{recursive:true});
  const runId=crypto.randomUUID(),prefix='Local\\CF034-CP-'+sha(root).slice(0,24)+'-';
  const record={version:1,contract:3,runId,root,owner:query({mode:'identity',pid:process.pid}),jobName:prefix+runId,jobPrefix:prefix,mutexName:'Local\\CF034-CP-LOCK-'+sha(root),registry,at:new Date().toISOString()};
  receipt(path.join(registry,'run-'+runId+'.json'),record);
  const child=spawnOwned(process.execPath,[...process.execArgv,...process.argv.slice(1)],{cwd:process.cwd(),env:{...process.env,[token]:JSON.stringify({runId,jobName:record.jobName})},ownership:record});
  const served=new Set(),commands=new Map(),pending=new Set();let baseline;
  function boundary(workerPid) {
    if(!baseline||workerPid!==baseline.worker.pid)throw Error('OWNED_OPERATIONAL_ERROR: worker roster not registered');
    if([...commands.values()].some(c=>!c.closed))throw Error('OWNED_GROUP_ACTIVE: command job closure not confirmed');
    const value=query({mode:'current',jobName:record.jobName,workerPid,baseline:baseline.members,creationCount:baseline.creationCount});
    if(value.status!=='quiescent'||value.creationCount!==baseline.creationCount)throw Error('OWNED_INSPECTION_INCONCLUSIVE: missing sealed worker evidence');
    return value;
  }
  async function command(check) {
    boundary(check.workerPid);
    const spec=check.command;
    if(typeof spec?.executable!=='string'||!Array.isArray(spec.args)||spec.args.some(a=>typeof a!=='string'))throw Error('OWNED_OPERATIONAL_ERROR: invalid command request');
    const commandId=crypto.randomUUID(),owned={...record,kind:'command',runId:commandId,parentRunId:runId,jobName:prefix+commandId,mutexName:null};
    receipt(path.join(registry,'command-'+commandId+'.json'),owned);
    let fd;
    if(spec.log) {
      if(!path.resolve(spec.log).toLowerCase().startsWith(root+path.sep))throw Error('Command log outside execution');
      fd=fs.openSync(spec.log,'wx');
    }
    const state={closed:false};commands.set(commandId,state);
    let timeout,stdout='',stderr='',overflow=false,timedOut=false;
    try {
      const invocation=Buffer.from(JSON.stringify({executable:spec.executable,args:spec.args,cwd:spec.cwd??process.cwd()})).toString('base64');
      state.child=spawnOwned(process.execPath,[commandRunner,invocation],{cwd:spec.cwd??process.cwd(),env:{...process.env,...spec.env},ownership:owned});
      const collect=which=>bytes=>{
        if(fd!==undefined)fs.writeSync(fd,bytes);
        else if(stdout.length+stderr.length+bytes.length<=1024*1024){if(which==='stdout')stdout+=bytes.toString('utf8');else stderr+=bytes.toString('utf8');}
        else{overflow=true;stopOwned(state.child);}
      };
      state.child.stdout.on('data',collect('stdout'));state.child.stderr.on('data',collect('stderr'));
      if(spec.timeout)timeout=setTimeout(()=>{timedOut=true;stopOwned(state.child);},spec.timeout);
      const status=await new Promise((resolve,reject)=>{state.child.once('error',reject);state.child.once('close',(code,signal)=>resolve({code,signal}));});
      if(timeout)clearTimeout(timeout);
      const closed=query({mode:'closed',jobName:owned.jobName});
      if(!closed.absent)throw Error('OWNED_INSPECTION_INCONCLUSIVE: command job is not absent');
      state.closed=true;
      commands.delete(commandId); // Keep only unconfirmed jobs in the active set.
      const result={status:status.code,signal:status.signal,stdout,stderr,jobName:owned.jobName,closed,commandId};
      atomic(path.join(registry,'closed-'+commandId+'.json'),{runId:commandId,parentRunId:runId,status,closed,timedOut,overflow,at:new Date().toISOString()});
      if(timedOut||overflow)throw Error('OWNED_OPERATIONAL_ERROR: '+(timedOut?'command timed out':'captured command output exceeded limit'));
      return result;
    }finally{if(timeout)clearTimeout(timeout);if(fd!==undefined)fs.closeSync(fd);}
  }
  async function serve(check) {
    if(check.runId!==runId||!/^[-a-f0-9]{36}$/.test(check.requestId)||!['register','current','command'].includes(check.mode))throw Error('Invalid owned worker request');
    if(check.mode==='register') {
      if(baseline)throw Error('Worker already registered');
      const value=query({mode:'register',jobName:record.jobName,workerPid:check.workerPid});
      const guardian=JSON.parse(fs.readFileSync(path.join(registry,'guardian-'+runId+'.json')));
      const guardianRow=guardian.pid+':'+guardian.ticks+':',workerRow=value.worker.pid+':'+value.worker.ticks+':';
      if(!value.members.some(r=>r.startsWith(guardianRow))||!Number.isInteger(value.creationCount))throw Error('Initial guardian/accounting evidence incomplete');
      if(value.members.some(r=>!r.startsWith(guardianRow)&&!r.startsWith(workerRow)&&!r.endsWith(':conhost')))throw Error('Unexpected initial process in worker job');
      baseline=value;atomic(path.join(registry,'baseline-'+runId+'.json'),value);return value;
    }
    return check.mode==='command'?await command(check):boundary(check.workerPid);
  }
  const cancel=()=>{stopOwned(child);for(const state of commands.values())if(state.child&&!state.closed)stopOwned(state.child);};
  const mailbox=path.join(registry,'mailbox-'+runId+'.json');
  const timer=setInterval(()=>{
    if(!fs.existsSync(mailbox))return;
    let check;
    try{check=JSON.parse(fs.readFileSync(mailbox));}catch{cancel();return;}
    if(!/^[-a-f0-9]{36}$/.test(check.requestId??'')){cancel();return;}
    if(!served.has(check.requestId)) {
      served.add(check.requestId);
      const task=serve(check).then(value=>atomic(path.join(registry,'reply-'+check.requestId+'.json'),{value}),error=>atomic(path.join(registry,'reply-'+check.requestId+'.json'),{error:classify(error)}));
      pending.add(task);task.finally(()=>pending.delete(task));
    }
  },100);
  process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
  child.stdout.on('data',bytes=>process.stdout.write(bytes));child.stderr.on('data',bytes=>process.stderr.write(bytes));
  let status;
  try {
    status=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
    clearInterval(timer);cancel();await Promise.all(pending);
    const closed=query({mode:'closed',jobName:record.jobName});
    if([...commands.values()].some(c=>!c.closed))throw Error('OWNED_INSPECTION_INCONCLUSIVE: command cleanup still unconfirmed');
    atomic(path.join(registry,'closed-'+runId+'.json'),{runId,status,closed,at:new Date().toISOString()});
  }finally{clearInterval(timer);process.off('SIGINT',cancel);process.off('SIGTERM',cancel);}
  process.exit(status.code??1);
}
export const supervisionSources=[fileURLToPath(import.meta.url),probe,commandRunner,fileURLToPath(new URL('../../../.github/scripts/owned-process.mjs',import.meta.url)),fileURLToPath(new URL('../../../.github/scripts/owned-process.ps1',import.meta.url))];
