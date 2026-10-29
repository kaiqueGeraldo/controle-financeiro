import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {evaluateRequired,jobRequirements} from './required.mjs';

const root=path.resolve(import.meta.dirname,'../..'),cli=path.join(import.meta.dirname,'required.mjs');
const modes=[['push',''],['pull_request',''],['workflow_dispatch','smoke'],['workflow_dispatch','expanded']];
// Expectations come from the review contract, independently of the evaluator.
const mandatory=(event,suite)=>event==='workflow_dispatch'&&suite==='expanded'?['windows-native','linux','expanded']:['windows-native','linux'];
const good=(event,suite)=>Object.fromEntries(['windows-native','linux','expanded'].map(job=>[job,{result:mandatory(event,suite).includes(job)?'success':'skipped'}]));
const evaluate=(needs,event,suite)=>evaluateRequired(JSON.stringify(needs),event,suite);

test('every configured mode approves only its complete mandatory success set',()=>{
 assert.deepEqual(jobRequirements,{'windows-native':'always',linux:'always',expanded:'expanded'});
 for(const [event,suite] of modes){
  const result=evaluate(good(event,suite),event,suite);
  assert.equal(result.approved,true);assert.deepEqual(result.required,mandatory(event,suite));
  assert.deepEqual(result.notApplicable,suite==='expanded'?[]:['expanded']);
 }
});
test('each mandatory failure, cancellation, skip, unknown and absent result rejects in every mode',()=>{
 for(const [event,suite] of modes)for(const job of mandatory(event,suite)){
  for(const status of ['failure','cancelled','skipped','pending','neutral','SUCCESS','',null,42]){
   const needs=good(event,suite);needs[job].result=status;
   const result=evaluate(needs,event,suite);assert.equal(result.approved,false,`${event}/${suite}/${job}/${status}`);assert.ok(result.problems.some(p=>p.startsWith(job+':')));
  }
  for(const absent of ['job','result']){
   const needs=good(event,suite);if(absent==='job')delete needs[job];else delete needs[job].result;
   assert.equal(evaluate(needs,event,suite).approved,false,`${job} missing ${absent}`);
  }
 }
});
test('Windows and Linux mixed results and multiple failures reject explicitly',()=>{
 for(const [windows,linux] of [['failure','success'],['skipped','success'],['success','failure'],['cancelled','failure'],['failure','skipped']]){
  const needs=good('pull_request','');needs['windows-native'].result=windows;needs.linux.result=linux;
  const result=evaluate(needs,'pull_request','');assert.equal(result.approved,false);assert.ok(result.problems.length>0);
 }
 const needs=good('workflow_dispatch','expanded');for(const job of Object.keys(needs))needs[job].result='failure';
 assert.equal(evaluate(needs,'workflow_dispatch','expanded').problems.length,3);
});
test('expanded skip is allowed only when explicitly not applicable; missing is never an exception',()=>{
 for(const [event,suite] of modes){
  const needs=good(event,suite);delete needs.expanded;assert.equal(evaluate(needs,event,suite).approved,false);
  needs.expanded={result:'skipped'};assert.equal(evaluate(needs,event,suite).approved,suite!=='expanded');
  needs.expanded={result:'failure'};assert.equal(evaluate(needs,event,suite).approved,false);
  needs.expanded={result:'success'};assert.equal(evaluate(needs,event,suite).approved,suite==='expanded');
 }
});
test('empty, malformed, scalar, array and unexpected job payloads reject conservatively',()=>{
 for(const payload of [undefined,'',' ','{','{}','null','[]','[{}]','true','1','"success"','{"windows-native":'])assert.equal(evaluateRequired(payload,'pull_request','').approved,false);
 for(const entry of [null,[],1,'success',{}]){const needs=good('push','');needs.linux=entry;assert.equal(evaluate(needs,'push','').approved,false);}
 const extra=good('push','');extra.unknown={result:'success'};assert.equal(evaluate(extra,'push','').approved,false);
});
test('unknown event or dispatch suite never silently selects smoke',()=>{
 for(const [event,suite] of [['merge_group',''],['',''],['workflow_dispatch',''],['workflow_dispatch','typo'],['push','expanded'],['pull_request','typo']])assert.equal(evaluate(good('push',''),event,suite).approved,false);
});
test('the workflow CLI exits nonzero for violations, without exposing payloads or interpreting them',()=>{
 const run=(needs,event='pull_request',suite='')=>spawnSync(process.execPath,[cli],{encoding:'utf8',windowsHide:true,shell:false,env:{...process.env,NEEDS_JSON:typeof needs==='string'?needs:JSON.stringify(needs),GITHUB_EVENT_NAME:event,CF_REQUIRED_SUITE:suite}});
 for(const [event,suite] of modes)assert.equal(run(good(event,suite),event,suite).status,0);
 for(const status of ['failure','cancelled','skipped','SENTINEL_SECRET_$(ignored)']){
  const needs=good('pull_request','');needs['windows-native'].result=status;needs.linux.outputs={untrusted:'SENTINEL_OUTPUT'};
  const result=run(needs);assert.equal(result.status,1);assert.match(result.stderr,/windows-native/);assert.doesNotMatch(result.stdout+result.stderr,/SENTINEL/);
 }
 for(const payload of ['','{}','{SENTINEL_INVALID']){const result=run(payload);assert.equal(result.status,1);assert.doesNotMatch(result.stderr,/SENTINEL/);}
});

