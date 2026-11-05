import fs from 'node:fs';
import path from 'node:path';
import {hash} from './source.mjs';
import {sanitizeText,sanitizeJson,sanitizationLimits} from './sanitize.mjs';

import {wrapperDefinitions} from './browser-wrappers.mjs';
export {wrapperDefinitions};
const strip=text=>String(text).replace(/\u001b\[[0-9;]*m/g,'');
export function diagnosticText(value) {
  let text=sanitizeText(strip(value??''));
  // URLs, markup and HTTP payloads are unnecessary to identify an assertion.
  text=text.replace(/(?:https?|wss?|file):\/\/[^\s"'<>]+/gi,'[URL]');
  const privateDetail=text.search(/<\/?[A-Za-z][^>]*>|(?:headers|payload|request body|response body)\s*[:=]/i);
  if(privateDetail>=0)text=text.slice(0,privateDetail)+'[Detail withheld]';
  return text.split(/\r?\n/).slice(0,60).join('\n').slice(0,12000);
}
function diagnosticValue(value,depth=0){
  if(depth>16)throw new Error('Diagnostic projection too deep');
  if(typeof value==='string')return diagnosticText(value);
  if(Array.isArray(value)){if(value.length>512)throw new Error('Diagnostic projection too large');return value.map(v=>diagnosticValue(v,depth+1));}
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,diagnosticValue(v,depth+1)]));
  return value;
}
function relativeFile(file,source) {
  if(typeof file!=='string')return null;
  if(path.isAbsolute(file)){const relative=path.relative(source,file);return relative.startsWith('..')?'[external]/'+path.basename(file):relative.split(path.sep).join('/');}
  return file.split(/[\\/]/).includes('..')?'[external]/'+path.basename(file):file.replaceAll('\\','/');
}
function location(error,source,fallback) {
  let loc=error?.location;
  if(!loc&&error?.stack){const matches=[...error.stack.matchAll(/\(?((?:[A-Za-z]:[\\/]|\/|file:\/\/\/)[^()\r\n]+\.(?:[cm]?js|tsx?)):(\d+):(\d+)\)?/g)];const item=matches.find(m=>!m[1].includes('node_modules'));if(item)loc={file:item[1].replace(/^file:\/\//,''),line:Number(item[2]),column:Number(item[3])};}
  loc=loc??fallback;return loc?{file:relativeFile(loc.file,source),line:loc.line??null,column:loc.column??null}:null;
}
function safeIdentity(test,source) {return {id:diagnosticText(test.id),project:diagnosticText(test.project),file:relativeFile(test.file,source),titles:(test.titles??[]).map(diagnosticText),line:test.line??null,column:test.column??null,repeatEachIndex:test.repeatEachIndex??0};}
function safeInput(root,relative,inputs,missing) {
  const file=path.join(root,relative);
  let stat;try{stat=fs.lstatSync(file);}catch(error){if(error.code==='ENOENT'){missing.push(relative);return null;}throw error;}
  const physicalRoot=fs.realpathSync.native(root),physical=fs.realpathSync.native(file);
  if(!stat.isFile()||!physical.startsWith(physicalRoot+path.sep))throw new Error('Unsafe wrapper diagnostic path');
  if(stat.size>sanitizationLimits.bytes)throw new Error('Unsafe wrapper diagnostic size');
  const bytes=fs.readFileSync(file);inputs.push({file:relative.split(path.sep).join('/'),sha256:hash(bytes),bytes:bytes.length});return bytes.toString('utf8');
}
export function summarizeWrapper(root,wrapper) {
  if(!Object.hasOwn(wrapperDefinitions,wrapper))throw new Error('Unknown wrapper');
  const base=wrapperDefinitions[wrapper].directory??path.join('browsers',wrapper),folder=path.join(root,base);
  if(fs.existsSync(folder)&&!fs.realpathSync.native(folder).startsWith(fs.realpathSync.native(root)+path.sep))throw new Error('Unsafe wrapper directory alias');
  const inputs=[],missing=[],get=name=>safeInput(root,path.join(base,'diagnostics',name),inputs,missing);
  const json=name=>{const text=get(name);return text===null?null:JSON.parse(text);};
  const invocation=json('invocation.json'),process=json('process.json');
  const events=phase=>{const text=get((phase==='browser'?'browser-events-run':'events-'+phase)+'.jsonl');if(text===null)return [];return text.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line));};
  const listed=events('list'),run=events('run'),browser=events('browser');
  if(invocation&&(invocation.version!==1||invocation.wrapper!==wrapper||!(wrapperDefinitions[wrapper].configs??[wrapperDefinitions[wrapper].config]).includes(invocation.config)))throw new Error('Different wrapper invocation');
  if(process&&(process.wrapper!==wrapper||process.invocationId!==invocation?.invocationId))throw new Error('Mixed wrapper process receipt');
  for(const [phase,events] of [['list',listed],['run',run],['run',browser]])for(const event of events)if(event.wrapper!==wrapper||event.invocationId!==invocation?.invocationId||event.version!==1||event.phase!==phase)throw new Error('Mixed wrapper lifecycle evidence');
  const rawContext=invocation?.context;
  if(rawContext&&(!/^[a-f0-9]{40}$/.test(rawContext.source?.commit)||!/^[a-f0-9]{64}$/.test(rawContext.source?.digest)))throw new Error('Invalid wrapper source context');
  const context=rawContext?{source:{commit:rawContext.source.commit,digest:rawContext.source.digest},ci:Object.fromEntries(['runId','attempt','job','event'].map(key=>[key,rawContext.ci?.[key]==null?null:diagnosticText(rawContext.ci[key])]))}:null;
  const source=invocation?.sourceRoot??root,listBegin=listed.find(x=>x.kind==='begin'),runBegin=run.find(x=>x.kind==='begin');
  const expected=listBegin?.expected??runBegin?.expected??[],started=run.filter(x=>x.kind==='test-start'),ended=run.filter(x=>x.kind==='test-end'),end=run.find(x=>x.kind==='end');
  const identities=[...(listBegin?.expected??[]),...(runBegin?.expected??[]),...started.map(x=>x.test),...ended.map(x=>x.test)];
  if(identities.some(t=>!t||typeof t.id!=='string'||typeof t.file!=='string'||typeof t.project!=='string'||!Array.isArray(t.titles)||t.titles.some(x=>typeof x!=='string')))throw new Error('Invalid wrapper test identity');
  const key=test=>JSON.stringify([test.id,test.project,test.file,test.titles,test.repeatEachIndex??0]);
  const selectionMatches=!!listBegin&&!!runBegin&&JSON.stringify(listBegin.expected.map(key).sort())===JSON.stringify(runBegin.expected.map(key).sort());
  const failed=new Set(ended.filter(x=>x.status!=='passed').map(x=>x.test.id));
  const stepErrors=new Map();
  for(const e of run)if(e.kind==='step-error'){const key=JSON.stringify([e.test?.id,e.error?.message]);if(!stepErrors.has(key))stepErrors.set(key,e);}
  const failures=run.filter(x=>x.kind==='global-error'||x.kind==='test-end'&&failed.has(x.test.id)&&x.errors?.length).map(event=>{
    const error=event.error??event.errors[0];
    const step=stepErrors.get(JSON.stringify([event.test?.id,error.message]));
    const observed=step??event;
    return {sequence:observed.sequence,case:event.test?safeIdentity(event.test,source):null,phase:step?.step?.category??(event.test?'test':'global setup/collection'),step:step?diagnosticText(step.step.title):null,message:diagnosticText(error.message),location:location(error,source,step?.step?.location??(event.test?{file:event.test.file,line:event.test.line,column:event.test.column}:null)),durationMs:step?.step?.durationMs??event.durationMs??null};
  }).sort((a,b)=>a.sequence-b.sequence);
  let firstError=failures[0]??null;
  if(!firstError&&(process?.execution.exit!==0||!process)){
    const output=get('run.log')??get('boundary.log')??safeInput(root,path.join(base,'playwright.log'),inputs,missing);
    if(output!==null){const lines=strip(output).split(/\r?\n/),index=lines.findIndex(line=>/Error:|\bERR_|SyntaxError:|TimeoutError:/.test(line));if(index>=0)firstError={case:wrapperDefinitions[wrapper].kind==='programmatic'&&expected[0]?safeIdentity(expected[0],source):null,phase:runBegin?'process after collection':run.some(x=>x.kind==='reporter-loaded')?'setup before collection':'process before reporter',step:null,message:diagnosticText(lines.slice(index,index+15).join('\n')),location:location({stack:lines.slice(index,index+15).join('\n')},source,null),durationMs:process?.execution.durationMs??null};}
  }
  if(!firstError&&process?.execution.error)firstError={case:null,phase:'process spawn',step:null,message:diagnosticText(process.execution.error.message),location:null,durationMs:process.execution.durationMs};
  const expectedIds=expected.map(x=>x.id),startedIds=started.map(x=>x.test.id),endedIds=ended.map(x=>x.test.id);
  const startedSet=new Set(startedIds),endedSet=new Set(endedIds);
  const interruptionFile=path.join(root,base,'interruption.json');
  const interruption=fs.existsSync(interruptionFile)?JSON.parse(safeInput(root,path.join(base,'interruption.json'),inputs,missing)):null;
  if(interruption&&!['timeout','interrupted'].includes(interruption.reason))throw new Error('Invalid parent interruption');
  const browserStarted=browser.some(e=>e.kind==='browser-started')?true:browser.length?false:null;
  if(!firstError&&interruption)firstError={case:null,phase:'parent deadline',step:null,message:'Wrapper '+interruption.reason,location:null,durationMs:interruption.timeoutMs??null};
  const measurements=[];
  if(fs.existsSync(folder))for(const name of fs.readdirSync(folder).filter(n=>/^san-e2-diagnosis-(360|768|1440)\.json$/.test(n))){
    const raw=JSON.parse(safeInput(root,path.join(base,name),inputs,missing));
    const allowed=['version','targetKey','width','targetConfirmed','outcome','failures','viewport','rects','clip','font','clipping','paint','reference','lastError','observationAt','sampleAt'];
    measurements.push(JSON.parse(sanitizeJson(JSON.stringify(Object.fromEntries(allowed.filter(k=>Object.hasOwn(raw,k)).map(k=>[k,diagnosticValue(raw[k])]))))));
  }
  const complete=!interruption&&browserStarted===true&&!!invocation&&!!process&&process.listing.exit===0&&process.execution.exit===0&&selectionMatches&&!!end&&end.status==='passed'&&!run.some(e=>e.kind==='global-error')&&expected.length>0&&new Set(expectedIds).size===expected.length&&JSON.stringify([...expectedIds].sort())===JSON.stringify([...startedIds].sort())&&JSON.stringify([...expectedIds].sort())===JSON.stringify([...endedIds].sort())&&ended.every(x=>x.status==='passed'&&x.expectedStatus==='passed'&&x.retry===0);
  return {version:1,wrapper,invocationId:invocation?.invocationId??null,context,command:invocation?.originalCommand?.map(diagnosticText)??null,selection:{config:invocation?.config??wrapperDefinitions[wrapper].config,argumentsSha256:invocation?.argumentsSha256??null,grepSupplied:invocation?.grepSupplied??null,matchesListing:selectionMatches},process:{browserStarted,termination:interruption?.reason??(process?.execution.signal?'signal':process?.execution.exit===0?'success':process?'failure':'unknown'),timeoutMs:interruption?.timeoutMs??null,spawned:process?!process.execution.error:run.length?true:null,exit:process?.execution.exit??null,signal:process?.execution.signal??null,listingExit:process?.listing.exit??null,durationMs:process?.execution.durationMs??null,reporterLoaded:run.some(x=>x.kind==='reporter-loaded'),collected:!!runBegin,ended:!!end},status:interruption?'interrupted':process?.execution.exit===0?(complete?'passed':'incomplete'):'failed',complete,missing,expected:expected.map(x=>safeIdentity(x,source)),started:started.map(x=>({test:safeIdentity(x.test,source),workerIndex:x.workerIndex,retry:x.retry,startTime:x.startTime})),finished:ended.map(x=>({test:safeIdentity(x.test,source),workerIndex:x.workerIndex,retry:x.retry,status:x.status,expectedStatus:x.expectedStatus,durationMs:x.durationMs,error:x.errors?.length?{message:diagnosticText(x.errors[0].message),location:location(x.errors[0],source,{file:x.test.file,line:x.test.line,column:x.test.column}),signature:hash(x.errors[0].message??'')}:null})),remaining:expected.filter(x=>!endedSet.has(x.id)).map(x=>({test:safeIdentity(x,source),state:startedSet.has(x.id)?'started without end':'not started'})),firstError,measurements,rawInputs:inputs};
}
export function requireWrapperDiagnostics(root,selection,source,ci) {
  const summaries=[];
  for(const [wrapper,definition] of Object.entries(wrapperDefinitions))if(selection.selected.includes(definition.qualified)){
    const summary=summarizeWrapper(root,wrapper);
    if(!summary.complete||summary.context?.source?.commit!==source.commit||summary.context?.source?.digest!==source.digest||ci&&['runId','attempt','job','event'].some(key=>summary.context?.ci?.[key]!==ci[key]))throw new Error('Mandatory wrapper diagnosis incomplete or from another execution: '+wrapper);
    summaries.push({wrapper,tests:summary.finished.length,complete:true});
  }
  return summaries;
}
export function publishWrapperDiagnostics(root,pending,result) {
  const files=[];
  for(const [wrapper,definition] of Object.entries(wrapperDefinitions)){
    const required=result?.selection?.selected?.includes(definition.qualified)||result?.browserPlan?.includes(definition.qualified)||result?.e2ePlanned&&wrapper==='FinancialJourneyPostgresE2E'||false;
    if(!required&&!fs.existsSync(path.join(root,definition.directory?path.join(definition.directory,'diagnostics'):path.join('browsers',wrapper))))continue;
    const summary=summarizeWrapper(root,wrapper);
    if(!summary.firstError&&!summary.process.spawned&&result?.error){
      const failedStep=result.steps?.find(s=>s.exit!==0)?.name;
      let message=diagnosticText(result.error);
      if(failedStep&&/^[a-z][a-z0-9-]*$/.test(failedStep)){
        const output=safeInput(root,failedStep+'.log',summary.rawInputs,summary.missing);
        if(output){const lines=strip(output).split(/\r?\n/),index=lines.findIndex(l=>/Error:|ERR_|\bERROR\b/.test(l));if(index>=0)message=diagnosticText(lines.slice(index,index+15).join('\n'));}
      }
      summary.firstError={case:null,phase:'prerequisite or Java preparation',step:failedStep??null,message,location:null,durationMs:null};
    }
    const publicFile='browsers/'+wrapper+'/diagnosis.json';
    const representation=sanitizeJson(JSON.stringify({...summary,required}));
    const output=path.join(pending,publicFile);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,representation,{flag:'wx'});
    files.push({input:(definition.directory??'browsers/'+wrapper)+'/diagnostics',rawInputs:summary.rawInputs,publicFile,sanitizedSha256:hash(Buffer.from(representation))});
  }
  return files;
}

