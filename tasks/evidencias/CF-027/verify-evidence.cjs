const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const backend = path.join(root, 'controle-financeiro-backend');
const base = '40e07ef';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const hash = file => sha(fs.readFileSync(file));
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8').replace(/^\uFEFF/, '');
const json = file => JSON.parse(read(file));
const git = (...args) => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const original = file => cp.execFileSync('git', ['show', `${base}:controle-financeiro-backend/${file}`], { cwd: root, encoding: 'utf8' }).replace(/\r\n/g, '\n');
const current = file => fs.readFileSync(path.join(backend, file), 'utf8').replace(/\r\n/g, '\n');
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(directory, e.name)) : [path.join(directory, e.name)]);
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const withoutPackage = text => text.replace(/^package [^;]+;/, 'package PRESERVED;');
git('merge-base', '--is-ancestor', base, 'HEAD');
assert(hash(path.join(root, 'README.md')) === '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca', 'README alheio foi alterado');
assert(!git('diff', '--cached', '--', 'README.md'), 'README alheio entrou no staging');
for (const scope of ['controle-financeiro-frontend', 'controle-financeiro-backend/src/main/resources',
  'tasks/evidencias/revalidacao-RV24-01-RV24-02', 'tasks/01-datas-integracao/RV24-01-criacao-resultado-desconhecido.md',
  'tasks/03-integridade/RV24-02-exclusao-usuario-vinculos.md', 'tasks/04-onboarding']) {
  assert(!git('diff', base, '--', scope), `Escopo preservado mudou: ${scope}`);
}
for (const [before, after] of [
  ['src/main/java/com/controlefinanceiro/api/domain/transaction/FinancialIntentReceipt.java', 'src/main/java/com/controlefinanceiro/api/domain/intent/internal/FinancialIntentReceipt.java'],
  ['src/main/java/com/controlefinanceiro/api/domain/transaction/FinancialIntentReceiptRepository.java', 'src/main/java/com/controlefinanceiro/api/domain/intent/internal/FinancialIntentReceiptRepository.java'],
  ['src/main/java/com/controlefinanceiro/api/domain/transaction/dto/FinancialIntentReceiptDTO.java', 'src/main/java/com/controlefinanceiro/api/domain/intent/FinancialIntentReceiptDTO.java']
]) assert(withoutPackage(original(before)) === withoutPackage(current(after)), `Mapeamento/DTO/query mudou: ${after}`);
const oldService = original('src/main/java/com/controlefinanceiro/api/service/FinancialIntentService.java');
const method = text => text.slice(text.indexOf('    public static String fingerprint('), text.lastIndexOf('\n}')).trim();
assert(method(oldService) === method(current('src/main/java/com/controlefinanceiro/api/service/intent/IntentFingerprint.java')), 'Canonicalização mudou');
const oldProtocol = oldService.slice(oldService.indexOf('    @Transactional'), oldService.indexOf('    public static String fingerprint(')).trim();
const adapter = current('src/main/java/com/controlefinanceiro/api/service/intent/internal/PostgresFinancialIntents.java');
const restoredProtocol = adapter.slice(adapter.indexOf('    @Transactional'), adapter.lastIndexOf('\n}'))
  .replaceAll('    @Override\n', '').replaceAll('UUID ownerId', 'User user').replaceAll('ownerId', 'user.getId()').trim();
