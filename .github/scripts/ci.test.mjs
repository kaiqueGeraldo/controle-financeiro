import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {sequence,requireCounts,junitCounts,requireReportedClasses,componentSummary} from './ci.mjs';
import {snapshot,sourceFor} from './source.mjs';

test('a failed required gate prevents E2E and packaging',async()=>{
  const visited=[];
  await assert.rejects(sequence(['lint','backend','e2e','package'],async stage=>{visited.push(stage);if(stage==='backend')throw new Error('invariant failed');}),/invariant failed/);
  assert.deepEqual(visited,['lint','backend']);
});
test('zero, skipped, failed and errored tests cannot approve a gate',()=>{
  for(const counts of [{tests:0,failures:0,errors:0,skipped:0},{tests:1,failures:0,errors:0,skipped:1},{tests:1,failures:1,errors:0,skipped:0},{tests:1,failures:0,errors:1,skipped:0}])assert.throws(()=>requireCounts(counts,'probe'));
  assert.equal(requireCounts({tests:2,failures:0,errors:0,skipped:0},'control').tests,2);
});

test('failed component diagnosis retains counts and identifiers without assertion payloads',()=>{
  const root=path.resolve('synthetic-root');
  const summary=componentSummary({numTotalTests:3,numFailedTests:1,numRuntimeErrorTestSuites:0,numPendingTests:1,numTodoTests:0,testResults:[
    {name:path.join(root,'tests','failed.test.tsx'),status:'failed',message:'PRIVATE_DOM_PAYLOAD',assertionResults:[{status:'failed',fullName:'synthetic required case',failureMessages:['PRIVATE_ASSERTION_PAYLOAD']},{status:'passed',fullName:'positive control'}]},
    {name:path.join(root,'tests','passed.test.tsx'),status:'passed'},
  ]},root);
  assert.deepEqual(summary,{counts:{tests:3,failures:1,errors:0,skipped:1},failedFiles:[{file:path.join('tests','failed.test.tsx'),tests:['synthetic required case']}]});
  assert.doesNotMatch(JSON.stringify(summary),/PRIVATE_|positive control/);
  assert.throws(()=>requireCounts(summary.counts,'components'));
});
test('report collection counts real suites and rejects missing totals',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cf034-reports-'));
  try{
    fs.writeFileSync(path.join(directory,'TEST-one.xml'),'<testsuite tests="3" failures="1" errors="0" skipped="0"></testsuite>');
    fs.writeFileSync(path.join(directory,'TEST-two.xml'),'<testsuite tests="2" failures="0" errors="0" skipped="1"></testsuite>');
    assert.deepEqual(junitCounts(directory),{tests:5,failures:1,errors:0,skipped:1});
    requireReportedClasses(directory,['one','two']);
    assert.throws(()=>requireReportedClasses(directory,['one','mandatory-missing']),/mandatory-missing/);
    fs.writeFileSync(path.join(directory,'TEST-bad.xml'),'<testsuite tests="1"/>');
    assert.throws(()=>junitCounts(directory),/Missing failures/);
  }finally{for(const file of fs.readdirSync(directory))fs.unlinkSync(path.join(directory,file));fs.rmdirSync(directory);}
});
test('source attestation rejects changed content and additional unrecorded source',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'cf034-source-'));
  const backend=path.join(directory,'controle-financeiro-backend');fs.mkdirSync(backend);
  const input=path.join(backend,'pom.xml');fs.writeFileSync(input,'approved');
  try{
    snapshot(directory,{commit:'synthetic'});assert.equal(sourceFor(directory).commit,'synthetic');
    fs.writeFileSync(input,'changed');assert.throws(()=>sourceFor(directory),/Source changed/);
    fs.writeFileSync(input,'approved');const extra=path.join(backend,'extra.java');fs.writeFileSync(extra,'unrecorded');
    assert.throws(()=>sourceFor(directory),/file set changed/);fs.unlinkSync(extra);
    assert.equal(sourceFor(directory).commit,'synthetic');
  }finally{fs.unlinkSync(input);fs.unlinkSync(path.join(directory,'.ci-source.json'));fs.rmdirSync(backend);fs.rmdirSync(directory);}
});
