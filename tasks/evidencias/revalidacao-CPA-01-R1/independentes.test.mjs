import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawnSync,execFileSync} from 'node:child_process';

const root=process.env.CPA_R1_TARGET??process.cwd();
const original=process.env.CPA_R1_ORIGINAL??process.cwd();
const cli=path.join(root,'.github/scripts/required.mjs');
const {evaluateRequired}=await import(pathToFileURL(cli));
const require=createRequire(path.join(original,'controle-financeiro-frontend/package.json'));
const yaml=require('js-yaml');
const workflow=yaml.load(fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8'));
// Literal oracle specified before calling the implementation; no jobRequirements import.
export const modes=[
 {event:'push',suite:'',expected:{'windows-native':'success',linux:'success',expanded:'skipped'}},
 {event:'pull_request',suite:'',expected:{'windows-native':'success',linux:'success',expanded:'skipped'}},
 {event:'workflow_dispatch',suite:'smoke',expected:{'windows-native':'success',linux:'success',expanded:'skipped'}},
 {event:'workflow_dispatch',suite:'expanded',expected:{'windows-native':'success',linux:'success',expanded:'success'}},
];
const payload=mode=>Object.fromEntries(Object.entries(mode.expected).map(([job,result])=>[job,{result}]));
const evaluate=(needs,mode)=>evaluateRequired(JSON.stringify(needs),mode.event,mode.suite);
const needs=job=>job.needs===undefined?[]:Array.isArray(job.needs)?job.needs:[job.needs];

test('independent literal table covers all 500 status combinations in the real evaluator',()=>{
 const statuses=['success','failure','cancelled','skipped','UNKNOWN_SYNTHETIC'];
 const rows=[];
 for(const mode of modes)for(const windows of statuses)for(const linux of statuses)for(const expanded of statuses){
  const actual={'windows-native':windows,linux,expanded};
  const expected=Object.entries(mode.expected).every(([job,result])=>actual[job]===result);
  const observed=evaluate(Object.fromEntries(Object.entries(actual).map(([job,result])=>[job,{result}])),mode);
  rows.push({event:mode.event,suite:mode.suite,actual,expected,observed});
  assert.equal(observed.approved,expected,JSON.stringify(actual)+' '+mode.event+'/'+mode.suite);
 }
 assert.equal(rows.length,500);assert.equal(rows.filter(row=>row.expected).length,4);
 if(process.env.CPA_R1_MATRIX)fs.writeFileSync(process.env.CPA_R1_MATRIX,JSON.stringify({oracle:'literal table from requirements; no implementation policy imported',rows},null,2)+'\n',{flag:'wx'});
});
test('every job and result must exist, even expanded when not applicable; invalid types fail closed',()=>{
 for(const mode of modes)for(const job of ['windows-native','linux','expanded']){
  const missing=payload(mode);delete missing[job];assert.equal(evaluate(missing,mode).approved,false);
  for(const entry of [{},null,[],true,1,'success',{result:null},{result:[]},{result:{}},{result:true},{result:0}]){
   const input=payload(mode);input[job]=entry;assert.equal(evaluate(input,mode).approved,false);
  }
 }
 for(const input of [undefined,'',' ','{','null','[]','false','1','"success"','{}'])assert.equal(evaluateRequired(input,'push','').approved,false);
 const extra=payload(modes[0]);extra.unexpected={result:'success'};assert.equal(evaluate(extra,modes[0]).approved,false);
});
test('workflow dispatch default and invalid modes match the job condition without implicit fallback',()=>{
 const input=workflow.on.workflow_dispatch.inputs.suite;
 assert.deepEqual(input,{type:'choice',options:['smoke','expanded'],default:'smoke'});
 const defaultMode={...modes[2],suite:input.default};assert.equal(evaluate(payload(defaultMode),defaultMode).approved,true);
 assert.equal(workflow.jobs.expanded.if,"github.event_name == 'workflow_dispatch' && inputs.suite == 'expanded'");
 for(const [event,suite]of [['workflow_dispatch',''],['workflow_dispatch','typo'],['workflow_dispatch',null],['merge_group',''],['',''],['push','expanded'],['pull_request','invalid']]){
  assert.equal(evaluateRequired(JSON.stringify(payload(modes[0])),event,suite).approved,false);
 }
});
test('actual workflow CLI propagates exit 1 and sanitizes hostile synthetic input',()=>{
 const run=(raw,event,suite)=>spawnSync(process.execPath,[cli],{encoding:'utf8',shell:false,windowsHide:true,env:{...process.env,NEEDS_JSON:raw,GITHUB_EVENT_NAME:event,CF_REQUIRED_SUITE:suite}});
 for(const mode of modes){
  const good=run(JSON.stringify(payload(mode)),mode.event,mode.suite);assert.equal(good.status,0);assert.match(good.stdout,/Required passed/);
  for(const job of ['windows-native','linux'])for(const result of ['failure','cancelled','skipped']){
   const bad=payload(mode);bad[job].result=result;const response=run(JSON.stringify(bad),mode.event,mode.suite);assert.equal(response.status,1);assert.match(response.stderr,/Required rejected/);
  }
 }
 for(const [raw,event,suite]of [['{SENTINEL','push',''],['{}','push',''],[JSON.stringify(payload(modes[0])),'unknown',''],[JSON.stringify(payload(modes[0])),'workflow_dispatch','']]){
  const result=run(raw,event,suite);assert.equal(result.status,1);assert.doesNotMatch(result.stdout+result.stderr,/SENTINEL/);
 }
 const hostile=payload(modes[0]);hostile.linux={result:'SENTINEL_$(echo unexpected);`x`\nLINE',outputs:{value:'SENTINEL_OUTPUT'}};
 const result=run(JSON.stringify(hostile),'push','');assert.equal(result.status,1);assert.doesNotMatch(result.stderr,/SENTINEL|LINE|unexpected/);assert.match(result.stderr,/unknown result/);
 const source=fs.readFileSync(cli,'utf8');assert.doesNotMatch(source,/child_process|\bexec\(|\beval\(/);
});
test('parsed YAML always calls the real evaluator as the final command, with intact needs data',()=>{
 const job=workflow.jobs.required;
 assert.equal(workflow.name,'CI integrated gates');assert.equal(job.name,undefined);assert.equal(job.strategy,undefined);
 assert.equal(job.if,'${{ always() }}');assert.deepEqual(needs(job),['windows-native','linux','expanded']);assert.equal(job['timeout-minutes'],5);
 assert.equal(job['continue-on-error'],undefined);
 assert.equal(job.steps.length,3);
 assert.equal(job.steps[0].uses,'actions/checkout@v4');assert.equal(job.steps[1].uses,'actions/setup-node@v4');
 assert.equal(job.steps[1].with['node-version'],'24');
 const step=job.steps.at(-1);assert.equal(step.run,'node .github/scripts/required.mjs');
 assert.deepEqual(step.env,{NEEDS_JSON:'${{ toJSON(needs) }}',CF_REQUIRED_SUITE:'${{ inputs.suite }}'});
 for(const step of job.steps){assert.equal(step.if,undefined);assert.equal(step['continue-on-error'],undefined);assert.equal(step['timeout-minutes'],1);}
 assert.equal(job.steps.some(s=>/upload-artifact|ci\.mjs|package/i.test((s.uses??'')+' '+(s.run??''))),false);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8'),/continue-on-error/);
});
test('worker DAG, filters and package ordering match the accepted base except the declared delta',()=>{
 const old=yaml.load(execFileSync('git',['show','e837748a600c356e2e9d4f60291240cebf523916:.github/workflows/ci.yml'],{cwd:original,encoding:'utf8'}));
 assert.deepEqual(workflow.on,old.on);assert.deepEqual(workflow.permissions,old.permissions);
 const normalize=job=>{const copy=structuredClone(job);for(const step of copy.steps)if(step.run?.startsWith('node --test '))step.run=step.run.replace(' .github/scripts/required.test.mjs','');return copy;};
 assert.deepEqual(normalize(workflow.jobs['windows-native']),old.jobs['windows-native']);
 assert.deepEqual(normalize(workflow.jobs.linux),old.jobs.required);
 const expanded=structuredClone(workflow.jobs.expanded);expanded.needs='required';assert.deepEqual(expanded,old.jobs.expanded);
 assert.deepEqual(needs(workflow.jobs.linux),['windows-native']);assert.deepEqual(needs(workflow.jobs.expanded),['linux']);
 for(const name of ['windows-native','linux'])assert.equal(workflow.jobs[name].if,undefined);
 const linux=workflow.jobs.linux;
 const execute=linux.steps.findIndex(s=>s.run?.startsWith('node .github/scripts/ci.mjs all '));
 const upload=linux.steps.findIndex(s=>s.with?.name==='tested-package-${{ github.sha }}');
 assert.ok(execute>=0&&upload>execute);assert.equal(linux.steps[execute].if,undefined);assert.equal(linux.steps[upload].if,undefined);
 const visited=new Set(),pending=new Set();function visit(id){assert.ok(workflow.jobs[id]);assert.equal(pending.has(id),false,'acyclic DAG');if(visited.has(id))return;pending.add(id);needs(workflow.jobs[id]).forEach(visit);pending.delete(id);visited.add(id);}Object.keys(workflow.jobs).forEach(visit);
});
