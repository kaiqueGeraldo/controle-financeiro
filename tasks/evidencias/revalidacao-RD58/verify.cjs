const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const git = (...args) => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex').toUpperCase();
const base = '18cd6df231b01f27abbab61f95c6b1f377adc468';
const candidate = '0c068d9bd750e648ba839742991108deace31f9f';
git('merge-base', '--is-ancestor', base, candidate);
git('merge-base', '--is-ancestor', candidate, 'HEAD');
const probes = [
 ['controle-financeiro-frontend/tests/component/directed-temporal-review.test.tsx', 'B9E85B026B60140F900A72E7AE22E0BB8E73433FA64BD5DA7BE00DF36D03371A'],
 ['controle-financeiro-backend/src/test/java/com/controlefinanceiro/api/DirectedGoalHistoryTemporalTest.java', 'F21E74ABFA5B3D6824543498D0E49140EA4603536A29A77FE2062D0C31C136D6']
];
for (const [file, expected] of probes) {
 assert.equal(hash(file), expected);
 assert.equal(git('diff', base, '--', file), '');
}
assert.equal(hash('README.md'), '6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA');
assert.equal(git('diff', candidate, '--', 'controle-financeiro-frontend/src', 'controle-financeiro-backend/src/main'), '');
assert(!git('diff', '--cached', '--name-only').split('\n').includes('README.md'));
const migrations = git('diff', '--name-status', base, candidate, '--', 'controle-financeiro-backend/src/main/resources/db/migration');
assert.equal(migrations, 'A\tcontrole-financeiro-backend/src/main/resources/db/migration/V14__goal_history_recorded_instant.sql');
assert.match(read('tasks/evidencias/revisao-dirigida-CF-005-CF-008/probes-final.log'), /2 failed \| 1 passed/);
assert.match(read('tasks/evidencias/revisao-dirigida-CF-005-CF-008/backend-probe-final.log'), /Tests run: 1, Failures: 1, Errors: 0, Skipped: 0/);
assert.match(read('tasks/evidencias/revisao-dirigida-CF-005-CF-008/backend-probe-final.log'), /but was: "2026-09-08T00:10:00"/);
for (const file of ['CF-005-datas-frontend.md', 'CF-006-datas-backend.md']) {
 const name = 'tasks/01-datas-integracao/' + file;
 const section = text => text.split('## Aceite e testes adversariais')[1].split('\n## ')[0].replaceAll('\r', '').trim();
 assert.equal(section(read(name)), section(git('show', `${base}:${name}`)));
}
const result = { date:'2026-10-09', base, candidate, branch:git('branch','--show-current'), head:git('rev-parse','HEAD'), status:git('status','--short'), staged:git('diff','--cached','--name-only'), migrations, readme:hash('README.md'), probes:probes.map(([file])=>({file,sha256:hash(file)})), productUnchanged:true, originalAssertionsUnchanged:true, historicalRedVerified:true };
if (process.argv.includes('--final')) {
 for (const name of ['frontend','frontend-bridge-final','backend','backend-supplement','lint','lint-supplement','typecheck','typecheck-supplement','build']) {
  assert.equal(fs.readFileSync(path.join(__dirname,name+'.exit'),'utf8').replace(/^\uFEFF/,'').trim(),'0',name);
 }
 const suites = JSON.parse(fs.readFileSync(path.join(__dirname,'backend-results.json'),'utf8').replace(/^\uFEFF/,''));
 assert.equal(suites.reduce((n,s)=>n+s.tests,0),112);
 assert.equal(suites.reduce((n,s)=>n+s.failures+s.errors+s.skipped,0),0);
 for (const name of ['README.md','EXECUCOES.md']) {
  const text=fs.readFileSync(path.join(__dirname,name),'utf8');
  for (const match of text.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
   if (!/^https?:/.test(match[1])) assert(fs.existsSync(path.resolve(__dirname,match[1])),match[1]);
  }
 }
 result.validation={frontendUnique:78,backendUnique:112,failures:0,errors:0,skipped:0,staticsAndBuilds:0};
}
fs.writeFileSync(path.join(__dirname, process.argv.includes('--final') ? 'verification.json' : 'baseline.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
