import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';

const required=['execution','scenario','candidate','packageSha256','pageId','documentId','url','title','browser','userSha256','sessionSha256','cardId'];
const identity=['execution','scenario','candidate','packageSha256','pageId','documentId','url','title','browser','userSha256','sessionSha256','cardId','challenge'];
const read=dir=>JSON.parse(fs.readFileSync(path.join(dir,'pause.json'),'utf8'));
function save(dir,state) {
  const temp=path.join(dir,'pause-'+randomUUID()+'.tmp');
  fs.writeFileSync(temp,JSON.stringify(state,null,2)+'\n',{flag:'wx'});
  fs.renameSync(temp,path.join(dir,'pause.json'));
}
function lock(dir) {
  const file=path.join(dir,'transition.lock');
  const fd=fs.openSync(file,'wx');
  return ()=>{fs.closeSync(fd);fs.unlinkSync(file);};
}
function active(state,now) {
  assert.equal(state.status,'waiting','Pause is not active');
  assert.ok(now>=state.preparedAt && now<state.expiresAt,'Pause expired or clock invalid');
}
function signalMatches(state,signal,now) {
  for(const key of identity) assert.equal(signal[key],state[key],'Wrong '+key);
  assert.ok(signal.observedAt>=state.preparedAt && signal.observedAt<=signal.issuedAt,'Observation predates preparation');
  assert.ok(signal.issuedAt<=now && signal.issuedAt<state.expiresAt,'Stale or future confirmation');
  assert.equal(signal.initialZoom,100);
  assert.equal(signal.pageZoom,200);
  assert.equal(signal.nativeIndicatorObserved,true);
  assert.equal(signal.capturesDeclared,true);
  assert.ok(signal.operator?.trim(),'Explicit operator required');
  assert.equal(signal.source,state.synthetic?'synthetic-test':'human-local-terminal');
}
export function preparePause(dir,target,{now=Date.now(),leaseMs=600_000,synthetic=false}={}) {
  for(const key of required) assert.ok(typeof target[key]==='string'&&target[key].trim(),key+' required');
  assert.ok(['cf015','rf15'].includes(target.scenario));
  assert.match(target.url,/^http:\/\/127\.0\.0\.1:\d+\/cartoes$/);
  assert.ok(Number.isFinite(leaseMs)&&leaseMs>0&&leaseMs<=600_000);
  fs.mkdirSync(dir,{recursive:true});
  const state={...Object.fromEntries(required.map(key=>[key,target[key]])),baseline:target.baseline,
    version:1,ownerPid:process.pid,challenge:randomUUID(),preparedAt:now,expiresAt:now+leaseMs,status:'waiting',synthetic,
    meaning:'Coordination only. No zoom measurement or functional approval.'};
  fs.writeFileSync(path.join(dir,'pause.json'),JSON.stringify(state,null,2)+'\n',{flag:'wx'});
  return state;
}
export function confirmationFor(state,{operator,now=Date.now(),source='human-local-terminal'}={}) {
  return {...Object.fromEntries(identity.map(key=>[key,state[key]])),observedAt:now,issuedAt:now,
    initialZoom:100,pageZoom:200,nativeIndicatorObserved:true,capturesDeclared:true,operator,source};
}
export function submitConfirmation(dir,signal,{now=Date.now()}={}) {
  const release=lock(dir);
  try {
    const state=read(dir); active(state,now); signalMatches(state,signal,now);
    fs.writeFileSync(path.join(dir,'confirmation.json'),JSON.stringify(signal,null,2)+'\n',{flag:'wx'});
  } finally {release();}
}
export function cancelPause(dir,reason,{now=Date.now(),status='cancelled'}={}) {
  const release=lock(dir);
  try {
    const state=read(dir);
    assert.equal(state.status,'waiting','Pause already consumed or ended');
    save(dir,{...state,status,endedAt:now,reason,functionalResult:'incomplete'});
  } finally {release();}
}
export async function consumeConfirmation(dir,revalidate,{clock=Date.now,now=clock(),signal:abortSignal}={}) {
  const release=lock(dir);
  try {
    const state=read(dir); active(state,now);
    const confirmationBytes=fs.readFileSync(path.join(dir,'confirmation.json'));
    const signal=JSON.parse(confirmationBytes);
    signalMatches(state,signal,now);
    try {
      const current=await revalidate();
      assert.equal(current.sessionStatus,200,'Session expired or invalid');
      for(const key of required) assert.deepEqual(current[key],state[key],'Preparation changed: '+key);
      assert.ok(!abortSignal?.aborted,'Cancelled during preparation revalidation');
      active(state,clock());
      save(dir,{...state,status:'resumed',resumedAt:now,confirmationSource:signal.source,
        confirmationSha256:createHash('sha256').update(confirmationBytes).digest('hex'),functionalResult:'pending',
        meaning:'Human declaration accepted once; native captures still require review.'});
      return {state,signal,pausedMs:now-state.preparedAt};
    } catch(error) {
      save(dir,{...state,status:'invalidated',endedAt:now,reason:error.message,functionalResult:'incomplete'});
      throw error;
    }
  } finally {release();}
}
export function waitForConfirmation(dir,revalidate,{signal,now=()=>Date.now()}={}) {
  return new Promise((resolve,reject)=>{
    let busy=false,closed=false,watcher,timer;
    function cleanup() {closed=true;watcher?.close();clearTimeout(timer);signal?.removeEventListener('abort',aborted);}
    function fail(error) {cleanup();reject(error);}
    function aborted() {
      try {cancelPause(dir,'Cancelled by operator or page/context changed',{now:now()});} catch {}
      fail(signal?.reason??new Error('Cancelled'));
    }
    async function check() {
      if(busy||closed)return;
      try {
        const state=read(dir);
        if(state.status!=='waiting') throw Error('Pause ended: '+state.status);
        if(now()>=state.expiresAt) {
          cancelPause(dir,'Resource lease expired',{now:now(),status:'expired'});
          throw Error('Resource lease expired; scenario incomplete');
        }
        if(!fs.existsSync(path.join(dir,'confirmation.json')) || fs.existsSync(path.join(dir,'transition.lock')))return;
        busy=true;
        const result=await consumeConfirmation(dir,revalidate,{now:now(),clock:now,signal});
        cleanup();resolve(result);
      } catch(error) {if(error.code!=='EEXIST')fail(error);}
      finally {busy=false;}
    }
    watcher=fs.watch(dir,()=>{void check();});
    signal?.addEventListener('abort',aborted,{once:true});
    timer=setTimeout(()=>{void check();},Math.max(1,read(dir).expiresAt-now()));
    if(signal?.aborted)aborted();else void check();
  });
}
export function finishScenario(dir,result,{now=Date.now()}={}) {
  assert.ok(['passed','failed'].includes(result));
  const release=lock(dir);
  try {
    const state=read(dir);assert.equal(state.status,'resumed');
    save(dir,{...state,status:'finished',functionalResult:result,finishedAt:now,
      acceptance:'Not global AC-UI-001/CF010/CF015 acceptance; evidence review required'});
  } finally {release();}
}
export function attachEvidence(dir,evidence) {
  // Evidence can arrive later. It cannot change the functional outcome.
  const state=read(dir);
  fs.writeFileSync(path.join(dir,'evidence-'+randomUUID()+'.json'),JSON.stringify({...evidence,at:Date.now(),challenge:state.challenge},null,2),{flag:'wx'});
}
export {read as readPause};
