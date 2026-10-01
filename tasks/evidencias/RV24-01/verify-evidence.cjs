const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../../..");
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const relative = file => path.relative(root, file).replaceAll("\\", "/");
const readme = sha(fs.readFileSync(path.join(root, "README.md")));
if (readme !== "6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca") throw new Error("README alheio mudou.");
const sources = ["controle-financeiro-backend/src", "controle-financeiro-frontend/src", "controle-financeiro-frontend/tests/component", "controle-financeiro-frontend/tests/e2e"]
  .flatMap(dir => walk(path.join(root, dir))).filter(file => /\.(java|tsx?|sql|ya?ml|cjs|mjs)$/.test(file)).sort()
  .map(file => ({ file: relative(file), raw_sha256: sha(fs.readFileSync(file)), lf_sha256: sha(fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n")) }));
const evidence = ["RV24-01", "RV24-02"].flatMap(dir => walk(path.join(root, "tasks/evidencias", dir)))
  .filter(file => !file.endsWith("checkpoint.json")).sort().map(file => {
    const bytes = fs.readFileSync(file);
    if (/\.(log|xml|txt|json)$/.test(file) && /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(bytes.toString("utf8"))) throw new Error(`JWT em evidência: ${relative(file)}`);
    return { file: relative(file), sha256: sha(bytes) };
  });
const checkpoint = { base: "30211b85db5ecda23f7956ccf8471765056fc4c5", date: "2026-10-01", timezone: "America/Sao_Paulo", readme_sha256: readme, sources, evidence,
  gates: { components: { tests: 193, failures: 0, skips: 0 }, lint: { errors: 0, warnings: 0 }, backend_affected_verify: { tests: 135, failures: 0, errors: 0, skips: 0 }, deletion_final: { tests: 6, failures: 0, errors: 0, skips: 0 }, creation_browser: { tests: 6, failures: 0 }, payment_R03_browser: { tests: 4, failures: 0 } },
  limitations: ["Overlapping gates; do not sum", "No independent approval", "CF-019 RVA-03, CF-022 RJ-022-01/H24-01 remain open", "CF-026 independent review pending, not a CF-027 dependency", "CF-027 not executed or released"] };
const out = path.join(__dirname, "checkpoint.json");
if (process.argv.includes("--check")) {
  const recorded = JSON.parse(fs.readFileSync(out, "utf8"));
  if (JSON.stringify(recorded) !== JSON.stringify(checkpoint)) throw new Error("Checkpoint diverge; preservar a evidência anterior e investigar.");
} else {
  if (fs.existsSync(out)) throw new Error("Checkpoint já existe; use --check para verificar sem sobrescrever.");
  fs.writeFileSync(out, JSON.stringify(checkpoint, null, 2) + "\n");
}
console.log(JSON.stringify({ sources: sources.length, evidence: evidence.length, readme_preserved: true, checkpoint_matches: true }));
