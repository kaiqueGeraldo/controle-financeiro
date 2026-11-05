import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {plan,validateManifest,validateResults,verifyDirectory,testList} from './zoom-coverage.mjs';
import {hash} from './source.mjs';

// Independent oracle from the explicit user decision, never imported from selector.
const nativeA={project:'review-sao-paulo',file:'cf015.native-zoom.integrated.spec.ts',titles:['R10: zoom nativo 200% com ações, rolagem e foco']};
const nativeB={project:'review-sao-paulo',file:'rf15-native-chrome.integrated.spec.ts',titles:['RF15: zoom nativo Chrome 200% com ações, rolagem e foco']};
const required=[{...nativeA,titles:['Independent preparation without zoom']},{...nativeB,titles:['Normal financial control']},{...nativeA,project:'other-project'},{...nativeA,file:'other.spec.ts'},{project:'review-sao-paulo',file:'ordinary.spec.ts',titles:['group','required']}];
const universe=[nativeA,nativeB,...required];
const context={candidate:'candidate-A',digest:'source-A',runId:'fresh-run',decisionSha:'decision-content-A'};
const started='2026-11-03T18:00:00.000Z';
function result(cases=required){return {config:{metadata:{zoomException:{decision:'DEC-ZOOM-05',...context}}},errors:[],stats:{startTime:started,expected:required.length,unexpected:0,skipped:0,flaky:0},suites:cases.map(x=>({title:x.file,specs:[{file:x.file,title:x.titles.at(-1),tests:[{projectName:x.project,expectedStatus:'passed',status:'expected',results:[{status:'passed'}]}]}],...(x.titles.length>1?{specs:[],suites:[{title:x.titles[0],specs:[{file:x.file,title:x.titles.at(-1),tests:[{projectName:x.project,expectedStatus:'passed',status:'expected',results:[{status:'passed'}]}]}]}]}:{} )}))};}
const rejected=(change)=>{const m=plan(universe,context);change(m);assert.throws(()=>validateManifest(m,universe,context));};
test('exactly B is deferred; common cases in both files and other projects/files remain',()=>{
 const m=plan(universe,context);assert.equal(m.decision,'DEC-ZOOM-05');assert.deepEqual(m.A,universe);assert.deepEqual(m.B,[nativeA,nativeB]);assert.deepEqual(m.C,required);
 assert.equal(validateResults(m,universe,context,result(),started).tests,5);
 assert.match(testList(m.C),/Independent preparation without zoom/);assert.match(m.label,/dois cenários de zoom adiados/);
});
test('third exclusion and omitted required identity are rejected independently of counts',()=>{
 rejected(m=>{m.B.push(m.C.shift());}); rejected(m=>{m.C.shift();});
 const r=result(required.slice(1));r.stats.expected=required.length;assert.throws(()=>validateResults(plan(universe,context),universe,context,r,started));
 const swapped=result([...required.slice(1),{project:'unknown',file:'unknown.spec.ts',titles:['extra']}]);assert.throws(()=>validateResults(plan(universe,context),universe,context,swapped,started));
});
test('manifest without decision, changed decision or divergent identity cannot be equivalent',()=>{
 rejected(m=>delete m.decision);rejected(m=>m.decision='another-decision');rejected(m=>m.B[0].project='another-project');rejected(m=>m.A[0].titles=['renamed']);
 assert.throws(()=>plan(universe.filter(x=>x!==nativeA),context));
});
test('empty and duplicate selection and missing provenance are rejected',()=>{
 assert.throws(()=>plan([],context));assert.throws(()=>plan([nativeA,nativeB],context));assert.throws(()=>plan([...universe,nativeA],context));assert.throws(()=>plan(universe,{...context,runId:''}));
});
test('unexpected skip, failure, error, expected failure and retry remain blocking',()=>{
 const m=plan(universe,context);
 for(const status of ['skipped','failed','timedOut','interrupted']){const r=result();r.suites[0].specs[0].tests[0].results[0].status=status;assert.throws(()=>validateResults(m,universe,context,r,started));}
 for(const status of ['skipped','unexpected','flaky']){const r=result();r.suites[0].specs[0].tests[0].status=status;assert.throws(()=>validateResults(m,universe,context,r,started));}
 const expectedFailure=result();expectedFailure.suites[0].specs[0].tests[0].expectedStatus='failed';assert.throws(()=>validateResults(m,universe,context,expectedFailure,started));
 const retry=result();retry.suites[0].specs[0].tests[0].results.push({status:'passed'});assert.throws(()=>validateResults(m,universe,context,retry,started));
 const errors=result();errors.errors=[{message:'error'}];assert.throws(()=>validateResults(m,universe,context,errors,started));
 for(const k of ['unexpected','skipped','flaky']){const r=result();r.stats[k]=1;assert.throws(()=>validateResults(m,universe,context,r,started));}
});
test('old report or another candidate, package or run cannot certify this invocation',()=>{
 const m=plan(universe,context);const old=result();old.stats.startTime='2026-11-02T00:00:00Z';assert.throws(()=>validateResults(m,universe,context,old,started));
 for(const key of Object.keys(context)){const r=result();r.config.metadata.zoomException[key]='other';assert.throws(()=>validateResults(m,universe,context,r,started));}
});
test('missing report and modified selection are rejected, verified control passes',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zoom-coverage-'));const m=plan(universe,context);const write=(f,v)=>fs.writeFileSync(path.join(dir,f),typeof v==='string'?v:JSON.stringify(v));
 try{
  write('universe.json',result(universe));write('manifest.json',m);write('selection.txt',testList(required));
  write('invocation.json',{context,started,universeSha:hash(fs.readFileSync(path.join(dir,'universe.json'))),selectionSha:hash(fs.readFileSync(path.join(dir,'selection.txt')))});
  assert.throws(()=>verifyDirectory(dir,context));write('results.json',result());assert.equal(verifyDirectory(dir,context).tests,5);
  write('selection.txt',testList(required.slice(1)));assert.throws(()=>verifyDirectory(dir,context));
 }finally{for(const f of fs.readdirSync(dir))fs.unlinkSync(path.join(dir,f));fs.rmdirSync(dir);}
});

