import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {preparePause,confirmationFor,submitConfirmation,consumeConfirmation,cancelPause,waitForConfirmation,finishScenario,attachEvidence,readPause} from './protocolo.mjs';

const root=process.env.ZOOM_PROTOCOL_TEST_ROOT??path.join(os.tmpdir(),'zoom-protocol-synthetic');
fs.mkdirSync(root,{recursive:true});
const target={execution:'execution-current',scenario:'cf015',candidate:'candidate-current',packageSha256:'package-current',
  pageId:'page-current',documentId:'document-current',url:'http://127.0.0.1:3107/cartoes',title:'CF015 | unique-current',
  browser:'synthetic-browser',userSha256:'user-current',sessionSha256:'session-current',cardId:'card-current'};
function setup() {
  const dir=fs.mkdtempSync(path.join(root,'case-'));
  const state=preparePause(dir,target,{now:1000,leaseMs:1000,synthetic:true});
  return {dir,state,valid:()=>({...target,sessionStatus:200}),signal:confirmationFor(state,{operator:'Synthetic protocol test',source:'synthetic-test',now:1100})};
}
test('absence never approves; cancellation closes the active watcher',async()=>{
  const x=setup(),controller=new AbortController();
  const waiting=waitForConfirmation(x.dir,x.valid,{signal:controller.signal,now:()=>1100});
  assert.equal(readPause(x.dir).functionalResult,undefined);
  controller.abort(new Error('Test cancellation'));
  await assert.rejects(waiting,/Test cancellation/);
  assert.equal(readPause(x.dir).functionalResult,'incomplete');
});
test('wrong execution, scenario, candidate, package, page, document and challenge are refused',()=>{
  for(const key of ['execution','scenario','candidate','packageSha256','pageId','documentId','challenge']) {
    const x=setup();
    assert.throws(()=>submitConfirmation(x.dir,{...x.signal,[key]:'wrong'},{now:1100,clock:()=>1100}),/Wrong/);
    assert.equal(fs.existsSync(path.join(x.dir,'confirmation.json')),false);
  }
});
test('stale observations and confirmations from an earlier preparation are refused',()=>{
  const x=setup(),old=setup();
  assert.throws(()=>submitConfirmation(x.dir,old.signal,{now:1100,clock:()=>1100}),/Wrong challenge/);
  assert.throws(()=>submitConfirmation(x.dir,{...x.signal,observedAt:999},{now:1100,clock:()=>1100}),/predates/);
  assert.throws(()=>submitConfirmation(x.dir,{...x.signal,issuedAt:2100},{now:2200}),/expired/);
});
test('cancelled scenario remains incomplete and cannot accept confirmation',()=>{
  const x=setup();cancelPause(x.dir,'Operator cancelled',{now:1100,clock:()=>1100});
  assert.throws(()=>submitConfirmation(x.dir,x.signal,{now:1100,clock:()=>1100}),/not active/);
  assert.equal(readPause(x.dir).functionalResult,'incomplete');
});
test('valid confirmation resumes through the file watcher exactly once',async()=>{
  const x=setup();
  const waiting=waitForConfirmation(x.dir,x.valid,{now:()=>1100});
  submitConfirmation(x.dir,x.signal,{now:1100,clock:()=>1100});
  const result=await waiting;
  assert.equal(result.pausedMs,100);
  assert.equal(readPause(x.dir).status,'resumed');
  await assert.rejects(consumeConfirmation(x.dir,x.valid,{now:1100,clock:()=>1100}),/not active/);
  assert.throws(()=>submitConfirmation(x.dir,x.signal,{now:1100,clock:()=>1100}),/not active/);
});
test('concurrent consumers cannot both resume',async()=>{
  const x=setup();submitConfirmation(x.dir,x.signal,{now:1100,clock:()=>1100});
  const first=consumeConfirmation(x.dir,x.valid,{now:1100,clock:()=>1100});
  await assert.rejects(consumeConfirmation(x.dir,x.valid,{now:1100,clock:()=>1100}),/EEXIST/);
  await first;
});
test('upload later cannot change a post-resume functional failure',async()=>{
  const x=setup();submitConfirmation(x.dir,x.signal,{now:1100,clock:()=>1100});
  await consumeConfirmation(x.dir,x.valid,{now:1100,clock:()=>1100});
  finishScenario(x.dir,'failed',{now:1200});
  const before=fs.readFileSync(path.join(x.dir,'pause.json'),'utf8');
  attachEvidence(x.dir,{source:'synthetic-test',sha256:'later-upload',nativeZoomCertified:false,challenge:'old-evidence-challenge'});
  assert.equal(fs.readFileSync(path.join(x.dir,'pause.json'),'utf8'),before);
  assert.equal(readPause(x.dir).functionalResult,'failed');
  const attached=fs.readdirSync(x.dir).find(name=>name.startsWith('evidence-'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(x.dir,attached))).challenge,x.state.challenge);
});
test('session expiration during pause is detected before continuation',async()=>{
  const x=setup();submitConfirmation(x.dir,x.signal,{now:1100,clock:()=>1100});
  await assert.rejects(consumeConfirmation(x.dir,()=>({...target,sessionStatus:401}),{now:1100,clock:()=>1100}),/Session expired/);
  assert.equal(readPause(x.dir).status,'invalidated');
  assert.equal(readPause(x.dir).functionalResult,'incomplete');
});
test('changed session, URL, document, page or entity invalidates preparation',async()=>{
  for(const key of ['sessionSha256','userSha256','url','documentId','pageId','cardId']) {
    const x=setup();submitConfirmation(x.dir,x.signal,{now:1100,clock:()=>1100});
    await assert.rejects(consumeConfirmation(x.dir,()=>({...target,sessionStatus:200,[key]:'changed'}),{now:1100,clock:()=>1100}),/Preparation changed/);
    assert.equal(readPause(x.dir).functionalResult,'incomplete');
  }
});
test('resource lease expiration leaves no successful result',async()=>{
  const x=setup();
  await assert.rejects(waitForConfirmation(x.dir,x.valid,{now:()=>2100}),/lease expired/);
  assert.equal(readPause(x.dir).status,'expired');
});
test('synthetic confirmation is impossible in an actual attended execution',()=>{
  const dir=fs.mkdtempSync(path.join(root,'production-mode-'));
  const state=preparePause(dir,target,{now:1000,leaseMs:1000});
  const forged=confirmationFor(state,{operator:'Synthetic',source:'synthetic-test',now:1100});
  assert.throws(()=>submitConfirmation(dir,forged,{now:1100,clock:()=>1100}),/synthetic-test/);
});
test('native indication and baseline declaration are mandatory; a signal alone is insufficient',()=>{
  for(const [key,value] of [['initialZoom',125],['pageZoom',150],['nativeIndicatorObserved',false],['capturesDeclared',false],['operator','']]) {
    const x=setup();assert.throws(()=>submitConfirmation(x.dir,{...x.signal,[key]:value},{now:1100,clock:()=>1100}));
  }
});

test('lease expiring during revalidation cannot resume',async()=>{
  const x=setup();submitConfirmation(x.dir,x.signal,{now:1100});
  await assert.rejects(consumeConfirmation(x.dir,x.valid,{now:1100,clock:()=>2100}),/expired/);
  assert.equal(readPause(x.dir).functionalResult,'incomplete');
});
test('cancellation racing with session revalidation cannot resume',async()=>{
  const x=setup(),controller=new AbortController();let release;
  const validation=new Promise(resolve=>{release=resolve;});
  submitConfirmation(x.dir,x.signal,{now:1100});
  const consumed=consumeConfirmation(x.dir,async()=>{await validation;return {...target,sessionStatus:200};},{now:1100,clock:()=>1100,signal:controller.signal});
  controller.abort();release();
  await assert.rejects(consumed,/Cancelled during/);
  assert.equal(readPause(x.dir).functionalResult,'incomplete');
});
