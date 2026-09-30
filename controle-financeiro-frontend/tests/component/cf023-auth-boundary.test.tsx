import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { beforeEach, expect, test, vi } from "vitest";
import { setAuthCookie, removeAuthCookie } from "@/actions/authActions";
import { proxyRequest } from "@/app/api/[...path]/route";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
const store = { set: vi.fn(), delete: vi.fn(), get: vi.fn() };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(cookies).mockResolvedValue(store as never);
});

test("CF023: cookie acompanha duração de 24h do JWT e logout elimina credencial", async () => {
  vi.stubEnv("NODE_ENV", "production");
  await setAuthCookie("synthetic-token-a");
  expect(store.set).toHaveBeenCalledWith("token", "synthetic-token-a", {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 86400,
  });
  await removeAuthCookie();
  expect(store.delete).toHaveBeenCalledWith("token");
});

test("CF023: BFF relê cookie por requisição, não usa Bearer fornecido pelo navegador", async () => {
  store.get.mockReturnValueOnce({ value: "synthetic-a" }).mockReturnValueOnce({ value: "synthetic-b" }).mockReturnValueOnce(undefined);
  const upstream = vi.fn().mockImplementation(async () => new Response("[]", {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  }));
  vi.stubGlobal("fetch", upstream);
  for (const expected of ["Bearer synthetic-a", "Bearer synthetic-b", null]) {
    const response = await proxyRequest({ method: "GET", signal: new AbortController().signal,
      nextUrl: { search: "" }, headers: new Headers({ authorization: "Bearer attacker-token" }),
    } as unknown as NextRequest, { params: { path: ["accounts"] } });
    const options = upstream.mock.calls.at(-1)![1];
    expect(options.headers.get("authorization")).toBe(expected);
    expect(options.cache).toBe("no-store");
    expect(response.headers.get("cache-control")).toBe("no-store");
  }
});
