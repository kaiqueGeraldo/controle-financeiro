import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const codeHead = git('rev-parse', 'HEAD');
const codePaths = git('diff', '--name-only', 'ad7fd81', codeHead, '--', 'controle-financeiro-frontend', 'controle-financeiro-backend').split('\n').filter(Boolean);
const runtimeDiff = git('diff', 'HEAD', '--', 'controle-financeiro-frontend', 'controle-financeiro-backend');
if (runtimeDiff) throw new Error('Uncommitted code: cannot certify the code head');
const unchanged = [
  'tasks/evidencias/revisao-CF-015',
  'tasks/03-integridade/CF-017-P01-P02-adocao-temporal.md',
  'controle-financeiro-frontend/tests/e2e/temporal.integrated.spec.ts',
  ...['cf015-annual-races', 'cf015-chart-race', 'cf015-payment-reconciliation', 'cf015-profile-draft'].map(name => `controle-financeiro-frontend/tests/component/${name}.test.tsx`),
].map(file => ({ file, unchangedFromReview: git('diff', 'eb40303', 'HEAD', '--', file) === '' }));
const readme = hash(path.join(root, 'README.md'));
if (readme !== '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca' || unchanged.some(item => !item.unchangedFromReview)) throw new Error('Preservation check failed');
fs.writeFileSync(path.join(directory, 'codigo-validado.json'), JSON.stringify({ codeHead, fixesRange: `ad7fd81..${codeHead}`, inclusiveCandidateRange: `eb40303..${codeHead}`, files: codePaths.map(file => ({ file, sha256WorkingTree: hash(path.join(root, file)), gitBlob: git('rev-parse', `${codeHead}:${file}`) })), preservation: { rootReadmeSha256: readme, stagedRootReadme: git('diff', '--cached', '--name-only', '--', 'README.md') !== '', unchanged } }, null, 2));
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const artifacts = walk(directory).filter(file => !['artefatos.json', 'documentacao-paths.txt'].includes(path.basename(file))).map(file => ({ file: path.relative(directory, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: hash(file) }));
fs.writeFileSync(path.join(directory, 'artefatos.json'), JSON.stringify(artifacts, null, 2));
console.log(JSON.stringify({ codeHead, codeFiles: codePaths.length, artifacts: artifacts.length, readmePreserved: true, historicalReviewPreserved: true }, null, 2));
