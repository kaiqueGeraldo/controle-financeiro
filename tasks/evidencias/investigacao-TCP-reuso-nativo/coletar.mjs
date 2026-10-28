import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const root = path.resolve(process.argv[2]);
assert.ok(root.startsWith(path.resolve('../controle-financeiro-runtimes/preparacao-adocao/tcp-nativo-')));
const out = import.meta.dirname;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inventory = [], artifacts = [], reports = {};
function sanitize(text) {
  return text.replace(/jdbc:postgresql:\/\/[^\s\]<>"']+/gi, '<JDBC_LOCAL_WITHHELD>')
    .replace(/(Bearer\s+)[A-Za-z0-9_.-]+/g, '$1<TOKEN_WITHHELD>')
    .replace(/(password\s*[=:]\s*)[^\s,;]+/gi, '$1<PASSWORD_WITHHELD>');
}
function collect(file, relative) {
  const bytes = fs.readFileSync(file), clean = Buffer.from(sanitize(bytes.toString('utf8')));
  let target = path.join(out, 'execucao', relative);
  if (target.length > 235) target = path.join(out, 'execucao', 'compactos', hash(file).slice(0, 16) + '-' + path.basename(file).replace('com.controlefinanceiro.api.migration.', '').slice(-55));
  assert.ok(target.length <= 235, target);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, clean, {flag: 'wx'});
  artifacts.push({source: file, target: path.relative(out, target).replaceAll('\\', '/'), originalSha256: hash(bytes),
    collectedSha256: hash(clean), decodedOrSanitized: !bytes.equals(clean)});
}
function walk(dir, relative = '') {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    assert.equal(entry.isSymbolicLink(), false);
    const file = path.join(dir, entry.name), rel = path.join(relative, entry.name);
    if (entry.isDirectory()) walk(file, rel);
    else {
      const bytes = fs.readFileSync(file);
      inventory.push({file: rel.replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes)});
      if (!rel.startsWith('checkout' + path.sep) && /\.(log|json|xml|err|java)$/.test(entry.name)) collect(file, rel);
      else if (rel.includes(path.join('target', 'adoption-processes')) && entry.name.endsWith('.log')) collect(file, path.join('processos', entry.name));
    }
  }
}
walk(root);
for (const entry of fs.readdirSync(root, {withFileTypes: true}).filter(e => e.isDirectory() && e.name.endsWith('-reports'))) {
  reports[entry.name] = fs.readdirSync(path.join(root, entry.name)).filter(f => /^TEST-.*\.xml$/.test(f)).map(file => {
    const xml = fs.readFileSync(path.join(root, entry.name, file), 'utf8');
    const header = xml.match(/<testsuite\b[^>]*>/)?.[0]; assert.ok(header);
    const counts = Object.fromEntries(['tests', 'failures', 'errors', 'skipped'].map(k => [k, Number(header.match(new RegExp('\\b' + k + '="(\\d+)"'))?.[1])]));
    assert.ok(Object.values(counts).every(Number.isFinite));
    return {file, ...counts, cases: [...xml.matchAll(/<testcase\b[\s\S]*?(?:<\/testcase>|\/>)/g)].map(m => ({
      name: m[0].match(/\bname="([^"]+)"/)?.[1], failure: /<failure\b/.test(m[0]), error: /<error\b/.test(m[0])}))};
  });
}
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'inputs.json')));
const harness = 'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/migration/AdoptionRuntimeTest.java';
for (const row of manifest.inputs) {
  const expected = row.file === harness ? hash(fs.readFileSync(row.file)) : row.sha256;
  assert.equal(hash(fs.readFileSync(path.join(root, 'checkout', row.file))), expected, row.file);
}
const receipts = fs.readdirSync(root).filter(f => f.endsWith('-receipt.json')).map(f => JSON.parse(fs.readFileSync(path.join(root, f))));
for (const receipt of receipts) for (const mutation of receipt.mutations ?? []) assert.equal(mutation.beforeSha256, mutation.restoredSha256);
fs.writeFileSync(path.join(out, 'runtime-files.json'), JSON.stringify({runtime: root, files: inventory.length, hashes: inventory}, null, 2) + '\n', {flag: 'wx'});
fs.writeFileSync(path.join(out, 'resultados.json'), JSON.stringify({at: new Date().toISOString(), runtime: root, base: manifest.commit,
  exportInputs: manifest.inputs.length, unchangedExportInputs: manifest.inputs.length - 1, authorizedHarnessDelta: harness,
  reports, receipts, artifacts, limits: 'Per-invocation results overlap; no unique-test sum. Diagnostic green can contain failed binds as data. UTF-8 conversion/sanitization distinguished by original and collected SHA; raw files retained.'}, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({files: inventory.length, artifacts: artifacts.length, reports}));
