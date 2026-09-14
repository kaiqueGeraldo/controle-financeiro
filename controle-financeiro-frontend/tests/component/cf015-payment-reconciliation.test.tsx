import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useCards } from "@/hooks/useCards";
import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import { cardService, type CreditCard } from "@/services/cardService";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "cf015-payment" }, isLoading: false }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [], categories: [], refresh: async () => undefined }) }));

afterEach(() => vi.useRealTimers());

test("CF015-R03: pagamento confirmado com releitura 503 não fecha como reconciliado", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  const card: CreditCard = { id: "cf015-card", name: "Sintético", last4Digits: "4242", limit: 1000,
    closingDay: 20, dueDay: 28, color: "#111", brand: "VISA", currentInvoiceValue: 100 };
  vi.spyOn(cardService, "getAll").mockResolvedValue({ status: 200, data: [card] });
  vi.spyOn(cardService, "getInvoiceDetails").mockResolvedValue({ status: 200, data: {
    id: "invoice", month: 9, year: 2026, status: "OPEN", totalAmount: 100, transactions: [],
  } });
  vi.spyOn(cardService, "payInvoice").mockResolvedValue({ status: 200, data: undefined });
  const onClose = vi.fn();
  function Harness() {
    const cards = useCards();
    return <><button onClick={() => cards.selectCard(card)}>Selecionar</button>
      <PayInvoiceModal isOpen={!!cards.selectedCardId} onClose={onClose} onSuccess={cards.refreshAll}
        cardId={card.id} cardName={card.name} currentInvoiceValue={100} month={9} year={2026}
        accounts={[{ id: "account", name: "Sintética", balance: 500, type: "CHECKING", color: "#111", isArchived: false }]} /></>;
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Selecionar" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  vi.mocked(cardService.getInvoiceDetails).mockRejectedValue(new Error("503 sintético: releitura indisponível"));
  fireEvent.submit(screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!);
  await act(async () => { await Promise.resolve(); });
  expect(cardService.payInvoice).toHaveBeenCalledTimes(1);
  expect(cardService.getInvoiceDetails).toHaveBeenCalledTimes(2);
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toMatch(/confirmar|recarreg|reconcil/i);
});
