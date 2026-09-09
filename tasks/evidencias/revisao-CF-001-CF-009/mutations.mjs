// Run from the repository root: node tasks/evidencias/revisao-CF-001-CF-009/mutations.mjs
// Uses an isolated source copy and restores every mutated file byte-for-byte.
import { cp, mkdir, mkdtemp, readFile, writeFile, symlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const source = path.join(root, "controle-financeiro-frontend");
const isolated = await mkdtemp(path.join(tmpdir(), "cf-review-mutations-"));
const output = path.join(source, "tests/artifacts/review-mutations");
await mkdir(output, { recursive: true });
for (const item of ["src", "scripts", "tests", "package.json", "tsconfig.json"]) {
  await cp(path.join(source, item), path.join(isolated, item), {
    recursive: true,
    filter: (file) => !file.startsWith(path.join(source, "tests/artifacts")),
  });
}
await symlink(path.join(source, "node_modules"), path.join(isolated, "node_modules"), "junction");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const results = [];
const scenarios = [
  { id: "M01-utc-default", file: "src/utils/date.ts", from: '  return [\n    String(date.getFullYear())',
    to: '  return date.toISOString().slice(0, 10);\n  return [\n    String(date.getFullYear())', test: "temporal-forms.test.tsx" },
  { id: "M02-civil-local-zone", file: "src/utils/date.ts", from: '{ ...options, timeZone: "UTC" }',
    to: '{ ...options }', test: "temporal-presentation.test.tsx" },
  { id: "M03-month-overflow", file: "src/utils/date.ts", from: '  shifted.setDate(1);',
    to: '  // Mutant: retains day 31.', test: "temporal-navigation.test.tsx" },
  { id: "M04-stale-invoice", file: "src/hooks/useCards.ts", from: 'if (request.isCurrent() && res?.data)',
    to: 'if (res?.data)', test: "async-state.test.tsx", all: true },
  { id: "M05-mutation-lock", file: "src/hooks/useOptimisticMutation.ts", from: 'if (activeMutation) return activeMutation.promise;',
    to: '// Mutant: same-tick duplicate reaches network.', test: "async-state.test.tsx" },
  { id: "M06-bff-timeout", file: "src/app/api/[...path]/route.ts", from: '{ status: 504 }',
    to: '{ status: 500 }', test: "bff-contract.test.tsx" },
];

function run(id, test) {
  const result = spawnSync(process.execPath, [path.join(isolated, "node_modules/vitest/vitest.mjs"),
    "run", "--config", "tests/component/vitest.config.mts", `tests/component/${test}`], {
    cwd: isolated, encoding: "utf8", env: { ...process.env, TZ: "America/Sao_Paulo" },
    timeout: 60_000, windowsHide: true,
  });
  const log = (result.stdout ?? "") + (result.stderr ?? "");
  return writeFile(path.join(output, `${id}.log`), log).then(() => ({
    exitCode: result.status,
    assertionFailure: /AssertionError|TestingLibraryElementError: Unable to find an element with the text: 07\/09\/2026/.test(log),
    environmentFailure: /Failed to resolve import|SyntaxError|Transform failed|Cannot find module/.test(log),
    summary: log.split(/\r?\n/).filter((line) => /Tests\s+\d|Test Files|AssertionError:|TestingLibraryElementError:/.test(line)),
  }));
}

for (const scenario of scenarios) {
  const target = path.join(isolated, scenario.file);
  const original = await readFile(target);
  const text = original.toString("utf8").replaceAll("\r\n", "\n");
  if (!text.includes(scenario.from)) throw new Error(`Mutation anchor missing: ${scenario.id}`);
  const control = await run(`${scenario.id}-control`, scenario.test);
  if (control.exitCode !== 0) throw new Error(`Control failed: ${scenario.id}`);
  const mutant = scenario.all ? text.replaceAll(scenario.from, scenario.to) : text.replace(scenario.from, scenario.to);
  let result;
  try {
    await writeFile(target, mutant);
    result = await run(scenario.id, scenario.test);
    await writeFile(path.join(output, `${scenario.id}.diff.txt`), `- ${scenario.from}\n+ ${scenario.to}\n`);
  } finally {
    await writeFile(target, original);
  }
  const restored = hash(await readFile(target)) === hash(original);
  const row = { id: scenario.id, file: scenario.file, test: scenario.test, control, result, restored };
  results.push(row);
  await writeFile(path.join(output, "results.json"), JSON.stringify({ isolated, results }, null, 2) + "\n");
  console.log(JSON.stringify(row));
  if (result.exitCode !== 1 || !result.assertionFailure || result.environmentFailure || !restored) {
    throw new Error(`Mutation not causally detected: ${scenario.id}`);
  }
}
await writeFile(path.join(output, "results.json"), JSON.stringify({ isolated, results }, null, 2) + "\n");
console.log(`Restored isolated source: ${isolated}`);
