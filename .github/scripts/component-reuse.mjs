import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { hash } from "./source.mjs";
import { requireComponentCoverage } from "./components.mjs";

// E2E configs/specs are outside both Vitest include globs. The credential
// component explicitly preloads server-clock.cjs, so it is a component input.
export function componentInputs(source) {
  return source.files.filter(f =>
    f.path.startsWith("controle-financeiro-frontend/") &&
    (!f.path.startsWith("controle-financeiro-frontend/tests/e2e/") ||
      f.path === "controle-financeiro-frontend/tests/e2e/support/server-clock.cjs")
  );
}
export function reuseComponents(directory, source) {
  const receipt = JSON.parse(fs.readFileSync(path.join(directory, "component-reuse.json")));
  const original = JSON.parse(fs.readFileSync(receipt.sourceManifest));
  assert.equal(hash(JSON.stringify(original.files)), original.digest, "Invalid original input manifest");
  const controller = JSON.parse(fs.readFileSync(receipt.controller));
  assert.equal(controller.steps.find(s => s.name === "components")?.exit, 0);
  assert.equal(controller.source.digest, original.digest);
  assert.equal(controller.runId, receipt.runId);
  assert.equal(controller.platform, receipt.platform);
  assert.equal(controller.node, receipt.node);
  assert.deepEqual(componentInputs(source), componentInputs(original), "Component inputs changed");
  for (const file of componentInputs(original))
    assert.equal(hash(fs.readFileSync(path.join(receipt.root, file.path))), file.sha256, file.path);
  const report = JSON.parse(fs.readFileSync(receipt.report));
  const audit = JSON.parse(fs.readFileSync(receipt.audit));
  assert.equal(receipt.node, process.version);
  assert.equal(receipt.platform, process.platform);
  assert.equal(receipt.exit, 0);
  const context = { candidate: original.commit, digest: original.digest, runId: receipt.runId };
  const coverage = requireComponentCoverage(report, audit, context, path.join(receipt.root, "controle-financeiro-frontend"));
  assert.equal(coverage.tests, 626);
  assert.equal(coverage.files, 71);
  return {
    counts: { tests: 626, failures: 0, errors: 0, skipped: 0 }, coverage,
    proof: { status: "reused by exact component input closure; not reexecuted", context,
      currentSource: source.digest, closureSha256: hash(JSON.stringify(componentInputs(source))),
      report: { path: receipt.report, sha256: hash(fs.readFileSync(receipt.report)) },
      audit: { path: receipt.audit, sha256: hash(fs.readFileSync(receipt.audit)) } },
  };
}
