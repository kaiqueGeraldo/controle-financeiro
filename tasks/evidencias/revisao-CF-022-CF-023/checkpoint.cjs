// Run after every test process has finished, from the repository root.
// Only the review evidence is sanitized; product, tests and earlier evidence stay intact.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve('tasks/evidencias/revisao-CF-022-CF-023');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const published = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.zip')) throw new Error('Trace with synthetic credentials must remain outside Git: ' + file);
    else if (entry.name.endsWith('.log')) {
      const original = fs.readFileSync(file);
      const text = original.toString('utf8').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<JWT-redacted>')
        .replace(/("(?:password|senha|novaSenha|recoveryToken|recovery_token|token)"\s*:\s*")[^"\n]*(")/g, '$1<credential-redacted>$2')
        .replace(/Synthetic-Cf022-2026/g, '<synthetic-password-redacted>')
        .replace(/synthetic-hash/g, '<synthetic-hash-redacted>');
      fs.writeFileSync(file, text);
      published.push({ file: path.relative(root, file).replaceAll('\\', '/'), before: sha(original), published: sha(text) });
    }
  }
}
walk(root);
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
const files = git(['ls-files', 'controle-financeiro-backend/src/main', 'controle-financeiro-frontend/src',
  'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/domain/habit',
  'controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/infra/security']).split('\n');
const unchangedProduct = git(['diff', '--name-only', '9ff1aec', '--', 'controle-financeiro-backend/src/main', 'controle-financeiro-frontend/src']);
if (unchangedProduct) throw new Error('Unexpected product changes: ' + unchangedProduct);
const readme = sha(fs.readFileSync('README.md')).toUpperCase();
if (readme !== '6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA') throw new Error('Preexisting README changed');
const candidate = {
  reviewedHead: '9ff1aec7c5d4e80eb20458c83b505132bfc3f5f3', headAtCheckpoint: git(['rev-parse', 'HEAD']),
  branch: git(['branch', '--show-current']), readmeSha256: readme, productUnchanged: true,
  sources: files.map(file => ({ file, sha256Lf: sha(fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')) })), logs: published,
};
fs.writeFileSync(path.join(root, 'checkpoint.json'), JSON.stringify(candidate, null, 2));
process.stdout.write(`Checkpoint: ${files.length} sources; ${published.length} logs; README/product preserved.\n`);
