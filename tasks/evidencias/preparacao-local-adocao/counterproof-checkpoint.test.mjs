import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
const {ProofStore,hash}=await import(process.env.CHECKPOINT_MODULE?pathToFileURL(process.env.CHECKPOINT_MODULE):new URL('./counterproof-checkpoint.mjs',import.meta.url));
const {validateObservation}=await import('./counterproof-observation.mjs');
const parent=process.env.RESUME_TEST_RUNTIME??os.tmpdir();fs.mkdirSync(parent,{recursive:true});
function fixture() {
  const root=fs.mkdtempSync(path.join(parent,'checkpoint-')),source=path.join(root,'source');fs.mkdirSync(source);
  fs.writeFileSync(path.join(source,'a'),'original');
  const options={directory:path.join(root,'proofs'),identity:{candidate:'candidate-a',observer:'v2',config:'pg17/image-a'},
    sourceRoot:source,evidenceRoot:root,inputs:[{file:'a',sha256:hash('original')}]};
  const store=()=>new ProofStore(options);
  const spec={name:'blocked-writer',edits:[['a',()=> 'mutant']]};
  const experiment={method:'writer',failure:['expected: 503','but was: 200'],diagnostic:'HTTP=200 SQL=1'};
  let calls=0;
  const observe=folder=>{
    calls++;assert.equal(fs.readFileSync(path.join(source,'a'),'utf8'),'mutant');
    const log=path.join(folder,'process.log'),reports=path.join(folder,'reports');fs.mkdirSync(reports);
    fs.writeFileSync(log,'HTTP=200 SQL=1');
    fs.writeFileSync(path.join(reports,'TEST-writer.xml'),'<testsuite tests="1" failures="1" errors="0" skipped="0"><testcase name="writer"><failure message="expected: 503 but was: 200">assertion</failure></testcase></testsuite>');
    return {status:1,log,reports};
  };
  const validate=result=>validateObservation(result,experiment);
  const original=()=>assert.equal(fs.readFileSync(path.join(source,'a'),'utf8'),'original');
  return {root,source,options,store,spec,experiment,observe,validate,original,calls:()=>calls};
}
test('valid completion is reused only after evidence and restoration checks',()=>{
  const f=fixture(),a=f.store().run(f.spec,f.observe,f.validate);f.original();
  assert.equal(a.record.state,'complete');assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,true);
  assert.equal(f.calls(),1);f.original();
});
test('recorded exit 1 before causal effect is retried as a new attempt, never skipped',()=>{
  const f=fixture();let firstFolder;
  assert.throws(()=>f.store().run(f.spec,folder=>{firstFolder=folder;const r=f.observe(folder);fs.writeFileSync(r.log,'startup timed out before HTTP/SQL');return r;},f.validate),/Missing causal effect/);
  const old=fs.readFileSync(path.join(firstFolder,'checkpoint.json'));f.original();
  const result=f.store().run(f.spec,f.observe,f.validate);
  assert.equal(result.reused,false);assert.equal(f.calls(),2);f.original();
  assert.deepEqual(fs.readFileSync(path.join(firstFolder,'checkpoint.json')),old);
  assert.equal(result.record.state,'complete');
});
test('failure preparing mutation is recorded and cannot release following work',()=>{
  const f=fixture();assert.throws(()=>f.store().run({...f.spec,edits:[['a',()=>{throw Error('preparation failed');}]]},f.observe,f.validate),/preparation failed/);
  f.original();assert.equal(f.calls(),0);assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);f.original();
});
test('observer exception after mutation restores bytes and persists failure',()=>{
  const f=fixture();assert.throws(()=>f.store().run(f.spec,()=>{throw Error('observer unavailable');},f.validate),/observer unavailable/);
  f.original();assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);f.original();
});
for(const state of ['running','mutated','observed','restoration-pending','failed-before-completion'])test('interruption in '+state+' restores and observes anew',()=>{
  const f=fixture();f.store();
  const folder=path.join(f.options.directory,f.spec.name,'0001');fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'original-0'),'original');fs.writeFileSync(path.join(f.source,'a'),'mutant');
  fs.writeFileSync(path.join(folder,'checkpoint.json'),JSON.stringify({state,name:f.spec.name,identity:hash(JSON.stringify(f.options.identity)),
    files:[{file:'a',backup:'original-0',before:hash('original'),after:hash('mutant')}],proof:{causal:true,assertionDetected:true}}));
  const result=f.store().run(f.spec,f.observe,f.validate);
  assert.equal(result.reused,false);assert.equal(path.basename(result.folder),'0002');assert.equal(f.calls(),1);f.original();
});
test('surviving mutation does not complete',()=>{
  const f=fixture();assert.throws(()=>f.store().run(f.spec,folder=>({...f.observe(folder),status:0}),f.validate),/survived/);f.original();
});
test('generic assertion counts with wrong failure do not complete',()=>{
  const f=fixture();assert.throws(()=>f.store().run(f.spec,folder=>{const r=f.observe(folder);fs.writeFileSync(path.join(r.reports,'TEST-writer.xml'),'<testsuite tests="1" failures="1" errors="0" skipped="0"><testcase name="writer"><failure>Expected HTTP 200 at liveness</failure></testcase></testsuite>');return r;},f.validate),/before causal/);f.original();
});
for(const invalid of ['wrong-method','errors','skipped','missing-child-effect'])test('observer rejects '+invalid,()=>{
  const f=fixture();
  assert.throws(()=>f.store().run(f.spec,folder=>{
    const r=f.observe(folder),file=path.join(r.reports,'TEST-writer.xml');let xml=fs.readFileSync(file,'utf8');
    if(invalid==='wrong-method')xml=xml.replace('name="writer"','name="unrelated"');
    if(invalid==='errors')xml=xml.replace('errors="0"','errors="1"');
    if(invalid==='skipped')xml=xml.replace('skipped="0"','skipped="1"');
    fs.writeFileSync(file,xml);return r;
  },result=>validateObservation(result,{...f.experiment,...(invalid==='missing-child-effect'?{childDiagnostic:'migrations actually applied'}:{})})));
  f.original();
});
for(const corruption of ['missing-log','tampered-report','tampered-checkpoint-result'])test('invalid evidence '+corruption+' is not reused',()=>{
  const f=fixture(),r=f.store().run(f.spec,f.observe,f.validate);
  if(corruption==='missing-log')fs.unlinkSync(r.record.result.log);
  else if(corruption==='tampered-report')fs.appendFileSync(path.join(r.record.result.reports,'TEST-writer.xml'),'changed');
  else {const checkpoint=path.join(r.folder,'checkpoint.json'),record=JSON.parse(fs.readFileSync(checkpoint));record.result.status=0;fs.writeFileSync(checkpoint,JSON.stringify(record));}
  assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);assert.equal(f.calls(),2);f.original();
});
for(const field of ['candidate','observer','config'])test('different '+field+' checkpoint is rejected without mutation',()=>{
  const f=fixture();f.store().run(f.spec,f.observe,f.validate);
  assert.throws(()=>new ProofStore({...f.options,identity:{...f.options.identity,[field]:'other'}}),/Incompatible/);assert.equal(f.calls(),1);f.original();
});
test('incomplete restoration blocks resume until backup/source repair is verified',()=>{
  const f=fixture();let folder;
  assert.throws(()=>f.store().run(f.spec,d=>{folder=d;fs.unlinkSync(path.join(d,'original-0'));throw Error('interrupted restore');},f.validate));
  assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'checkpoint.json'))).state,'restoration-pending');
  assert.throws(()=>f.store().run(f.spec,f.observe,f.validate));assert.equal(f.calls(),0);
  fs.writeFileSync(path.join(folder,'original-0'),'original');
  assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);f.original();
});
test('unrelated candidate change blocks reuse even with a valid proof',()=>{
  const f=fixture();fs.writeFileSync(path.join(f.source,'b'),'baseline');f.options.inputs.push({file:'b',sha256:hash('baseline')});
  f.store().run(f.spec,f.observe,f.validate);fs.writeFileSync(path.join(f.source,'b'),'changed');
  assert.throws(()=>f.store().run(f.spec,f.observe,f.validate),/not restored/);assert.equal(f.calls(),1);f.original();
});
test('legacy status-only receipt is kept but never imported as completion',()=>{
  const f=fixture(),legacy=path.join(f.root,'results.json'),bytes='[{"name":"blocked-writer","status":1}]';fs.writeFileSync(legacy,bytes);
  assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);assert.equal(fs.readFileSync(legacy,'utf8'),bytes);f.original();
});
test('truncated checkpoint fails closed and does not advance',()=>{
  const f=fixture(),r=f.store().run(f.spec,f.observe,f.validate);fs.writeFileSync(path.join(r.folder,'checkpoint.json'),'{');
  assert.throws(()=>f.store().run(f.spec,f.observe,f.validate));assert.equal(f.calls(),1);f.original();
});
test('a later incomplete attempt prevents reuse of an older completion',()=>{
 const f=fixture(),old=f.store().run(f.spec,f.observe,f.validate),folder=path.join(path.dirname(old.folder),'0002');fs.mkdirSync(folder);
 fs.writeFileSync(path.join(folder,'original-0'),'original');fs.writeFileSync(path.join(f.source,'a'),'mutant');
 fs.writeFileSync(path.join(folder,'checkpoint.json'),JSON.stringify({...old.record,state:'observed',active:false}));
 const result=f.store().run(f.spec,f.observe,f.validate);assert.equal(path.basename(result.folder),'0003');assert.equal(result.reused,false);assert.equal(f.calls(),2);f.original();
});
test('an active observer cannot be resumed or have its mutation restored concurrently',()=>{
 const f=fixture();f.store().run(f.spec,folder=>{
  assert.throws(()=>f.store().run(f.spec,f.observe,f.validate),/still running/);
  assert.equal(fs.readFileSync(path.join(f.source,'a'),'utf8'),'mutant');return f.observe(folder);
 },f.validate);f.original();
});
test('unknown external process cleanup blocks restoration and continuation until verified',()=>{
 const f=fixture();let externalActive=false;
 f.options.verifyEnvironment=()=>{if(externalActive)throw Error('external child still active');};
 assert.throws(()=>f.store().run(f.spec,folder=>{const result=f.observe(folder);externalActive=true;return result;},f.validate),/external child/);
 assert.equal(fs.readFileSync(path.join(f.source,'a'),'utf8'),'mutant');
 assert.throws(()=>f.store().run(f.spec,f.observe,f.validate),/external child/);assert.equal(f.calls(),1);
 externalActive=false;
 assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);f.original();assert.equal(f.calls(),2);
});
