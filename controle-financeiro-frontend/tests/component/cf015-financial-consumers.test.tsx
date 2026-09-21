import { act, renderHook } from "@testing-library/react";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import { FinanceProvider, useFinanceContext } from "@/contexts/financeContext";
import { DashboardProvider, useDashboardContext } from "@/contexts/dashboardContext";
import { PlanningProvider, usePlanningContext } from "@/contexts/planningContext";
import { useCards } from "@/hooks/useCards";
import { accountService } from "@/services/accountService";
import { dashboardService } from "@/services/dashboardService";
import { planningService } from "@/services/planningService";
import { cardService } from "@/services/cardService";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { id: "consumers" }, isLoading: false }) }));
vi.mock("@/contexts/userContext", () => ({ useUserContext: () => ({ user: { id: "consumers" }, isLoading: false }) }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/services/categoryService", () => ({ categoryService: { getAll: vi.fn().mockResolvedValue({ data: [] }) } }));
vi.mock("@/services/transactionService", () => ({ transactionService: { getAll: vi.fn().mockResolvedValue({ data: { content: [] } }) } }));
vi.mock("@/services/accountService", () => ({ accountService: { getAll: vi.fn() } }));
vi.mock("@/services/planningService", () => ({ planningService: { getByMonth: vi.fn() } }));
vi.mock("@/services/dashboardService", () => ({ dashboardService: { getMonthlyFlow: vi.fn(), getWealthChart: vi.fn() } }));
vi.mock("@/services/cardService", () => ({ cardService: { getAll: vi.fn(), getInvoiceDetails: vi.fn() } }));

function Providers({ children }: { children: ReactNode }) {
  return <FinanceProvider><DashboardProvider><PlanningProvider>{children}</PlanningProvider></DashboardProvider></FinanceProvider>;
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  vi.mocked(accountService.getAll).mockResolvedValue({ status: 200, data: [{ id: "a", name: "Synthetic", balance: 900, type: "CHECKING", color: "#111", isArchived: false }] });
  vi.mocked(cardService.getAll).mockResolvedValue({ status: 200, data: [] });
  vi.mocked(planningService.getByMonth).mockResolvedValue({ status: 200, data: { items: [], incomeForecast: 0 } });
  vi.mocked(dashboardService.getMonthlyFlow).mockResolvedValue({ status: 200, data: { income: 0, expense: 100, balance: -100, percentage: 0 } });
  vi.mocked(dashboardService.getWealthChart).mockResolvedValue({ status: 200, data: [{ label: "current", valor: 900 }] });
});
afterEach(() => vi.useRealTimers());

test.each(["accounts", "dashboard", "planning"] as const)("R03: falha de %s impede reconciliação e recuperação atualiza providers reais", async consumer => {
  const view = renderHook(() => ({ cards: useCards(), finance: useFinanceContext(), dashboard: useDashboardContext(), planning: usePlanningContext() }), { wrapper: Providers });
  await act(async () => vi.advanceTimersByTimeAsync(350));
  const failure = new Error(`503 ${consumer}`);
  if (consumer === "accounts") vi.mocked(accountService.getAll).mockRejectedValueOnce(failure);
  if (consumer === "dashboard") vi.mocked(dashboardService.getMonthlyFlow).mockRejectedValueOnce(failure);
  if (consumer === "planning") vi.mocked(planningService.getByMonth).mockRejectedValueOnce(failure);
  let outcome!: Promise<unknown>;
  await act(async () => {
    outcome = view.result.current.cards.refreshAll().catch(error => error);
    await vi.advanceTimersByTimeAsync(350);
    expect(await outcome).toBe(failure);
  });
  expect(consumer === "accounts" ? view.result.current.finance.error : consumer === "dashboard" ? view.result.current.dashboard.flowError : view.result.current.planning.error).toBe(failure);
  await act(async () => {
    outcome = view.result.current.cards.refreshAll();
    await vi.advanceTimersByTimeAsync(350);
    await outcome;
  });
  expect(view.result.current.finance.error).toBeNull();
  expect(view.result.current.dashboard.flowError).toBeNull();
  expect(view.result.current.planning.error).toBeNull();
  expect(view.result.current.finance.saldoTotal).toBe(900);
  expect(view.result.current.dashboard.flowData.expense).toBe(100);
  expect(view.result.current.dashboard.chartData).toEqual([{ label: "current", valor: 900 }]);
});
