import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { proxyRequest } from "@/app/api/[...path]/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

function request(
  method = "GET",
  signal: AbortSignal = new AbortController().signal,
): NextRequest {
  return {
    method,
    signal,
    nextUrl: { search: "?year=2026" },
    headers: new Headers({ accept: "application/json" }),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  } as unknown as NextRequest;
}

const context = { params: Promise.resolve({ path: ["transactions", "export"] }) };

describe("contrato do BFF [AC-UI-006/007]", () => {
  beforeEach(() => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "token-sintetico" }),
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("204 permanece sem corpo e sem content-type inventado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const response = await proxyRequest(request("DELETE"), context);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("content-type")).toBeNull();
  });

  test("R04: request já cancelado não dispara escrita no backend", async () => {
    const client = new AbortController();
    client.abort(new DOMException("navegação anterior", "AbortError"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const response = await proxyRequest(request("POST", client.signal), context);
    expect(response.status).toBe(499);
    expect(fetch).not.toHaveBeenCalled();
  });

  test("arquivo binário preserva bytes, tipo e nome", async () => {
    const bytes = Uint8Array.from([0x50, 0x4b, 0x03, 0x04]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(bytes, {
          status: 200,
          headers: {
            "content-type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "content-disposition": "attachment; filename=extrato.xlsx",
          },
        }),
      ),
    );

    const response = await proxyRequest(request(), context);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      "attachment; filename=extrato.xlsx",
    );
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual(
      Array.from(bytes),
    );
  });

  test("conexão recusada é 503 recuperável", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const response = await proxyRequest(request(), context);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      message: expect.stringContaining("manutenção"),
    });
  });

  test("status e problema JSON do backend atravessam o proxy sem reclassificação", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 403, message: "Operação não permitida." }), {
          status: 403,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const response = await proxyRequest(request(), context);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      status: 403,
      message: "Operação não permitida.",
    });
  });

  test("timeout upstream é 504 e cancelamento do cliente não vira 500", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          if (init.signal?.aborted) {
            reject(init.signal.reason);
            return;
          }
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        });
      }),
    );

    const timeoutResponsePromise = proxyRequest(request(), context);
    await vi.advanceTimersByTimeAsync(10_000);
    const timeoutResponse = await timeoutResponsePromise;
    expect(timeoutResponse.status).toBe(504);

    const client = new AbortController();
    const cancelResponsePromise = proxyRequest(request("GET", client.signal), context);
    await Promise.resolve();
    client.abort(new DOMException("navegação", "AbortError"));
    const cancelResponse = await cancelResponsePromise;
    expect(cancelResponse.status).toBe(499);
  });
});
