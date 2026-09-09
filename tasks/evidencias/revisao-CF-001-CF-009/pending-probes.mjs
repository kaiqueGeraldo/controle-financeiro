// Diagnostic of an OPEN finding, not a passing product gate or a skipped test.
import { cp, mkdir, mkdtemp, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const evidence = fileURLToPath(new URL("./", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
const source = path.join(root, "controle-financeiro-frontend");
const isolated = await mkdtemp(path.join(tmpdir(), "cf-review-open-probes-"));
const output = path.join(source, "tests/artifacts/review-open-probes");
await mkdir(output, { recursive: true });
for (const item of ["src", "tests", "package.json", "tsconfig.json"]) {
  await cp(path.join(source, item), path.join(isolated, item), {
    recursive: true, filter: (file) => !file.startsWith(path.join(source, "tests/artifacts")),
  });
}
await symlink(path.join(source, "node_modules"), path.join(isolated, "node_modules"), "junction");
await cp(path.join(evidence, "probes/habit-product-day.test.tsx"), path.join(isolated, "tests/component/habit-product-day.test.tsx"));
const run = spawnSync(process.execPath, [path.join(isolated, "node_modules/vitest/vitest.mjs"), "run", "--config",
  "tests/component/vitest.config.mts", "habit-product-day"], {
  cwd: isolated, encoding: "utf8", timeout: 60_000, windowsHide: true,
  env: { ...process.env, TZ: "Pacific/Kiritimati", CF_TEST_TIMEZONE: "Pacific/Kiritimati" },
});
const log = (run.stdout ?? "") + (run.stderr ?? "");
await writeFile(path.join(output, "P05.log"), log);
const summary = { isolated, exitCode: run.status,
  confirmed: run.status === 1 && /2026-09-07/.test(log) && /2026-09-08/.test(log) && /AssertionError/.test(log),
  excerpt: log.split(/\r?\n/).filter((line) => /2026-09-0[78]|AssertionError|Tests\s+\d/.test(line)),
};
await writeFile(path.join(output, "results.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary));
// Propagate the failing product assertion. Do not report a green product suite.
process.exitCode = run.status ?? 2;
