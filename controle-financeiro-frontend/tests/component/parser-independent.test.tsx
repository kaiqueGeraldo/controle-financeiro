import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { investmentService } from "@/services/investmentService";
import { parseInvestmentResultJson } from "@/services/investmentResultJson";
import { validateCreationResult } from "@/services/creationResult";
import type { InvestmentOperationDTO } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "parser-review" } }) }));
const command: InvestmentOperationDTO = { investmentId: "asset", accountId: "account", type: "BUY", quantity: 2, price: 100, fees: 0, date: "2027-01-15" };
const snapshot = '{"id":"10000000-0000-4000-8000-000000000001","type":"BUY","date":"2027-01-15","quantity":2,"price":100,"totalValue":200,"fees":0,"costDelta":200,"realizedResult":null,"dateOrigin":"USER_INPUT"}';
const inherited = '{"__proto__":' + snapshot + '}';
const storageKey = "cf-creation:v1:parser-review:INVESTMENT_OPERATION";

test("JSON object members must not be promoted into the prototype", () => {
  const value = parseInvestmentResultJson(inherited);
  expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  expect(Object.hasOwn(value as object, "__proto__")).toBe(true);
  expect(() => validateCreationResult(value, command)).toThrow();
});

test.each(["POST", "retry", "GET"])("inherited-only financial fields cannot confirm via %s", async route => {
  sessionStorage.clear();
  const hook = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  const fetch = vi.fn().mockImplementation(async () => new Response(inherited));
  vi.stubGlobal("fetch", fetch);
  const send = (value: unknown) => investmentService.operation(value as InvestmentOperationDTO);
  let outcome: unknown;
  let saved = "";
  if (route === "POST") {
    fetch.mockImplementation(async () => {
      saved = sessionStorage.getItem(storageKey)!;
      return new Response(inherited);
    });
    await act(async () => { outcome = await hook.result.current.start(command, send); });
  } else {
    await act(async () => { await hook.result.current.start(command, async () => { throw Error("lost delivery"); }); });
    saved = sessionStorage.getItem(storageKey)!;
    if (route === "retry") await act(async () => { outcome = await hook.result.current.retry(send); });
    else {
      const id = JSON.parse(saved).command.operationId;
      fetch.mockImplementation(async () => new Response('{"operationId":"' + id + '","kind":"INVESTMENT_OPERATION","result":' + inherited + '}'));
      await act(async () => { outcome = await hook.result.current.recover(); });
    }
  }
  expect.soft(outcome).toBe("unknown");
  expect.soft(sessionStorage.getItem(storageKey)).toBe(saved);
  expect.soft(hook.result.current.pending).not.toBeNull();
});

test("strings, escaped keys, arrays, booleans and null preserve their JSON meanings", () => {
  const raw = '{"note":"quantity: 2, \\"price\\":3","nested":[true,false,null,{"quanti\\u0074y":2.00000001}],"count":3}';
  const value = parseInvestmentResultJson(raw) as { note: string; nested: unknown[]; count: number };
  expect(value.note).toBe('quantity: 2, "price":3');
  expect(value.nested.slice(0, 3)).toEqual([true, false, null]);
  expect(value.nested[3]).toHaveProperty("quantity.value", "2.00000001");
  expect(value.count).toBe(3);
});

test.each(['{"quantity":01}', '{"quantity":+1}', '{"quantity":1.}', '{"quantity":1e}', '{"quantity":NaN}', '[1,]', '{"x":"\\q"}'])
  ("malformed JSON is rejected: %s", raw => { expect(() => parseInvestmentResultJson(raw)).toThrow(); });

test.each(["1e1025", "1e-1025", "1e99999999999999999999", "1".repeat(1025)])
  ("out-of-domain decimal work is bounded: %s", token => {
    expect(() => validateCreationResult(parseInvestmentResultJson(snapshot.replace('"quantity":2', '"quantity":' + token)), command)).toThrow();
  });
