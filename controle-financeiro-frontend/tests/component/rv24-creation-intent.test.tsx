import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { NewTransactionModal } from "@/components/forms/newTransactionModal";
import { ApiError } from "@/services/api";
import { transactionService } from "@/services/transactionService";
const session = vi.hoisted(() => ({ user: { id: "owner-A" } }));
vi.mock("@/hooks/useUser", () => ({ useUser: () => session }));
vi.mock("@/components/ui/modal", () => ({ Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => isOpen ? <div>{children}</div> : null }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/services/transactionService", () => ({ transactionService: { create: vi.fn() } }));
const unknown = new ApiError("Unknown outcome", 502, { requiresReconciliation: true });
const props = { onClose: vi.fn(), onSuccess: vi.fn(), accounts: [{ id: "account", name: "Conta", type: "CHECKING" as const, balance: 1000, color: "BLUE", isArchived: false }], categories: [{ id: "category", name: "Categoria", type: "EXPENSE" as const, icon: "Tag", color: "BLUE" }] };
function form() {
  const view = render(<NewTransactionModal {...props} isOpen />);
  fireEvent.change(view.getByPlaceholderText("0,00"), { target: { value: "25.00" } });
  fireEvent.change(view.getByPlaceholderText("Ex: Mercado, Salário..."), { target: { value: "Review" } });
  fireEvent.change(view.getByLabelText("Categoria do lançamento"), { target: { value: "category" } });
  fireEvent.change(view.getByLabelText("Conta do lançamento"), { target: { value: "account" } });
  return view;
}
async function submit(view: ReturnType<typeof form>) { await act(async () => fireEvent.submit(view.container.querySelector("form")!)); }
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); session.user = { id: "owner-A" }; vi.mocked(transactionService.create).mockRejectedValue(unknown); });

