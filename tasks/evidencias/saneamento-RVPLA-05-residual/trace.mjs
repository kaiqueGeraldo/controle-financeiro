import fs from 'node:fs';
import path from 'node:path';
import child from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const log=process.env.RESIDUAL_TRACE_LOG,root=process.env.RESIDUAL_TRACE_ROOT;
const append=fs.appendFileSync,self=fileURLToPath(import.meta.url),origin=process.hrtime.bigint();
let overhead=0n;
function emit(event,data={}) {
  if(!log)return;
  const begin=process.hrtime.bigint();
  append(log,JSON.stringify({event,pid:process.pid,parent:process.ppid,ns:begin.toString(),at:new Date().toISOString(),...data})+'\n');
  overhead+=process.hrtime.bigint()-begin;
}
function describe(executable,args=[]) {
  let value={executable:path.basename(executable),resume:args.includes('resume')};
  const at=args.indexOf('-Configuration');
  if(at>=0)try{
    const config=JSON.parse(Buffer.from(args[at+1],'base64'));
    value={...value,mode:config.mode,jobName:config.jobName??config.ownership?.jobName,kind:config.ownership?.kind??'worker',targetPid:config.pid,workerPid:config.workerPid};
    if(config.args?.[0]?.endsWith('owned-command.mjs')) {
      const invocation=JSON.parse(Buffer.from(config.args[1],'base64'));
      value.tool=path.basename(invocation.executable);
    }
  }catch{}
  if(args.some(a=>String(a).endsWith('stop-own.ps1'))){value.action='fixture-stop';value.targetPid=Number(args[args.indexOf('-OwnedPid')+1]);}
  return value;
}
const spawn=child.spawn;
child.spawn=(exe,args=[],options)=>{
  let actual=args;
  if(path.resolve(exe)===path.resolve(process.execPath)&&args.some(a=>String(a).endsWith('counterproofs.mjs'))&&!args.includes('--import'))actual=['--import',pathToFileURL(self).href,...args];
  const d=describe(exe,actual),begin=process.hrtime.bigint();emit('spawn-start',d);
  const p=spawn(exe,actual,options);emit('spawned',{...d,childPid:p.pid,spawnCallMs:Number(process.hrtime.bigint()-begin)/1e6});
  p.once('exit',(code,signal)=>emit('child-exit',{...d,childPid:p.pid,code,signal}));
  p.once('close',(code,signal)=>emit('child-close',{...d,childPid:p.pid,code,signal}));
  return p;
};
for(const name of ['spawnSync','execFileSync']) {
  const original=child[name];
  child[name]=function(exe,args=[],options){
    const begin=process.hrtime.bigint(),d=describe(exe,args);emit(name+'-start',d);
    try{const result=original(exe,args,options);emit(name+'-end',{...d,ms:Number(process.hrtime.bigint()-begin)/1e6,status:result?.status});return result;}
    catch(error){emit(name+'-error',{...d,ms:Number(process.hrtime.bigint()-begin)/1e6,status:error.status,code:error.code});throw error;}
  };
}
const read=fs.readFileSync,write=fs.writeFileSync,rename=fs.renameSync,sync=fs.fsyncSync;
const inside=file=>root&&typeof file==='string'&&path.resolve(file).toLowerCase().startsWith(path.resolve(root).toLowerCase()+path.sep);
const relevant=file=>inside(file)&&(/checkpoint\.json$|identity\.json$|inputs\.json$|LegacyPreflight\.java$/.test(file)||/\.owned-runs[\\/](mailbox|reply|closed|baseline)-/.test(file));
fs.readFileSync=function(file,...args){const begin=process.hrtime.bigint();try{return read(file,...args);}finally{if(relevant(file))emit('file-read',{file:path.relative(root,file),ms:Number(process.hrtime.bigint()-begin)/1e6});}};
fs.writeFileSync=function(file,...args){const begin=process.hrtime.bigint();try{return write(file,...args);}finally{if(relevant(file))emit('file-write',{file:path.relative(root,file),ms:Number(process.hrtime.bigint()-begin)/1e6});}};
fs.renameSync=function(from,to){const begin=process.hrtime.bigint();let error;try{return rename(from,to);}catch(e){error=e;throw e;}finally{if(inside(to)){const data={file:path.relative(root,to),ms:Number(process.hrtime.bigint()-begin)/1e6,code:error?.code};if(!error&&String(to).endsWith('checkpoint.json'))data.state=JSON.parse(read(to)).state;emit('atomic-publish',data);}}};
fs.fsyncSync=function(fd){const begin=process.hrtime.bigint();try{return sync(fd);}finally{emit('fsync',{ms:Number(process.hrtime.bigint()-begin)/1e6});}};
syncBuiltinESMExports();
emit('process-start',{role:process.env.CF_COUNTERPROOF_SESSION?'worker':'controller-or-probe'});
process.on('uncaughtExceptionMonitor',e=>emit('uncaught',{name:e.name,message:e.message,code:e.code}));
process.on('exit',code=>emit('process-exit',{code,elapsedMs:Number(process.hrtime.bigint()-origin)/1e6,instrumentationAppendMs:Number(overhead)/1e6}));
