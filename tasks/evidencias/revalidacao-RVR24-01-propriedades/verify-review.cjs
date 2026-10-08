const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const dir = __dirname, root = path.resolve(dir, '../../..');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: root });
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const json = name => JSON.parse(read(name));
const candidate = 'b5e8550609cea1d7ce0e94cd5c9fbb98eb13b68a';
git('merge-base', '--is-ancestor', 'd4e5a06', '3ac2fc5');
git('merge-base', '--is-ancestor', '3ac2fc5', candidate);
git('merge-base', '--is-ancestor', candidate, 'HEAD');
assert.equal(git('diff', candidate, '--', 'controle-financeiro-frontend', 'controle-financeiro-backend').length, 0);
assert.equal(sha(fs.readFileSync(path.join(root, 'README.md'))), '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca');
const original = 'tasks/evidencias/revalidacao-RVR24-01-precisao/parser-independent.test.tsx';
const originalHash = '18981b2f600001356f59d87fd2fb9cd0d378db1f4d71701bd2f2d1d5eed800dd';
assert.equal(sha(git('show', `d4e5a06:${original}`)), originalHash);
assert.equal(sha(fs.readFileSync(path.join(root, original))), originalHash);
assert.equal(sha(fs.readFileSync(path.join(root, 'controle-financeiro-frontend/tests/component/parser-independent.test.tsx'))), originalHash);
const counter = json('counterproof.json');
assert.equal(sha(fs.readFileSync(path.join(counter.copy, 'tests/component/parser-independent.test.tsx'))), originalHash);
for (const hash of counter.hashes) assert.equal(hash.main, hash.restored);
assert.deepEqual(counter.results.map(value => value.exit), [1, 1, 0]);
assert.match(read('counter-own-old.log'), /17 failed \| 8 passed/);
assert.match(read('counter-construction-old.log'), /1 failed \| 15 passed/);
assert.match(read('counter-restored.log'), /25 passed/);
assert.equal(json('components-result.json').exit, 1);
assert.match(read('components.log'), /EPERM: operation not permitted, rename/);
assert.match(read('components.log'), /Tests\s+no tests/);
assert.equal(json('components-authorized-result.json').exit, 0);
assert.match(read('components-authorized.log'), /267 passed/);
assert.equal(json('object-boundary-result.json').exit, 0);
assert.match(read('object-boundary.log'), /5 passed/);
assert.equal(sha(fs.readFileSync(path.join(counter.copy, 'tests/component/object-boundary.test.tsx'))), sha(fs.readFileSync(path.join(dir, 'object-boundary.test.tsx'))));
let compared = 0;
function compare(source, copy) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const a = path.join(source, entry.name), b = path.join(copy, entry.name);
    if (entry.isDirectory()) compare(a, b);
    else { assert.equal(sha(fs.readFileSync(a)), sha(fs.readFileSync(b)), a); compared++; }
  }
}
compare(path.join(root, 'controle-financeiro-frontend/src'), path.join(counter.copy, 'src'));
for (const run of ['buy','ng01']) {
  const execution = json(`${run}/result.json`);
  assert.equal(execution.maven_exit, 0);
  for (const suite of execution.suites) assert.equal(suite.failures + suite.errors + suite.skipped, 0);
  compare(path.join(root, 'controle-financeiro-backend/src/main'), path.join(execution.copy, 'src/main'));
}
for (const exit of Object.values(json('static-result.json'))) assert.equal(exit, 0);
const lint = json('lint.json');
assert.equal(lint.reduce((n, result) => n + result.errorCount + result.warningCount, 0), 0);
const buy = json('buy/browser/sql-checkpoints.json');
assert.equal(buy.length, 3);
for (const phase of buy) {
  assert.equal(phase.posts, 1);
  assert.deepEqual(phase.state.accounts, [{balance:800}]);
  assert.deepEqual(phase.state.operations, [{total_value:200,quantity:2,fees:0}]);
  assert.deepEqual(phase.state.bank, [{amount:200,origin:'INVESTMENT_BUY'}]);
  assert.equal(phase.state.receipts.length, 1);
  assert.deepEqual(phase.state.receipts, buy[0].state.receipts);
}
const ng = json('ng01/browser/precision-state.json');
assert.equal(ng.uiPosts, 1); assert.equal(ng.explicitReplayPosts, 1); assert.equal(ng.totalMutationRequests, 2);
assert.deepEqual(ng.pendingAfterRecovery, []);
for (const phase of ['committed','afterReplay','recovered']) {
  assert.deepEqual(ng[phase].accounts, [{balance:1001}]);
  assert.deepEqual(ng[phase].raw_operations, [{quantity:'999999999999.99999999'}]);
  assert.deepEqual(ng[phase].raw_receipts, [{quantity:'999999999999.99999999'}]);
  assert.deepEqual(ng[phase].receipts, [{id:ng.command.operationId,gross:1}]);
  assert.equal(ng[phase].operations.length, 1); assert.equal(ng[phase].bank.length, 1);
}
for (const file of ['operation-raw.json','replay-raw.json','receipt-raw.json']) assert.match(read(`ng01/browser/${file}`), /"quantity":999999999999\.99999999/);
assert.equal(read('ng01/browser/operation-raw.json'), read('ng01/browser/replay-raw.json'));
for (const file of ['tasks/01-datas-integracao/RV24-01-criacao-resultado-desconhecido.md','tasks/01-datas-integracao/CF-009-estado-assincrono.md']) {
  const text = fs.readFileSync(path.join(root,file),'utf8');
  assert.match(text, /- Estado: concluida/); assert.doesNotMatch(text, /^- \[ \]/m);
}
const results = { candidate, originalHash, comparedSourceFiles:compared, componentTests:267, extraTests:5, lintFiles:lint.length, buy:buy[0].state.receipts[0].id, ng01:ng.command.operationId };
if (process.argv.includes('--check')) {
  const checkpoint=json('checkpoint.json'); assert.deepEqual(checkpoint.results,results);
  for(const [file,hash] of Object.entries(checkpoint.hashes)) assert.equal(sha(fs.readFileSync(path.join(dir,file))),hash,file);
} else {
  const hashes={};
  function walk(base){for(const entry of fs.readdirSync(base,{withFileTypes:true})){const file=path.join(base,entry.name);if(entry.isDirectory())walk(file);else if(entry.name!=='checkpoint.json')hashes[path.relative(dir,file).replaceAll('\\','/')]=sha(fs.readFileSync(file));}}
  walk(dir); fs.writeFileSync(path.join(dir,'checkpoint.json'),JSON.stringify({results,hashes},null,2)+'\n');
}
console.log(JSON.stringify(results,null,2));
