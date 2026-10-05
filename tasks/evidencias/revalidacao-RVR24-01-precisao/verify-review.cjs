const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const dir = __dirname;
const root = path.resolve(dir, '../../..');
const git = (...args) => execFileSync('git', args, {cwd: root});
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const json = name => JSON.parse(read(name));
const originalPaths = [
  ['28e5682', 'tasks/evidencias/revalidacao-RVR24-01-teto/json-precision.test.tsx', 'dfdbd8d15d1b7a4fc3711799e78fdf6d1030c6444536cde90aff1ae4d1bf4c1a'],
  ['1e9e932', 'tasks/evidencias/revalidacao-RVR24-01-bruto/decimal-independent.test.tsx', '7b293c5a328231d950b456e95a847273e66439b22588f55026f8d1d5608bd255'],
  ['c45bfb6', 'tasks/evidencias/revisao-CF-025-CF-027-RV24/financial-result-review.test.tsx', '0174865c3f241459bb2dfae5eb9540b2a95c47c92be72f5b427a59dcb5a69143'],
];
const originals = originalPaths.map(([commit, file, expected]) => {
  assert.equal(sha(git('show', `${commit}:${file}`)), expected);
  assert.equal(sha(fs.readFileSync(path.join(root, file))), expected);
  return {commit, file, sha256: expected};
});
const front = read('frontend-copy.txt').trim();
assert.equal(sha(fs.readFileSync(path.join(front, 'tests/component/json-precision-original.test.tsx'))), originals[0].sha256);
assert.equal(sha(fs.readFileSync(path.join(root, 'tasks/evidencias/saneamento-RVR24-01-precisao/json-precision.original.test.tsx'))), originals[0].sha256);
for (const [index, name] of [[1,'decimal-independent'],[2,'financial-result-review']]) {
  assert.equal(sha(fs.readFileSync(path.join(root, `controle-financeiro-frontend/tests/component/${name}.test.tsx`))), originals[index].sha256);
}
assert.equal(sha(fs.readFileSync(path.join(root,'README.md'))), '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
assert.equal(git('diff','98d0343','--','controle-financeiro-frontend/src','controle-financeiro-backend/src/main','controle-financeiro-frontend/tests','controle-financeiro-backend/src/test','controle-financeiro-frontend/package.json','controle-financeiro-frontend/package-lock.json').length, 0);
git('merge-base','--is-ancestor','98d0343','HEAD');
const sourceComparisons=[];
function compareTrees(source, copy) {
  for(const entry of fs.readdirSync(source,{withFileTypes:true})) {
    const original=path.join(source,entry.name), target=path.join(copy,entry.name);
    if(entry.isDirectory()) compareTrees(original,target);
    else {assert.equal(sha(fs.readFileSync(original)),sha(fs.readFileSync(target))); sourceComparisons.push(path.relative(root,original));}
  }
}
compareTrees(path.join(root,'controle-financeiro-frontend/src'),path.join(front,'src'));
for (const run of ['ng01','buy']) compareTrees(path.join(root,'controle-financeiro-backend/src/main'),path.join(read(`${run}/copy-path.txt`).trim(),'src/main'));
assert.equal(json('components-result.json').exit,0);
assert.match(read('components.log'),/226 passed/);
assert.match(read('original.log'),/1 failed \| 6 passed/);
assert.match(read('client-old-original.log'),/6 failed \| 1 passed/);
assert.match(read('parser-independent.log'),/4 failed \| 12 passed/);
assert.match(read('client-old-inheritance.log'),/3 passed \| 13 skipped/);
const client=json('client-counterproof.json'), backend=json('backend-counterproof.json');
assert.equal(client.before,client.restored); assert.equal(backend.before,backend.restored);
assert.equal(backend.mutant_exit,1); assert.equal(backend.restored_exit,0);
assert.match(read('backend-old.log'),/but was: 1.0E\+12/);
for(const exit of Object.values(json('static-result.json'))) assert.equal(exit,0);
const lint=json('lint.json'); assert.equal(lint.reduce((n,r)=>n+r.errorCount+r.warningCount,0),0);
for(const run of ['ng01','buy']) {
  const result=json(`${run}/result.json`); assert.equal(result.maven_exit,0);
  for(const suite of result.suites) assert.equal(suite.failures+suite.errors+suite.skipped,0);
}
const ng=json('ng01/browser/precision-state.json');
assert.equal(ng.totalMutationRequests,2); assert.equal(ng.uiPosts,1); assert.equal(ng.explicitReplayPosts,1);
assert.deepEqual(ng.pendingAfterRecovery,[]);
for(const phase of ['committed','afterReplay','recovered']) {
  assert.deepEqual(ng[phase].accounts,[{balance:1001}]);
  assert.deepEqual(ng[phase].raw_operations,[{quantity:'999999999999.99999999'}]);
  assert.deepEqual(ng[phase].raw_receipts,[{quantity:'999999999999.99999999'}]);
  assert.deepEqual(ng[phase].receipts,[{id:ng.command.operationId,gross:1}]);
  assert.equal(ng[phase].operations.length,1); assert.equal(ng[phase].bank.length,1);
}
for(const file of ['operation-raw.json','replay-raw.json','receipt-raw.json']) assert.match(read(`ng01/browser/${file}`),/"quantity":999999999999\.99999999/);
assert.equal(read('ng01/browser/operation-raw.json'),read('ng01/browser/replay-raw.json'));
const buy=json('buy/browser/sql-checkpoints.json');
for(const phase of buy){assert.deepEqual(phase.state.accounts,[{balance:800}]);assert.equal(phase.state.operations.length,1);assert.equal(phase.state.receipts.length,1);assert.equal(phase.state.operations[0].total_value,200);}
const result={candidate:'98d03439119d5fa02d1c4b4732e975a18afc46d1', originals, comparedSourceFiles:sourceComparisons.length, ng01:ng.command.operationId, buy:buy[0].state.receipts[0].id, lintFiles:lint.length};
if(process.argv.includes('--check')) {
  const checkpoint=json('checkpoint.json');
  assert.deepEqual(checkpoint.results,result);
  for(const [file,hash] of Object.entries(checkpoint.hashes)) assert.equal(sha(fs.readFileSync(path.join(dir,file))),hash,file);
} else {
  const hashes={};
  function walk(base){for(const entry of fs.readdirSync(base,{withFileTypes:true})){const file=path.join(base,entry.name);if(entry.isDirectory())walk(file);else if(entry.name!=='checkpoint.json')hashes[path.relative(dir,file).replaceAll('\\','/')]=sha(fs.readFileSync(file));}}
  walk(dir);
  fs.writeFileSync(path.join(dir,'checkpoint.json'),JSON.stringify({results:result,hashes},null,2)+'\n');
}
console.log(JSON.stringify(result,null,2));
