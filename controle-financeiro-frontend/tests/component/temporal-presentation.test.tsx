import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { InvoiceDetails } from "@/components/screens/cards/invoiceDetails";
import { StatusBadge } from "@/components/screens/goals/goalItem";
import { InvestmentDetails } from "@/components/screens/investments/investmentDetails";
import { TransactionDetails } from "@/components/screens/extract/transactionDetails";
import { BrowserTodayProvider } from "@/contexts/browserTodayContext";
import type { Goal, Investment, Transaction } from "@/types";

// This suite tests temporal presentation with privacy disabled, not session loading.
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));

vi.mock("framer-motion", async () => {
  const { createElement } = await import("react");
  const motionProps = new Set([
    "animate",
    "exit",
    "initial",
    "layoutId",
    "transition",
    "whileHover",
    "whileTap",
  ]);

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) => (props: Record<string, unknown>) => {
          const domProps = Object.fromEntries(
            Object.entries(props).filter(([key]) => !motionProps.has(key)),
          );
          return createElement(tag, domProps);
        },
      },
    ),
  };
});

const goal = (currentValue: number, deadline = "2026-09-07"): Goal => ({
  id: "goal-synthetic",
  title: "Meta Sintética",
  type: "MONETARY",
  targetValue: 100,
  currentValue,
  deadline,
});

describe("apresentação temporal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T02:59:59.000Z"));
  });

  test("reclassifica prazo ao virar o dia e nunca atrasa meta concluída", () => {
    const rendered = render(
      <BrowserTodayProvider>
        <StatusBadge goal={goal(0)} />
      </BrowserTodayProvider>,
    );

    expect(screen.getByText("Iniciando")).toBeDefined();
    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByText("Atrasado")).toBeDefined();

    rendered.rerender(
      <BrowserTodayProvider>
        <StatusBadge goal={goal(100, "2026-09-06")} />
      </BrowserTodayProvider>,
    );
    expect(screen.getByText("Concluído")).toBeDefined();
  });

  test("revalida o dia ao recuperar foco depois de uma aba suspensa", () => {
    render(
      <BrowserTodayProvider>
        <StatusBadge goal={goal(0)} />
      </BrowserTodayProvider>,
    );

    expect(screen.getByText("Iniciando")).toBeDefined();
    act(() => {
      vi.setSystemTime(new Date("2026-09-08T03:05:00.000Z"));
      window.dispatchEvent(new Event("focus"));
    });
    expect(screen.getByText("Atrasado")).toBeDefined();
  });

  test("mantém o dia civil na fatura e no histórico de investimento", () => {
    const card = {
      id: "card-synthetic",
      name: "Cartão Sintético",
      last4Digits: "0000",
      limit: 1000,
      closingDay: 5,
      dueDay: 10,
      color: "#000000",
      brand: "VISA" as const,
      currentInvoiceValue: 10,
    };

    const invoice = render(
      <InvoiceDetails
        card={card}
        isOpen
        onClose={vi.fn()}
        invoiceData={{
          month: 9,
          year: 2026,
          totalAmount: 10,
          status: "OPEN",
          transactions: [
            {
              id: "card-transaction-synthetic",
              description: "Compra Sintética",
              amount: 10,
              date: "2026-09-07",
            },
          ],
        }}
        isLoadingInvoice={false}
        viewDateFormatted="setembro de 2026"
        onChangeMonth={vi.fn()}
        onPay={vi.fn()}
        onDelete={vi.fn()}
        onUpdateLimit={vi.fn()}
      />,
    );
    expect(screen.getByText("07/09/2026")).toBeDefined();
    invoice.unmount();

    const asset: Investment = {
      id: "investment-synthetic",
      ticker: "TEST3",
      name: "Ativo Sintético",
      type: "STOCK",
      quantity: 1,
      averagePrice: 10,
      currentPrice: 10,
    };
    render(
      <InvestmentDetails
        isOpen
        asset={asset}
        history={[
          {
            id: "investment-transaction-synthetic",
            dateOrigin: "USER_INPUT",
            type: "BUY",
            date: "2026-09-07",
            quantity: 1,
            price: 10,
            totalValue: 10,
            fees: 0,
          },
        ]}
        isHistoryLoading={false}
        onClose={vi.fn()}
        onOperation={vi.fn()}
        onDeleteAsset={vi.fn()}
        onDeleteHistory={vi.fn()}
      />,
    );
    expect(screen.getByText("07/09/2026")).toBeDefined();
  });

  test("data civil inválida recebe saída neutra no detalhe da transação", () => {
    const transaction: Transaction = {
      id: "transaction-synthetic",
      description: "Transação Sintética",
      amount: 10,
      date: "2026-02-29",
      createdAt: "2026-02-28T12:00:00",
      time: "12:00:00", timeOrigin: "USER_INPUT",
      isPaid: true,
      type: "EXPENSE",
      accountId: "account-synthetic",
    };

    render(
      <TransactionDetails
        transaction={transaction}
        categories={[]}
        accounts={[]}
        isOpen
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("—")).toBeDefined();
    expect(screen.queryByText("Invalid Date")).toBeNull();
  });
});
