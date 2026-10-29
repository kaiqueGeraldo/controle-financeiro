import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const phase = process.argv[2];
assert.ok(['inicial', 'final'].includes(phase));
const out = import.meta.dirname;
const priorRoot = 'tasks/evidencias/revalidacao-RVPLA-05-residual';
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const prior = JSON.parse(fs.readFileSync(`${priorRoot}/preservacao-final.json`));
assert.equal(prior.protectedFiles, 25100);
const expected = {...prior.hashes};
const inventory = JSON.parse(fs.readFileSync(`${priorRoot}/runtime-files.json`));
for (const row of inventory.hashes) expected[path.join(inventory.runtime, row.file)] = row.sha256;
function files(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    assert.equal(entry.isSymbolicLink(), false);
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
for (const [file, hash] of Object.entries(expected)) assert.equal(digest(file), hash, file);
for (const file of files(priorRoot)) expected[file] = digest(file);
const product = execFileSync('git', ['ls-files', '-z', '--', 'controle-financeiro-backend', 'controle-financeiro-frontend'], {encoding: 'utf8'}).split('\0').filter(Boolean);
for (const file of product) expected[file] = digest(file);
const initial = phase === 'final' ? JSON.parse(fs.readFileSync(path.join(out, 'preservacao-inicial.json'))) : null;
const authorized = 'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java';
const authorizedDelta = {};
if (initial) for (const [file, hash] of Object.entries(initial.hashes)) {
  if (file === authorized) authorizedDelta[file] = {before: hash, after: digest(file)};
  else assert.equal(digest(file), hash, file);
}
assert.equal(digest('README.md'), prior.readmeSha256);
const jar = '../controle-financeiro-runtimes/preparacao-adocao/p05/package/api.jar';
assert.equal(digest(jar), prior.jarSha256);
execFileSync('git', ['merge-base', '--is-ancestor', '3b245d9dd23e876700507718767827ea5e9f8a11', 'HEAD']);
const record = {phase, at: new Date().toISOString(), historicalInventory: `${priorRoot}/preservacao-final.json`, historicalInventorySha256: digest(`${priorRoot}/preservacao-final.json`), historicalProtectedFiles: 25100,
  previousRuntimeFiles: inventory.files, protectedFiles: Object.keys(expected).length, productFiles: product.length, migrations: 16,
  readmeSha256: digest('README.md'), jarSha256: digest(jar), authorizedDelta, hashes: expected};
fs.writeFileSync(path.join(out, `preservacao-${phase}.json`), JSON.stringify(record, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({...record, hashes: undefined}));
