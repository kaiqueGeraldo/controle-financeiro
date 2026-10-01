import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../../../..");
const frontend = join(root, "controle-financeiro-frontend");
const base = "5f26a1d56f94a21d75e67c375ea9095aaec3a79f";
const scratch = mkdtempSync(join(tmpdir(), "cf026-regressions-"));
// A junction reuses the exact installed dependencies, without copying or installing.
symlinkSync(join(frontend, "node_modules"), join(scratch, "node_modules"), "junction");
const sources = [
  "components/forms/configDashboardModal.tsx",
  "components/forms/changePasswordModal.tsx",
  "components/forms/depositGoalModal.tsx",
  "hooks/useOptimisticMutation.ts",
];
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const aliases = sources.map((relative, i) => ({
  find: `@/${relative.replace(/\.tsx?$/, "")}`,
  replacement: join(scratch, `${i}.tsx`),
}));
const originalHashes = sources.map(relative => hash(readFileSync(join(frontend, "src", relative))));
const report = { base, scratch, executions: [], sourcePreserved: false, isolatedRestored: false };
const config = join(scratch, "vitest.config.mts");
writeFileSync(config, `export default ${JSON.stringify({
  resolve: { alias: [...aliases, { find: "@", replacement: join(frontend, "src") }] },
  test: {
    environment: "jsdom", include: ["tests/component/**/*.test.tsx"], reporters: ["verbose"],
    setupFiles: [join(frontend, "tests/component/setup.ts")],
    restoreMocks: true, unstubEnvs: true, unstubGlobals: true,
  },
}, null, 2)};\n`);

function restore() {
  sources.forEach((relative, i) => copyFileSync(join(frontend, "src", relative), aliases[i].replacement));
}
function run(name, expectedSuccess, filter) {
  const args = [join(frontend, "node_modules/vitest/vitest.mjs"), "run", "--config", config,
    "tests/component/cf026-contracts.test.tsx", ...(filter ? ["-t", filter] : [])];
  const result = spawnSync(process.execPath, args, { cwd: frontend, encoding: "utf8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}\nexit_code=${result.status}\n`;
  writeFileSync(join(evidence, `${name}.log`), output);
  report.executions.push({ name, status: result.status, expectedSuccess, filter });
  console.log(`${name}: exit=${result.status}`);
  if (result.error || result.status === null || /Tests\s+no tests/.test(output) ||
      (result.status === 0) !== expectedSuccess) {
    throw new Error(`${name}: resultado inesperado; consultar log`);
  }
}

try {
  restore();
  sources.slice(0, 3).forEach((relative, i) => {
    writeFileSync(aliases[i].replacement, execFileSync("git", ["show", `${base}:controle-financeiro-frontend/src/${relative}`], { cwd: root }));
  });
  run("original-isolado-red", false);
  restore();
  run("original-isolado-restaurado", true);
  const hook = readFileSync(aliases[3].replacement, "utf8");
  const mutant = hook.replaceAll("generationRef.current += 1;", "/* mutação: não invalida a geração */");
  if (mutant === hook) throw new Error("Alvo da mutação ausente");
  writeFileSync(aliases[3].replacement, mutant);
  const diff = spawnSync("git", ["diff", "--no-index", "--", join(frontend, "src", sources[3]), aliases[3].replacement], { encoding: "utf8" });
  writeFileSync(join(evidence, "mutacao-geracao.patch"), diff.stdout ?? "");
  run("mutacao-geracao-red", false, "cleanup");
  restore();
  run("mutacao-geracao-restaurada", true, "cleanup");
} finally {
  restore();
  report.sourcePreserved = sources.every((relative, i) => originalHashes[i] === hash(readFileSync(join(frontend, "src", relative))));
  report.isolatedRestored = sources.every((relative, i) => originalHashes[i] === hash(readFileSync(aliases[i].replacement)));
  report.hashes = sources.map((relative, i) => ({ relative, sha256: originalHashes[i] }));
  writeFileSync(join(evidence, "regressoes.json"), JSON.stringify(report, null, 2) + "\n");
  if (!report.sourcePreserved || !report.isolatedRestored) throw new Error("Falha de preservação/restauração");
}
