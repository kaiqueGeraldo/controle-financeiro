import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../../../..");
const frontend = join(root, "controle-financeiro-frontend");
const base = "5f26a1d56f94a21d75e67c375ea9095aaec3a79f";
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const git = (args) => execFileSync("git", args, { cwd: root });
const readJson = (path) => JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
const before = readJson(join(evidence, "lint-antes.json"));
const after = readJson(join(evidence, "lint-final-ampliado.json"));
const inspected = new Set(after.map(item => item.filePath));
if (before.some(item => !inspected.has(item.filePath))) throw new Error("Lint perdeu alvos");
if (after.some(item => item.errorCount || item.warningCount)) throw new Error("Lint final não está verde");

const preserved = ["controle-financeiro-frontend/eslint.config.mjs", "controle-financeiro-frontend/package.json",
  "controle-financeiro-frontend/package-lock.json", "controle-financeiro-frontend/tests/component/vitest.config.mts"];
for (const path of preserved) {
  const baseline = git(["show", `${base}:${path}`]).toString("utf8").replace(/\r\n/g, "\n");
  const current = readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");
  if (baseline !== current) throw new Error(`Configuração/dependência alterada: ${path}`);
}
const readmeHash = sha256(readFileSync(join(root, "README.md")));
if (readmeHash !== "6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca") throw new Error("README alheio alterado");

const require = createRequire(join(frontend, "package.json"));
const ts = require("typescript");
function assertions(text) {
  const file = ts.createSourceFile("test.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = [];
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression.getText(file);
      if (expression === "expect" || expression.startsWith("expect(")) result.push(node.getText(file));
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return result;
}
const existingTest = "controle-financeiro-frontend/tests/component/async-state.test.tsx";
const originalAssertions = assertions(git(["show", `${base}:${existingTest}`]).toString("utf8"));
const currentAssertions = assertions(readFileSync(join(root, existingTest), "utf8").replace(/\r\n/g, "\n"));
if (JSON.stringify(originalAssertions) !== JSON.stringify(currentAssertions)) throw new Error("Assertions históricas alteradas");
const newTest = readFileSync(join(frontend, "tests/component/cf026-contracts.test.tsx"), "utf8");
if (/\b(?:test|it|describe)\.(?:skip|only)\b/.test(newTest)) throw new Error("Skip/only adicionado");

const documents = ["tasks/03-integridade/CF-026-lint-tipagem-frontend.md", "docs/sdd/lint-baseline.md",
  "tasks/evidencias/CF-026/README.md", "tasks/evidencias/CF-026/execucao/README.md"];
let checkedLinks = 0;
for (const path of documents) {
  const absolute = join(root, path);
  for (const match of readFileSync(absolute, "utf8").matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(match[1])) continue;
    const target = match[1].split("#")[0];
    if (!existsSync(resolve(dirname(absolute), target))) throw new Error(`Link inexistente: ${path}: ${target}`);
    checkedLinks += 1;
  }
}
const manifest = {
  base, date: "2026-10-01", timezone: "America/Sao_Paulo", readmeHash,
  before: { files: before.length, errors: before.reduce((sum, item) => sum + item.errorCount, 0), warnings: before.reduce((sum, item) => sum + item.warningCount, 0) },
  after: { files: after.length, errors: 0, warnings: 0, excluded: [] },
  preserved, existingAssertionsPreserved: currentAssertions.length, addedSkipOrOnly: false, checkedLinks,
  files: after.map(item => ({ path: relative(root, item.filePath).replaceAll("\\", "/"), sha256: sha256(readFileSync(item.filePath)) })),
};
writeFileSync(join(evidence, "manifesto-validado.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ files: after.length, historicalAssertions: currentAssertions.length, checkedLinks, readmePreserved: true }));
