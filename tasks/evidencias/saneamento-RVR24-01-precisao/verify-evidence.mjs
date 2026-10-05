import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = new URL("../../../", import.meta.url);
const local = new URL("./", import.meta.url);
const read = file => readFileSync(new URL(file, local), "utf8");
const json = file => JSON.parse(read(file));
const sha = file => createHash("sha256").update(readFileSync(file)).digest("hex").toUpperCase();
for (const row of json("hashes.json")) assert.equal(sha(new URL(row.file, root)), row.sha256);
for (const row of json("sanitization.json")) assert.equal(sha(new URL(row.file, local)).toLowerCase(), row.published_sha256);
assert.match(read("probes-before.log"), /6 failed \| 1 passed/);
assert.match(read("probes-after-original.log"), /1 failed \| 6 passed/);
assert.match(read("components-final.log"), /178 passed/);
assert.match(read("http-regressions.log"), /46 passed/);
assert.match(read("bff-decimal.log"), /8 passed/);
assert.deepEqual(json("static-final.json"), { bff: 0, lint: 0, typecheck: 0 });
assert.equal(json("build-result.json").build, 0);
assert.equal(json("lint-final.json").reduce((n, file) => n + file.errorCount + file.warningCount, 0), 0);
assert.deepEqual(json("backend-source-comparison.json").mismatches, []);
for (const [run, name, count] of [
  ["after-original", "Rv24CreationBrowserIntegrationTest", 1],
  ["after-recovery", "Rv24CreationBrowserIntegrationTest", 1],
  ["after-recovery", "Cf024ConcurrencyCacheIntegrationTest", 30],
  ["buy-regression", "Rv24CreationBrowserIntegrationTest", 1],
  ["buy-regression", "FinancialIntentsIntegrationTest", 5],
]) {
  const suite = json(`${run}/result.json`).suites.find(suite => suite.name.endsWith(`.${name}`));
  assert.equal(suite.tests, count);
  assert.equal(suite.failures + suite.errors + suite.skipped, 0);
}
const recovery = json("after-recovery/browser/precision-state.json");
assert.equal(recovery.uiPosts + recovery.explicitReplayPosts, 2);
assert.equal(recovery.recovered.accounts[0].balance, 1001);
assert.equal(recovery.recovered.operations.length, 1);
assert.equal(recovery.recovered.receipts.length, 1);
assert.deepEqual(recovery.pendingAfterRecovery, []);
for (const checkpoint of json("buy-regression/browser/sql-checkpoints.json")) {
  assert.equal(checkpoint.state.accounts[0].balance, 800);
  assert.equal(checkpoint.state.operations.length, 1);
  assert.equal(checkpoint.state.receipts.length, 1);
}
for (const task of ["CF-009-estado-assincrono.md", "RV24-01-criacao-resultado-desconhecido.md"]) {
  assert.match(readFileSync(new URL(`tasks/01-datas-integracao/${task}`, root), "utf8"), /- Estado: em_revisao/);
}
const staged = spawnSync("git", ["diff", "--cached", "--name-only"], { cwd: root, encoding: "utf8" });
assert.equal(staged.status, 0);
assert.ok(!staged.stdout.split(/\r?\n/).includes("README.md"));
console.log("Verified: original hashes, 226 distinct frontend cases, 35 backend regressions, 3 browser journeys, static gates, README and review states. Original destructive-parsing probe remains explicitly red.");
