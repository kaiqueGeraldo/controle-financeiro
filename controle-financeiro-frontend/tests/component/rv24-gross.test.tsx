import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { validateCreationResult } from "@/services/creationResult";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import type { InvestmentOperationDTO } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "gross-owner" } }) }));
const command: InvestmentOperationDTO = { investmentId: "asset", accountId: "account", type: "BUY", quantity: 2, price: 100, fees: 2, date: "2027-01-15" };
const result = { id: "10000000-0000-4000-8000-000000000001", type: "BUY", quantity: 2, price: 100, totalValue: 200, fees: 2, date: "2027-01-15", dateOrigin: "USER_INPUT", costDelta: 202, realizedResult: null };
beforeEach(() => sessionStorage.clear());

test.each([
  [1, 1.005, 1.01], [1, 1.004, 1], [0.125, 10.04, 1.26],
  [0.1, 0.2, 0.02], [0.00000001, 1000000, 0.01],
  [3, 0.335, 1.01], [999999999999, 0.01, 9999999999.99],
])("FIN-06 execution %s x %s has gross %s before fees", (quantity, price, totalValue) => {
  for (const type of ["BUY", "SELL", "DIVIDEND", "INTEREST"] as const) {
    const request = { ...command, type, quantity, price, fees: 0 };
    const response = { ...result, type, quantity, price, totalValue, fees: 0, costDelta: null };
    expect(() => validateCreationResult(response, request)).not.toThrow();
    expect(() => validateCreationResult({ ...response, totalValue: totalValue === 1 ? 1.01 : 1 }, request)).toThrow();
  }
});

test.each([202, 198, 999, 200.001, 0, -200, Infinity, NaN, null, undefined, "200"])("invalid or non-gross total %s cannot confirm", totalValue => {
  expect(() => validateCreationResult({ ...result, totalValue }, command)).toThrow();
});

test("fees are separate from gross, without reconstructing historical cost or current valuation", () => {
  expect(() => validateCreationResult(result, command)).not.toThrow();
  expect(() => validateCreationResult({ ...result, type: "SELL", costDelta: null, realizedResult: null }, { ...command, type: "SELL" })).not.toThrow();
});

test("NG-01 monetary gross is authoritative despite rounded or zero descriptive price", () => {
  for (const [quantity, price, totalValue, amount] of [[3, 0.33333333, 1, "1.00"], [200000000, 0, 0.01, "0.01"]] as const) {
    const request = { ...command, type: "SELL" as const, amount, fees: 0 };
    const response = { ...result, type: "SELL", quantity, price, totalValue, fees: 0, costDelta: null, realizedResult: null };
    expect(() => validateCreationResult(response, request)).not.toThrow();
    expect(() => validateCreationResult({ ...response, totalValue: 2 }, request)).toThrow();
  }
});

test("excess execution precision is not silently rounded", () => {
  expect(() => validateCreationResult({ ...result, price: 100.000000001 }, { ...command, price: 100.000000001 })).toThrow();
});

test("bad POST, retry and GET retain exact intent; valid GET recovers without another POST", async () => {
  const hook = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  const send = vi.fn().mockResolvedValue({ data: { ...result, totalValue: 202 } });
  await act(async () => expect(await hook.result.current.start(command, send)).toBe("unknown"));
  const key = "cf-creation:v1:gross-owner:INVESTMENT_OPERATION";
  const saved = sessionStorage.getItem(key)!;
  const frozen = JSON.parse(saved).command;
  await act(async () => expect(await hook.result.current.retry(send)).toBe("unknown"));
  expect(send.mock.calls.map(call => call[0])).toEqual([frozen, frozen]);
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ operationId: frozen.operationId, kind: "INVESTMENT_OPERATION", result: { ...result, totalValue: 198 } })))
    .mockResolvedValue(new Response(JSON.stringify({ operationId: frozen.operationId, kind: "INVESTMENT_OPERATION", result })));
  vi.stubGlobal("fetch", fetch);
  await act(async () => expect(await hook.result.current.recover()).toBe("unknown"));
  expect(sessionStorage.getItem(key)).toBe(saved);
  await act(async () => expect(await hook.result.current.recover()).toBe("confirmed"));
  expect(sessionStorage.getItem(key)).toBeNull();
  expect(send).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls.every(([url, options]) => url === `/api/financial-intents/${frozen.operationId}` && options.method === "GET")).toBe(true);
  send.mockResolvedValue({ data: result });
  await act(async () => expect(await hook.result.current.start(command, send)).toBe("confirmed"));
  expect(send.mock.calls[2][0]).toEqual({ ...frozen, operationId: expect.any(String) });
  expect(send.mock.calls[2][0].operationId).not.toBe(frozen.operationId);
});
