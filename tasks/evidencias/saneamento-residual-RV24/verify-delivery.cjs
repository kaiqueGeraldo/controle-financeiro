// Run from repository root. Read-only checks; report goes to stdout.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = process.cwd();
const evidence = 'tasks/evidencias/saneamento-residual-RV24';
const read = p => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).replace(/\r\n/g, '\n');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const baseline = JSON.parse(read(`${evidence}/baseline.json`));
assert(hash('README.md') === baseline.readmeSha256.toLowerCase(), 'Root README changed');
const probes = ['tasks/evidencias/revalidacao-RV24-01-RV24-02/rv24-independent-review.test.tsx', 'controle-financeiro-frontend/tests/component/rv24-independent-review.test.tsx'];
for (const p of probes) assert(hash(p) === baseline.independentProbeSha256.toLowerCase(), `Probe changed: ${p}`);
const tracked = git('ls-files').trim().split('\n');
const canonical = tracked.filter(p => /^tasks\/[^/]+\/CF-\d{3}-[^/]+\.md$/.test(p));
const states = [];
for (const p of canonical) {
  const id = Number(p.match(/CF-(\d{3})/)[1]);
  const old = git('show', `${baseline.head}:${p}`), now = read(p);
  if (id > 27 || p.includes('CF-017-P01-P02')) { assert(now === old, `${p}: downstream/derived task changed`); continue; }
  const protectedLines = s => s.split('\n').filter(l => /^- (Estado:|Depende de:|\[[ xX]\])/.test(l));
  assert(JSON.stringify(protectedLines(old)) === JSON.stringify(protectedLines(now)), `${p}: state/dependencies/criteria changed`);
  const criteria = s => s.match(/## Critérios de aceite\n[\s\S]*?(?=\n## |$)/)?.[0];
  assert(criteria(old) === criteria(now), `${p}: criteria section changed`);
  states.push({ task: `CF-${String(id).padStart(3, '0')}`, state: now.match(/- Estado: (\S+)/)[1] });
}
assert(states.length === 27, 'Expected 27 canonical tasks');
const counts = Object.fromEntries(['concluida', 'em_revisao'].map(s => [s, states.filter(t => t.state === s).length]));
assert(counts.concluida === 10 && counts.em_revisao === 17, 'Unexpected state counts');
assert(git('diff', baseline.head, '--', 'controle-financeiro-backend').trim() === '', 'Backend changed');
const lint = JSON.parse(read(`${evidence}/lint-final.json`));
assert(lint.every(f => !f.errorCount && !f.warningCount), 'Lint failed');
const runs = ['integration-valid', 'integration-invalid'].map(run => {
  const result = JSON.parse(read(`${evidence}/${run}/result.json`));
  assert(result.maven_exit === 0 && result.suites.every(s => !s.failures && !s.errors && !s.skipped), `${run}: failed Java tests`);
  assert(read(`${evidence}/${run}/browser/playwright.log`).includes('6 passed'), `${run}: browser failed`);
  const sources = tracked.filter(p => /^controle-financeiro-backend\/src\/main\//.test(p));
  for (const p of sources) assert(read(p) === read(path.join(result.copy, p.replace('controle-financeiro-backend/', ''))), `${run}: source drift ${p}`);
  return { run, javaTests: result.suites.reduce((a,s) => a + s.tests, 0), browserJourneys: 6, backendSourcesEqual: sources.length };
});
const matrix = 'tasks/evidencias/consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md';
for (const { task } of states) assert(read(matrix).includes(`| ${task} `) || read(matrix).includes(`[${task}]`), `Missing matrix row ${task}`);
const changed = [...new Set([...git('diff', '--name-only', baseline.head).trim().split('\n'), ...git('ls-files', '--others', '--exclude-standard').trim().split('\n')])].filter(Boolean);
const missingLinks = [];
for (const p of changed.filter(p => p.startsWith('tasks/') && p.endsWith('.md'))) {
  for (const m of read(p).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^(https?:|mailto:|codex:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(p), target))) missingLinks.push({ file:p, target });
  }
}
assert(!missingLinks.length, JSON.stringify(missingLinks));
const productHashes = changed.filter(p => p.startsWith('controle-financeiro-frontend/')).map(file => ({file,sha256:hash(file)}));
console.log(JSON.stringify({baseline:baseline.head, readmeSha256:hash('README.md'), independentProbeSha256:hash(probes[0]), counts, states, lintFiles:lint.length, lintErrors:0, lintWarnings:0, runs, links:'all local links in changed Markdown resolve', productHashes}, null, 2));
