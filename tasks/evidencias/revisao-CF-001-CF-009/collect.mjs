// Capture auditable summaries and an explicit staging plan; never stages or commits.
import { readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const evidence = "tasks/evidencias/revisao-CF-001-CF-009/";
const artifacts = "controle-financeiro-frontend/tests/artifacts/";
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const read = (name) => readFile(path.join(root, name));
const writeJson = (name, value) => writeFile(path.join(root, evidence, name), JSON.stringify(value, null, 2) + "\n");
const logs = [
  "review-unit-initial.log", "review-unit-final.log", "review-component-initial.log",
  "review-regressions-red.log", "review-regressions-green.log", "review-boundary-red.log",
  "review-boundary-green.log", "review-boundary-extra-red.log", "review-date-red.log",
  "review-state-red.log", "review-forms-red.log", "review-submit-red.log", "review-habits-red.log",
  "review-habits-green.log", "review-middleware-red.log", "review-components-final-set.log",
  "review-backend-initial.log", "review-backend-final.log", "review-backend-final-set.log",
  "review-integrated.log", "review-integrated-final.log", "review-smoke.log",
  "review-typecheck-final.log", "review-build-complete.log", "review-build-complete-final.log",
];
const results = [];
for (const file of logs) {
  try {
    const bytes = await read(artifacts + file);
    const text = bytes.toString("utf8");
    results.push({ file: artifacts + file, bytes: bytes.length, sha256: hash(bytes),
      excerpt: text.split(/\r?\n/).filter((line) => /Tests run:|Test Files|Tests\s+\d|BUILD (SUCCESS|FAILURE)|AssertionError|expected:|but was:|ERR_ASSERTION|COMPILATION ERROR|Failed to fetch|Compiled successfully|\d+ passed \(|\d+ failed \(|Timed out waiting|ℹ (tests|pass|fail|skipped)/.test(line)).slice(-30),
    });
  } catch (error) { if (error.code !== "ENOENT") throw error; }
}
for (const [name, file] of [
  ["frontendMutations", "review-mutations/results.json"],
  ["backendMutations", "review-backend-mutations/results.json"],
  ["integratedMutation", "review-integrated-mutation/results.json"],
  ["integratedControl", "review-integrated-mutation/control.json"],
  ["integratedCausalVerification", "review-integrated-mutation/causal-verification.json"],
  ["openProbe", "review-open-probes/results.json"],
]) {
  try { results.push({ name, ...JSON.parse((await read(artifacts + file)).toString()) }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
await writeJson("resultados.json", { capturedAt: new Date().toISOString(), results });

const all = git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean);
const code = [];
for (const file of all.filter((file) => /^(controle-financeiro-(frontend|backend)\/|\.github\/)/.test(file))) {
  if (file.startsWith(artifacts) && file !== artifacts + ".gitignore") continue;
  const bytes = await read(file);
  code.push({ path: file, bytes: bytes.length, sha256: hash(bytes) });
}
await writeJson("codigo-validado.json", { capturedAt: new Date().toISOString(), initialHead: "169d7be4c7d3db97d4c318ff3f99d9de3a808067", files: code.sort((a,b) => a.path.localeCompare(b.path)) });
const initial = JSON.parse((await read(evidence + "base-inicial.json")).toString());
const readme = initial.files.find((file) => file.path === "README.md");
await writeJson("preservacao.json", { excluded: [{ path: "README.md", reason: "Revisão geral preexistente da apresentação do projeto, fora do lote CF-001–009.", unchanged: hash(await read("README.md")).toLowerCase() === readme.sha256.toLowerCase() }],
  futureTaskDefinitions: "Arquivos CF-010–036 preexistentes são catálogo necessário às referências do oracle CF-001; nenhum estado ou implementação futura foi alterado.",
  prohibitedOperations: "Nenhum reset/clean/amend/rebase/push/deploy; arquivos ignorados e planilhas fora do plano de staging." });
if (process.argv.includes("--snapshot-only")) process.exit(0);

const groups = [
  { id: "01", message: "docs(foundation): versionar criterios e contratos CF-001 CF-004", tasks: ["CF-001", "CF-004"], files: [] },
  { id: "02", message: "test(harness): preparar ambientes descartaveis CF-002 CF-003", tasks: ["CF-002", "CF-003"], findings: ["R01"], files: [] },
  { id: "03", message: "fix(backend): alinhar calendario e validacao HTTP CF-006 CF-008", tasks: ["CF-006", "CF-008"], findings: ["R06", "R07", "R16"], files: [] },
  { id: "04", message: "fix(http): preservar erros sessao e cancelamento CF-008", tasks: ["CF-008", "CF-009"], findings: ["R02", "R04", "R05", "R15"], files: [] },
  { id: "05", message: "fix(frontend): preservar datas e estado concorrente CF-005 CF-009", tasks: ["CF-005", "CF-009"], findings: ["R03", "R08", "R09", "R10", "R11", "R12", "R13", "R14"], files: [] },
  { id: "06", message: "test(e2e): validar datas de browser a PostgreSQL CF-007", tasks: ["CF-007"], files: [] },
  { id: "07", message: "docs(review): registrar achados e gates CF-001 a CF-009", tasks: ["CF-001", "CF-002", "CF-003", "CF-004", "CF-005", "CF-006", "CF-007", "CF-008", "CF-009"], files: [] },
];
const candidates = [...new Set([
  ...git("diff", "--name-only", "-z").split("\0"),
  ...git("ls-files", "--others", "--exclude-standard", "-z").split("\0"),
  evidence + "commit-plan.json", evidence + "commits.json",
])].filter(Boolean).sort();
const omitted = [];
for (const file of candidates) {
  if (file === "README.md") { omitted.push(file); continue; }
  let group;
  if (file.startsWith(evidence) || /^tasks\/(00-fundacao|01-datas-integracao)\//.test(file)) group = 6;
  else if (/TemporalBrowserApiPostgresE2E\.java$|playwright\.integrated\.config\.ts$|temporal\.integrated\.spec\.ts$|tasks\/evidencias\/CF-007\//.test(file)) group = 5;
  else if (/^docs\/|^tasks\/(?!evidencias\/CF-00[235689]\/)|\/tests\/oracles\/|\/src\/types\/temporal-contract\//.test(file)) group = 0;
  else if (/^\.github\/|\/mvnw\.cmd$|\/pom\.xml$|\/package(-lock)?\.json$|\/scripts\/|\/tests\/README\.md$|\/tests\/artifacts\/\.gitignore$|\/tests\/component\/(vitest\.config\.mts|setup\.ts|auth-screen\.test\.tsx)$|\/tests\/e2e\/|\/src\/test\/resources\/|\/api\/support\/|ControleFinanceiroApiApplicationTests\.java$|PostgreSqlPersistenceTests\.java$|^tasks\/evidencias\/CF-00[23]\//.test(file)) group = 1;
  else if (/^controle-financeiro-backend\//.test(file) || /^tasks\/evidencias\/CF-006\//.test(file)) group = 2;
  else if (/\/src\/services\/|\/src\/app\/api\/|\/src\/middleware\.ts$|\/src\/contexts\/userContext\.tsx$|\/src\/hooks\/useRequestCoordinator\.ts$|\/tests\/component\/(http-contract|bff-contract|user-session-review|middleware-expiry-review)\.test\.tsx$|^tasks\/evidencias\/CF-008\//.test(file)) group = 3;
  else if (/^controle-financeiro-frontend\/(src\/|tests\/)|^tasks\/evidencias\/CF-00[59]\//.test(file)) group = 4;
  else throw new Error(`Unassigned scope: ${file}`);
  if (/\.env(?:\.|$)|node_modules|\/target\/|\.xlsx$|\.log$|\.next\//.test(file)) throw new Error(`Forbidden artifact: ${file}`);
  groups[group].files.push(file);
}
await writeJson("commit-plan.json", { note: "Explicit paths reviewed before staging; only final combined set tested. Future definitions are documentation, not feature execution.", groups, omitted });
console.log(JSON.stringify(groups.map(({ id, message, files }) => ({ id, message, files: files.length }))));
