import { expect, test, vi } from "vitest";
import { parseInvestmentResultJson } from "@/services/investmentResultJson";
import { parse } from "@/services/vendor/lossless-json/parse";
import { validateCreationResult } from "@/services/creationResult";
import { recoverCreation, type SavedCreation } from "@/services/creationIntent";
import * as api from "@/services/api";
import type { InvestmentOperationDTO } from "@/types";

const command: InvestmentOperationDTO = { investmentId: "asset", accountId: "account", type: "BUY", quantity: 2, price: 100, fees: 0, date: "2027-01-15" };
const result = { id: "10000000-0000-4000-8000-000000000001", type: "BUY", date: "2027-01-15", dateOrigin: "USER_INPUT", quantity: 2, price: 100, totalValue: 200, fees: 0, costDelta: 200, realizedResult: null };

test("nonfinancial own-data construction agrees with JSON.parse for special names and nesting", () => {
  // Only exactly representable nonfinancial numbers: JSON.parse is not a decimal oracle.
  const keys = ["__proto__", "constructor", "prototype", "hasOwnProperty", 'quote"slash\\', "line\ntext", ""];
  for (const key of keys) {
    for (const value of [null, false, "__proto__", [2, { note: "constructor" }], { count: 3 }]) {
      const raw = '{' + JSON.stringify(key) + ':' + JSON.stringify(value) + '}';
      const expected = JSON.parse(raw);
      const actual = parseInvestmentResultJson(raw);
      expect(Object.getPrototypeOf(actual)).toBe(Object.prototype);
      expect(Object.getOwnPropertyDescriptors(actual)).toEqual(Object.getOwnPropertyDescriptors(expected));
    }
  }
});

test("ordinary inherited setter is not invoked during parsing or normal revival", () => {
  const key = "rvr24InheritedSetterProbe";
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, key);
  let calls = 0;
  let parsed: unknown;
  try {
    Object.defineProperty(Object.prototype, key, { configurable: true, set() { calls++; } });
    parsed = parseInvestmentResultJson('{"rvr24InheritedSetterProbe":{"nested":1}}');
  } finally {
    if (previous) Object.defineProperty(Object.prototype, key, previous);
    else Reflect.deleteProperty(Object.prototype, key);
  }
  expect(calls).toBe(0);
  expect(Object.getOwnPropertyDescriptor(parsed, key)).toEqual({ value: { nested: 1 }, enumerable: true, configurable: true, writable: true });
  expect(Object.getOwnPropertyDescriptor(Object.prototype, key)).toEqual(previous);
});

test("reviver replacement defines own data even if callback removes the existing member", () => {
  let calls = 0;
  const proto = Object.create(null);
  Object.defineProperty(proto, "member", { set() { calls++; }, configurable: true });
  const actual = parse('{"member":2}', function (this: Record<string, unknown>, key: string, value: unknown) {
    if (key === "member") {
      delete this.member;
      Object.setPrototypeOf(this, proto);
      return 3;
    }
    return value;
  });
  expect(calls).toBe(0);
  expect(Object.getOwnPropertyDescriptor(actual, "member")).toEqual({ value: 3, enumerable: true, configurable: true, writable: true });
});

test("the remaining in discriminator never accepts an inherited investmentId", () => {
  const { investmentId, ...own } = command;
  const inherited = Object.assign(Object.create({ investmentId }), own);
  expect(() => validateCreationResult(result, inherited)).toThrow();
  expect(() => validateCreationResult(result, Object.assign(Object.create(null), command))).not.toThrow();
});

test("recovery requires an own data wrapper before the own receipt and snapshot", async () => {
  const saved: SavedCreation = { version: 1, ownerId: "review", kind: "INVESTMENT_OPERATION", command: { ...command, operationId: "20000000-0000-4000-8000-000000000001" } };
  const data = { operationId: saved.command.operationId, kind: saved.kind, result };
  const mock = vi.spyOn(api, "apiRequest");
  mock.mockResolvedValue(Object.assign(Object.create({ data }), { status: 200 }));
  await expect(recoverCreation(saved)).rejects.toThrow("Recibo inválido");
  mock.mockResolvedValue({ status: 200, data });
  await expect(recoverCreation(saved)).resolves.toBeUndefined();
});
