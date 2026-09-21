import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useCards } from "@/hooks/useCards";
import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import { cardService, type CreditCard, type CardInvoiceDetails } from "@/services/cardService";

const session = vi.hoisted(() => ({ id: "lifecycle-owner" }));
const refreshFinance = vi.hoisted(() => vi.fn<() => Promise<void>>());
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: session.id }, isLoading: false }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [], categories: [], refresh: refreshFinance }) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const card: CreditCard = { id: "lifecycle-card", name: "Sintético", last4Digits: "4242", limit: 1000,
  closingDay: 20, dueDay: 28, color: "#111", brand: "VISA", currentInvoiceValue: 100 };
const invoice: CardInvoiceDetails = { id: "invoice", month: 9, year: 2026, status: "OPEN", totalAmount: 100, transactions: [] };
const paid: CardInvoiceDetails = { ...invoice, status: "PAID" };
function setup() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  session.id = "lifecycle-owner";
  refreshFinance.mockReset().mockResolvedValue(undefined);
  sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(cardService, "getAll").mockResolvedValue({ status: 200, data: [card] });
  const reads = vi.spyOn(cardService, "getInvoiceDetails").mockResolvedValue({ status: 200, data: invoice });
  vi.spyOn(cardService, "payInvoice").mockResolvedValue({ status: 200, data: undefined });
  return reads;
}
afterEach(() => { vi.useRealTimers(); sessionStorage.clear(); });

// A newer successful background batch does not certify the batch owned by the
// payment caller. Recovery must explicitly await its own complete read batch.
test.each(["failure-first", "success-first", "late-success", "late-error"] as const)(
  "R03/RV01: supersession %s preserves pending payment and read-only recovery", async order => {
    const reads = setup();
    const onClose = vi.fn();
    function Harness() {
      const cards = useCards();
      return <><button onClick={() => cards.selectCard(card)}>Selecionar</button>
        <output aria-label="Fatura">{cards.invoiceDetails?.status}</output>
        <PayInvoiceModal isOpen={!!cards.selectedCardId} onClose={onClose} onSuccess={cards.refreshAll}
          ownerId={session.id} cardId={card.id} cardName={card.name} currentInvoiceValue={100} month={9} year={2026}
          accounts={[{ id: "account", name: "Sintética", balance: 500, type: "CHECKING", color: "#111", isArchived: false }]} /></>;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar" }));
    await act(async () => vi.advanceTimersByTimeAsync(350));
    const first = deferred<{ status: number; data: CardInvoiceDetails }>();
    const second = deferred<{ status: number; data: CardInvoiceDetails }>();
    reads.mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);
    fireEvent.submit(screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!);
    await act(async () => Promise.resolve());
    await act(async () => { window.dispatchEvent(new Event("refreshCards")); });
    expect(reads).toHaveBeenCalledTimes(3);
    if (order.startsWith("late")) {
      await act(async () => second.resolve({ status: 200, data: paid }));
      expect(screen.getByLabelText("Fatura").textContent).toBe("PAID");
      expect(onClose).not.toHaveBeenCalled();
      await act(async () => {
        if (order === "late-error") first.reject(new Error("503 obsolete"));
        else first.resolve({ status: 200, data: invoice });
      });
    } else {
      await act(async () => first.reject(new Error("503 original")));
      expect(onClose).not.toHaveBeenCalled();
      await act(async () => {
        if (order === "failure-first") second.reject(new Error("503 replacement"));
        else second.resolve({ status: 200, data: paid });
      });
    }
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("Pagamento confirmado");
    expect(screen.getByRole("alert").textContent).toContain("cancelada ou substituída");
    expect((screen.getByRole("button", { name: "Confirmar Pagamento" }) as HTMLButtonElement).disabled).toBe(true);
    expect(sessionStorage.getItem("invoice-payment:lifecycle-owner:lifecycle-card:2026:9")).toBe("confirmed");
    if (order !== "failure-first") expect(screen.getByLabelText("Fatura").textContent).toBe("PAID");
    reads.mockResolvedValue({ status: 200, data: paid });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Atualizar dados sem repetir pagamento" })));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Fatura").textContent).toBe("PAID");
    expect(reads).toHaveBeenCalledTimes(4);
    expect(cardService.payInvoice).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("invoice-payment:lifecycle-owner:lifecycle-card:2026:9")).toBeNull();
  },
);

test.each(["session", "unmount"] as const)("R03/RV01: %s cancels even a batch whose reads all succeed", async action => {
  setup();
  const pending = deferred<void>();
  const view = renderHook(() => useCards());
  await act(async () => Promise.resolve());
  refreshFinance.mockImplementationOnce(() => pending.promise);
  let outcome!: Promise<unknown>;
  act(() => { outcome = view.result.current.refreshAll().catch(error => error); });
  // Cards have already committed successfully; the last consumer is still pending.
  await act(async () => Promise.resolve());
  if (action === "session") { session.id = "other-owner"; view.rerender(); }
  else view.unmount();
  await act(async () => pending.resolve());
  expect(await outcome).toMatchObject({ name: "ReconciliationCancelledError" });
});

test("R03/RV01: current batch preserves the actual read failure", async () => {
  setup();
  const view = renderHook(() => useCards());
  await act(async () => Promise.resolve());
  const failure = new Error("503 accounts");
  refreshFinance.mockRejectedValueOnce(failure);
  await act(async () => { await expect(view.result.current.refreshAll()).rejects.toBe(failure); });
});
