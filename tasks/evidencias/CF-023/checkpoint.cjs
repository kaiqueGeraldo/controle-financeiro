const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve('tasks/evidencias/CF-023');
const destination = path.join(root, 'checkpoint.json');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const lf = bytes => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
const git = (...args) => execFileSync('git', args, { maxBuffer: 20 * 1024 * 1024 });

if (process.argv[2] === 'record') {
  assert(!fs.existsSync(destination), 'Do not overwrite a recorded checkpoint');
  const codeCommit = git('rev-parse', 'HEAD').toString().trim();
  const sources = fs.readFileSync(path.join(root, 'source-sha256.txt'), 'utf8').trim().split(/\r?\n/).map(line => {
    const [, expected, rawFile] = line.match(/^([a-f0-9]{64})\s+(.+)$/);
    const file = rawFile.replaceAll('\\', '/');
    const bytes = fs.readFileSync(file);
    assert.equal(sha(bytes), expected, `Tested working bytes: ${file}`);
    if (file.endsWith('.jar')) return { file, testedSha256: expected, generatedArtifact: true };
    const committed = git('show', `${codeCommit}:${file}`);
    assert.equal(sha(lf(bytes)), sha(committed), `Tested source differs from commit: ${file}`);
    return { file, testedSha256: expected, committedLfSha256: sha(committed) };
  });
  const logs = JSON.parse(fs.readFileSync(path.join(root, 'evidence-sha256.json'), 'utf8')).map(record => {
    const bytes = fs.readFileSync(path.join(root, record.file));
    assert.equal(sha(bytes), record.publishedSha256, `Published bytes: ${record.file}`);
    return { file: record.file, publishedLfSha256: sha(lf(bytes)) };
  });
  fs.writeFileSync(destination, JSON.stringify({ codeCommit, sources, logs }, null, 2) + '\n');
  console.log(`Checkpoint recorded: ${sources.length} tested sources/artifacts, ${logs.length} logs`);
} else {
  const checkpoint = JSON.parse(fs.readFileSync(destination, 'utf8'));
  for (const source of checkpoint.sources.filter(source => !source.generatedArtifact)) {
    assert.equal(sha(lf(fs.readFileSync(source.file))), source.committedLfSha256, source.file);
    assert.equal(sha(git('show', `${checkpoint.codeCommit}:${source.file}`)), source.committedLfSha256, source.file);
    assert.equal(sha(git('show', `HEAD:${source.file}`)), source.committedLfSha256, source.file);
  }
  for (const log of checkpoint.logs) assert.equal(sha(lf(fs.readFileSync(path.join(root, log.file)))), log.publishedLfSha256, log.file);
  console.log('Checkpoint verified: source commit, HEAD, working tree and published logs agree modulo CRLF/LF');
}
