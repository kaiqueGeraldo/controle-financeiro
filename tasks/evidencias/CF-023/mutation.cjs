// Run from repository root. Only the isolated copy under backend/target is mutated.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const backend = path.resolve('controle-financeiro-backend');
const copy = path.join(backend, 'target/cf023-ownership-mutant');
const relative = 'src/main/java/com/controlefinanceiro/api/service/OwnedResourceOrder.java';
const evidence = path.resolve('tasks/evidencias/CF-023');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
if (process.argv[2] === 'prepare') {
  if (fs.existsSync(copy)) throw new Error('Mutation copy already exists; inspect it before reuse.');
  fs.mkdirSync(copy);
  for (const item of ['src', '.mvn', 'mvnw.cmd', 'pom.xml']) fs.cpSync(path.join(backend, item), path.join(copy, item), { recursive: true });
  const original = fs.readFileSync(path.join(backend, relative), 'utf8');
  const needle = '+ " = :owner and r.id in :ids"';
  if (!original.includes(needle)) throw new Error('Mutation anchor missing');
  const mutated = original.replace(needle, '+ " = :owner or 1=1) and r.id in :ids"').replace('+ " r where " + ownerPath', '+ " r where (" + ownerPath');
  fs.writeFileSync(path.join(copy, relative), mutated);
  fs.writeFileSync(path.join(evidence, 'mutation.diff'), '--- original/OwnedResourceOrder.java\n+++ mutant/OwnedResourceOrder.java\n@@ owner predicate @@\n-where r.<owner>.id = :owner and r.id in :ids\n+where (r.<owner>.id = :owner or 1=1) and r.id in :ids\n');
  fs.writeFileSync(path.join(evidence, 'mutation-state.json'), JSON.stringify({ copy, file: relative, originalSha256: hash(original), mutantSha256: hash(mutated), restored: false }, null, 2));
} else if (process.argv[2] === 'restore') {
  const state = JSON.parse(fs.readFileSync(path.join(evidence, 'mutation-state.json')));
  const original = fs.readFileSync(path.join(backend, relative));
  if (hash(original) !== state.originalSha256) throw new Error('Shared source changed during mutation');
  fs.writeFileSync(path.join(copy, relative), original);
  state.restored = hash(fs.readFileSync(path.join(copy, relative))) === state.originalSha256;
  state.sharedSourceUnchanged = true;
  fs.writeFileSync(path.join(evidence, 'mutation-state.json'), JSON.stringify(state, null, 2));
} else throw new Error('Expected prepare or restore');
