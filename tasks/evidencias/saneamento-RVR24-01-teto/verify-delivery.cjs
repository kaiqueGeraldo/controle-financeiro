// Read-only verification; run from repository root and redirect stdout if desired.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const evidence = 'tasks/evidencias/saneamento-RVR24-01-teto';
const read = p => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).replace(/\r\n/g, '\n');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const baseline = JSON.parse(read(`${evidence}/baseline.json`));
assert(hash('README.md') === baseline.readmeSha256.toLowerCase(), 'README changed');
const probe = 'controle-financeiro-frontend/tests/component/decimal-independent.test.tsx';
for (const p of [baseline.probe, probe]) assert(hash(p) === baseline.probeSha256.toLowerCase(), `Probe changed ${p}`);
const tracked = git('ls-files').trim().split('\n');
const states = [];
for (const p of tracked.filter(p => /^tasks\/[^/]+\/(CF-|RV24-)[^/]+\.md$/.test(p) && p.endsWith('.md'))) {
  const old = git('show', `${baseline.head}:${p}`), now = read(p);
  const protectedLines = s => s.split('\n').filter(l => /^- (Estado:|Depende de:|\[[ xX]\])/.test(l));
  assert(JSON.stringify(protectedLines(old)) === JSON.stringify(protectedLines(now)), `State/dependency/criteria changed ${p}`);
  if (/CF-02[5-8]|RV24-02/.test(p)) assert(old === now, `Accepted/next task changed ${p}`);
  states.push({ file:p, state:now.match(/- Estado: (\S+)/)?.[1] });
}
assert(git('diff', baseline.head, '--', 'controle-financeiro-backend').trim() === '', 'Backend changed');
const run = JSON.parse(read(`${evidence}/integration/result.json`));
assert(run.maven_exit === 0 && run.suites.every(s => !s.failures && !s.errors && !s.skipped), 'Integration failed');
const sources = tracked.filter(p => p.startsWith('controle-financeiro-backend/src/main/'));
for (const p of sources) assert(read(p) === read(path.join(run.copy, p.replace('controle-financeiro-backend/', ''))), `Backend source drift ${p}`);
const checkpoints = JSON.parse(read(`${evidence}/integration/browser/sql-checkpoints.json`));
assert(checkpoints.length === 3 && checkpoints.every(c => c.posts === 1 && c.state.operations.length === 1 && c.state.receipts.length === 1 && c.state.accounts[0].balance === 800), 'SQL checkpoints failed');
const lint = JSON.parse(read(`${evidence}/lint-final.json`));
assert(lint.every(f => !f.errorCount && !f.warningCount), 'Lint failed');
assert(JSON.parse(read(`${evidence}/static-final.json`)).typecheck === 0, 'Typecheck failed');
assert(JSON.parse(read(`${evidence}/build-final-result.json`)).build === 0, 'Build failed');
const files = ['controle-financeiro-frontend/src/services/creationResult.ts', probe, 'controle-financeiro-frontend/tests/component/rv24-ceiling.test.tsx'];
const allMarkdown = [...tracked.filter(p => /CF-009-|RV24-01-criacao/.test(p)), ...fs.readdirSync(evidence).filter(p => p.endsWith('.md')).map(p => `${evidence}/${p}`)];
for (const p of allMarkdown) for (const m of read(p).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  const target=m[1].split('#')[0];
  if (target && !/^(https?:|mailto:)/.test(target)) assert(fs.existsSync(path.resolve(path.dirname(p), target)), `Broken link ${p}: ${target}`);
}
console.log(JSON.stringify({ baseline:baseline.head, readmeSha256:hash('README.md'), probeSha256:hash(probe), states, productHashes:files.map(file => ({file, sha256:hash(file)})), backendSourcesEqual:sources.length, lintFiles:lint.length, typecheck:0, lint:0, build:0, javaRunner:1, browserJourneys:1, sqlCheckpoints:3, components:151, links:'resolved' }, null, 2));