test("original causal expectation: unknown result prevents a second creation; identity is persisted before POST", async () => {
  vi.mocked(transactionService.create).mockImplementation(async command => {
    expect(JSON.parse(sessionStorage.getItem("cf-creation:v1:owner-A:TRANSACTION_CREATE")!).command).toEqual(command);
    throw unknown;
  });
  const view = form(); await submit(view); await submit(view);
  expect(transactionService.create).toHaveBeenCalledTimes(1);
  expect(vi.mocked(transactionService.create).mock.calls[0][0].operationId).toMatch(/^[0-9a-f-]{36}$/);
  expect(props.onSuccess).not.toHaveBeenCalled();
});
test("closing, reopening and remount preserve exact retry body, even if draft was changed", async () => {
  const view = form(); await submit(view);
  const original = vi.mocked(transactionService.create).mock.calls[0][0];
  view.rerender(<NewTransactionModal {...props} isOpen={false} />);
  view.rerender(<NewTransactionModal {...props} isOpen />);
  expect((view.getByText("Repetir a mesma intenção") as HTMLButtonElement).disabled).toBe(false);
  view.unmount();
  const reopened = form();
  vi.mocked(transactionService.create).mockResolvedValue({ status: 200, data: {} } as never);
  await act(async () => fireEvent.click(reopened.getByText("Repetir a mesma intenção")));
  expect(transactionService.create).toHaveBeenLastCalledWith(original);
  expect(props.onSuccess).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem("cf-creation:v1:owner-A:TRANSACTION_CREATE")).toBeNull();
});
test.each([404, 503])("GET %s does not unlock a new intention", async status => {
  const view = form(); await submit(view);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"message":"synthetic"}', { status })));
  await act(async () => fireEvent.click(view.getByText("Consultar recibo")));
  await submit(view);
  expect(transactionService.create).toHaveBeenCalledTimes(1);
  expect((view.getByText("Salvar Transação") as HTMLButtonElement).disabled).toBe(true);
  expect(props.onSuccess).not.toHaveBeenCalled();
});
test("authenticated receipt confirms without POST; later equal legitimate intention gets a new identity", async () => {
  const view = form(); await submit(view);
  const command = vi.mocked(transactionService.create).mock.calls[0][0];
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ operationId: command.operationId, kind: "TRANSACTION_CREATE", result: { id: "fact" } })));
  vi.stubGlobal("fetch", fetch);
  await act(async () => fireEvent.click(view.getByText("Consultar recibo")));
  expect(fetch).toHaveBeenCalledWith(`/api/financial-intents/${command.operationId}`, expect.objectContaining({ method: "GET", cache: "no-store" }));
  expect(transactionService.create).toHaveBeenCalledTimes(1);
  vi.mocked(transactionService.create).mockResolvedValue({ status: 200, data: {} } as never);
  await submit(view);
  expect(vi.mocked(transactionService.create).mock.calls[1][0]).toEqual({ ...command, operationId: expect.any(String) });
  expect(vi.mocked(transactionService.create).mock.calls[1][0].operationId).not.toBe(command.operationId);
});
test("owner switch suppresses late success and leaves A intent untouched; B never retries it", async () => {
  let finish!: (value: never) => void;
  vi.mocked(transactionService.create).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const view = form(); act(() => fireEvent.submit(view.container.querySelector("form")!));
  const saved = sessionStorage.getItem("cf-creation:v1:owner-A:TRANSACTION_CREATE");
  session.user = { id: "owner-B" };
  view.rerender(<NewTransactionModal {...props} isOpen />);
  await act(async () => finish({ status: 200, data: {} } as never));
  expect(props.onSuccess).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("cf-creation:v1:owner-A:TRANSACTION_CREATE")).toBe(saved);
  expect(view.queryByText("Repetir a mesma intenção")).toBeNull();
  session.user = { id: "owner-A" }; view.rerender(<NewTransactionModal {...props} isOpen />);
  await waitFor(() => expect((view.getByText("Repetir a mesma intenção") as HTMLButtonElement).disabled).toBe(false));
});
test("storage unavailable prevents POST; corrupted saved payload cannot be silently discarded", async () => {
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  const view = form(); await submit(view); expect(transactionService.create).not.toHaveBeenCalled();
  write.mockRestore(); view.unmount();
  sessionStorage.setItem("cf-creation:v1:owner-A:TRANSACTION_CREATE", '{"version":999}');
  const corrupt = form(); await submit(corrupt); expect(transactionService.create).not.toHaveBeenCalled();
  expect(corrupt.getByRole("alert").textContent).toContain("Confira o histórico");
});
test("definitive initial rejection permits correcting the draft with a new identity", async () => {
  vi.mocked(transactionService.create).mockRejectedValueOnce(new ApiError("Validation", 400));
  const view = form(); await submit(view);
  fireEvent.change(view.getByPlaceholderText("0,00"), { target: { value: "30" } });
  await submit(view);
  expect(transactionService.create).toHaveBeenCalledTimes(2);
  const calls = vi.mocked(transactionService.create).mock.calls;
  expect(calls[1][0].operationId).not.toBe(calls[0][0].operationId);
  expect(calls[1][0].amount).toBe("30");
});
test("unmount during POST suppresses late success and preserves the durable intention", async () => {
  let finish!: (value: never) => void;
  vi.mocked(transactionService.create).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const view = form(); act(() => fireEvent.submit(view.container.querySelector("form")!));
  const before = sessionStorage.getItem("cf-creation:v1:owner-A:TRANSACTION_CREATE"); view.unmount();
  await act(async () => finish({ status: 200, data: {} } as never));
  expect(props.onSuccess).not.toHaveBeenCalled(); expect(sessionStorage.getItem("cf-creation:v1:owner-A:TRANSACTION_CREATE")).toBe(before);
});
test("receipt for a different kind or identity cannot unlock creation", async () => {
  const view = form(); await submit(view);
  const command = vi.mocked(transactionService.create).mock.calls[0][0];
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ operationId: command.operationId, kind: "INVESTMENT_OPERATION", result: {} }))));
  await act(async () => fireEvent.click(view.getByText("Consultar recibo")));
  await submit(view); expect(transactionService.create).toHaveBeenCalledTimes(1); expect(props.onSuccess).not.toHaveBeenCalled();
});
test("an array is not a receipt result object and must not confirm unknown money", async () => {
  const view = form(); await submit(view);
  const command = vi.mocked(transactionService.create).mock.calls[0][0];
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ operationId: command.operationId, kind: "TRANSACTION_CREATE", result: [] }))));
  await act(async () => fireEvent.click(view.getByText("Consultar recibo")));
  expect(props.onSuccess).not.toHaveBeenCalled(); await submit(view);
  expect(transactionService.create).toHaveBeenCalledTimes(1);
});
