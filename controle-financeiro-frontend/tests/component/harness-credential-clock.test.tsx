import { spawnSync } from "node:child_process";
import path from "node:path";
import { afterEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const preload = path.resolve("tests/e2e/support/server-clock.cjs");
afterEach(() => vi.useRealTimers());
function serverClock(overrides: Record<string, string> = {}) {
  return spawnSync(process.execPath, ["--require", preload, "-e", "console.log(new Date().toISOString())"], {
    encoding: "utf8", windowsHide: true,
    env: { ...process.env, CF_E2E_SERVER_CLOCK: "1", CF_E2E_AUTH_NOW: "2027-02-02T05:00:00Z",
      BACKEND_API_URL: "http://127.0.0.1:3108", NODE_ENV: "development", ...overrides },
  });
}

test("P04: Next usa authNow controlado depois da antiga expiração e distingue JWT válido/expirado", () => {
  const server = serverClock();
  expect(server.status, server.stderr).toBe(0);
  expect(server.stdout.trim()).toBe("2027-02-02T05:00:00.000Z");
  vi.useFakeTimers(); vi.setSystemTime(new Date(server.stdout.trim()));
  for (const [exp, status] of [[1801458000, 307], [1801544400, 307], [1801630800, 200]]) {
    // Respectivamente antiga expiração (01/02), fronteira (02/02), novo TTL (03/02).
    const token = `header.${btoa(JSON.stringify({ exp }))}.signature`;
    const result = middleware(new NextRequest("http://localhost/extrato", { headers: { cookie: `token=${token}` } }));
    expect(result.status).toBe(status);
  }
});

test.each([{ NODE_ENV: "production" }, { CF_E2E_SERVER_CLOCK: "0" }, { BACKEND_API_URL: "https://example.test" }])(
  "preload recusa fora do harness: %j", (environment) => {
    const server = serverClock(environment);
    expect(server.status).not.toBe(0);
    expect(server.stderr).toContain("Relógio E2E exige opt-in");
  },
);
