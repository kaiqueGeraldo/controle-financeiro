import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useAnnualSummary } from "@/hooks/useAnnualSummary";
import { annualSummaryService } from "@/services/annualSummaryService";
import type { AnnualSummaryResponse } from "@/types";

let persistedNote = "Antes da gravação";

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ user: { id: "annual-summary-user" }, isLoading: false }),
}));
vi.mock("@/contexts/toastContext", () => ({
  useToast: () => ({ error: vi.fn() }),
}));
vi.mock("@/services/annualSummaryService", () => ({
  annualSummaryService: {
    getSummary: vi.fn(),
    updateNote: vi.fn(),
  },
}));

function response(note: string): AnnualSummaryResponse {
  return {
    year: 2026,
    balance: { totalIncome: 0, totalExpense: 0, annualBalance: 0 },
    creditCard: { totalSpent: 0, subscriptionsTotal: 0, monthlyAverage: 0 },
    investments: { totalValue: 0, items: [] },
    comparison: { incomeGrowthPercentage: 0, expenseGrowthPercentage: 0, message: "" },
    note,
  };
}

describe("CF-014: nota anual", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
    persistedNote = "Antes da gravação";
    vi.mocked(annualSummaryService.getSummary).mockImplementation(async () => ({
      status: 200,
      data: response(persistedNote),
    }));
    vi.mocked(annualSummaryService.updateNote).mockImplementation(async (_year, content) => {
      persistedNote = content;
      return { status: 204, data: undefined };
    });
  });

  afterEach(() => vi.useRealTimers());

  test("nota confirmada pelo serviço reaparece após desmontar e recarregar o resumo", async () => {
    const first = renderHook(() => useAnnualSummary());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(first.result.current.noteContent).toBe("Antes da gravação");

    act(() => first.result.current.setNoteContent("Nota persistida sintética"));
    await act(async () => {
      await expect(first.result.current.saveNote()).resolves.toBe(true);
    });
    expect(annualSummaryService.updateNote).toHaveBeenCalledWith(2026, "Nota persistida sintética");
    first.unmount();

    const reloaded = renderHook(() => useAnnualSummary());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(reloaded.result.current.noteContent).toBe("Nota persistida sintética");
  });
});
