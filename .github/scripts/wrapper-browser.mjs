import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {physicalPath} from './paths.mjs';
import {hash} from './source.mjs';
import {wrapperDefinitions} from './wrapper-diagnostics.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
export function reporterArguments(original,reporters){
 const args=[];
 for(let i=0;i<original.length;i++){
  if(original[i]==='--reporter'){i++;continue;}
  if(original[i].startsWith('--reporter='))continue;
  args.push(original[i]);
  if(['--config','--grep','--grep-invert','--project','--output','--test-list'].includes(original[i])&&i+1<original.length)args.push(original[++i]);
 }
 return [...args,'--reporter='+reporters];
}
export function playwrightPhase(phase,args,jsonOutput){
 const directory=process.env.CF_WRAPPER_DIAGNOSTICS;
 const fd=fs.openSync(path.join(directory,phase+'.log'),'wx'),at=Date.now();
 const reporter=path.join(here,'wrapper-reporter.mjs');
 let result;
 try{
  result=spawnSync(process.execPath,['--require',path.join(here,'browser-preload.cjs'),path.resolve('node_modules/@playwright/test/cli.js'),...reporterArguments(args,phase==='list'?reporter:'line,json,'+reporter)],{
   cwd:process.cwd(),env:{...process.env,CF_WRAPPER_PHASE:phase,PLAYWRIGHT_JSON_OUTPUT_FILE:jsonOutput,NODE_OPTIONS:process.env.NODE_OPTIONS??''},
   stdio:['ignore',fd,fd],windowsHide:true,shell:false,...(phase==='list'?{timeout:120000}:{})
  });
 }finally{fs.closeSync(fd);}
 return {started:new Date(at).toISOString(),finished:new Date().toISOString(),durationMs:Date.now()-at,exit:result.status,signal:result.signal,error:result.error?{code:result.error.code??null,message:result.error.message}:null};
}
function main(){
 const [flag,wrapper,...input]=process.argv.slice(2),definition=wrapperDefinitions[wrapper];
 if(flag!=='--wrapper'||!definition)throw new Error('Unknown wrapper diagnostic boundary');
 let entry='node_modules/@playwright/test/cli.js',args=input;
 if(input[0]==='--entry'){entry=input[1];args=input.slice(2);}
 const front=physicalPath(process.cwd()),source=physicalPath(process.env.CF_SOURCE_ROOT??path.dirname(front));
 const config=definition.kind==='programmatic'?definition.config:args[args.indexOf('--config')+1];
 if(!(definition.configs??[definition.config]).includes(config))throw new Error('Unexpected wrapper config');
 const evidence=physicalPath(process.env.CF_REVIEW_EVIDENCE);
 if(evidence===source||evidence.startsWith(source+path.sep))throw new Error('Wrapper diagnosis must remain outside sources');
 const directory=path.join(evidence,'diagnostics');fs.mkdirSync(directory);
 const invocationId=randomUUID(),recorded=JSON.parse(fs.readFileSync(path.join(source,'.ci-source.json'),'utf8'));
 const context={source:{commit:recorded.commit,digest:recorded.digest},ci:Object.fromEntries(['runId','attempt','job','event'].map((k,i)=>[k,process.env[['GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','GITHUB_JOB','GITHUB_EVENT_NAME'][i]]??null]))};
 fs.writeFileSync(path.join(directory,'invocation.json'),JSON.stringify({version:1,wrapper,invocationId,context,config,cwd:front,sourceRoot:source,originalCommand:['node',path.relative(front,path.resolve(entry)),...args],argumentsSha256:hash(JSON.stringify([entry,...args])),grepSupplied:args.some(x=>x==='--grep'||x.startsWith('--grep='))}),{flag:'wx'});
 Object.assign(process.env,{CF_WRAPPER_DIAGNOSTICS:directory,CF_WRAPPER_NAME:wrapper,CF_WRAPPER_INVOCATION:invocationId});
 let listing,execution;
 if(definition.kind==='programmatic'||definition.kind==='zoom'){
  const fd=fs.openSync(path.join(directory,definition.kind==='zoom'?'boundary.log':'run.log'),'wx'),at=Date.now();
  const synthetic={id:wrapper,project:'programmatic',file:definition.config,titles:[wrapper,'script entry'],line:1,column:1};
  const emit=(kind,data={})=>fs.appendFileSync(path.join(directory,'events-run.jsonl'),JSON.stringify({version:1,wrapper,invocationId,phase:'run',sequence:Date.now()-at,kind,...data})+'\n');
  if(definition.kind==='programmatic'){
   const begin={version:1,wrapper,invocationId,phase:'list',sequence:1,kind:'begin',expected:[synthetic]};
   fs.writeFileSync(path.join(directory,'events-list.jsonl'),JSON.stringify(begin)+'\n',{flag:'wx'});
   emit('begin',{expected:[synthetic]});emit('test-start',{test:synthetic,workerIndex:0,retry:0,startTime:new Date().toISOString()});
  }
  let result;
  try{result=spawnSync(process.execPath,['--require',path.join(here,'browser-preload.cjs'),path.resolve(entry),...args],{cwd:front,env:{...process.env,CF_WRAPPER_PHASE:'run',NODE_OPTIONS:process.env.NODE_OPTIONS??''},stdio:['ignore',fd,fd],windowsHide:true,shell:false});}finally{fs.closeSync(fd);}
  execution={started:new Date(at).toISOString(),finished:new Date().toISOString(),exit:result.status,signal:result.signal,durationMs:Date.now()-at,error:result.error?{code:result.error.code,message:result.error.message}:null};
  if(definition.kind==='programmatic'){
   listing={exit:0,method:'declared script entry; no scenario discovery API'};
   emit('test-end',{test:synthetic,workerIndex:0,retry:0,status:result.status===0?'passed':'failed',expectedStatus:'passed',durationMs:execution.durationMs,errors:[]});emit('end',{status:result.status===0?'passed':'failed'});
  }else listing=fs.existsSync(path.join(directory,'listing-process.json'))?JSON.parse(fs.readFileSync(path.join(directory,'listing-process.json'))):{exit:null};
 }else{
  listing=playwrightPhase('list',[...args,'--list'],path.join(directory,'listing.json'));
  fs.writeFileSync(path.join(directory,'listing-process.json'),JSON.stringify(listing),{flag:'wx'});
  execution=playwrightPhase('run',args,definition.jsonOutput?path.join(evidence,definition.jsonOutput):path.join(directory,'results.json'));
 }
 fs.writeFileSync(path.join(directory,'process.json'),JSON.stringify({version:1,wrapper,invocationId,context,listing,execution}),{flag:'wx'});
 console.log('Wrapper '+wrapper+' execution='+execution.exit+'; private diagnostics retained');
 if(execution.signal){process.kill(process.pid,execution.signal);return;}
 process.exitCode=execution.exit??1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
