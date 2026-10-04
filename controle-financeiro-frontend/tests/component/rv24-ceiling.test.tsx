import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { validateCreationResult } from "@/services/creationResult";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import type { InvestmentOperationDTO } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "ceiling-owner" } }) }));
const command: InvestmentOperationDTO = { investmentId: "asset", accountId: "account", type: "BUY", quantity: 1000000, price: 999999.99999999, fees: 0, date: "2027-01-15" };
const result = { id: "10000000-0000-4000-8000-000000000001", type: "BUY", quantity: command.quantity, price: command.price, totalValue: 999999999999.99, fees: 0, date: command.date, dateOrigin: "USER_INPUT", costDelta: null, realizedResult: null };

test.each([
  [999999.99999998, 999999999999.98, true],
  [999999.99999999, 999999999999.99, true],
  [1000000, 1000000000000, false],
])("FIN-06 unit price %s produces gross %s, accepted=%s", (price, totalValue, accepted) => {
  for (const type of ["BUY", "SELL", "DIVIDEND", "INTEREST"] as const) {
    const check = () => validateCreationResult({ ...result, type, price, totalValue }, { ...command, type, price });
    if (accepted) expect(check).not.toThrow(); else expect(check).toThrow(/Resultado financeiro inválido/);
  }
});

test.each([
  [333333333333.3316, 999999999999.99, true], // exact product .9948 rounds down to the maximum
  [333333333333.33167, 1000000000000, false], // exact product .99501 rounds into 13 integer digits
])("compare rounded monetary result, execution price %s", (price, totalValue, accepted) => {
  const check = () => validateCreationResult({ ...result, quantity: 3, price, totalValue }, { ...command, quantity: 3, price });
  if (accepted) expect(check).not.toThrow(); else expect(check).toThrow();
});

test.each([
  ["999999999999.98", 999999999999.98, true], ["999999999999.99", 999999999999.99, true],
  ["1000000000000.00", 1000000000000, false], ["999999999999", 999999999999, true],
  ["999999999999.99001", 999999999999.99, false], ["1e2", 100, false],
  ["000999999999999.99", 999999999999.99, false], ["1.00\n", 1, false],
])("NG-01 amount %s is parsed without Number rounding", (amount, totalValue, accepted) => {
  const c = { ...command, type: "SELL" as const, amount };
  const r = { ...result, type: "SELL", quantity: 0.00000001, price: 99999999999999000000, totalValue };
  const check = () => validateCreationResult(r, c);
  if (accepted) expect(check).not.toThrow(); else expect(check).toThrow();
});

test.each(["quantity", "price"] as const)("FIN-06 %s range is not inferred from a small gross", field => {
  const other = field === "quantity" ? "price" : "quantity";
  for (const [operand, totalValue, accepted] of [[999999999999.9999, 10000, true], [1000000000000, 10000, false], [0.00000001, 0.01, true], [0.000000001, 0.01, false]] as const) {
    const multiplier = operand < 1 ? 1000000 : 0.00000001;
    const c = { ...command, [field]: operand, [other]: multiplier };
    const check = () => validateCreationResult({ ...result, [field]: operand, [other]: multiplier, totalValue }, c);
    if (accepted) expect(check).not.toThrow(); else expect(check).toThrow();
  }
});

test.each([999999999999.98, 999999999999.99, 1000000000000, -0.01, 0.001])("fee %s respects its own money bounds and nonnegative net", fees => {
  const check = () => validateCreationResult({ ...result, type: "SELL", fees }, { ...command, type: "SELL", fees });
  if (fees === 999999999999.98 || fees === 999999999999.99) expect(check).not.toThrow(); else expect(check).toThrow();
});

test("BUY gross plus fee can reach but cannot exceed the money ceiling", () => {
  const c = { ...command, price: 999999.99999998, fees: 0.01 };
  const r = { ...result, price: c.price, totalValue: 999999999999.98, fees: 0.01, costDelta: 999999999999.99 };
  expect(() => validateCreationResult(r, c)).not.toThrow();
  expect(() => validateCreationResult({ ...r, fees: 0.02 }, { ...c, fees: 0.02 })).toThrow();
});

test.each(["costDelta", "realizedResult"] as const)("known snapshot %s is money, without recalculating history", field => {
  for (const amount of [null, 999999999999.99]) expect(() => validateCreationResult({ ...result, [field]: amount }, command)).not.toThrow();
  for (const amount of [1000000000000, 0.001]) expect(() => validateCreationResult({ ...result, [field]: amount }, command)).toThrow();
  expect(() => validateCreationResult({ ...result, type: "SELL", realizedResult: -999999999999.99 }, { ...command, type: "SELL" })).not.toThrow();
});

test.each(["POST", "retry", "GET"])("above-ceiling %s preserves the valid original command until valid recovery", async route => {
  sessionStorage.clear();
  const hook = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  const c = { ...command, quantity: 2, price: 100 };
  const valid = { ...result, quantity: 2, price: 100, totalValue: 200, costDelta: 200 };
  const bad = { ...valid, totalValue: 1000000000000 };
  const send = vi.fn().mockResolvedValue({ data: bad });
  if (route === "POST") await act(async () => expect(await hook.result.current.start(c, send)).toBe("unknown"));
  else await act(async () => expect(await hook.result.current.start(c, async () => { throw Error("lost response"); })).toBe("unknown"));
  const key = "cf-creation:v1:ceiling-owner:INVESTMENT_OPERATION";
  const saved = sessionStorage.getItem(key)!;
  const frozen = JSON.parse(saved).command;
  const receipt = (value: unknown) => new Response(JSON.stringify({ operationId: frozen.operationId, kind: "INVESTMENT_OPERATION", result: value }));
  if (route === "retry") {
    await act(async () => expect(await hook.result.current.retry(send)).toBe("unknown"));
    expect(send).toHaveBeenCalledWith(frozen);
  } else if (route === "GET") {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(receipt(bad)));
    await act(async () => expect(await hook.result.current.recover()).toBe("unknown"));
  }
  expect(sessionStorage.getItem(key)).toBe(saved);
  const noNewIntent = vi.fn();
  await act(async () => expect(await hook.result.current.start(c, noNewIntent)).toBe("ignored"));
  expect(noNewIntent).not.toHaveBeenCalled();
  const sends = send.mock.calls.length;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(receipt(valid)));
  await act(async () => expect(await hook.result.current.recover()).toBe("confirmed"));
  expect(send).toHaveBeenCalledTimes(sends);
  expect(sessionStorage.getItem(key)).toBeNull();
});
