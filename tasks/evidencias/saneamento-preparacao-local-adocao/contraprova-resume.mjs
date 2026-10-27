import fs from 'node:fs';import path from 'node:path';import {spawnSync}from'node:child_process';import assert from'node:assert/strict';import crypto from'node:crypto';
const run=path.resolve(process.argv[2]);
if(!run.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/saneamento-')))throw Error('New runtime required');fs.mkdirSync(run);
const file='tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.mjs',original=fs.readFileSync(file),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const mutant=original.toString().replace(/      if\(name===attempts\.at\(-1\)&&this\.valid\(record,folder\)\) \{[\s\S]*?\n      if\(!\[/,
  "      if(record.result?.status===1){this.verifyInputs();return {reused:true,folder,record};}\n      if(![");
assert.notEqual(mutant,original.toString());const target=path.join(run,'checkpoint-mutant.mjs');fs.writeFileSync(target,mutant);
const result=spawnSync(process.execPath,['--test','--test-reporter=tap','tasks/evidencias/preparacao-local-adocao/counterproof-checkpoint.test.mjs'],{encoding:'utf8',env:{...process.env,CHECKPOINT_MODULE:target,RESUME_TEST_RUNTIME:path.join(run,'fixtures')}});
fs.writeFileSync(path.join(run,'mutation.log'),result.stdout+result.stderr);assert.notEqual(result.status,0);
assert.match(result.stdout,/not ok.*recorded exit 1 before causal effect/);
fs.writeFileSync(target,original);assert.equal(sha(fs.readFileSync(target)),sha(original));assert.equal(sha(fs.readFileSync(file)),sha(original));
fs.writeFileSync(path.join(run,'result.json'),JSON.stringify({mutation:'Old exit-1 skip before validation',detected:true,exit:result.status,original:sha(original),mutant:sha(mutant),restored:sha(fs.readFileSync(target)),repositoryUnchanged:true},null,2)+'\n');console.log('OLD_RESUME_DEFECT=DETECTED; SOURCE_HASHES=RESTORED');
