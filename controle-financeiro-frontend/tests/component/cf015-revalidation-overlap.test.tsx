import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useCards } from "@/hooks/useCards";
import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import { cardService, type CreditCard, type CardInvoiceDetails } from "@/services/cardService";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "review-overlap" }, isLoading: false }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [], categories: [], refresh: async () => undefined }) }));
afterEach(() => vi.useRealTimers());

test("R03 revalidação: refresh concorrente não transforma releitura recusada em reconciliação concluída", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  const card: CreditCard = { id: "overlap-card", name: "Sintético", last4Digits: "4242", limit: 1000,
    closingDay: 20, dueDay: 28, color: "#111", brand: "VISA", currentInvoiceValue: 100 };
  const invoice: CardInvoiceDetails = { id: "invoice", month: 9, year: 2026, status: "OPEN", totalAmount: 100, transactions: [] };
  vi.spyOn(cardService, "getAll").mockResolvedValue({ status: 200, data: [card] });
  const reads = vi.spyOn(cardService, "getInvoiceDetails").mockResolvedValue({ status: 200, data: invoice });
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
  await act(async () => vi.advanceTimersByTimeAsync(350));
  let rejectFirst!: (error: Error) => void;
  let rejectSecond!: (error: Error) => void;
  reads.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectFirst = reject; }))
    .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSecond = reject; }));
  fireEvent.submit(screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!);
  await act(async () => Promise.resolve());
  expect(reads).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Fechar modal" }));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(onClose).not.toHaveBeenCalled();
  await act(async () => { window.dispatchEvent(new Event("refreshCards")); });
  expect(reads).toHaveBeenCalledTimes(3);
  await act(async () => { rejectFirst(new Error("503 original")); });
  await act(async () => { rejectSecond(new Error("503 substituta")); });
  expect(cardService.payInvoice).toHaveBeenCalledTimes(1);
  // AC-UI-006/011: nenhuma das releituras confirmou o estado financeiro.
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toContain("Pagamento confirmado");
});
