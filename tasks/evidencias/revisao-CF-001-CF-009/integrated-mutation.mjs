// JAVA_HOME=JDK 21; Docker running. Uses a disposable database and isolated source.
import { cp, mkdir, mkdtemp, readFile, writeFile, symlink, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir, homedir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const frontend = "controle-financeiro-frontend";
const backend = "controle-financeiro-backend";
const output = path.join(root, frontend, "tests/artifacts/review-integrated-mutation");
await mkdir(output, { recursive: true });
const classifyExisting = process.argv.includes("--classify-existing");
const resume = process.argv.includes("--resume-control") || classifyExisting;
const isolated = resume
  ? JSON.parse(await readFile(path.join(output, "control.json"), "utf8")).isolated
  : await mkdtemp(path.join(tmpdir(), "cf-review-integrated-mutation-"));
if (!path.resolve(isolated).startsWith(path.join(tmpdir(), "cf-review-integrated-mutation-"))) {
  throw new Error("Unexpected isolation directory");
}
if (resume) {
  if (!classifyExisting) await cp(path.join(output, "control.log"), path.join(output, `control-before-resume-${Date.now()}.log`));
} else {
for (const item of ["src", ".mvn", "mvnw", "mvnw.cmd", "pom.xml"]) {
  await cp(path.join(root, backend, item), path.join(isolated, backend, item), { recursive: true });
}
for (const item of ["src", "public", "tests", "scripts", "package.json", "package-lock.json", "tsconfig.json", "next-env.d.ts", "next.config.ts", "postcss.config.mjs"]) {
  await cp(path.join(root, frontend, item), path.join(isolated, frontend, item), {
    recursive: true, filter: (file) => !file.startsWith(path.join(root, frontend, "tests/artifacts")),
  });
}
await symlink(path.join(root, frontend, "node_modules"), path.join(isolated, frontend, "node_modules"), "junction");
// Both control and mutant use this isolation-only resolver setting. Turbopack
// rejects junctions outside its root; no application or test assertion changes.
const configPath = path.join(isolated, frontend, "next.config.ts");
const configOriginal = await readFile(configPath, "utf8");
await writeFile(configPath, configOriginal.replace("const nextConfig: NextConfig = {",
  `const nextConfig: NextConfig = {\n  turbopack: { root: ${JSON.stringify(homedir())} },`));
}
const target = path.join(isolated, backend, "src/main/java/com/controlefinanceiro/api/domain/investment/dto/InvestTransactionResponseDTO.java");
const original = await readFile(target);
const from = "transaction.getDate().toLocalDate(),";
const to = "transaction.getDate().toLocalDate().plusDays(1),";
if (!original.toString().includes(from)) throw new Error("Mutation anchor missing");
async function changedDayEvidence(log) {
  const artifacts = path.join(isolated, frontend, "tests/artifacts/cf007/playwright-results");
  const contexts = (await readdir(artifacts, { recursive: true }).catch(() => []))
    .filter((file) => file.endsWith("error-context.md"));
  const dom = (await Promise.all(contexts.map((file) => readFile(path.join(artifacts, file), "utf8")))).join("\n");
  return log.includes("Locator: getByText('30/01/2027', { exact: true })") && dom.includes("paragraph: 31/01/2027");
}
if (classifyExisting) {
  const previous = JSON.parse(await readFile(path.join(output, "results.json"), "utf8"));
  const log = await readFile(path.join(output, "M10-api-changes-civil-day.log"), "utf8");
  const confirmed = previous.control.exitCode === 0 && previous.result.exitCode === 1 && await changedDayEvidence(log);
  const sameAsWorkspace = original.equals(await readFile(path.join(root, backend, "src/main/java/com/controlefinanceiro/api/domain/investment/dto/InvestTransactionResponseDTO.java")));
  const verification = { confirmed, restored: previous.restored && sameAsWorkspace, expected: "30/01/2027", observedDom: "31/01/2027",
    note: "Read-only classification of completed execution. Original results.json preserved; no assertions or test runs changed." };
  await writeFile(path.join(output, "causal-verification.json"), JSON.stringify(verification, null, 2) + "\n");
  console.log(JSON.stringify(verification));
  process.exit(confirmed && verification.restored ? 0 : 1);
}
async function run(id) {
  const args = ["--batch-mode", "-Duser.timezone=UTC", `-Dmaven.repo.local=${path.join(homedir(), ".m2/repository")}`,
    "-Dtest=TemporalBrowserApiPostgresE2E", "-Dcf007.playwright.project=sao-paulo", "test"];
  const result = spawnSync(process.platform === "win32" ? "cmd.exe" : "./mvnw",
    process.platform === "win32" ? ["/d", "/c", "mvnw.cmd", ...args] : args,
    { cwd: path.join(isolated, backend), env: process.env, encoding: "utf8", timeout: 780_000, windowsHide: true });
  const log = (result.stdout ?? "") + (result.stderr ?? "");
  await writeFile(path.join(output, `${id}.log`), log);
  return { exitCode: result.status,
    assertionFailure: result.status === 1 && await changedDayEvidence(log),
    environmentFailure: /COMPILATION ERROR|Timed out waiting.*config.webServer|Failed to load ApplicationContext|TurbopackInternalError/.test(log),
    summary: log.split(/\r?\n/).filter((line) => /Tests run:|BUILD (SUCCESS|FAILURE)|2027-01-3[01]|Expected|Received/.test(line) && !/INFO.*---/.test(line)),
  };
}
const control = await run("control");
await writeFile(path.join(output, "control.json"), JSON.stringify({ isolated, control }, null, 2));
console.log(JSON.stringify({ control }));
if (control.exitCode !== 0) throw new Error("Integrated control failed");
let result;
try {
  await writeFile(target, original.toString().replace(from, to));
  result = await run("M10-api-changes-civil-day");
} finally { await writeFile(target, original); }
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const restored = hash(await readFile(target)) === hash(original);
await writeFile(path.join(output, "results.json"), JSON.stringify({ isolated, from, to, control, result, restored }, null, 2) + "\n");
console.log(JSON.stringify({ result, restored }));
if (result.exitCode !== 1 || !result.assertionFailure || result.environmentFailure || !restored) {
  throw new Error("Integrated mutation not causally detected");
}
