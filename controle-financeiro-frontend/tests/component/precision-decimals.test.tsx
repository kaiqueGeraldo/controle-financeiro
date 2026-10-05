import { act, renderHook } from "@testing-library/react";
import { LosslessNumber } from "lossless-json";
import { expect, test, vi } from "vitest";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { apiRequest } from "@/services/api";
import { parseSavedCreation } from "@/services/creationIntent";
import { validateCreationResult } from "@/services/creationResult";
import { parseInvestmentResultJson } from "@/services/investmentResultJson";
import { investmentService } from "@/services/investmentService";
import type { InvestmentOperationDTO } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "exact-decimals" } }) }));
const sell: InvestmentOperationDTO = {
  investmentId: "asset", accountId: "account", type: "SELL", quantity: 1, price: 1,
  fees: 0, amount: "1.00", date: "2027-01-15",
};
// Literal JSON tokens, not JavaScript numeric fixtures or a productive oracle.
const raw = (quantity = "999999999999.99999999", total = "1.00", price = "0E-8", fees = "0.00") =>
  `{"id":"10000000-0000-4000-8000-000000000001","type":"SELL","date":"2027-01-15","quantity":${quantity},"price":${price},"totalValue":${total},"fees":${fees},"costDelta":1.00,"realizedResult":0.00,"dateOrigin":"USER_INPUT"}`;

test.each(["999999999999.99999998", "999999999999.99999999", "0.00000001", "1E-8"])(
  "exact legal quantity %s reaches the validator intact", quantity => {
    const result = parseInvestmentResultJson(raw(quantity));
    expect(result).toHaveProperty("quantity", new LosslessNumber(quantity));
    expect(() => validateCreationResult(result, sell)).not.toThrow();
  },
);
test.each(["1000000000000.00000000", "999999999999.999999999", "0.000000001", "0", "-1"])(
  "quantity outside precision/range %s is not normalized", quantity => {
    expect(() => validateCreationResult(parseInvestmentResultJson(raw(quantity)), sell)).toThrow();
  },
);
test.each(["999999999999.98", "999999999999.99"])("money boundary %s is exact", total => {
  expect(() => validateCreationResult(parseInvestmentResultJson(raw(undefined, total)), { ...sell, amount: total })).not.toThrow();
});
test.each(["1000000000000.00", "999999999999.99001"])("invalid monetary token %s is rejected", total => {
  expect(() => validateCreationResult(parseInvestmentResultJson(raw(undefined, total)), { ...sell, amount: "999999999999.99" })).toThrow();
});
test("NG-01 descriptive price may exceed the input-price ceiling without becoming authoritative", () => {
  expect(() => validateCreationResult(parseInvestmentResultJson(raw("0.00000001", "999999999999.99", "99999999999999000000.00000000")), {
    ...sell, amount: "999999999999.99",
  })).not.toThrow();
});
test("exact fees, negative realized snapshot and null are preserved", () => {
  const result = raw(undefined, "1.00", "0E-8", "0.01").replace('"costDelta":1.00', '"costDelta":null').replace('"realizedResult":0.00', '"realizedResult":-0.01');
  expect(() => validateCreationResult(parseInvestmentResultJson(result), { ...sell, fees: 0.01 })).not.toThrow();
  expect(() => validateCreationResult(parseInvestmentResultJson(raw(undefined, "1.00", "0E-8", "0.010000000000000001")), { ...sell, fees: 0.01 })).toThrow();
});
test.each([["1.00500000", "1.01"], ["1.00400000", "1.00"]])("HALF_UP uses exact price %s", (price, total) => {
  const command = { ...sell, type: "BUY" as const, amount: undefined, price: Number(price) };
  const result = raw("1.00000000", total, price).replace('"SELL"', '"BUY"');
  expect(() => validateCreationResult(parseInvestmentResultJson(result), command)).not.toThrow();
});
test("numeric-looking JSON strings and forged numeric objects do not become financial numbers", () => {
  for (const quantity of ['"999999999999.99999999"', '{"isLosslessNumber":true,"value":"999999999999.99999999"}', "null"]) {
    expect(() => validateCreationResult(parseInvestmentResultJson(raw(quantity)), sell)).toThrow();
  }
  expect(() => parseInvestmentResultJson('{"quantity":1,"quantity":2}')).toThrow();
});
test("other API responses keep numeric types; parse failures remain reconcilable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"quantity":2,"totalValue":200}')));
  expect((await apiRequest("/investments/asset/history", { method: "GET" })).data).toEqual({ quantity: 2, totalValue: 200 });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"quantity":1,')));
  await expect(investmentService.operation(sell)).rejects.toMatchObject({ kind: "invalid_response", requiresReconciliation: true });
});
test("legacy persisted command keeps UUID and payload through bad POST/GET then exact recovery", async () => {
  sessionStorage.clear();
  const key = "cf-creation:v1:exact-decimals:INVESTMENT_OPERATION";
  const hook = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  const fetch = vi.fn<(url: string, options: RequestInit) => Promise<Response>>()
    .mockImplementation(async () => new Response(raw("1000000000000.00000000")));
  vi.stubGlobal("fetch", fetch);
  await act(async () => {
    expect(await hook.result.current.start(sell, command => {
      if (!("investmentId" in command)) throw Error("wrong kind");
      return investmentService.operation(command);
    })).toBe("unknown");
  });
  const stored = sessionStorage.getItem(key)!;
  const saved = parseSavedCreation(stored, "exact-decimals", "INVESTMENT_OPERATION");
  expect(saved.command).toMatchObject(sell);
  expect(fetch.mock.calls[0][1].body).toBe(JSON.stringify(saved.command));
  fetch.mockImplementation(async () => new Response(`{"operationId":"${saved.command.operationId}","kind":"INVESTMENT_OPERATION","result":${raw("1000000000000.00000000")}}`));
  await act(async () => { expect(await hook.result.current.recover()).toBe("unknown"); });
  expect(sessionStorage.getItem(key)).toBe(stored);
  hook.unmount();
  const remounted = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  fetch.mockImplementation(async () => new Response(`{"operationId":"${saved.command.operationId}","kind":"INVESTMENT_OPERATION","result":${raw()}}`));
  await act(async () => { expect(await remounted.result.current.recover()).toBe("confirmed"); });
  expect(sessionStorage.getItem(key)).toBeNull();
  expect(fetch.mock.calls.filter(([, options]) => options.method === "POST")).toHaveLength(1);
});
