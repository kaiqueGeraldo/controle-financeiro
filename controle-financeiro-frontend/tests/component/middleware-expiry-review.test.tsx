import { afterEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

afterEach(() => vi.useRealTimers());

test.each([-1, 0, 1])("R15: expiração da rota na fronteira do instante (%s segundo)", (delta) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2040-01-01T00:00:00Z"));
  const exp = 2208988800 + delta;
  // Token sintético testa somente o redirecionamento. A API verifica assinatura.
  const token = `header.${btoa(JSON.stringify({ exp }))}.signature`;
  const request = new NextRequest("http://localhost/extrato", { headers: { cookie: `token=${token}` } });
  const response = middleware(request);
  expect(response.status).toBe(delta > 0 ? 200 : 307);
  if (delta <= 0) expect(response.headers.get("location")).toBe("http://localhost/auth");
});
