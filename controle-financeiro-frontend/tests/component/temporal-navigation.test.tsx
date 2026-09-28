import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { PlanningProvider, usePlanningContext } from "@/contexts/planningContext";
import { useCards } from "@/hooks/useCards";
import { useExtract } from "@/hooks/useExtract";
import { cardService } from "@/services/cardService";
import { transactionService } from "@/services/transactionService";

vi.mock("@/contexts/userContext", () => ({
  useUserContext: () => ({
    user: { id: "user-synthetic" },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useFinanceData", () => ({
  useFinanceData: () => ({
    accounts: [],
    categories: [],
    refresh: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useOptimisticMutation", () => ({
  useOptimisticMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/services/cardService", () => ({
  cardService: {
    getAll: vi.fn(),
    getInvoiceDetails: vi.fn(),
  },
}));

vi.mock("@/services/categoryService", () => ({
  categoryService: { getAll: vi.fn() },
}));

vi.mock("@/services/planningService", () => ({
  planningService: { getByMonth: vi.fn() },
}));

vi.mock("@/services/transactionService", () => ({
  transactionService: { getAll: vi.fn(), getSummary: vi.fn() },
}));

function expectFebruaryFirst(value: Date) {
  expect(value.getFullYear()).toBe(2026);
  expect(value.getMonth()).toBe(1);
  expect(value.getDate()).toBe(1);
}

describe("navegação por competência", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 12));
    vi.mocked(cardService.getAll).mockResolvedValue({ status: 200, data: [] });
    vi.mocked(transactionService.getAll).mockResolvedValue({
      status: 200,
      data: {
        content: [],
        page: { size: 30, number: 0, totalElements: 0, totalPages: 1 },
      },
    });
    vi.mocked(transactionService.getSummary).mockResolvedValue({
      status: 200, data: { entries: 0, exits: 0, balance: 0 },
    });
  });

  test("cartões avançam janeiro/31 para fevereiro/01 e depois março/01", () => {
    const { result } = renderHook(() => useCards());

    act(() => result.current.changeMonth(1));
    expectFebruaryFirst(result.current.viewDate);
    act(() => result.current.changeMonth(1));
    expect(result.current.viewDate.getMonth()).toBe(2);
    expect(result.current.viewDate.getDate()).toBe(1);
  });

  test("extrato avança janeiro/31 para fevereiro/01 sem mutação acumulada", () => {
    const { result } = renderHook(() => useExtract());

    act(() => result.current.changeMonth(1));
    expectFebruaryFirst(result.current.filters.date);
    act(() => result.current.changeMonth(-1));
    expect(result.current.filters.date.getMonth()).toBe(0);
    expect(result.current.filters.date.getDate()).toBe(1);
  });

  test("R10: falha ao carregar página seguinte permite repetir a mesma página", async () => {
    const response = (number: number) => ({ status: 200, data: {
      content: [], page: { size: 30, number, totalElements: 90, totalPages: 3 },
    } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(transactionService.getAll).mockResolvedValueOnce(response(0))
      .mockRejectedValueOnce(new Error("leitura sintética indisponível"))
      .mockResolvedValueOnce(response(1));
    const { result } = renderHook(() => useExtract());
    await act(async () => Promise.resolve());
    await act(async () => { result.current.loadMore(); });
    expect(result.current.isLoadingMore).toBe(false);
    await act(async () => { result.current.loadMore(); });
    expect(vi.mocked(transactionService.getAll).mock.calls.map(([params]) => params?.page)).toEqual([0, 1, 1]);
  });

  test("CF-021: resumo global do filtro não varia ao buscar a página seguinte", async () => {
    vi.useRealTimers();
    const response = (number: number) => ({ status: 200, data: {
      content: [], page: { size: 30, number, totalElements: 60, totalPages: 2 },
    } });
    vi.mocked(transactionService.getAll).mockResolvedValueOnce(response(0)).mockResolvedValueOnce(response(1));
    vi.mocked(transactionService.getSummary).mockResolvedValueOnce({
      status: 200, data: { entries: 300, exits: 40, balance: 260 },
    });
    const { result } = renderHook(() => useExtract());
    await waitFor(() => expect(result.current.summary?.balance).toBe(260));
    await act(async () => { result.current.loadMore(); });
    await waitFor(() => expect(vi.mocked(transactionService.getAll)).toHaveBeenCalledTimes(2));
    expect(result.current.summary).toEqual({ entries: 300, exits: 40, balance: 260 });
    expect(transactionService.getSummary).toHaveBeenCalledTimes(1);
  });

  test("extrato ordena grupos de datas civis sem convertê-los em instantes", async () => {
    vi.mocked(transactionService.getAll).mockResolvedValueOnce({
      status: 200,
      data: {
        content: [
          {
            id: "transaction-older",
            description: "Anterior",
            amount: 10,
            date: "2026-01-30",
            createdAt: "2026-01-30T12:00:00",
            isPaid: true,
            type: "EXPENSE",
            accountId: "account-synthetic",
          },
          {
            id: "transaction-newer",
            description: "Posterior",
            amount: 10,
            date: "2026-01-31",
            createdAt: "2026-01-31T12:00:00",
            isPaid: true,
            type: "EXPENSE",
            accountId: "account-synthetic",
          },
        ],
        page: { size: 30, number: 0, totalElements: 2, totalPages: 1 },
      },
    });

    const { result } = renderHook(() => useExtract());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.groupedTransactions.map((group) => group.date)).toEqual([
      "2026-01-31",
      "2026-01-30",
    ]);
  });

  test("planejamento avança janeiro/31 para fevereiro/01", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PlanningProvider>{children}</PlanningProvider>
    );
    const { result } = renderHook(() => usePlanningContext(), { wrapper });

    act(() => result.current.changeMonth(1));
    expectFebruaryFirst(result.current.dateRef);
  });
});
