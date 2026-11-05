import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const file='/work/s/controle-financeiro-frontend/tests/component/cards-planning-audit.test.tsx',before=fs.readFileSync(file),hash=b=>createHash('sha256').update(b).digest('hex');
const block=[
'describe("diagnostic-scaling", () => {',
'  beforeEach(() => { vi.restoreAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z")); });',
'  afterEach(() => vi.useRealTimers());',
'  test.each([20, 40, 80])("diagnostic-scaling %i", (size) => {',
'    beginTrace("diagnostic-scaling / lista longa mantém n=" + size);',
'    markTrace("prepared", { fakeTimers: vi.isFakeTimers(), fixtureSize: size });',
'    const rows = step("fixture-" + size, () => Array.from({ length: size }, (_, index) => ({ id: "diagnostic-" + index, description: "Compra sintética " + index, amount: 10, date: "2026-09-08" })));',
'    step("render-invoice", () => renderInvoice("CLOSED", rows));',
'    const action = step("query-payment-role", () => screen.getByRole("button", { name: "Pagar Fatura" }));',
'    step("assert-layout-and-last", () => { expect(action.parentElement?.className).toContain("shrink-0"); expect(screen.getByText("Compra sintética " + (size - 1))).toBeDefined(); });',
'    markTrace("body-complete", { nodes: document.body.querySelectorAll("*").length });',
'  });',
'});'
].join('\n');
const runner='/work/diag/experiments.mjs',runnerBefore=fs.readFileSync(runner,'utf8');
const runnerAfter=runnerBefore.replace("]:mode==='D'?[{id:'D-group-workers2',files:group,workers:2}]:[];","]:mode==='D'?[{id:'D-group-workers2',files:group,workers:2}]:mode==='E'?[{id:'E-scaling',files:[group[0]],filter:'diagnostic-scaling'}]:[];");
assert.notEqual(runnerBefore,runnerAfter);
fs.writeFileSync('/evidence/scaling-overlay.json',JSON.stringify({purpose:'One bounded sizing probe; original80-case remains unchanged and is deselected explicitly',originalInstrumentedFileSha256:hash(before),appendedBlockSha256:hash(block),sizes:[20,40,80],watchdog:5000},null,2)+'\n',{flag:'wx'});
try{
 fs.writeFileSync(file,Buffer.concat([before,Buffer.from('\n'+block+'\n')]));
 fs.writeFileSync(runner,runnerAfter);
 const r=spawnSync(process.execPath,[runner,'E'],{stdio:'inherit'});
 assert.equal(r.status,0,'Sizing process failed');
}finally{
 fs.writeFileSync(file,before);fs.writeFileSync(runner,runnerBefore);
 assert.equal(hash(fs.readFileSync(file)),hash(before));
 fs.writeFileSync('/evidence/scaling-restored.json',JSON.stringify({at:new Date().toISOString(),file,sha256:hash(before),restored:true,runnerRestored:true},null,2)+'\n',{flag:'wx'});
}
