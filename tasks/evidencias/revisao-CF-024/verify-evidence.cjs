const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const historical = path.join(root, 'tasks/evidencias/CF-024');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const lf = bytes => bytes.toString('utf8').replace(/\r\n/g, '\n');
const old = JSON.parse(fs.readFileSync(path.join(historical, 'checkpoint.json'), 'utf8'));
const sourceMismatches = old.sources.filter(entry => sha(lf(fs.readFileSync(path.join(root, entry.file)))) !== entry.normalizedLfSha256);
if (sourceMismatches.length) throw Error('Fontes divergem do checkpoint: ' + sourceMismatches.map(x => x.file));
const historicalLogs = JSON.parse(fs.readFileSync(path.join(historical, 'evidence-sha256.json'), 'utf8'));
for (const entry of historicalLogs) {
  if (sha(fs.readFileSync(path.join(historical, entry.file))) !== entry.publishedSha256) throw Error('Evidência histórica alterada: ' + entry.file);
}
for (const ancestor of ['9fa4fae', 'dbf828e', 'f225657']) git('merge-base', '--is-ancestor', ancestor, 'HEAD');
if (git('diff', 'dbf828e', 'HEAD', '--', 'controle-financeiro-backend/src', 'controle-financeiro-backend/pom.xml', 'controle-financeiro-frontend/src')) throw Error('Produto posterior diferente.');
if (git('diff', '--', 'controle-financeiro-backend/src', 'controle-financeiro-backend/pom.xml', 'controle-financeiro-frontend/src')) throw Error('Produto local alterado.');
const readmeHash = sha(fs.readFileSync(path.join(root, 'README.md')));
if (readmeHash !== old.readmeSha256) throw Error('README alheio alterado.');
const mutation = JSON.parse(fs.readFileSync(path.join(__dirname, 'mutacoes/mutation-results.json'), 'utf8'));
if (mutation.results.length !== 5 || !mutation.source_tree_matches_shared_checkout || mutation.clean_validation.tests !== 30 || mutation.clean_validation.exit_code !== 0) throw Error('Mutações incompletas.');
for (const result of mutation.results) {
  if (!result.failures || result.errors || result.skipped || result.exit_code === 0) throw Error('Mutação não causal: ' + result.name);
  for (const file of result.restored) if (file.source_sha256 !== file.restored_sha256) throw Error('Restauração incompleta.');
}
const final = JSON.parse(fs.readFileSync(path.join(__dirname, 'final/results.json'), 'utf8').replace(/^\uFEFF/, ''));
if (final.exit_code !== 0 || !final.source_tree_matches || final.results.some(s => s.failures || s.errors || s.skipped)) throw Error('Probes finais não aprovados.');
const gate = fs.readFileSync(path.join(__dirname, 'pertinentes-verify-final.log'), 'utf8');
if (!gate.includes('Tests run: 99, Failures: 0, Errors: 0, Skipped: 0') || !gate.includes('BUILD SUCCESS')) throw Error('Gate pertinente não aprovado.');
const report = {
  reviewStarted: '2026-09-30', timezone: 'America/Sao_Paulo', inspectedHead: git('rev-parse', 'HEAD'),
  productCommit: old.productCommit, ancestors: ['9fa4fae', 'dbf828e', 'f225657'],
  sourceCount: old.sources.length, normalizedSourceHashesMatchHistoricalCheckpoint: true,
  historicalPublishedLogCount: historicalLogs.length, historicalPublishedLogHashesPreserved: true,
  rootReadmeSha256: readmeHash, productAndFrontendSourcesUnchanged: true,
  rebuiltJarSha256: sha(fs.readFileSync(path.join(root, 'controle-financeiro-backend/target/api-0.0.1.jar'))),
  historicalJar: 'Não comparado: target foi reempacotado pelo gate independente de 99 testes; não prova o JAR histórico.',
  gates: { pertinentCheckoutVerify: 99, finalIsolated: final.results.map(({suite,tests,failures,errors,skipped}) => ({suite,tests,failures,errors,skipped})),
    components: 18, mutations: mutation.results.map(({name,tests,failures,errors,skipped})=>({name,tests,failures,errors,skipped})), restoredCf024: 30 },
  unresolvedExecutions: ['afetados-verify.log: 119 testes, 1 timeout de scheduler; posterior isolado passou, causa não encerrada',
    'consumidor-desconhecido-red.log: 1 falha causal', 'exclusao-contrato-red.log: 1 falha causal'],
  note: 'Contagens se sobrepõem. Revisão não reproduziu o gate histórico 388 nem o frontend completo 157.'
};
fs.writeFileSync(path.join(__dirname, 'checkpoint.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Verificados ${old.sources.length} fontes, ${historicalLogs.length} logs históricos, cinco mutações, README e gates independentes.`);
