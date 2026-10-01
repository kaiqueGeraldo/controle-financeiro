const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const auditedHead = '5d0649a07550b3db1058f6094c51d2beef64095a';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/^\uFEFF/, '');
const json = f => JSON.parse(read(f));
const assert = (ok, why) => { if (!ok) throw new Error(why); };
const git = (...args) => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const rel = f => path.relative(__dirname, f).replaceAll('\\', '/');
const hash = f => sha(fs.readFileSync(f));
const stripAnsi = s => s.replace(/\x1b\[[0-9;]*m/g, '');
cp.execFileSync(process.execPath, [path.join(root, 'tasks/evidencias/RV24-01/verify-evidence.cjs'), '--check'], { cwd: root, stdio: 'inherit' });
for (const ref of ['30211b8', '53fa3a8', '805f588', auditedHead]) git('merge-base', '--is-ancestor', ref, 'HEAD');
assert(!git('diff', auditedHead, '--', 'controle-financeiro-backend', 'controle-financeiro-frontend'), 'Produto/config/testes compartilhados diferem da entrega auditada.');
const copy = read('copy-path.txt').trim();
const main = walk(path.join(root, 'controle-financeiro-backend/src/main')).concat(path.join(root, 'controle-financeiro-backend/pom.xml')).sort();
const product = main.map(f => {
  const relative = path.relative(path.join(root, 'controle-financeiro-backend'), f);
  if (fs.existsSync(copy)) assert(hash(f) === hash(path.join(copy, relative)), `Produto da cópia mudou: ${relative}`);
  return { file: relative.replaceAll('\\', '/'), sha256: hash(f) };
});
const sums = json('backend-suites.json').reduce((a,s) => { for (const k of Object.keys(a)) a[k] += s[k]; return a; }, { tests:0, failures:0, errors:0, skipped:0 });
assert(JSON.stringify(sums) === JSON.stringify({tests:139,failures:0,errors:0,skipped:0}), 'Contagem backend divergente.');
assert(/Tests run: 139, Failures: 0, Errors: 0, Skipped: 0/.test(read('affected-verify.log')) && /BUILD SUCCESS/.test(read('affected-verify.log')), 'Gate backend ausente.');
assert(/193 passed \(193\)/.test(stripAnsi(read('components-complete.log'))), 'Gate componentes ausente.');
assert(Object.values(json('frontend-results.json')).every(v => v === 0), 'Gate frontend falhou.');
const lint = json('lint.json');
assert(lint.length === 244 && lint.every(f => f.errorCount === 0 && f.warningCount === 0), 'Lint divergente.');
assert(/5 failed \| 1 passed \(6\)/.test(stripAnsi(read('components-independent-final.log'))), 'Probes vermelhos independentes ausentes.');
assert(/2 failed \(2\)/.test(stripAnsi(read('original-consumers-red.log'))), 'Contraprova consumidores ausente.');
const red = json('paid-purchase-red/result.json');
assert(red.failures === 1 && red.errors === 0 && red.skipped === 0 && red.current_source_unchanged, 'Contraprova FK inválida.');
for (const [file, pattern] of [
  ['browser/playwright.log', /6 passed/], ['browser-dom/playwright.log', /1 failed[\s\S]*5 passed/],
  ['browser-before-isolated/playwright.log', /1 passed/], ['payment-R03/playwright.log', /4 passed/]
]) assert(pattern.test(read(file)), `Resultado browser divergente: ${file}`);
assert(/ECONNRESET/.test(read('browser-dom/playwright.log')), 'Investigação de transporte perdeu evidência.');
for (const item of json('sanitization.json')) assert(hash(path.join(__dirname, item.file)) === item.published_sha256, `Proveniência publicada diverge: ${item.file}`);
const jwt = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
const excluded = new Set(['checkpoint.json']);
const evidence = walk(__dirname).filter(f => !excluded.has(rel(f))).sort().map(f => {
  if (/\.(log|xml|txt|json|md)$/.test(f)) assert(!jwt.test(fs.readFileSync(f, 'utf8')), `JWT: ${rel(f)}`);
  return { file: rel(f), sha256: hash(f) };
});
const checkpoint = {
  audited_head: auditedHead, date: '2026-10-01', timezone: 'America/Sao_Paulo',
  historical_checkpoint_sha256: hash(path.join(root,'tasks/evidencias/RV24-01/checkpoint.json')),
  readme_sha256: hash(path.join(root,'README.md')), product, evidence,
  gates: { backend: sums, components:193, lint_targets:244, lint_errors:0, lint_warnings:0, frontend_exits:json('frontend-results.json'), original_creation_browser:6, extra_dom_browser:{passed:5,failed:1}, isolated_before:1, payment_R03:4, independent_components:{passed:1,failed:5}, historical_consumers_failed:2, historical_fk_failed:1 },
  decision: { RV24_01:'em_revisao', RV24_02:'concluida', CF027:'pronta: fronteira backend de intenção/recibo, sem implementação' },
  limitations:['Gates se sobrepõem: não somar', 'H-RV24-01 ECONNRESET inconclusivo', 'RVR24-01/02 abertos; nenhum backend real foi observado retornando DTO inválido', 'CF-019 RVA-03 e CF-022 RJ-022-01/H24-01 preservados', 'CF-026 aguarda revisão independente; não é dependência CF-027', 'Verificação da cópia local só ocorre enquanto disponível; hashes publicados preservados']
};
const output = path.join(__dirname,'checkpoint.json');
if (process.argv.includes('--check')) assert(JSON.stringify(json('checkpoint.json')) === JSON.stringify(checkpoint), 'Checkpoint diverge; não sobrescrever.');
else { assert(!fs.existsSync(output), 'Checkpoint já existe: use --check.'); fs.writeFileSync(output,JSON.stringify(checkpoint,null,2)+'\n'); }
console.log(JSON.stringify({ evidence:evidence.length, product_files:product.length, backend:sums, sources_and_history_preserved:true, checkpoint_matches:true }));
