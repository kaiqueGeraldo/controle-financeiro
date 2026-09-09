import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const playwrightCli = fileURLToPath(
  new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
);
const [action = "test", ...extraArguments] = process.argv.slice(2);

if (!new Set(["install", "test"]).has(action)) {
  console.error("Uso: node scripts/playwright.mjs <install|test> [...argumentos]");
  process.exit(2);
}

const environment = {
  ...process.env,
  BACKEND_API_URL:
    process.env.BACKEND_API_URL ?? "http://127.0.0.1:65535",
  CF_TEST_BASE_URL: process.env.CF_TEST_BASE_URL ?? "http://127.0.0.1:3100",
  CF_TEST_FIXED_NOW:
    process.env.CF_TEST_FIXED_NOW ?? "2026-09-08T02:59:59.000Z",
  CF_TEST_SEED: process.env.CF_TEST_SEED ?? "cf001-v1",
  CF_TEST_TIMEZONE:
    process.env.CF_TEST_TIMEZONE ?? "America/Sao_Paulo",
  PLAYWRIGHT_BROWSERS_PATH: "0",
};

console.info(
  `[harness] action=${action} timezone=${environment.CF_TEST_TIMEZONE} ` +
    `viewports=360x800,768x1024,1440x900 seed=${environment.CF_TEST_SEED} ` +
    `fixedNow=${environment.CF_TEST_FIXED_NOW}`,
);

function waitForChild(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (signal) {
        reject(new Error(`Processo encerrado pelo sinal ${signal}.`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function isReachable(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1_000) });
    return true;
  } catch {
    return false;
  }
}

async function waitUntilReachable(url, server, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Servidor Next encerrou com código ${server.exitCode}.`);
    }
    if (await isReachable(url)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Servidor Next não respondeu em ${url} após ${timeoutMs}ms.`);
}

function processIsRunning(child) {
  return child?.pid && child.exitCode === null && child.signalCode === null;
}

async function waitUntilStopped(child, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (processIsRunning(child) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return !processIsRunning(child);
}

async function stopProcessTree(child) {
  if (!processIsRunning(child)) return;

  child.kill("SIGTERM");
  if (await waitUntilStopped(child, 5_000)) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      shell: false,
      stdio: "ignore",
    });
  } else {
    process.kill(-child.pid, "SIGKILL");
  }

  if (!(await waitUntilStopped(child, 5_000))) {
    throw new Error(`Não foi possível encerrar a árvore do PID ${child.pid}.`);
  }
}

async function waitUntilUnreachable(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await isReachable(url))) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Falha ao liberar ${url} após ${timeoutMs}ms.`);
}

function runPlaywright(arguments_) {
  const child = spawn(process.execPath, arguments_, {
    cwd: frontendRoot,
    env: environment,
    shell: false,
    stdio: "inherit",
  });
  return { child, result: waitForChild(child) };
}

async function main() {
  if (action === "install") {
    const { result } = runPlaywright([
      playwrightCli,
      "install",
      "chromium",
      ...extraArguments,
    ]);
    process.exitCode = await result;
    return;
  }

  const readinessUrl = new URL("/auth", environment.CF_TEST_BASE_URL).href;
  if (await isReachable(readinessUrl)) {
    throw new Error(
      `A porta do harness já está ocupada em ${environment.CF_TEST_BASE_URL}; ` +
        "o processo existente não será reutilizado nem encerrado.",
    );
  }

  const baseUrl = new URL(environment.CF_TEST_BASE_URL);
  const server = spawn(
    process.execPath,
    [
      nextCli,
      "dev",
      "--hostname",
      baseUrl.hostname,
      "--port",
      baseUrl.port || "80",
    ],
    {
      cwd: frontendRoot,
      detached: process.platform !== "win32",
      env: environment,
      shell: false,
      stdio: "inherit",
    },
  );

  let runner;
  const stopOwnedProcesses = () => {
    if (runner) runner.kill("SIGTERM");
    server.kill("SIGTERM");
  };
  process.once("SIGINT", stopOwnedProcesses);
  process.once("SIGTERM", stopOwnedProcesses);

  try {
    await waitUntilReachable(readinessUrl, server, 120_000);
    const execution = runPlaywright([
      playwrightCli,
      "test",
      "--config=tests/e2e/playwright.config.ts",
      ...extraArguments,
    ]);
    runner = execution.child;
    process.exitCode = await execution.result;
  } finally {
    await stopProcessTree(server);
    await waitUntilUnreachable(readinessUrl, 5_000);
    console.info(`[harness] servidor encerrado e porta liberada: ${baseUrl.port}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
