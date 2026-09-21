import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const evidence = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(evidence, '../../..');
const frontend = path.join(root, 'controle-financeiro-frontend');
const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'cf015-independent-'));
for (const folder of ['src', 'tests/component']) fs.cpSync(path.join(frontend, folder), path.join(copy, folder), { recursive: true });
for (const file of ['package.json', 'tsconfig.json']) fs.copyFileSync(path.join(frontend, file), path.join(copy, file));
fs.symlinkSync(path.join(frontend, 'node_modules'), path.join(copy, 'node_modules'), 'junction');
const hash = value => createHash('sha256').update(value).digest('hex');
const cases = [
  { id: 'R01-R04', files: ['src/hooks/useAnnualSummary.ts', 'src/components/screens/annual-summary/annualNotepad.tsx'], test: 'cf015-annual-races.test.tsx' },
  { id: 'R02', files: ['src/contexts/dashboardContext.tsx'], test: 'cf015-chart-race.test.tsx' },
  { id: 'R03', files: ['src/hooks/useCards.ts', 'src/components/forms/payInvoiceModal.tsx'], test: 'cf015-payment-reconciliation.test.tsx' },
  { id: 'R05', files: ['src/hooks/useCards.ts', 'src/screens/private/cards/cardsScreen.tsx'], test: 'cf015-recovery-expanded.test.tsx', filter: 'R05:' },
  { id: 'R07', files: ['src/components/forms/editProfileModal.tsx'], test: 'cf015-profile-draft.test.tsx' },
];
const results = [];
for (const regression of cases) {
  const originals = regression.files.map(file => ({ file, content: fs.readFileSync(path.join(copy, file)) }));
  try {
    for (const { file } of originals) fs.writeFileSync(path.join(copy, file), execFileSync('git', ['show', `ad7fd81:controle-financeiro-frontend/${file}`], { cwd: root }));
    const args = [path.join(frontend, 'node_modules/vitest/vitest.mjs'), 'run', '--root', copy, '--config', path.join(copy, 'tests/component/vitest.config.mts'), `tests/component/${regression.test}`];
    if (regression.filter) args.push('-t', regression.filter);
    const result = spawnSync(process.execPath, args, { cwd: copy, encoding: 'utf8', windowsHide: true });
    fs.writeFileSync(path.join(evidence, `original-${regression.id}.log`), result.stdout + result.stderr);
    results.push({ ...regression, exit: result.status });
  } finally {
    for (const { file, content } of originals) fs.writeFileSync(path.join(copy, file), content);
  }
  results.at(-1).preservation = originals.map(({ file, content }) => ({ file, sha256: hash(content), isolatedRestored: hash(fs.readFileSync(path.join(copy, file))) === hash(content), workingTreeUnchanged: hash(fs.readFileSync(path.join(frontend, file))) === hash(content) }));
}
fs.writeFileSync(path.join(evidence, 'regression-probe.json'), JSON.stringify({ copy, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some(result => result.exit !== 1)) process.exitCode = 1;
