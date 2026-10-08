const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../../..');
const git = (...args) => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const hash = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = '1b0d9bcefaba0bcc37a21955caa94db65a3bf383';
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'baseline.json'), 'utf8'));
assert.equal(hash(path.join(root, 'README.md')).toUpperCase(), baseline.readmeSHA256);
assert.equal(git('diff', base, '--', 'controle-financeiro-frontend/src', 'controle-financeiro-backend/src/main'), '');
assert(!git('diff', '--cached', '--name-only').split('\n').includes('README.md'));

const tasks = ['CF-005-datas-frontend.md', 'CF-006-datas-backend.md', 'CF-007-e2e-temporal.md', 'CF-008-erros-e-contratos.md'];
const states = [];
for (const [i, name] of tasks.entries()) {
  const file = `tasks/01-datas-integracao/${name}`;
  const original = git('show', `${base}:${file}`);
  const current = read(file);
  const acceptance = text => text.split('## Aceite e testes adversariais')[1].split('\n## ')[0].replaceAll('\r', '').trim();
  assert.equal(acceptance(current), acceptance(original), `Critérios alterados: ${name}`);
  const state = current.match(/^- Estado: (.+)$/m)[1].trim();
  assert.equal(state, i < 2 ? 'em_revisao' : 'concluida');
  states.push({ task: name.slice(0, 6), before: 'em_revisao', after: state });
}
const suites = JSON.parse(fs.readFileSync(path.join(__dirname, 'backend-results.json'), 'utf8'));
const total = key => suites.reduce((n, suite) => n + suite[key], 0);
assert.equal(total('tests'), 77);
assert.equal(total('failures'), 1);
assert.equal(total('errors'), 0);
assert.equal(total('skipped'), 0);
assert.equal(suites.find(suite => suite.suite.endsWith('DirectedGoalHistoryTemporalTest')).failures, 1);
const statics = JSON.parse(fs.readFileSync(path.join(__dirname, 'static-final.json'), 'utf8'));
assert.deepEqual(statics, { lint: 0, typecheck: 0 });
assert.match(fs.readFileSync(path.join(__dirname, 'components-authorized.log'), 'utf8'), /64 passed/);
assert.match(fs.readFileSync(path.join(__dirname, 'probes-final.log'), 'utf8'), /2 failed \| 1 passed/);
assert.match(fs.readFileSync(path.join(__dirname, 'backend-probe-final.log'), 'utf8'), /Tests run: 1, Failures: 1, Errors: 0, Skipped: 0/);
assert.match(fs.readFileSync(path.join(__dirname, 'backend-probe-final.log'), 'utf8'), /but was: "2026-09-08T00:10:00"/);
for (const f of ['README.md', 'MATRIZ.md', 'ACHADOS.md', 'EXECUCOES.md']) {
  const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
  for (const match of content.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
    if (/^https?:/.test(match[1])) continue;
    assert(fs.existsSync(path.resolve(__dirname, match[1])), `Link ausente ${f}: ${match[1]}`);
  }
}
const manifestFiles = fs.readdirSync(__dirname).filter(name => !['checkpoint.json', 'manifest.json'].includes(name));
const manifest = manifestFiles.filter(name => fs.statSync(path.join(__dirname, name)).isFile())
  .map(name => ({ path: name, sha256: hash(path.join(__dirname, name)) }));
for (const file of ['controle-financeiro-frontend/tests/component/directed-temporal-review.test.tsx',
  'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/DirectedGoalHistoryTemporalTest.java']) {
  manifest.push({ path: path.relative(__dirname, path.join(root, file)).replaceAll('\\', '/'), sha256: hash(path.join(root, file)) });
}
const checkpoint = { date: '2026-10-08', productBase: base, readmePreserved: true, productUnchanged: true,
  originalAcceptancePreserved: true, states, backend: { tests: 77, failures: 1, errors: 0, skipped: 0 },
  frontendUnique: { tests: 67, passed: 65, failed: 2 }, statics };
if (process.argv.includes('--check')) {
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8')), manifest);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(__dirname, 'checkpoint.json'), 'utf8')), checkpoint);
} else {
  fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(__dirname, 'checkpoint.json'), JSON.stringify(checkpoint, null, 2) + '\n');
}
console.log(JSON.stringify(checkpoint, null, 2));
