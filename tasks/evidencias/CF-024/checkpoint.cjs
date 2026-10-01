const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const normalized = data => Buffer.from(data.toString('utf8').replace(/\r\n/g, '\n'));
const productCommit = process.argv[2];
if (!productCommit) throw new Error('Informe o commit local de produto testado.');
const commit = git('rev-parse', productCommit).trim();
const files = git('ls-files', 'controle-financeiro-backend/src', 'controle-financeiro-backend/pom.xml').trim().split('\n').filter(Boolean).sort();
const sources = files.map(file => {
  const working = fs.readFileSync(path.join(root, file));
  const committed = execFileSync('git', ['show', `${commit}:${file}`], { cwd: root });
  if (sha(normalized(working)) !== sha(normalized(committed))) throw new Error(`Fonte difere do commit: ${file}`);
  return { file, rawSha256: sha(working), normalizedLfSha256: sha(normalized(working)) };
});
const readme = sha(fs.readFileSync(path.join(root, 'README.md')));
if (readme !== '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca') throw new Error('README alheio alterado.');
const mutation = JSON.parse(fs.readFileSync(path.join(__dirname, 'mutation-results.json')));
if (mutation.results.length !== 5 || !mutation.source_tree_matches_shared_checkout || mutation.clean_validation.tests !== 30
  || mutation.clean_validation.failures || mutation.clean_validation.errors || mutation.clean_validation.skipped) throw new Error('Mutações/restauração incompletas.');
for (const result of mutation.results) {
  if (result.exit_code === 0 || !result.failures || result.errors || result.skipped) throw new Error('Mutação sobrevivente ou não causal.');
  for (const file of result.restored) if (file.source_sha256 !== file.restored_sha256) throw new Error('Restauração divergente.');
}
const baselineLog = fs.readFileSync(path.join(__dirname, 'logs/backend-verify-final.log'), 'utf8');
if (!baselineLog.includes('Tests run: 388, Failures: 0, Errors: 0, Skipped: 0') || !baselineLog.includes('BUILD SUCCESS')) throw new Error('Gate backend incompleto.');
const jar = 'controle-financeiro-backend/target/api-0.0.1.jar';
fs.writeFileSync(path.join(__dirname, 'checkpoint.json'), JSON.stringify({
  date: '2026-09-30', timezone: 'America/Sao_Paulo', base: '9fa4fae', productCommit: commit,
  readmeSha256: readme, sources, jar: { file: jar, sha256: sha(fs.readFileSync(path.join(root, jar))) },
  gates: { backendVerify: 388, finalCf024Class: 30, components: 157, typecheck: true,
    mutationsDetected: 5, causalFailures: mutation.results.reduce((sum, result) => sum + result.failures, 0), independentReview: false },
  note: 'Gates se sobrepõem; novo caso deadlock foi executado na classe final30 após compilação do gate388.'
}, null, 2) + '\n');
console.log(`Checkpoint aprovado: ${sources.length} fontes no commit, README preservado e cinco mutações restauradas.`);