assert(restoredProtocol === oldProtocol, 'Semântica/transação/lock/JSON/query do adaptador mudou');
for (const name of ['TransactionService', 'InvestmentService']) {
  const file = `src/main/java/com/controlefinanceiro/api/service/${name}.java`;
  const restored = current(file).replace('import com.controlefinanceiro.api.service.intent.FinancialIntents;\n', '')
    .replace('import com.controlefinanceiro.api.service.intent.IntentFingerprint;\n', '')
    .replaceAll('FinancialIntents', 'FinancialIntentService').replaceAll('IntentFingerprint.fingerprint', 'FinancialIntentService.fingerprint')
    .replaceAll('intents.replay(data.operationId(),user.getId(),', 'intents.replay(data.operationId(),user,')
    .replaceAll('intents.complete(data.operationId(),user.getId(),', 'intents.complete(data.operationId(),user,');
  assert(restored === original(file), `Regras/ordem do consumidor mudou: ${name}`);
}
const validation = json('validation/result.json');
const sums = validation.suites.reduce((result, suite) => {
  for (const key of Object.keys(result)) result[key] += suite[key];
  return result;
}, { tests: 0, failures: 0, errors: 0, skipped: 0 });
assert(validation.maven_exit === 0 && sums.tests > 100 && sums.failures === 0 && sums.errors === 0 && sums.skipped === 0, 'Gate consolidado inválido');
assert(validation.suites.find(s => s.name.endsWith('.Cf024ConcurrencyCacheIntegrationTest'))?.tests === 30, 'CF024 final30 ausente');
assert(/BUILD SUCCESS/.test(read('validation/backend-verify.log')), 'Verify/JAR ausente');
assert(/6 passed/.test(read('validation/browser/playwright.log')), 'Seis jornadas ausentes');
assert(/Tests run: 42, Failures: 0, Errors: 0, Skipped: 0/.test(read('directed-after-runtime-restore.log')), 'Gate dirigido ausente');
assert(/Tests run: 1, Failures: 1, Errors: 0, Skipped: 0/.test(read('architecture-before-causal.log')), 'Vermelho causal ausente');
const mutations = json('mutations/result.json');
assert(mutations.shared_sources_unchanged && mutations.copy_sources_restored && mutations.suites.reduce((n, s) => n + s.failures, 0) === 3, 'Contraprovas inválidas');
const copy = validation.copy;
const product = walk(path.join(backend, 'src/main')).concat(path.join(backend, 'pom.xml')).sort().map(file => {
  const local = path.relative(backend, file);
  assert(hash(file) === hash(path.join(copy, local)), `Produto difere da cópia testada: ${local}`);
  return { file: relative(file), sha256: hash(file) };
});
const copiedHarness = new Set(['src/test/java/com/controlefinanceiro/api/Rv24CreationBrowserIntegrationTest.java',
  'src/test/java/com/controlefinanceiro/api/service/Rv24DeletionIntegrationTest.java']);
const testSources = walk(path.join(backend, 'src/test')).sort().map(file => {
  const local = path.relative(backend, file).replaceAll('\\', '/');
  if (!copiedHarness.has(local)) assert(hash(file) === hash(path.join(copy, local)), `Teste difere da cópia testada: ${local}`);
  return { file: relative(file), sha256: hash(file), copied_harness_path_only: copiedHarness.has(local) };
});
for (const entry of json('sanitization.json')) assert(hash(path.join(__dirname, entry.file)) === entry.published_sha256, `Sanitização divergiu: ${entry.file}`);
const evidence = walk(__dirname).filter(file => !file.endsWith('checkpoint.json')).sort().map(file => ({ file: path.relative(__dirname, file).replaceAll('\\', '/'), sha256: hash(file) }));
const checkpoint = { base, implementation_commit: git('log', '-1', '--format=%H', '--', 'controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/intent'),
  date: '2026-10-01', timezone: 'America/Sao_Paulo', readme_sha256: hash(path.join(root, 'README.md')), product, test_sources: testSources, evidence,
  gates: { consolidated: sums, directed_overlapping: 42, browser: 6, mutations_failed_by_assertion: 3 },
  state: { CF027: 'em_revisao', RV24_01: 'em_revisao', RV24_02: 'concluida', CF028: 'não iniciada' },
  limitations: ['RVR24-01/02 e H-RV24-01 ECONNRESET inconclusivo preservados', 'Sem produção/push/deploy/banco/email real',
    'Clean acidental de target: runtime e fontes históricos reconstruídos; outputs originais não recuperados', 'Gates dirigidos/consolidados se sobrepõem; não somar', 'Revisão independente da CF027 pendente'] };
const output = path.join(__dirname, 'checkpoint.json');
if (process.argv.includes('--check')) assert(JSON.stringify(json('checkpoint.json')) === JSON.stringify(checkpoint), 'Checkpoint divergiu');
else { assert(!fs.existsSync(output), 'Checkpoint já existe'); fs.writeFileSync(output, JSON.stringify(checkpoint, null, 2) + '\n'); }
console.log(JSON.stringify({ product_files: product.length, evidence_files: evidence.length, gates: checkpoint.gates, preserved_scopes_verified: true }));
