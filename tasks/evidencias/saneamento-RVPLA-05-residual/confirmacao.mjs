import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.argv[2]);
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/rvpla05-residual-')));
assert.equal(fs.existsSync(root),false);fs.mkdirSync(root);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),source='tasks/evidencias/preparacao-local-adocao/',snapshot=path.join(root,'snapshot');
for(const f of ['.github/scripts/owned-process.mjs','.github/scripts/owned-process.ps1','.github/scripts/owned-job-probe.ps1','.github/scripts/owned-command.mjs',source+'counterproof-supervision.mjs',source+'counterproof-checkpoint.mjs']){const to=path.join(snapshot,f);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(f,to);}
const probe=path.join(snapshot,'.github/scripts/owned-job-probe.ps1'),probeBefore=fs.readFileSync(probe);
const instrumented=probeBefore.toString().replace("if($config.mode -eq 'identity')", "if($config.mode -eq 'current' -and (Test-Path -LiteralPath (Join-Path $env:RESIDUAL_FAULT_ROOT 'armed'))){throw 'OWNED_INSPECTION_INCONCLUSIVE: residual test denies fresh inspection'}\nif($config.mode -eq 'identity')");
assert.notEqual(instrumented,probeBefore.toString());
const module=n=>pathToFileURL(path.join(snapshot,source,n)).href,worker=path.join(root,'worker.mjs');
const original=`import fs from'node:fs';import path from'node:path';import{superviseCounterproof,verifyOwnedBoundary}from ${JSON.stringify(module('counterproof-supervision.mjs'))};import{ProofStore,hash}from ${JSON.stringify(module('counterproof-checkpoint.mjs'))};
const root=process.argv[2],generation=process.argv[3];await superviseCounterproof(root);const run=JSON.parse(process.env.CF_COUNTERPROOF_SESSION);fs.writeFileSync(root+'/ready-'+generation+'.json',JSON.stringify(run));const end=Date.now()+20000;while(!fs.existsSync(root+'/release-'+generation)){if(Date.now()>end)throw Error('Release barrier missing');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25);}
const src=root+'/source';if(!fs.existsSync(src)){fs.mkdirSync(src);fs.writeFileSync(src+'/input','original');}
const store=new ProofStore({directory:root+'/proofs',sourceRoot:src,evidenceRoot:root,inputs:[{file:'input',sha256:hash('original')}],identity:{candidate:'residual-synthetic',observer:'fresh-confirmation-contract'},verifyEnvironment:()=>verifyOwnedBoundary(root)});let outcome,error;try{outcome=store.run({name:'effect',edits:[['input',()=> 'mutant']]},folder=>{const log=folder+'/effect.log';fs.writeFileSync(log,'SYNTHETIC_CAUSAL_EFFECT');return{status:1,log};},r=>({causal:true,assertionDetected:true,files:[r.log]}));}catch(e){error={message:e.message,kind:e.kind};}fs.writeFileSync(root+'/decision-'+generation+'.json',JSON.stringify({certified:!!outcome,reused:outcome?.reused,error,input:fs.readFileSync(src+'/input','utf8'),attemptCount:fs.readdirSync(root+'/proofs/effect').length,run},null,2));`;
fs.writeFileSync(worker,original);
async function barrier(file){const end=Date.now()+20000;while(!fs.existsSync(file)){if(Date.now()>end)throw Error('Missing confirmation barrier '+file);await new Promise(r=>setTimeout(r,25));}return fs.readFileSync(file,'utf8');}
async function generation(name,beforeRelease=()=>{}){
  const fd=fs.openSync(path.join(root,name+'.log'),'wx'),child=spawn(process.execPath,[worker,root,name],{env:{...process.env,RESIDUAL_FAULT_ROOT:root},windowsHide:true,stdio:['ignore',fd,fd]});fs.closeSync(fd);
  const done=new Promise(r=>child.once('close',r)),run=JSON.parse(await barrier(path.join(root,'ready-'+name+'.json')));
  beforeRelease(run);fs.writeFileSync(path.join(root,'release-'+name),'controlled release');assert.equal(await done,0);
  return JSON.parse(await barrier(path.join(root,'decision-'+name+'.json')));
}
const oracle=path.join(root,'expected-denial.mjs');
fs.writeFileSync(oracle,"import fs from'node:fs';import assert from'node:assert/strict';const r=JSON.parse(fs.readFileSync(process.argv[2]));assert.equal(r.certified,false,'STALE_CONFIRMATION_ALLOWED_ADVANCE');assert.equal(r.input,'original');assert.equal(r.attemptCount,1);\n");
function check(name){const r=spawnSync(process.execPath,[oracle,path.join(root,'decision-'+name+'.json')],{encoding:'utf8'});fs.writeFileSync(path.join(root,name+'-oracle.log'),r.stdout+r.stderr);return r;}
let result;
try {
  fs.writeFileSync(probe,instrumented);
  const first=await generation('first');assert.equal(first.certified,true);assert.equal(first.reused,false);
  const checkpoint=path.join(root,'proofs/effect/0001/checkpoint.json'),checkpointHash=sha(fs.readFileSync(checkpoint)),registry=path.join(root,'.owned-runs');
  const replies=fs.readdirSync(registry).filter(n=>n.startsWith('reply-')).map(n=>({name:n,bytes:fs.readFileSync(path.join(registry,n))}));
  const old=replies.find(r=>JSON.parse(r.bytes).value?.status==='quiescent');assert.ok(old);const oldValue=JSON.parse(old.bytes).value;fs.writeFileSync(path.join(root,'old-confirmation.json'),JSON.stringify(oldValue));
  const denied=await generation('denied',run=>{
    assert.notEqual(run.runId,first.run.runId);
    // A stale reply retains its old/random nonce; it cannot answer a new request.
    fs.writeFileSync(path.join(registry,'reply-'+crypto.randomUUID()+'.json'),old.bytes,{flag:'wx'});
    fs.writeFileSync(path.join(registry,'mailbox-'+first.run.runId+'-99999999.json'),JSON.stringify({runId:first.run.runId,requestId:crypto.randomUUID(),sequence:99999999,mode:'current'}),{flag:'wx'});
    fs.writeFileSync(path.join(root,'armed'),'fresh external inspection must fail');
  });
  assert.equal(check('denied').status,0);assert.equal(denied.error.kind,'inconclusive');assert.equal(sha(fs.readFileSync(checkpoint)),checkpointHash);
  // Counterproof of an incorrect optimization: replacing a fresh callback by
  // the real certificate from the previous generation must fail the same oracle.
  const needle='verifyEnvironment:()=>verifyOwnedBoundary(root)',mutant=original.replace(needle,"verifyEnvironment:()=>JSON.parse(fs.readFileSync(root+'/old-confirmation.json'))");assert.notEqual(mutant,original);
  let cached;
  try{fs.writeFileSync(worker,mutant);cached=await generation('cached');const red=check('cached');assert.equal(red.status,1);assert.match(red.stderr,/STALE_CONFIRMATION_ALLOWED_ADVANCE/);}finally{fs.writeFileSync(worker,original);}
  assert.equal(sha(fs.readFileSync(worker)),sha(original));assert.equal(sha(fs.readFileSync(checkpoint)),checkpointHash);
  fs.renameSync(path.join(root,'armed'),path.join(root,'fault-disarmed'));
  const restored=await generation('restored');assert.equal(restored.certified,true);assert.equal(restored.reused,true);assert.equal(restored.attemptCount,1);assert.equal(sha(fs.readFileSync(checkpoint)),checkpointHash);
  result={first,denied,cached,restored,oldCertificateJob:oldValue.jobName,checkpointSha256:checkpointHash,workerBefore:sha(original),workerMutant:sha(mutant),workerRestored:sha(fs.readFileSync(worker)),scope:'Real broker/native inspection; stale nonce files cannot answer a new generation. Cache counterproof changes only the synthetic checkpoint callback, not a claim that the production broker cached a certificate.'};
}finally{fs.writeFileSync(worker,original);fs.writeFileSync(probe,probeBefore);assert.equal(sha(fs.readFileSync(probe)),sha(probeBefore));}
result.probeBefore=sha(probeBefore);result.probeExecuted=sha(instrumented);result.probeRestored=sha(fs.readFileSync(probe));
fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({freshFailureRejected:true,staleGenerationIgnored:true,cacheMutantDetected:true,restoredReused:true,checkpointUnchanged:true}));
