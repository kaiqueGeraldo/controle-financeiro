import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { StrictMode } from "react";
import { useCreationIntent } from "@/hooks/useCreationIntent";
import { OperationModal } from "@/components/forms/operationModal";
import { ApiError } from "@/services/api";
import { validateCreationResult } from "@/services/creationResult";
import type { CreateTransactionDTO, InvestmentOperationDTO } from "@/types";

const session = vi.hoisted(() => ({ user: { id: "residual-A" } }));
vi.mock("@/hooks/useUser", () => ({ useUser: () => session }));
vi.mock("@/components/ui/modal", () => ({ Modal: ({children}: {children: React.ReactNode}) => <div>{children}</div> }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [{id: "account", balance: 1000}] }) }));
const tx: CreateTransactionDTO = {description: "Review", amount: "25.00", date: "2027-01-15", type: "EXPENSE", accountId: "account", categoryId: "category", isPaid: true};
const buy: InvestmentOperationDTO = {investmentId: "asset", type: "BUY", quantity: 2, price: 100, fees: 0, date: "2027-01-15", accountId: "account"};
const txResult = {id: "10000000-0000-4000-8000-000000000001", description: "Review", amount: 25, date: "2027-01-15", type: "EXPENSE", accountId: "account", categoryId: "category", isPaid: true, isSystemManaged: false, status: "SETTLED", origin: "USER"};
const buyResult = {id: "10000000-0000-4000-8000-000000000002", type: "BUY", date: "2027-01-15", dateOrigin: "USER_INPUT", quantity: 2, price: 100, totalValue: 200, fees: 0, costDelta: 200, realizedResult: null};
const key = "cf-creation:v1:residual-A:TRANSACTION_CREATE";
beforeEach(() => { sessionStorage.clear(); session.user = {id: "residual-A"}; });

const invalidResults = [null, [], {}, {...txResult, id: ""}, {...txResult, amount: "25"}, {...txResult, amount: null}, {...txResult, amount: Infinity}, {...txResult, type: "INCOME"}, {...txResult, date: "2027-01-16"}, {...txResult, accountId: "other"}, {...txResult, categoryId: "other"}, {...txResult, isPaid: "true"}, {...txResult, status: "PENDING"}];
test.each(invalidResults.map((value, index) => ({value, index})))("transaction invalid result $index remains recoverable on POST, retry and GET", async ({value}) => {
  const {result} = renderHook(() => useCreationIntent("TRANSACTION_CREATE"));
  const send = vi.fn().mockResolvedValue({data: value});
  await act(async () => { expect(await result.current.start(tx, send)).toBe("unknown"); });
  const saved = sessionStorage.getItem(key)!;
  await act(async () => { expect(await result.current.retry(send)).toBe("unknown"); });
  expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
  const command = JSON.parse(saved).command;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({operationId: command.operationId, kind: "TRANSACTION_CREATE", result: value}))));
  await act(async () => { expect(await result.current.recover()).toBe("unknown"); });
  expect(sessionStorage.getItem(key)).toBe(saved);
});

test.each(["id", "type", "date", "dateOrigin", "quantity", "price", "totalValue", "fees", "costDelta", "realizedResult"])("investment missing %s cannot confirm and valid retry keeps identity", async field => {
  const {result} = renderHook(() => useCreationIntent("INVESTMENT_OPERATION"));
  const incomplete: Record<string, unknown> = {...buyResult}; delete incomplete[field];
  const send = vi.fn().mockResolvedValueOnce({data: incomplete}).mockResolvedValue({data: buyResult});
  await act(async () => { expect(await result.current.start(buy, send)).toBe("unknown"); });
  const saved = result.current.pending;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({operationId: saved!.command.operationId, kind: "INVESTMENT_OPERATION", result: incomplete}))));
  await act(async () => { expect(await result.current.recover()).toBe("unknown"); });
  await act(async () => { expect(await result.current.retry(send)).toBe("confirmed"); });
  expect(send.mock.calls[1][0]).toEqual(saved!.command);
  expect(result.current.pending).toBeNull();
});

test("valid result reaching removeItem keeps intent when storage removal fails", async () => {
  const {result} = renderHook(() => useCreationIntent("TRANSACTION_CREATE"));
  const remove = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {throw Error("unavailable");});
  await act(async () => { expect(await result.current.start(tx, async () => ({data: txResult}))).toBe("unknown"); });
  expect(remove).toHaveBeenCalledWith(key);
  expect(sessionStorage.getItem(key)).not.toBeNull();
});

