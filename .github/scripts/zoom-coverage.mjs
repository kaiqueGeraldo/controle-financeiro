import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {hash} from './source.mjs';

export const decision='DEC-ZOOM-05';
export const deferred=Object.freeze([
  {project:'review-sao-paulo',file:'cf015.native-zoom.integrated.spec.ts',titles:['R10: zoom nativo 200% com ações, rolagem e foco']},
  {project:'review-sao-paulo',file:'rf15-native-chrome.integrated.spec.ts',titles:['RF15: zoom nativo Chrome 200% com ações, rolagem e foco']},
]);
export const label='Expanded do recorte autorizado, com dois cenários de zoom adiados pela decisão '+decision;
export const identity=x=>JSON.stringify([x.project,x.file,x.titles]);
function identities(items){
  assert.ok(Array.isArray(items)&&items.length,'Empty mandatory selection');
  const ids=items.map(x=>{assert.ok(typeof x.project==='string'&&x.project&&typeof x.file==='string'&&x.file&&Array.isArray(x.titles)&&x.titles.length&&x.titles.every(t=>typeof t==='string'&&t),'Invalid identity');return identity(x);});
  assert.equal(new Set(ids).size,ids.length,'Duplicate identity');return ids.sort();
}
export function browserCases(report){
  const cases=[];
  function visit(suite,parents){
    for(const spec of suite.specs??[])for(const test of spec.tests??[])cases.push({project:test.projectName,file:spec.file.replaceAll('\\','/'),titles:[...parents,spec.title],test});
    for(const child of suite.suites??[])visit(child,[...parents,child.title]);
  }
  for(const suite of report.suites??[])visit(suite,[]);
  return cases;
}
export function plan(universe,context){
  const a=universe.map(({project,file,titles})=>({project,file,titles}));const ids=identities(a);
  for(const key of ['candidate','digest','runId','decisionSha'])assert.ok(typeof context[key]==='string'&&context[key],'Missing provenance: '+key);
  for(const x of deferred)assert.ok(ids.includes(identity(x)),'Authorized identity absent or divergent: '+identity(x));
  const b=deferred.map(x=>structuredClone(x)),blocked=new Set(b.map(identity)),c=a.filter(x=>!blocked.has(identity(x)));
  identities(c);assert.deepEqual([...b,...c].map(identity).sort(),ids,'A must equal B union C');
  assert.ok(c.every(x=>!blocked.has(identity(x))),'B intersects C');
  return {version:1,decision,label,zoomStatus:'pendente, com exceção temporária autorizada para a continuidade delimitada',...context,A:a,B:b,C:c};
}
export function validateManifest(manifest,universe,context){
  assert.deepEqual(manifest,plan(universe,context),'Manifest/decision/identity/provenance differs from required coverage');
  return manifest;
}
export function validateResults(manifest,universe,context,report,started){
  validateManifest(manifest,universe,context);
  assert.deepEqual(report.config?.metadata?.zoomException,{decision,...context},'Report belongs to another candidate/run');
  assert.ok(Date.parse(report.stats?.startTime)>=Date.parse(started),'Old report');
  assert.equal(report.errors?.length??0,0,'Browser errors');
  const actual=browserCases(report);assert.deepEqual(identities(actual),identities(manifest.C),'Mandatory identity missing, unknown, or extra exclusion');
  for(const x of actual){
    assert.equal(x.test.expectedStatus,'passed','Unexpected expected status');
    assert.equal(x.test.status,'expected','Unexpected skip/failure/flaky');
    assert.equal(x.test.results?.length,1,'Exactly one result, no retries');
    assert.equal(x.test.results[0].status,'passed','Unexpected skip/error/failure');
  }
  assert.equal(report.stats.expected,manifest.C.length,'Wrong expected count');
  for(const k of ['unexpected','skipped','flaky'])assert.equal(report.stats[k],0,'Unexpected '+k);
  return {label,decision,deferred:manifest.B,required:manifest.C,tests:actual.length,failures:0,errors:0,skipped:0};
}
export function verifyDirectory(directory,context){
  const read=f=>JSON.parse(fs.readFileSync(path.join(directory,f),'utf8'));
  const receipt=read('invocation.json'),original=read('universe.json'),manifest=read('manifest.json'),report=read('results.json');
  assert.deepEqual(receipt.context,context,'Different invocation');
  assert.equal(hash(fs.readFileSync(path.join(directory,'universe.json'))),receipt.universeSha,'Changed original listing');
  assert.equal(hash(fs.readFileSync(path.join(directory,'selection.txt'))),receipt.selectionSha,'Changed selection');
  assert.equal(fs.readFileSync(path.join(directory,'selection.txt'),'utf8'),testList(manifest.C),'Selection differs from C');
  return validateResults(manifest,browserCases(original),context,report,receipt.started);
}
export function testList(cases){return cases.map(x=>'['+x.project+'] › '+x.file+' › '+x.titles.join(' › ')).join('\n')+'\n';}

