import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const initial = JSON.parse(fs.readFileSync(path.join(here, 'base-inicial.json'), 'utf8'));
const hashes = initial.map(entry => {
  const data = fs.readFileSync(path.join(root, entry.path));
  const sha256 = crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
  return { path: entry.path, initial: entry.sha256, current: sha256, preserved: sha256 === entry.sha256 };
});
fs.writeFileSync(path.join(here, 'preservacao.json'), JSON.stringify(hashes, null, 2));
const historical = git('diff', '--name-only', '8dad1c1..1ced2f0').split('\n');
const later = initial.filter(e => historical.includes(e.path)).map(e => e.path);
fs.writeFileSync(path.join(here, 'rastreabilidade-git.json'), JSON.stringify({
  capturedAt: new Date().toISOString(), head: git('rev-parse', 'HEAD'),
  commits: git('log', '--format=%H %s', '8dad1c1^..1ced2f0').split('\n'),
  frontendCommits: git('log', '--all', '--format=%H %s', '--grep=CF-01[0-4]'),
  historicalPaths: historical, subsequentUncommittedOverlap: later,
  workingStatus: git('status', '--short'),
}, null, 2));
const lint = JSON.parse(fs.readFileSync(path.join(here, 'lint-final.json'), 'utf8'));
console.log(JSON.stringify({ preserved: hashes.filter(e => e.preserved).length, total: hashes.length,
  changed: hashes.filter(e => !e.preserved).map(e => e.path),
  lint: lint.reduce((s, f) => ({ errors: s.errors + f.errorCount, warnings: s.warnings + f.warningCount }), { errors: 0, warnings: 0 }),
  reviewLint: lint.filter(f => f.filePath.toLowerCase().includes('cf015') && f.messages.length).map(f => ({ file: f.filePath, messages: f.messages })),
}, null, 2));
