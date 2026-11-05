const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const directory=process.env.CF_WRAPPER_DIAGNOSTICS,phase=process.env.CF_WRAPPER_PHASE;
function emit(kind,data={}) {
  if(!directory||!phase)return;
  fs.appendFileSync(path.join(directory,'browser-events-'+phase+'.jsonl'),JSON.stringify({version:1,wrapper:process.env.CF_WRAPPER_NAME,invocationId:process.env.CF_WRAPPER_INVOCATION,phase,at:new Date().toISOString(),pid:process.pid,kind,...data})+'\n');
}
emit('node-started');
process.on('uncaughtExceptionMonitor',error=>emit('uncaught-error',{message:error.message,stack:error.stack}));
const original=Module._load,patched=new WeakSet();
Module._load=function(...args){
 const exported=original.apply(this,args);
 for(const name of ['chromium','firefox','webkit']){
  const type=exported?.[name];
  if(!type?.launch||patched.has(type))continue;
  patched.add(type);
  const launch=type.launch;
  type.launch=async function(...parameters){
   emit('browser-launch-request',{browser:name});
   try{const browser=await launch.apply(this,parameters);emit('browser-started',{browser:name});return browser;}
   catch(error){emit('browser-launch-error',{browser:name,message:error.message,stack:error.stack});throw error;}
  };
 }
 return exported;
};
