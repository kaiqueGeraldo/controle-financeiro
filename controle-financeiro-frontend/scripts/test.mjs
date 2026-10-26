import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const timezone of ["America/Sao_Paulo", "UTC", "Pacific/Kiritimati"]) {
  console.log(`\nFuso de teste: ${timezone}`);
  const result = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "tests/date.test.mjs"], {
    cwd: root, env: { ...process.env, TZ: timezone }, stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