// Dependency-free inspection of the workflow's explicit job/needs/step fields.
// Evidence additionally parses the full document with the existing js-yaml.
function workflowJobs(){
 const text=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8').replaceAll('\r\n','\n');
 const entries=[...text.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/gm)].map(m=>[m[1],m[2]]);
 assert.equal(new Set(entries.map(e=>e[0])).size,entries.length,'No duplicate job IDs');
 const needs=job=>{const raw=job.match(/^    needs: (.+)$/m)?.[1];return raw?.startsWith('[')?raw.slice(1,-1).split(',').map(v=>v.trim()):raw?[raw]:[];};
 return {text,jobs:Object.fromEntries(entries),needs};
}
test('required is always eligible, covers exactly the policy jobs and executes the real evaluator',()=>{
 const {text,jobs,needs}=workflowJobs(),aggregate=jobs.required;
 assert.ok(aggregate);assert.deepEqual(needs(aggregate).sort(),Object.keys(jobRequirements).sort());
 assert.match(aggregate,/^    if: \$\{\{ always\(\) \}\}$/m);
 assert.match(aggregate,/^    timeout-minutes: 5$/m);
 assert.doesNotMatch(aggregate,/^    name:|strategy:|ci\.mjs|upload-artifact|continue-on-error/m);
 assert.match(aggregate,/NEEDS_JSON: \$\{\{ toJSON\(needs\) \}\}/);
 assert.match(aggregate,/CF_REQUIRED_SUITE: \$\{\{ inputs.suite \}\}/);
 const commands=[...aggregate.matchAll(/^        run: (.+)$/gm)].map(m=>m[1]);assert.deepEqual(commands,['node .github/scripts/required.mjs']);
 assert.doesNotMatch(text,/continue-on-error/);
 for(const job of Object.keys(jobRequirements))assert.ok(jobs[job],`${job} must exist`);
});
test('execution and package remain behind Windows; expanded completes before aggregation without a cycle',()=>{
 const {text,jobs,needs}=workflowJobs();
 assert.deepEqual(needs(jobs.linux),['windows-native']);assert.deepEqual(needs(jobs.expanded),['linux']);
 assert.deepEqual(needs(jobs['windows-native']),[]);
 assert.doesNotMatch(jobs.linux.split('    steps:')[0],/\bif:/);
 assert.doesNotMatch(jobs['windows-native'].split('    steps:')[0],/\bif:/);
 assert.match(jobs['windows-native'],/ci\.mjs windows-native/);assert.match(jobs.linux,/ci\.mjs all/);
 assert.match(jobs.linux,/name: tested-package-\$\{\{ github.sha \}\}/);
 assert.doesNotMatch(jobs.linux.split('name: tested-package-')[0].split('uses: actions\/upload-artifact@v4').at(-1),/if: always/);
 assert.match(jobs.expanded,/^    if: github.event_name == 'workflow_dispatch' && inputs.suite == 'expanded'$/m);
 assert.match(jobs.expanded,/CF034_SUITE: expanded/);
 assert.match(text,/push:\n    branches: \[main\]/);assert.match(text,/pull_request:\n    branches: \[main\]/);assert.match(text,/options: \[smoke, expanded\]/);
});
