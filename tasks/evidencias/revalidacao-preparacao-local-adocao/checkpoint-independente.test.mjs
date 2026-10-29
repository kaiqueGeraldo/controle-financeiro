import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {ProofStore,hash} from '../preparacao-local-adocao/counterproof-checkpoint.mjs';
import {validateObservation} from '../preparacao-local-adocao/counterproof-observation.mjs';
const runtime=path.resolve(process.env.REVALIDATION_RUNTIME),modulePath=fileURLToPath(new URL('../preparacao-local-adocao/counterproof-checkpoint.mjs',import.meta.url));
fs.mkdirSync(path.join(runtime,'atomic'),{recursive:true});
function fixture(){const root=fs.mkdtempSync(path.join(runtime,'atomic/case-'));fs.mkdirSync(path.join(root,'source'));fs.writeFileSync(path.join(root,'source/input'),'BASE');
 const options={directory:path.join(root,'receipts'),sourceRoot:path.join(root,'source'),evidenceRoot:root,identity:{candidate:'aa068d1',observer:'independent-v1',config:'fixed'},inputs:[{file:'input',sha256:hash('BASE')}]};
 const spec={name:'causal',edits:[['input',()=> 'MUTANT']]};let observations=0;
 const observe=folder=>{observations++;assert.equal(fs.readFileSync(path.join(root,'source/input'),'utf8'),'MUTANT');const log=path.join(folder,'effect.log');fs.writeFileSync(log,'EXPECTED_EFFECT');return {status:1,log};};
 const validate=r=>{assert.equal(r.status,1);assert.equal(fs.readFileSync(r.log,'utf8'),'EXPECTED_EFFECT');return {causal:true,assertionDetected:true,files:[r.log]};};
 return {root,options,spec,observe,validate,store:()=>new ProofStore(options),calls:()=>observations};}
for(const state of ['running','mutated','observed','restoration-pending','complete'])test('real process interruption before atomic rename: '+state,()=>{
 const f=fixture(),worker=path.join(f.root,'interrupt.mjs');
 fs.writeFileSync(worker,`import fs from 'node:fs';import {ProofStore}from ${JSON.stringify(pathToFileURL(modulePath).href)};const rename=fs.renameSync;fs.renameSync=(a,b)=>{if(String(b).endsWith('checkpoint.json')&&JSON.parse(fs.readFileSync(a)).state===${JSON.stringify(state)})process.exit(88);return rename(a,b);};const store=new ProofStore(${JSON.stringify(f.options)});store.run({name:'causal',edits:[['input',()=> 'MUTANT']]},folder=>{const log=folder+'/effect.log';fs.writeFileSync(log,'EXPECTED_EFFECT');return {status:1,log};},r=>({causal:true,assertionDetected:true,files:[r.log]}));`);
 const child=spawnSync(process.execPath,[worker],{encoding:'utf8'});assert.equal(child.status,88,child.stderr);
 const folder=path.join(f.options.directory,'causal/0001');assert.ok(fs.readdirSync(folder).some(n=>n.endsWith('.tmp')));
 if(state==='running') {assert.throws(()=>f.store().run(f.spec,f.observe,f.validate),/ENOENT/);assert.equal(f.calls(),0);assert.equal(fs.readFileSync(path.join(f.options.sourceRoot,'input'),'utf8'),'BASE');}
 else {const old=JSON.parse(fs.readFileSync(path.join(folder,'checkpoint.json')));assert.notEqual(old.state,'complete');const result=f.store().run(f.spec,f.observe,f.validate);assert.equal(result.reused,false);assert.equal(path.basename(result.folder),'0002');assert.equal(f.calls(),1);assert.equal(fs.readFileSync(path.join(f.options.sourceRoot,'input'),'utf8'),'BASE');}
});
test('event claiming completion does not override incomplete checkpoint',()=>{
 const f=fixture(),r=f.store().run(f.spec,f.observe,f.validate),cp=path.join(r.folder,'checkpoint.json');
 fs.writeFileSync(cp,JSON.stringify({...r.record,state:'observed'}));fs.appendFileSync(path.join(r.folder,'events.jsonl'),JSON.stringify({...r.record,state:'complete'})+'\n');
 assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);assert.equal(f.calls(),2);
});
test('unknown bytes after partial restoration block without overwriting them',()=>{
 const f=fixture(),r=f.store().run(f.spec,f.observe,f.validate);fs.writeFileSync(path.join(f.options.sourceRoot,'input'),'PARTIAL');
 assert.throws(()=>f.store().run(f.spec,f.observe,f.validate),/Unknown source change/);assert.equal(f.calls(),1);assert.equal(fs.readFileSync(path.join(f.options.sourceRoot,'input'),'utf8'),'PARTIAL');
});
test('evidence outside execution and stale foreign candidate cannot be reused',()=>{
 const f=fixture(),r=f.store().run(f.spec,f.observe,f.validate),cp=path.join(r.folder,'checkpoint.json');
 fs.writeFileSync(cp,JSON.stringify({...r.record,identity:hash('another-candidate')}));assert.throws(()=>f.store().run(f.spec,f.observe,f.validate),/Incompatible attempt/);assert.equal(f.calls(),1);
 fs.writeFileSync(cp,JSON.stringify({...r.record,evidence:[{file:'../foreign.log',sha256:hash('EXPECTED_EFFECT')}]}));assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);assert.equal(f.calls(),2);
});
test('generic success flags never replace a causal re-observation',()=>{
 const f=fixture(),r=f.store().run(f.spec,f.observe,f.validate);
 assert.throws(()=>f.store().run(f.spec,f.observe,()=>{throw Error('wrong effect');}),/wrong effect/);assert.equal(f.calls(),2);
 assert.equal(f.store().run(f.spec,f.observe,f.validate).reused,false);assert.equal(f.calls(),3);
});
test('historical p04 readiness receipt fails the new causal observer',()=>{
 const p=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p04/counterproofs/results.json');
 const old=JSON.parse(fs.readFileSync(p)).find(x=>x.name==='readiness-healthy-with-db-frozen');assert.ok(old);
 const reports=old.commands.find(x=>x.startsWith('-Dcf034.reportsDirectory=')).substring('-Dcf034.reportsDirectory='.length);
 assert.throws(()=>validateObservation({...old,reports},{test:'AdoptionRuntimeTest#readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart',method:'readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart',failure:['expected: 503','but was: 200']}),/before causal effect/);
});
