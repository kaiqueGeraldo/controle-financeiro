import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { OperationModal } from "@/components/forms/operationModal";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import * as api from "@/services/api";
import { recoverCreation, type SavedCreation } from "@/services/creationIntent";
import { validateCreationResponse, validateCreationResult } from "@/services/creationResult";
import { parseInvestmentResultJson } from "@/services/investmentResultJson";
import { parse } from "@/services/vendor/lossless-json/parse";
import type { CreateTransactionDTO, InvestmentOperationDTO } from "@/types";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "own-fields" } }) }));
vi.mock("@/components/ui/modal", () => ({ Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [{ id: "account", balance: 1000 }] }) }));
const buy: InvestmentOperationDTO = { investmentId: "asset", accountId: "account", type: "BUY", quantity: 2, price: 100, fees: 0, date: "2027-01-15" };
const result = { id: "10000000-0000-4000-8000-000000000001", type: "BUY", date: "2027-01-15", dateOrigin: "USER_INPUT", quantity: 2, price: 100, totalValue: 200, fees: 0, costDelta: 200, realizedResult: null };
const key = "cf-creation:v1:own-fields:INVESTMENT_OPERATION";
beforeEach(() => sessionStorage.clear());

test.each(Object.keys(result))("required investment member %s cannot be inherited", field => {
  const own: Record<string, unknown> = { ...result };
  const inherited = own[field];
  delete own[field];
  const value = Object.assign(Object.create({ [field]: inherited }), own);
  expect(Object.hasOwn(value, field)).toBe(false);
  expect(() => validateCreationResult(value, buy)).toThrow();
});
test("own valid members on null/custom prototypes and shadowed method names remain valid", () => {
  for (const proto of [null, { totalValue: 999, constructor: "inherited extra" }]) {
    const value = Object.assign(Object.create(proto), result, { hasOwnProperty: false, prototype: "data" });
    expect(() => validateCreationResult(value, buy)).not.toThrow();
  }
  const invalid = Object.assign(Object.create(result), result, { quantity: undefined });
  expect(() => validateCreationResult(invalid, buy)).toThrow();
});
test("envelope data must be own, independently of snapshot validity", () => {
  expect(() => validateCreationResponse(Object.create({ data: result }), buy)).toThrow();
  expect(() => validateCreationResponse({ data: result, hasOwnProperty: null }, buy)).not.toThrow();
});
test.each(["operationId", "kind", "result"])("receipt member %s must be own", async field => {
  const saved: SavedCreation = { version: 1, ownerId: "own-fields", kind: "INVESTMENT_OPERATION", command: { ...buy, operationId: "20000000-0000-4000-8000-000000000001" } };
  const receipt: Record<string, unknown> = { operationId: saved.command.operationId, kind: saved.kind, result };
  const prototype = { [field]: receipt[field] };
  delete receipt[field];
  vi.spyOn(api, "apiRequest").mockResolvedValue({ status: 200, data: Object.assign(Object.create(prototype), receipt) });
  await expect(recoverCreation(saved)).rejects.toThrow("Recibo inválido");
});
test.each(["POST", "retry"])("direct inherited snapshot via %s keeps identity, valid recovery then completes", async route => {
  const hook = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  const send = vi.fn().mockResolvedValue({ data: Object.create(result) });
  await act(async () => { expect(await hook.result.current.start(buy, send)).toBe("unknown"); });
  const saved = sessionStorage.getItem(key)!;
  if (route === "retry") await act(async () => { expect(await hook.result.current.retry(send)).toBe("unknown"); });
  expect(sessionStorage.getItem(key)).toBe(saved);
  if (route === "retry") expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
  const command = JSON.parse(saved).command;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ operationId: command.operationId, kind: "INVESTMENT_OPERATION", result }))));
  await act(async () => { expect(await hook.result.current.recover()).toBe("confirmed"); });
  expect(sessionStorage.getItem(key)).toBeNull();
});
test("transaction and transfer snapshots also require their own conditional members", () => {
  const command: CreateTransactionDTO = { description: "constructor __proto__ prototype", type: "EXPENSE", amount: "25.00", date: "2027-01-15", accountId: "account", categoryId: "category", isPaid: true };
  const snapshot = { ...command, id: result.id, amount: 25, status: "SETTLED", isSystemManaged: false, origin: "USER" };
  expect(() => validateCreationResult(snapshot, command)).not.toThrow();
  for (const field of Object.keys(snapshot)) {
    const own: Record<string, unknown> = { ...snapshot };
    const inherited = { [field]: own[field] }; delete own[field];
    expect(() => validateCreationResult(Object.assign(Object.create(inherited), own), command)).toThrow();
  }
  const transfer = { ...command, type: "TRANSFER" as const, destinationAccountId: "other" };
  const transferResult = { ...snapshot, type: "TRANSFER", origin: "TRANSFER", operationId: result.id, transferDirection: "OUTBOUND", counterpartyAccountId: "other" };
  for (const field of ["operationId", "transferDirection", "counterpartyAccountId"]) {
    const own: Record<string, unknown> = { ...transferResult }; const proto = { [field]: own[field] }; delete own[field];
    expect(() => validateCreationResult(Object.assign(Object.create(proto), own), transfer)).toThrow();
  }
});
test.each(['{"mark":true}', 'null', '7', '"text"'])("__proto__ value %s stays a data member", rawValue => {
  const before = Object.getOwnPropertyDescriptors(Object.prototype);
  const raw = `{"__proto__":${rawValue},"constructor":{"prototype":{"mark":true}},"hasOwnProperty":false,"prototype":"data","text":"__proto__ constructor"}`;
  const expected = JSON.parse(raw); // nonfinancial, exactly representable construction oracle
  const actual = parseInvestmentResultJson(raw);
  expect(Object.getPrototypeOf(actual)).toBe(Object.prototype);
  expect(Object.getOwnPropertyDescriptors(actual)).toEqual(Object.getOwnPropertyDescriptors(expected));
  expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(before);
});
test("nested objects, escaped special keys and arrays preserve exact decimal tokens", () => {
  const value = parseInvestmentResultJson('{"nested":[{"__pro\\u0074o__":{"quantity":999999999999.99999999}},{"constructor":"data","quantity":0.00000001}]}');
  // Chai deliberately refuses __proto__ in a dotted property path; inspect the own descriptor.
  const nested = Object.getOwnPropertyDescriptor(value, "nested")!.value;
  const member = Object.getOwnPropertyDescriptor(nested[0], "__proto__")!;
  expect(Object.getPrototypeOf(nested[0])).toBe(Object.prototype);
  expect(member.value.quantity.value).toBe("999999999999.99999999");
  expect(value).toHaveProperty("nested.1.quantity.value", "0.00000001");
  expect(() => validateCreationResult(parseInvestmentResultJson('{"__proto__":' + JSON.stringify(result) + '}'), buy)).toThrow();
  const validWithExtra = parseInvestmentResultJson(JSON.stringify(result).replace(/}$/, ',"__proto__":{"note":"data"},"hasOwnProperty":null}'));
  expect(() => validateCreationResult(validWithExtra, buy)).not.toThrow();
});
test("duplicate-key replacement also defines a data property instead of invoking a setter", () => {
  const value = parse('{"__proto__":1,"__proto__":2}', undefined, { onDuplicateKey: () => ({ marker: true }) });
  expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  expect(Object.getOwnPropertyDescriptor(value, "__proto__")).toMatchObject({ value: { marker: true }, enumerable: true, writable: true, configurable: true });
});
test("actual modal suppresses success and close for inherited JSON, then valid recovery completes", async () => {
  const callbacks = { onSuccess: vi.fn(), onClose: vi.fn(), onReconcile: vi.fn() };
  const asset = { id: "asset", ticker: "OWN", name: "Own", type: "STOCK" as const, quantity: 10, currentPrice: 100, averagePrice: 100 };
  const view = render(<OperationModal isOpen asset={asset} {...callbacks} />);
  fireEvent.change(view.getByPlaceholderText("0"), { target: { value: "2" } });
  fireEvent.change(view.getByPlaceholderText("0,00"), { target: { value: "100" } });
  let matching = result;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
    const saved = JSON.parse(sessionStorage.getItem(key)!);
    matching = { ...result, date: saved.command.date };
    return new Response('{"__proto__":' + JSON.stringify(matching) + '}');
  }));
  await act(async () => fireEvent.submit(view.container.querySelector("form")!));
  const saved = sessionStorage.getItem(key)!;
  expect(callbacks.onSuccess).not.toHaveBeenCalled(); expect(callbacks.onClose).not.toHaveBeenCalled();
  expect(view.getByRole("button", { name: "Confirmar Operação" }).hasAttribute("disabled")).toBe(true);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ operationId: JSON.parse(saved).command.operationId, kind: "INVESTMENT_OPERATION", result: matching }))));
  await act(async () => fireEvent.click(view.getByRole("button", { name: "Consultar recibo" })));
  expect(callbacks.onSuccess).toHaveBeenCalledTimes(1); expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem(key)).toBeNull();
});
