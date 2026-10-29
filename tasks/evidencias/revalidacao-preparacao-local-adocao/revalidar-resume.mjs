import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {hash} from '../preparacao-local-adocao/counterproof-checkpoint.mjs';
const runtime=path.resolve(process.argv[2]);
assert.ok(runtime.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-')));
const root=path.join(runtime,'resume');fs.mkdirSync(root);
const records=[];
function run(name,args,env={}) {
  const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:8*1024*1024,env:{...process.env,...env}});
  fs.writeFileSync(path.join(root,name+'.log'),r.stdout+r.stderr);
  records.push({name,args,exit:r.status,logSha256:hash(r.stdout+r.stderr)});return r;
}
// The original independent observer is retained byte-for-byte. Redirect its only
// output, because its hardcoded historical destination is immutable evidence.
const historical='tasks/evidencias/revisao-preparacao-local-adocao/auditar-resume.mjs';
fs.copyFileSync(historical,path.join(root,'observador-original.mjs'));
const redirect=path.join(root,'redirecionar-saida.mjs');
fs.writeFileSync(redirect,`import fs from 'node:fs';import {syncBuiltinESMExports}from'node:module';const write=fs.writeFileSync;fs.writeFileSync=(file,...args)=>write(file==='tasks/evidencias/revisao-preparacao-local-adocao/observador-resume.json'?process.env.REVIEW_OBSERVER_OUTPUT:file,...args);syncBuiltinESMExports();`);
assert.equal(run('observador-original',['--import',pathToFileURL(redirect).href,path.join(root,'observador-original.mjs'),'../controle-financeiro-runtimes/preparacao-adocao/revisao-20261026-01'],{REVIEW_OBSERVER_OUTPUT:path.join(root,'observador-original.json')}).status,0);
// Reproduction criteria/runner source unchanged; only the disposable directory
// allowlist is adapted to the prefix explicitly required for this revalidation.
const fixtureSource='tasks/evidencias/saneamento-preparacao-local-adocao/reproduzir-resume.mjs';
const fixture=fs.readFileSync(fixtureSource,'utf8');
const adapted=fixture.replaceAll('preparacao-adocao/saneamento-','preparacao-adocao/revalidacao-');
assert.notEqual(adapted,fixture);
fs.writeFileSync(path.join(root,'reproduzir-resume.mjs'),adapted);
for(const mode of ['original','fixed'])assert.equal(run(mode,[path.join(root,'reproduzir-resume.mjs'),path.join(root,mode),...(mode==='fixed'?['fixed']:[])]).status,0);
const f=path.join(root,'fixed/counterproofs/v2/preflight-hides-missing-constraint');
const a=JSON.parse(fs.readFileSync(path.join(f,'0001/checkpoint.json'))),b=JSON.parse(fs.readFileSync(path.join(f,'0002/checkpoint.json')));
assert.equal(a.state,'failed');assert.equal(b.state,'failed');assert.equal(a.proof,undefined);assert.equal(b.proof,undefined);
assert.equal(fs.readdirSync(path.join(root,'fixed/counterproofs/v2')).filter(n=>n!=='identity.json').length,1);
const test='tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs';
assert.equal(run('controle-28',['--test','--test-reporter=tap',test],{RESUME_TEST_RUNTIME:path.join(root,'fixtures-28')}).status,0);
const source='tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.mjs',bytes=fs.readFileSync(source);
const mutant=bytes.toString().replace(/      if\(name===attempts\.at\(-1\)&&this\.valid\(record,folder\)\) \{[\s\S]*?\n      if\(!\[/,"      if(record.result?.status===1){this.verifyInputs();return {reused:true,folder,record};}\n      if(![");
assert.notEqual(mutant,bytes.toString());const target=path.join(root,'checkpoint-mutante.mjs');fs.writeFileSync(target,mutant);
let red;
try {
  red=run('mutante-resume',['--test','--test-reporter=tap',test],{CHECKPOINT_MODULE:target,RESUME_TEST_RUNTIME:path.join(root,'fixtures-mutante')});
  assert.notEqual(red.status,0);assert.match(red.stdout,/not ok.*recorded exit 1 before causal effect/);
  assert.match(red.stdout,/true !== false/);
} finally {fs.writeFileSync(target,bytes);}
assert.equal(hash(fs.readFileSync(target)),hash(bytes));assert.equal(hash(fs.readFileSync(source)),hash(bytes));
assert.equal(run('restaurado-28',['--test','--test-reporter=tap',test],{CHECKPOINT_MODULE:target,RESUME_TEST_RUNTIME:path.join(root,'fixtures-restaurado')}).status,0);
fs.writeFileSync(path.join(root,'resultado.json'),JSON.stringify({records,originalObserverSha256:hash(fs.readFileSync(historical)),originalObserverLimitation:'Evaluates hardcoded old predicate over historical result; still reports old defect for corrected source. Actual runner executions distinguish versions.',fixtureOriginalSha256:hash(fixture),fixtureAdaptedSha256:hash(adapted),adaptation:'Only saneamento directory prefix replaced by revalidacao; no criteria, expected values or runner modifications',failedAttemptRetained:true,nextGateNotRun:true,mutation:{before:hash(bytes),mutant:hash(mutant),restored:hash(fs.readFileSync(target)),detectedByExpectedAssertion:true}},null,2)+'\n');
console.log('Original and corrected runner reproduced; 28 passed, old defect red, restored 28 passed.');
