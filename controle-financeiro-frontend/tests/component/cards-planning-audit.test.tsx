import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import { CreditCardItem } from "@/components/screens/cards/creditCardItem";
import { InvoiceDetails } from "@/components/screens/cards/invoiceDetails";
import { ApiError } from "@/services/api";
import { cardService, type CardInvoiceTransaction, type CreditCard } from "@/services/cardService";

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { privacyMode: false } }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => createElement("img", props),
}));

const card: CreditCard = {
  id: "card-synthetic",
  name: "Cartão sintético com nome muito longo para validar a área de clique",
  last4Digits: "4242",
  limit: 5000,
  closingDay: 30,
  dueDay: 10,
  color: "#111111",
  brand: "VISA",
  currentInvoiceValue: 1200,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function renderInvoice(
  status: "OPEN" | "CLOSED" | "PAID",
  transactions: CardInvoiceTransaction[] = [],
) {
  return render(
    <InvoiceDetails
      card={card}
      isOpen
      onClose={vi.fn()}
      invoiceData={{
        id: `invoice-${status}`,
        month: 9,
        year: 2026,
        status,
        totalAmount: status === "PAID" ? 0 : 1200,
        transactions,
      }}
      isLoadingInvoice={false}
      viewDateFormatted="setembro de 2026"
      onChangeMonth={vi.fn()}
      onPay={vi.fn()}
      onDelete={vi.fn()}
      onUpdateLimit={vi.fn()}
      canGoBack
      canGoForward
    />,
  );
}

describe("CF-013: cartões, faturas e planejamento", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("o cartão inteiro é uma ação de detalhe alcançável por teclado", () => {
    const onClick = vi.fn();
    render(<CreditCardItem card={card} onClick={onClick} />);

    const cardAction = screen.getByRole("button", { name: /ver fatura de cartão sintético/i });
    fireEvent.click(cardAction);

    expect(onClick).toHaveBeenCalledWith(card);
  });

  test.each([
    ["OPEN", "Aberta", "Adiantar Fatura", false],
    ["CLOSED", "Fechada", "Pagar Fatura", false],
    ["PAID", "Paga", "Fatura Paga", true],
  ] as const)(
    "apresenta fatura %s com status e ação coerentes",
    (status, label, paymentAction, disabled) => {
      renderInvoice(status);

      expect(screen.getByText(label)).toBeDefined();
      expect(screen.getByRole("button", { name: paymentAction })).toHaveProperty("disabled", disabled);
      expect(screen.getByText(/Fecha:/).textContent).toContain("30 de ago");
      expect(screen.getByText(/Vence:/).textContent).toContain("10 de set");
    },
  );

  test("lista longa mantém a ação de pagamento fora da área rolável", () => {
    const transactions = Array.from({ length: 80 }, (_, index) => ({
      id: `transaction-${index}`,
      description: `Compra sintética ${index}`,
      amount: 10,
      date: "2026-09-08",
    }));

    renderInvoice("CLOSED", transactions);

    const paymentAction = screen.getByRole("button", { name: "Pagar Fatura" });
    expect(paymentAction.parentElement?.className).toContain("shrink-0");
    expect(screen.getByText("Compra sintética 79")).toBeDefined();
  });

  test("pagamento parcial aguarda a releitura antes de fechar o formulário", async () => {
    const confirmation = deferred<void>();
    const onClose = vi.fn();
    vi.spyOn(cardService, "payInvoice").mockResolvedValue({ status: 200, data: undefined });

    render(
      <PayInvoiceModal
        isOpen
        onClose={onClose}
        onSuccess={() => confirmation.promise}
        cardId={card.id}
        cardName={card.name}
        accounts={[{ id: "account-synthetic", name: "Conta sintética", balance: 3000, type: "CHECKING", color: "#111", isArchived: false }]}
        currentInvoiceValue={1200}
        month={9}
        year={2026}
      />,
    );

    fireEvent.change(screen.getByLabelText("Valor do Pagamento"), { target: { value: "400.00" } });
    fireEvent.submit(screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!);

    await act(async () => Promise.resolve());
    expect(cardService.payInvoice).toHaveBeenCalledWith(card.id, expect.objectContaining({ amount: 400, month: 9, year: 2026, isPrepayment: false }));
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      confirmation.resolve();
      await confirmation.promise;
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("falha de resultado desconhecido conserva o pagamento e orienta a reconciliação", async () => {
    vi.spyOn(cardService, "payInvoice").mockRejectedValue(
      new ApiError("Timeout sintético", 504, { requiresReconciliation: true }),
    );
    const onClose = vi.fn();

    render(
      <PayInvoiceModal
        isOpen
        onClose={onClose}
        onSuccess={vi.fn()}
        cardId={card.id}
        cardName={card.name}
        accounts={[{ id: "account-synthetic", name: "Conta sintética", balance: 3000, type: "CHECKING", color: "#111", isArchived: false }]}
        currentInvoiceValue={1200}
        month={9}
        year={2026}
      />,
    );

    fireEvent.change(screen.getByLabelText("Valor do Pagamento"), { target: { value: "400.00" } });
    fireEvent.submit(screen.getByRole("button", { name: "Confirmar Pagamento" }).closest("form")!);

    await act(async () => Promise.resolve());
    expect(screen.getByRole("alert").textContent).toContain("Não foi possível confirmar o pagamento");
    expect((screen.getByLabelText("Valor do Pagamento") as HTMLInputElement).value).toBe("400.00");
    expect(onClose).not.toHaveBeenCalled();
  });
});
