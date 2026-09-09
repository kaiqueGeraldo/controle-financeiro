// Run from this repository with JAVA_HOME pointing to JDK 21. No production services.
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir, homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const source = path.join(root, "controle-financeiro-backend");
const isolated = await mkdtemp(path.join(tmpdir(), "cf-review-backend-mutations-"));
const output = path.join(root, "controle-financeiro-frontend/tests/artifacts/review-backend-mutations");
await mkdir(output, { recursive: true });
for (const item of ["src", ".mvn", "mvnw", "mvnw.cmd", "pom.xml"]) {
  await cp(path.join(source, item), path.join(isolated, item), { recursive: true });
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const scenarios = [
  { id: "M07-product-zone", file: "utils/TemporalConfig.java", test: "TemporalConfigTest",
    from: "return Clock.system(productZoneId);", to: "return Clock.systemUTC();" },
  { id: "M08-invalid-wall-time", file: "utils/DateUtil.java", test: "DateUtilTest",
    from: "} catch (DateTimeParseException exception) {\n            throw new BusinessRuleException(INVALID_TIME_MESSAGE);",
    to: "} catch (DateTimeParseException exception) {\n            return LocalTime.NOON;" },
  { id: "M09-year-zero", file: "utils/StrictLocalDateDeserializer.java", test: "TemporalJsonContractTest",
    from: "parsed.getYear() < 1", to: "parsed.getYear() < 0" },
];
const results = [];
async function run(id, test) {
  const args = ["--batch-mode", "-Duser.timezone=UTC", `-Dmaven.repo.local=${path.join(homedir(), ".m2/repository")}`, `-Dtest=${test}`, "test"];
  const result = spawnSync(process.platform === "win32" ? "cmd.exe" : "./mvnw",
    process.platform === "win32" ? ["/d", "/c", "mvnw.cmd", ...args] : args,
    { cwd: isolated, encoding: "utf8", env: process.env, timeout: 120_000, windowsHide: true });
  const log = (result.stdout ?? "") + (result.stderr ?? "");
  await writeFile(path.join(output, `${id}.log`), log);
  return {
    exitCode: result.status,
    assertionFailure: /AssertionFailedError|AssertionError:/.test(log),
    environmentFailure: /COMPILATION ERROR|Non-resolvable|Could not resolve|Failed to load ApplicationContext/.test(log),
    summary: log.split(/\r?\n/).filter((line) => /Tests run:|expected:|but was:|Expecting code|throwable|BUILD (SUCCESS|FAILURE)/.test(line)),
  };
}
for (const scenario of scenarios) {
  const target = path.join(isolated, "src/main/java/com/controlefinanceiro/api", scenario.file);
  const original = await readFile(target);
  const text = original.toString("utf8").replaceAll("\r\n", "\n");
  if (!text.includes(scenario.from)) throw new Error(`Missing anchor ${scenario.id}`);
  const control = await run(`${scenario.id}-control`, scenario.test);
  if (control.exitCode !== 0) throw new Error(`Control failed ${scenario.id}`);
  let result;
  try {
    await writeFile(target, text.replace(scenario.from, scenario.to));
    result = await run(scenario.id, scenario.test);
  } finally { await writeFile(target, original); }
  const restored = hash(await readFile(target)) === hash(original);
  results.push({ ...scenario, control, result, restored });
  await writeFile(path.join(output, "results.json"), JSON.stringify({ isolated, results }, null, 2) + "\n");
  console.log(JSON.stringify(results.at(-1)));
  if (result.exitCode !== 1 || !result.assertionFailure || result.environmentFailure || !restored) {
    throw new Error(`Mutation not causally detected ${scenario.id}`);
  }
}
console.log(`Restored isolated source: ${isolated}`);
