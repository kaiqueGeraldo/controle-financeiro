import fs from'node:fs';import path from'node:path';import crypto from'node:crypto';import assert from'node:assert/strict';
import {validateObservation}from'../preparacao-local-adocao/counterproof-observation.mjs';
const run=path.resolve('../controle-financeiro-runtimes/preparacao-adocao/p04/counterproofs'),name='readiness-healthy-with-db-frozen';
const result={status:1,log:path.join(run,name+'.log'),reports:path.join(run,name+'-reports')};
let rejection;
try{validateObservation(result,{test:'AdoptionRuntimeTest#readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart',method:'readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart',failure:['expected: 503','but was: 200']});}catch(error){rejection=error.message;}
assert.equal(rejection,'Assertion failed before causal effect');
const independent='tasks/evidencias/revisao-preparacao-local-adocao/execucao/counterproofs-independent/readiness.log',log=fs.readFileSync(independent,'utf8');assert.match(log,/expected: 503\s+but was: 200/);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const receipt={legacyLog:result.log,sha256:hash(result.log),legacyGenericStatus:1,rejection,mutatedStartupIsNotReadinessProof:true,
 independentAcceptedProof:independent,independentSha256:hash(independent),independentCausalAssertionPreserved:true,mode:'Read-only receipt verification; zero new application tests'};
fs.writeFileSync('tasks/evidencias/saneamento-preparacao-local-adocao/legado-nao-comprovado.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
