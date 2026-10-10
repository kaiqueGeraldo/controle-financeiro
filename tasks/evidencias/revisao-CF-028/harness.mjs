import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url));
const delivered = resolve(here, '../CF-028');
const fixture = JSON.parse(readFileSync(resolve(delivered, 'examples.json'), 'utf8'));
// Execute original generator in memory, intercept only its filesystem sink.
const generator = readFileSync(resolve(delivered, 'build-examples.mjs'), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace("new URL('./examples.json',import.meta.url)", "'memory.json'");
let generated;
vm.runInNewContext(generator, {createHash, console:{log(){}}, writeFileSync:(_, bytes)=>{generated=bytes;}});
assert.equal(generated, readFileSync(resolve(delivered, 'examples.json'),'utf8'));
const runs=[];
for (const timezone of ['America/Sao_Paulo','UTC','Pacific/Kiritimati']) {
  const run=spawnSync(process.execPath,[resolve(delivered,'verify.mjs')],{encoding:'utf8',env:{...process.env,TZ:timezone}});
  assert.equal(run.status,0,run.stderr);
  runs.push(JSON.parse(run.stdout));
}
// Isolate original reconcile and record the actual reason each corruption fails.
const source=readFileSync(resolve(delivered,'verify.mjs'),'utf8');
const body=source.slice(source.indexOf('function units'),source.indexOf("check('E01:"));
const mutations=[
  ['netWorth', f=>f.expected.netWorth='2001.00', /netWorth/],
  ['currentInstallment', f=>f.draft.payload.sections.cards.items[0].opening.futureInstallments[0].competence.month=10, /corrente duplicada/],
  ['capacity', f=>f.draft.payload.sections.allocations.items[0].amount='1000.01', /capacidade excedida/],
  ['Number', f=>f.draft.payload.sections.accounts.items[0].balance.value=100, /decimal deve ser string/],
  ['invalidDate', f=>f.draft.payload.sections.goals.items[0].deadline='2027-02-29', /assert/]
];
const causes=[];
for(const [name, mutate, expected] of mutations){
  const f=structuredClone(fixture);mutate(f);
  let caught;
  try {vm.runInNewContext(body+'\nreconcile(f)',{assert,f});} catch(error) {caught=error;}
  assert(caught);assert.match(caught.message,expected);
  causes.push({name,message:caught.message});
}
// Prove a coverage limitation, not a new contract violation: response capacity is unchecked.
const f=structuredClone(fixture);
f.completeResponse.data.summary.bySource[0].newAllocationCapacity.value='999.00';
vm.runInNewContext(body+'\nreconcile(f)',{assert,f});
console.log(JSON.stringify({generatorBytesIdentical:true,runs,causes,uncheckedResponseField:'newAllocationCapacity: 999.00 survives reconcile; expected 100.00'},null,2));
