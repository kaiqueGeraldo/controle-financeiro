import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {backendSelection} from '../../../.github/scripts/suites.mjs';
const runtime=path.resolve(process.argv[2]),root=path.resolve(import.meta.dirname,'../../..');
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const runs=[];
const entries=fs.readdirSync(runtime).map(label=>({label,dir:path.join(runtime,label),record:'execution.json',log:'maven.log',reports:'surefire'}));
entries.push({label:'linux-loopback',dir:path.join(runtime,'linux-fixtures'),record:'loopback-execution.json',log:'loopback.log',reports:'loopback-surefire'});
for(const {label,dir,record:recordName,log:logName,reports:reportsName} of entries){
 const file=path.join(dir,recordName);if(!fs.existsSync(file))continue;
 const record=JSON.parse(fs.readFileSync(file));
 const reports=fs.existsSync(path.join(dir,reportsName))?fs.readdirSync(path.join(dir,reportsName)).filter(n=>n.startsWith('TEST-')&&n.endsWith('.xml')).map(n=>{
  const text=fs.readFileSync(path.join(dir,reportsName,n),'utf8'),suite=text.match(/<testsuite\b[^>]*>/)?.[0];
  return {file:n,sha256:hash(path.join(dir,reportsName,n)),counts:Object.fromEntries(['tests','failures','errors','skipped'].map(k=>[k,Number(suite?.match(new RegExp(`\\b${k}="(\\d+)"`))?.[1])]))};
 }):[];
 const log=path.join(dir,logName);
 const startups=fs.existsSync(log)?[...fs.readFileSync(log,'utf8').matchAll(/Started ([\w.$]+) in ([0-9.]+) seconds/g)].map(m=>({owner:m[1],seconds:+m[2]})):[];
 const browsers=[];
 const browserDir=path.join(dir,'browsers');
 if(fs.existsSync(browserDir))for(const owner of fs.readdirSync(browserDir)){
  const json=path.join(browserDir,owner,'playwright-private.json');if(!fs.existsSync(json))continue;
  let data;
  try { data=JSON.parse(fs.readFileSync(json)); }
  catch { browsers.push({owner,status:'incomplete report; not approval',sha256:hash(json)});continue; }
  function failures(suites){return suites.flatMap(s=>[...(s.specs??[]).filter(s=>!s.ok).map(s=>({title:s.title,results:s.tests.flatMap(t=>t.results.map(r=>({status:r.status,error:r.error?.message?.replace(/\u001b\[[0-9;]*m/g,'').slice(0,160)})))})),...failures(s.suites??[])]);}
  // Error payloads remain private; durable record only exposes committed titles/status.
  browsers.push({owner,stats:data.stats,failed:failures(data.suites??[]).map(x=>({title:x.title,statuses:x.results.map(r=>r.status)}))});
 }
 const selected=(record.args??[]).find(a=>a.startsWith('-Dtest='))?.slice(7).split(',').map(n=>n.split('#')[0])??[];
 const missing=selected.filter(n=>!reports.some(r=>r.file===`TEST-${n}.xml`||r.file.endsWith(`.${n}.xml`)));
 const append=path.join(dir,'append-proof.json');
 runs.push({label,exit:record.exit,error:record.error,selected,missing,reportsAtControllerReturn:record.reports?.length,appendProof:fs.existsSync(append)?JSON.parse(fs.readFileSync(append)):undefined,started:record.started??record.start,finished:record.finished??record.end,recordSha256:hash(file),logAtControllerReturnSha256:record.logSha256,logSha256:fs.existsSync(log)?hash(log):null,reports,startups,browsers});
}
assert.equal(execFileSync('git',['diff','1c4173f2e9a8bd459a9f2ecd4acf2d803245be88','--','controle-financeiro-backend/src/main','controle-financeiro-frontend/src','.github'],{cwd:root,encoding:'utf8'}),'');
const checks=JSON.parse(fs.readFileSync(path.join(runtime,'checks-final.json')));assert.equal(checks.contracts,0);assert.equal(checks.types,0);
const original=path.resolve(process.env.PR3_ORIGINAL_CHECKOUT??path.resolve(root,'../..'));
const oracleFile=path.join(original,'tasks/evidencias/revalidacao-CPA-01/identidades.json'),oracle=JSON.parse(fs.readFileSync(oracleFile));
const selection={smoke:backendSelection(root,'smoke','linux').selected,expanded:backendSelection(root,'expanded','linux').selected,windows:backendSelection(root,'smoke','win32','platform-only').selected};
for(const suite of ['smoke','expanded'])assert.deepEqual([...selection[suite],...selection.windows].sort(),oracle.expected[suite]);
const counters=Object.fromEntries(['fixture','auth','opening'].map(name=>[name,JSON.parse(fs.readFileSync(path.join(runtime,name+'-counterproof.json')))]));
const paymentProof=JSON.parse(fs.readFileSync(path.join(runtime,'directed-affected/browsers/MilestoneRemediationBrowserTest/payment-derived.json')));
const result={at:new Date(),base:'1c4173f2e9a8bd459a9f2ecd4acf2d803245be88',runtimeName:path.basename(runtime),runs,counterproofs:counters,paymentProof,selection:{oracleReference:'revalidacao-CPA-01/identidades.json preserved in original checkout',oracleSha256:hash(oracleFile),...selection},contracts:{tests:32,failures:0,errors:0,skipped:0,source:'final execution; gate sources unchanged by diff',logSha256:hash(path.join(runtime,'contracts-final.log'))},typecheck:{exit:checks.types,logSha256:hash(path.join(runtime,'types-final.log'))},limits:{remoteReexecution:false,fullExpanded:false,windowsNativeGateRerun:false,countsMustNotBeAddedAcrossRuns:true,productChanged:false,packageGenerated:false},over40:runs.flatMap(r=>r.startups.filter(x=>x.seconds>40).map(s=>({run:r.label,...s})))};
fs.writeFileSync(path.join(import.meta.dirname,'validacao.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({runs:runs.map(r=>({label:r.label,exit:r.exit,missing:r.missing,reports:r.reports.map(x=>x.counts),browser:r.browsers.map(b=>({owner:b.owner,stats:b.stats,failed:b.failed}))})),over40:result.over40}));
