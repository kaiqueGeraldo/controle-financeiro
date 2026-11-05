import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {physicalPath} from './paths.mjs';
import {hash} from './source.mjs';
import {wrapperDefinitions} from './wrapper-diagnostics.mjs';

const [flag,wrapper,...original]=process.argv.slice(2);
if(flag!=='--wrapper'||!Object.hasOwn(wrapperDefinitions,wrapper))throw new Error('Unknown wrapper diagnostic boundary');
const definition=wrapperDefinitions[wrapper];
if(original[0]!=='test'||original[1]!=='--config'||original[2]!==definition.config)throw new Error('Wrapper selection differs from its declared configuration');
const front=physicalPath(process.cwd()),source=physicalPath(process.env.CF_SOURCE_ROOT??path.dirname(front));
if(!process.env.CF_REVIEW_EVIDENCE||!path.isAbsolute(process.env.CF_REVIEW_EVIDENCE))throw new Error('Absolute private evidence directory required');
const evidence=physicalPath(process.env.CF_REVIEW_EVIDENCE);
if(evidence===source||evidence.startsWith(source+path.sep))throw new Error('Wrapper diagnosis must remain outside sources');
const directory=path.join(evidence,'diagnostics');fs.mkdirSync(directory);
const invocationId=randomUUID(),started=new Date().toISOString();
const sourceFile=path.join(source,'.ci-source.json');
const recorded=fs.existsSync(sourceFile)?JSON.parse(fs.readFileSync(sourceFile,'utf8')):{};
const context={source:{commit:recorded.commit??null,digest:recorded.digest??null},ci:Object.fromEntries(['runId','attempt','job','event'].map((key,i)=>[key,process.env[['GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT','GITHUB_JOB','GITHUB_EVENT_NAME'][i]]??null]))};
const invocation={version:1,wrapper,invocationId,started,context,config:definition.config,cwd:front,sourceRoot:source,originalCommand:[process.execPath,path.join(front,'node_modules/@playwright/test/cli.js'),...original],argumentsSha256:hash(JSON.stringify(original)),grepSupplied:original.some(x=>x==='--grep'||x.startsWith('--grep='))};
fs.writeFileSync(path.join(directory,'invocation.json'),JSON.stringify(invocation,null,2)+'\n',{flag:'wx'});
const reporter=path.join(path.dirname(fileURLToPath(import.meta.url)),'wrapper-reporter.mjs');
if(reporter.includes(','))throw new Error('Reporter path contains unsupported list separator');
const args=[];
for(let i=0;i<original.length;i++){if(original[i]==='--reporter'){i++;continue;}if(original[i].startsWith('--reporter='))continue;args.push(original[i]);}
const cli=path.join(front,'node_modules/@playwright/test/cli.js');
function execute(phase,extra,reporters) {
  const output=path.join(directory,phase+'.log'),fd=fs.openSync(output,'wx'),at=Date.now();
  let result;
  try {result=spawnSync(process.execPath,[cli,...args,...extra,'--reporter='+reporters],{cwd:front,env:{...process.env,CF_WRAPPER_DIAGNOSTICS:directory,CF_WRAPPER_PHASE:phase,CF_WRAPPER_NAME:wrapper,CF_WRAPPER_INVOCATION:invocationId,PLAYWRIGHT_JSON_OUTPUT_FILE:path.join(directory,'results.json')},stdio:['ignore',fd,fd],windowsHide:true,shell:false,...(phase==='list'?{timeout:120000}:{})});}
  finally {fs.closeSync(fd);}
  return {started:new Date(at).toISOString(),finished:new Date().toISOString(),durationMs:Date.now()-at,exit:result.status,signal:result.signal,error:result.error?{code:result.error.code??null,message:result.error.message}:null};
}
const listing=execute('list',['--list'],reporter);
fs.writeFileSync(path.join(directory,'listing-process.json'),JSON.stringify(listing,null,2)+'\n',{flag:'wx'});
// Discovery does not replace execution or change its exit code, even when discovery failed.
const execution=execute('run',[],'line,json,'+reporter);
fs.writeFileSync(path.join(directory,'process.json'),JSON.stringify({version:1,wrapper,invocationId,context,listing,execution,finished:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
console.log('Wrapper '+wrapper+' finished; discovery='+listing.exit+'; execution='+execution.exit+'; private diagnostic receipt recorded');
process.exitCode=execution.exit??1;

