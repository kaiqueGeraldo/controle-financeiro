import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {collectPublic} from './publish-evidence.mjs';
import {summarizeWrapper,requireWrapperDiagnostics,wrapperDefinitions} from './wrapper-diagnostics.mjs';

const source={commit:'a'.repeat(40),digest:'b'.repeat(64)};
const ci={runId:'100',attempt:'2',job:'expanded',event:'workflow_dispatch'};
const wrappers=Object.keys(wrapperDefinitions);
function fixture(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-wrapper-contract-'));
  t.after(()=>{assert.equal(path.dirname(root),fs.realpathSync.native(os.tmpdir()));fs.rmSync(root,{recursive:true,force:true});});
  return root;
}
function write(root,file,value){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,typeof value==='string'?value:JSON.stringify(value));}
function receipt(root,wrapper,{failed=false,message='SYNTHETIC_FAILURE',second=false}={}){
  const folder='browsers/'+wrapper+'/diagnostics/',invocationId=wrapper+'-invocation';
  const identity={id:wrapper+'-case',project:'synthetic-project',file:'synthetic.spec.ts',titles:['synthetic-project',wrapper,'case'],line:12,column:3,repeatEachIndex:0};
  const expected=[identity,...(second?[{...identity,id:wrapper+'-remaining',titles:['remaining']}]:[])];
  write(root,folder+'invocation.json',{version:1,wrapper,invocationId,config:wrapperDefinitions[wrapper].config,sourceRoot:root,argumentsSha256:'c'.repeat(64),context:{source,ci},grepSupplied:false});
  write(root,folder+'process.json',{version:1,wrapper,invocationId,listing:{exit:0},execution:{exit:failed?1:0,durationMs:456,signal:null,error:null}});
  const events=(phase,items)=>items.map((e,i)=>JSON.stringify({version:1,wrapper,invocationId,phase,sequence:i+1,...e})).join('\n')+'\n';
  write(root,folder+'events-list.jsonl',events('list',[{kind:'reporter-loaded'},{kind:'begin',expected},{kind:'end',status:'passed'}]));
  const error={message,location:{file:path.join(root,'synthetic.spec.ts'),line:13,column:5}};
  write(root,folder+'events-run.jsonl',events('run',[
    {kind:'reporter-loaded'},{kind:'begin',expected},
    {kind:'test-start',test:identity,workerIndex:0,retry:0,startTime:'2026-11-05T00:00:00.000Z'},
    ...(failed?[{kind:'step-error',test:identity,step:{title:'synthetic assertion',category:'expect',durationMs:23,location:error.location},error}]:[]),
    {kind:'test-end',test:identity,workerIndex:0,retry:0,status:failed?'failed':'passed',expectedStatus:'passed',durationMs:123,errors:failed?[error]:[]},
    {kind:'end',status:failed?'failed':'passed',durationMs:456},
  ]));
  return folder;
}
const selection={selected:wrappers.map(w=>wrapperDefinitions[w].qualified)};
test('workflow publication retains both wrapper failures, identities and first steps',t=>{
  const root=fixture(t);
  for(const w of wrappers)receipt(root,w,{failed:true,message:'IDENTIFIABLE_'+w,second:true});
  write(root,'result.json',{selection,status:'failed'});
  const files=collectPublic(root);
  for(const w of wrappers){
    const publicFile='browsers/'+w+'/diagnosis.json';
    assert.ok(files.some(f=>f.publicFile===publicFile));
    const summary=JSON.parse(fs.readFileSync(path.join(root,'public',publicFile)));
    assert.equal(summary.firstError.message,'IDENTIFIABLE_'+w);
    assert.equal(summary.firstError.case.titles[1],w);
    assert.equal(summary.firstError.step,'synthetic assertion');
    assert.equal(summary.firstError.location.line,13);
    assert.equal(summary.firstError.durationMs,23);
    assert.equal(summary.process.exit,1);
    assert.equal(summary.expected.length,2);assert.equal(summary.started.length,1);assert.equal(summary.finished.length,1);
    assert.equal(summary.remaining[0].state,'not started');
    assert.equal(summary.required,true);assert.equal(summary.complete,false);
  }
  assert.throws(()=>requireWrapperDiagnostics(root,selection,source,ci),/incomplete/);
});
test('positive evidence passes only for matching source, job and complete selection',t=>{
  const root=fixture(t);for(const w of wrappers)receipt(root,w);
  assert.equal(requireWrapperDiagnostics(root,selection,source,ci).length,2);
  assert.throws(()=>requireWrapperDiagnostics(root,selection,{...source,commit:'d'.repeat(40)},ci),/another execution/);
  assert.throws(()=>requireWrapperDiagnostics(root,selection,source,{...ci,attempt:'3'}),/another execution/);
});
test('missing required lifecycle is published as incomplete and cannot approve',t=>{
  const root=fixture(t);receipt(root,wrappers[0]);
  fs.unlinkSync(path.join(root,'browsers',wrappers[0],'diagnostics','events-run.jsonl'));
  write(root,'result.json',{selection,status:'failed'});collectPublic(root);
  for(const w of wrappers){
    const summary=JSON.parse(fs.readFileSync(path.join(root,'public','browsers',w,'diagnosis.json')));
    assert.equal(summary.complete,false);assert.ok(summary.missing.some(p=>p.endsWith('events-run.jsonl')));
  }
  assert.throws(()=>requireWrapperDiagnostics(root,selection,source,ci),/incomplete/);
});
test('a different invocation or phase cannot be combined into a receipt',t=>{
  const root=fixture(t),folder=receipt(root,wrappers[0]);
  const file=path.join(root,folder,'events-run.jsonl');
  const original=fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,original.replaceAll('"phase":"run"','"phase":"list"'));
  assert.throws(()=>summarizeWrapper(root,wrappers[0]),/Mixed wrapper lifecycle/);
  fs.writeFileSync(file,original.replaceAll(wrappers[0]+'-invocation','other-invocation'));
  assert.throws(()=>summarizeWrapper(root,wrappers[0]),/Mixed wrapper lifecycle/);
});
test('public projection removes sentinel, URLs, HTTP detail and unrelated raw files',t=>{
  const root=fixture(t),sentinel='SYNTHETIC_SENSITIVE_51937';
  for(const w of wrappers){
    const folder=receipt(root,w,{failed:true,message:"Synthetic assertion password='"+sentinel+"' https://private.invalid/path headers: "+sentinel});
    write(root,folder+'results.json',{private:sentinel});write(root,folder+'trace.zip',sentinel);
  }
  write(root,'result.json',{selection,status:'failed'});collectPublic(root);
  const walk=folder=>fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(folder,e.name)):[path.join(folder,e.name)]);
  const publicFiles=walk(path.join(root,'public'));
  const publicText=publicFiles.map(f=>fs.readFileSync(f,'utf8')).join('\n');
  assert.doesNotMatch(publicText,new RegExp(sentinel+'|private.invalid|trace.zip'));
  assert.equal(publicFiles.filter(f=>f.endsWith('diagnosis.json')).length,2);
  assert.match(publicText,/REDACTED/);
});
test('sanitization failure never exposes public directory or a raw fallback',t=>{
  const root=fixture(t);receipt(root,wrappers[0],{failed:true,message: "password='SYNTHETIC_UNCLOSED"});
  assert.throws(()=>collectPublic(root));assert.equal(fs.existsSync(path.join(root,'public')),false);
});
test('a wrapper alias outside the evidence root is rejected',t=>{
  const root=fixture(t),outside=fixture(t);
  fs.mkdirSync(path.join(root,'browsers'));fs.symlinkSync(outside,path.join(root,'browsers',wrappers[0]),process.platform==='win32'?'junction':'dir');
  assert.throws(()=>summarizeWrapper(root,wrappers[0]),/Unsafe wrapper directory/);
});
test('launcher preserves nonzero child exit and captures a failure before any reporter',t=>{
  const root=fixture(t),sourceRoot=path.join(root,'source'),front=path.join(sourceRoot,'controle-financeiro-frontend'),output=path.join(root,'output');
  fs.mkdirSync(front,{recursive:true});fs.mkdirSync(output);
  write(sourceRoot,'.ci-source.json',source);
  write(front,'node_modules/@playwright/test/cli.js',"console.error('Error: SYNTHETIC_DEPENDENCY_FAILURE password=\\\"SYNTHETIC_PRIVATE_17\\\"');process.exit(17);");
  const wrapper=wrappers[0],evidence=path.join(output,'browsers',wrapper);fs.mkdirSync(evidence,{recursive:true});
  const launcher=fileURLToPath(new URL('./wrapper-browser.mjs',import.meta.url));
  const result=spawnSync(process.execPath,[launcher,'--wrapper',wrapper,'test','--config',wrapperDefinitions[wrapper].config],{cwd:front,env:{...process.env,CF_SOURCE_ROOT:sourceRoot,CF_REVIEW_EVIDENCE:evidence},encoding:'utf8',windowsHide:true});
  assert.equal(result.status,17,result.stderr);
  const summary=summarizeWrapper(output,wrapper);
  assert.equal(summary.process.exit,17);assert.equal(summary.process.reporterLoaded,false);assert.equal(summary.process.collected,false);
  assert.equal(summary.firstError.phase,'process before reporter');assert.match(summary.firstError.message,/SYNTHETIC_DEPENDENCY_FAILURE/);
  collectPublic(output);
  assert.doesNotMatch(fs.readFileSync(path.join(output,'public','browsers',wrapper,'diagnosis.json'),'utf8'),/SYNTHETIC_PRIVATE_17/);
});

