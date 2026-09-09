import { act, fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NewCardTransactionModal } from "@/components/forms/newCardTransactionModal";
import { NewTransactionModal } from "@/components/forms/newTransactionModal";
import { OperationModal } from "@/components/forms/operationModal";
import { PayInvoiceModal } from "@/components/forms/payInvoiceModal";
import { ApiError } from "@/services/api";
import { cardService } from "@/services/cardService";
import { transactionService } from "@/services/transactionService";
import { investmentService } from "@/services/investmentService";
import type { Account, Category, Investment } from "@/types";

vi.mock("@/components/ui/modal", () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock("@/contexts/toastContext", () => ({
  useToast: () => ({ error: vi.fn(), info: vi.fn(), success: vi.fn() }),
}));

vi.mock("@/hooks/useFinanceData", () => ({
  useFinanceData: () => ({ accounts }),
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { privacyMode: false } }),
}));

vi.mock("@/services/cardService", () => ({
  cardService: {
    createTransaction: vi.fn(),
    getAll: vi.fn(),
    payInvoice: vi.fn(),
  },
}));

vi.mock("@/services/investmentService", () => ({
  investmentService: {
    operation: vi.fn(),
    updateBalance: vi.fn(),
  },
}));

vi.mock("@/services/transactionService", () => ({
  transactionService: { create: vi.fn() },
}));

const accounts: Account[] = [
  {
    id: "account-synthetic",
    name: "Conta Sintética",
    type: "CHECKING",
    balance: 1000,
    color: "#000000",
    isArchived: false,
  },
];

const categories: Category[] = [
  {
    id: "category-synthetic",
    name: "Categoria Sintética",
    icon: "Tag",
    color: "#000000",
    type: "EXPENSE",
  },
];

const asset: Investment = {
  id: "investment-synthetic",
  ticker: "TEST3",
  name: "Ativo Sintético",
  type: "STOCK",
  quantity: 1,
  averagePrice: 10,
  currentPrice: 10,
};

const modalCallbacks = {
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

function dateInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="date"]');
  if (!input) throw new Error("Campo de data não renderizado");
  return input;
}

function timeInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="time"]');
  if (!input) throw new Error("Campo de hora não renderizado");
  return input;
}

