import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { ApiError } from "@/services/api";
import { validateCreationResult } from "@/services/creationResult";
import type { InvestmentOperationDTO } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({user: {id: "independent-review"}}) }));
const command: InvestmentOperationDTO = { investmentId: "asset", accountId: "account", type: "BUY", quantity: 2, price: 100, fees: 0, date: "2027-01-15" };
// FIN-04/06: two units at 100 have gross 200; this oracle does not call product arithmetic.
const valid = { id: "10000000-0000-4000-8000-000000000001", type: "BUY", quantity: 2, price: 100, totalValue: 200, fees: 0, date: "2027-01-15", dateOrigin: "USER_INPUT", costDelta: 200, realizedResult: null };
const key = "cf-creation:v1:independent-review:INVESTMENT_OPERATION";
beforeEach(() => { sessionStorage.clear(); });

test.each(["POST", "retry", "GET"])("RVR24-01: inconsistent gross cannot confirm via %s", async path => {
  const {result} = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  const bad = {...valid, totalValue: 999};
  let outcome: unknown;
  if (path === "POST") {
    await act(async () => { outcome = await result.current.start(command, async () => ({data: bad})); });
  } else {
    await act(async () => { await result.current.start(command, async () => {throw new ApiError("unknown", 502, {requiresReconciliation: true});}); });
    const before = sessionStorage.getItem(key)!;
    const identity = JSON.parse(before).command.operationId;
    if (path === "GET") {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({operationId: identity, kind: "INVESTMENT_OPERATION", result: bad}))));
      await act(async () => {outcome = await result.current.recover();});
    } else {
      const send = vi.fn().mockResolvedValue({data: bad});
      await act(async () => {outcome = await result.current.retry(send);});
      expect(send).toHaveBeenCalledWith(JSON.parse(before).command);
    }
  }
  // Soft assertions preserve both independent observations when the candidate is defective.
  expect.soft(outcome).toBe("unknown");
  expect.soft(sessionStorage.getItem(key)).not.toBeNull();
  expect.soft(result.current.pending).not.toBeNull();
});

test("legitimate decimal rounding and unknown historical cost remain acceptable", () => {
  const rounded = {...command, quantity: 1, price: 1.005};
  expect(() => validateCreationResult({...valid, quantity: 1, price: 1.005, totalValue: 1.01, costDelta: 1.01}, rounded)).not.toThrow();
  expect(() => validateCreationResult({...valid, type: "SELL", costDelta: null, realizedResult: null}, {...command, type: "SELL"})).not.toThrow();
});