test("transfer ledger pair identity differs from intent; pending and monetary redemption remain valid", () => {
  const transfer = {...tx, type: "TRANSFER" as const, categoryId: "", destinationAccountId: "destination", operationId: "20000000-0000-4000-8000-000000000001"};
  expect(() => validateCreationResult({...txResult, type: "TRANSFER", origin: "TRANSFER", categoryId: null, operationId: "30000000-0000-4000-8000-000000000001", transferDirection: "OUTBOUND", counterpartyAccountId: "destination"}, transfer)).not.toThrow();
  expect(() => validateCreationResult({...txResult, isPaid: false, status: "PENDING"}, {...tx, isPaid: false})).not.toThrow();
  expect(() => validateCreationResult({...buyResult, type: "SELL", quantity: 1.5, price: 133.33333333, costDelta: null, realizedResult: null}, {...buy, type: "SELL", amount: "200.00"})).not.toThrow();
  // Monetary command uses gross amount; descriptive price may round to zero at scale 8.
  expect(() => validateCreationResult({...buyResult, type: "SELL", quantity: 200000000, price: 0, totalValue: 0.01, costDelta: null, realizedResult: null}, {...buy, type: "SELL", amount: "0.01"})).not.toThrow();
  for (const type of ["SELL", "DIVIDEND", "INTEREST"] as const) expect(() => validateCreationResult({...buyResult, type, costDelta: null, realizedResult: null}, {...buy, type})).not.toThrow();
});

const asset = {id: "asset", name: "Asset", ticker: "TEST", type: "STOCK" as const, quantity: 10, averagePrice: 100, currentPrice: 100};
test.each(["unmount", "A-B", "A-B-A", "expired"].flatMap(mode => ["success", "error"].map(response => ({mode, response}))))("late $response after $mode leaves intent and no consumer callbacks", async ({mode, response}) => {
  let resolve!: (value: Response) => void;
  let reject!: (error: Error) => void;
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((yes, no) => {resolve = yes; reject = no;})));
  const callbacks = {onSuccess: vi.fn(), onClose: vi.fn(), onReconcile: vi.fn()};
  const component = <OperationModal isOpen asset={asset} {...callbacks}/>;
  const view = render(<StrictMode>{component}</StrictMode>);
  fireEvent.change(view.getByPlaceholderText("0"), {target: {value: "2"}});
  fireEvent.change(view.getByPlaceholderText("0,00"), {target: {value: "100"}});
  act(() => fireEvent.submit(view.container.querySelector("form")!));
  const storageKey = "cf-creation:v1:residual-A:INVESTMENT_OPERATION";
  const saved = sessionStorage.getItem(storageKey);
  if (mode === "unmount") view.unmount();
  else if (mode === "expired") act(() => window.dispatchEvent(new Event("sessionExpired")));
  else {
    session.user = {id: "residual-B"}; view.rerender(<StrictMode><OperationModal isOpen asset={asset} {...callbacks}/></StrictMode>);
    if (mode === "A-B-A") {session.user = {id: "residual-A"}; view.rerender(<StrictMode><OperationModal isOpen asset={asset} {...callbacks}/></StrictMode>);}
  }
  await act(async () => {if (response === "error") reject(new Error("network")); else resolve(new Response(JSON.stringify({...buyResult, date: JSON.parse(saved!).command.date})));});
  expect(sessionStorage.getItem(storageKey)).toBe(saved);
  expect(callbacks.onSuccess).not.toHaveBeenCalled(); expect(callbacks.onClose).not.toHaveBeenCalled(); expect(callbacks.onReconcile).not.toHaveBeenCalled();
});

test.each(["unknown", "rejected"])("active %s investment execution still reconciles", async mode => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"message":"synthetic"}', {status: mode === "unknown" ? 502 : 400})));
  const onReconcile = vi.fn(), onSuccess = vi.fn();
  const view = render(<OperationModal isOpen asset={asset} onSuccess={onSuccess} onClose={vi.fn()} onReconcile={onReconcile}/>);
  fireEvent.change(view.getByPlaceholderText("0"), {target: {value: "2"}}); fireEvent.change(view.getByPlaceholderText("0,00"), {target: {value: "100"}});
  await act(async () => fireEvent.submit(view.container.querySelector("form")!));
  expect(onReconcile).toHaveBeenCalledTimes(1); expect(onSuccess).not.toHaveBeenCalled();
});

test.each(["recover", "retry"] as const)("late %s error from A cannot affect new A session and valid recovery is retained", async mode => {
  const {result, rerender} = renderHook(() => useCreationIntent("TRANSACTION_CREATE"));
  await act(async () => {await result.current.start(tx, async () => {throw new ApiError("Unknown", 502);});});
  const saved = sessionStorage.getItem(key)!;
  let reject!: (error: Error) => void;
  const pending = new Promise<never>((_, no) => {reject = no;});
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));
  let work!: Promise<unknown>;
  act(() => {work = mode === "recover" ? result.current.recover() : result.current.retry(() => pending);});
  session.user = {id: "residual-B"}; rerender(); session.user = {id: "residual-A"}; rerender();
  await act(async () => {reject(new Error("late error")); expect(await work).toBe("obsolete");});
  expect(sessionStorage.getItem(key)).toBe(saved);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({operationId: JSON.parse(saved).command.operationId, kind: "TRANSACTION_CREATE", result: txResult}))));
  await act(async () => {expect(await result.current.recover()).toBe("confirmed");});
});
