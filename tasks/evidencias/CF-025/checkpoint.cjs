const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const files = git('ls-files', '--cached', '--others', '--exclude-standard',
  'controle-financeiro-backend/src/main', 'controle-financeiro-backend/src/test',
  'controle-financeiro-backend/pom.xml').split('\n').filter(Boolean).sort();
const sources = files.map(file => {
  const bytes = fs.readFileSync(path.join(root, file));
  return { file, bytesSha256: sha(bytes), lfSha256: sha(bytes.toString('utf8').replace(/\r\n/g, '\n')) };
});
const checkpoint = {
  head: git('rev-parse', 'HEAD'),
  status: git('status', '--short'),
  rootReadmeSha256: sha(fs.readFileSync(path.join(root, 'README.md'))),
  sources,
};
if (process.argv[2] === '--check-commit') {
  for (const source of sources) {
    const committed = execFileSync('git', ['show', `HEAD:${source.file}`], { cwd: root, encoding: 'utf8' });
    if (sha(committed.replace(/\r\n/g, '\n')) !== source.lfSha256) throw new Error(`Commit differs: ${source.file}`);
  }
  console.log(`${sources.length} backend sources/POM match HEAD with LF normalization.`);
} else {
  fs.writeFileSync(path.join(__dirname, 'checkpoint.json'), JSON.stringify(checkpoint, null, 2) + '\n');
  console.log(`Snapshot: ${sources.length} backend sources/POM; ${checkpoint.head}`);
}