describe("defaults e payloads de data civil nos formulários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T02:59:59.000Z"));
    vi.mocked(cardService.getAll).mockResolvedValue({ status: 200, data: [] });
    vi.mocked(cardService.createTransaction).mockResolvedValue({
      status: 201,
      data: {},
    });
    vi.mocked(cardService.payInvoice).mockResolvedValue({ status: 200, data: {} });
    vi.mocked(transactionService.create).mockResolvedValue({
      status: 201,
      data: {
        id: "10000000-0000-0000-0000-000000000010",
        description: "Receita sintética",
        amount: 10,
        date: "2026-09-07",
        createdAt: "2026-09-07T23:30:00",
        isPaid: false,
        type: "INCOME",
        accountId: "10000000-0000-0000-0000-000000000001",
      },
    });
  });

  test("abre os quatro formulários às 23h59 com o dia do navegador, não o UTC", () => {
    expect(new Date().getDate()).toBe(7);
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-09-08");

    const renderers = [
      () =>
        render(
          <NewTransactionModal
            {...modalCallbacks}
            isOpen
            accounts={accounts}
            categories={categories}
          />,
        ),
      () =>
        render(
          <NewCardTransactionModal
            {...modalCallbacks}
            isOpen
            categories={categories}
            defaultCardId="card-synthetic"
          />,
        ),
      () =>
        render(
          <OperationModal {...modalCallbacks} isOpen asset={asset} />,
        ),
      () =>
        render(
          <PayInvoiceModal
            {...modalCallbacks}
            isOpen
            cardId="card-synthetic"
            cardName="Cartão Sintético"
            accounts={accounts}
            currentInvoiceValue={100}
            month={9}
            year={2026}
          />,
        ),
    ];

    for (const renderModal of renderers) {
      const rendered = renderModal();
      expect(dateInput(rendered.container).value).toBe("2026-09-07");
      rendered.unmount();
    }
  });

  test("R11: refresh de contas/ativo não apaga data editada no formulário aberto", () => {
    const paymentProps = { ...modalCallbacks, isOpen: true, cardId: "card-synthetic",
      cardName: "Cartão Sintético", accounts, currentInvoiceValue: 100, month: 9, year: 2026 };
    const payment = render(<PayInvoiceModal {...paymentProps} />);
    fireEvent.change(dateInput(payment.container), { target: { value: "2024-02-29" } });
    fireEvent.change(timeInput(payment.container), { target: { value: "08:15" } });
    act(() => vi.advanceTimersByTime(2_000));
    payment.rerender(<PayInvoiceModal {...paymentProps} accounts={[...accounts]} currentInvoiceValue={90} />);
    expect(dateInput(payment.container).value).toBe("2024-02-29");
    expect(timeInput(payment.container).value).toBe("08:15");
    payment.unmount();

    const operation = render(<OperationModal {...modalCallbacks} isOpen asset={asset} />);
    fireEvent.change(dateInput(operation.container), { target: { value: "2024-02-29" } });
    operation.rerender(<OperationModal {...modalCallbacks} isOpen asset={{ ...asset, currentPrice: 11 }} />);
    expect(dateInput(operation.container).value).toBe("2024-02-29");
  });

  test("preserva o campo aberto na virada e submete exatamente a data digitada", async () => {
    const props = {
      ...modalCallbacks,
      accounts,
      categories,
    };
    const rendered = render(<NewTransactionModal {...props} isOpen />);
    const input = dateInput(rendered.container);

    expect(input.value).toBe("2026-09-07");
    expect(timeInput(rendered.container).value).toBe("23:59");
    act(() => vi.advanceTimersByTime(2_000));
    expect(input.value).toBe("2026-09-07");
    expect(timeInput(rendered.container).value).toBe("23:59");

    fireEvent.change(input, { target: { value: "2024-02-29" } });
    await act(async () => {
      fireEvent.submit(rendered.container.querySelector("form")!);
      await Promise.resolve();
    });

    expect(transactionService.create).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2024-02-29", time: "23:59" }),
    );

    rendered.rerender(<NewTransactionModal {...props} isOpen={false} />);
    rendered.rerender(<NewTransactionModal {...props} isOpen />);
    expect(dateInput(rendered.container).value).toBe("2026-09-08");
    expect(timeInput(rendered.container).value).toBe("00:00");
  });

  test("AC-UI-006: 503 mantém dados do formulário e não sinaliza sucesso", async () => {
    vi.mocked(transactionService.create).mockRejectedValueOnce(
      new ApiError("Serviço temporariamente indisponível.", 503, {
        kind: "unavailable",
        retryable: true,
        requiresReconciliation: true,
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const rendered = render(
      <NewTransactionModal
        {...modalCallbacks}
        isOpen
        accounts={accounts}
        categories={categories}
      />,
    );
    const amount = rendered.getByPlaceholderText("0,00") as HTMLInputElement;
    const description = rendered.getByPlaceholderText(
      "Ex: Mercado, Salário...",
    ) as HTMLInputElement;
    const selects = rendered.container.querySelectorAll("select");

    fireEvent.change(amount, { target: { value: "42.17" } });
    fireEvent.change(description, { target: { value: "Despesa recuperável" } });
    fireEvent.change(selects[0], { target: { value: categories[0].id } });
    fireEvent.change(selects[1], { target: { value: accounts[0].id } });

    await act(async () => {
      fireEvent.submit(rendered.container.querySelector("form")!);
      await Promise.resolve();
    });

    expect(amount.value).toBe("42.17");
    expect(description.value).toBe("Despesa recuperável");
    expect(modalCallbacks.onSuccess).not.toHaveBeenCalled();
    expect(modalCallbacks.onClose).not.toHaveBeenCalled();
  });

  test("R12: conflito de investimento não dispara callback de sucesso", async () => {
    const onReconcile = vi.fn();
    vi.mocked(investmentService.operation).mockRejectedValueOnce(new ApiError("Conflito sintético", 409, {
      kind: "conflict", requiresReconciliation: true,
    }));
    const rendered = render(<OperationModal {...modalCallbacks} onReconcile={onReconcile} isOpen asset={asset} />);
    await act(async () => { fireEvent.submit(rendered.container.querySelector("form")!); });
    expect(modalCallbacks.onSuccess).not.toHaveBeenCalled();
    expect(modalCallbacks.onClose).not.toHaveBeenCalled();
    expect(onReconcile).toHaveBeenCalledTimes(1);
  });

  test.each(["transaction", "card", "payment", "investment"])("R13: dois submits de %s no mesmo tick enviam uma operação", async (kind) => {
    let finish!: (value: never) => void;
    const pending = new Promise<never>((resolve) => { finish = resolve; });
    const endpoint = { transaction: transactionService.create, card: cardService.createTransaction,
      payment: cardService.payInvoice, investment: investmentService.operation }[kind]!;
    vi.mocked(endpoint).mockReturnValue(pending);
    const rendered = kind === "transaction" ? render(<NewTransactionModal {...modalCallbacks} isOpen accounts={accounts} categories={categories} />)
      : kind === "card" ? render(<NewCardTransactionModal {...modalCallbacks} isOpen categories={categories} defaultCardId="card-synthetic" />)
      : kind === "payment" ? render(<PayInvoiceModal {...modalCallbacks} isOpen accounts={accounts} cardId="card-synthetic" cardName="Cartão" currentInvoiceValue={100} month={9} year={2026} />)
      : render(<OperationModal {...modalCallbacks} isOpen asset={asset} />);
    act(() => {
      fireEvent.submit(rendered.container.querySelector("form")!);
      fireEvent.submit(rendered.container.querySelector("form")!);
    });
    try { expect(endpoint).toHaveBeenCalledTimes(1); }
    finally { await act(async () => { finish({ status: 200, data: {} } as never); await pending; }); }
    expect(modalCallbacks.onSuccess).toHaveBeenCalledTimes(1);
  });
});
