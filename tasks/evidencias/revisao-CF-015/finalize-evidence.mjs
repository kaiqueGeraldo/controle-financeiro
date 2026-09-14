import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const sha = data => crypto.createHash('sha256').update(data).digest('hex').toUpperCase();
const initial = JSON.parse(fs.readFileSync(path.join(here, 'base-inicial.json'), 'utf8'));
const preservation = initial.map(entry => {
  const current = sha(fs.readFileSync(path.join(root, entry.path)));
  return { path: entry.path, initial: entry.sha256, current, preserved: current === entry.sha256,
    expectedTaskStatusUpdate: /^tasks\/02-frontend\/CF-01[0-4]-/.test(entry.path) };
});
const unexpected = preservation.filter(e => !e.preserved && !e.expectedTaskStatusUpdate);
if (unexpected.length) throw new Error(`Alteração preexistente inesperada: ${JSON.stringify(unexpected)}`);
fs.writeFileSync(path.join(here, 'preservacao-final.json'), JSON.stringify(preservation, null, 2));
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? walk(path.join(directory, e.name)) : [path.join(directory, e.name)]);
}
const files = walk(here).filter(p => !['artefatos.json', 'staging-files.txt'].includes(path.basename(p))).sort();
const artifacts = files.map(p => {
  const data = fs.readFileSync(p);
  return { path: path.relative(root, p).replaceAll('\\', '/'), bytes: data.length, sha256: sha(data) };
});
fs.writeFileSync(path.join(here, 'artefatos.json'), JSON.stringify(artifacts, null, 2));
const stage = [...artifacts.map(e => e.path), 'tasks/evidencias/revisao-CF-015/artefatos.json', 'tasks/evidencias/revisao-CF-015/staging-files.txt'];
fs.writeFileSync(path.join(here, 'staging-files.txt'), stage.join('\n') + '\n');
console.log(JSON.stringify({ initialFiles: preservation.length, unchanged: preservation.filter(e => e.preserved).length,
  intentionalTaskUpdates: preservation.filter(e => !e.preserved).map(e => e.path), artifacts: artifacts.length,
  bytes: artifacts.reduce((n, e) => n + e.bytes, 0) }, null, 2));
