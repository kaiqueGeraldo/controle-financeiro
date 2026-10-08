import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useAnnualSummary } from "@/hooks/useAnnualSummary";
import { GoalDetails } from "@/components/screens/goals/goalDetails";
import { BrowserTodayProvider } from "@/contexts/browserTodayContext";

vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: null, isLoading: false }) }));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));
vi.mock("@/contexts/goalsContext", () => ({ useGoalsContext: () => ({ refreshGoals: vi.fn() }) }));
vi.mock("@/contexts/habitsContext", () => ({ useHabitsContext: () => ({ habits: [] }) }));
vi.mock("@/contexts/investmentsContext", () => ({ useInvestmentsContext: () => ({ investments: [] }) }));
vi.mock("@/contexts/modals/goalModalContext", () => ({ useGoalModals: () => ({ openDeleteHistory: vi.fn() }) }));

afterEach(() => vi.useRealTimers());

test("RD58-01: seletor anual inicia pelo navegador (SPEC-002 DEC-01)", () => {
  vi.stubEnv("TZ", "UTC");
  vi.useFakeTimers();
  // UTC is already January; the product calendar is still December (SPEC-002 DEC-01).
  vi.setSystemTime(new Date("2027-01-01T01:00:00Z"));
  expect(new Date().getFullYear()).toBe(2027);
  const { result } = renderHook(() => useAnnualSummary());
  expect(result.current.year).toBe(2027);
});

test("controle: seleção explícita do ano fica estável na virada", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2027-01-01T01:00:00Z"));
  const { result, rerender } = renderHook(() => useAnnualSummary());
  act(() => result.current.setYear(2024));
  act(() => vi.setSystemTime(new Date("2028-01-01T04:00:00Z")));
  rerender();
  expect(result.current.year).toBe(2024);
});

test("RD58-02: histórico legado de meta explicita fuso desconhecido (CT-10/E11)", () => {
  render(<BrowserTodayProvider><GoalDetails
    isOpen goal={{ id: "goal", title: "Meta sintética", type: "NUMERIC", targetValue: 10,
      currentValue: 1, deadline: "2027-12-31" }} accounts={[]} cards={[]}
    history={[{ id: "history", amount: 1, note: "Histórico sintético", date: "2026-09-07T23:30:00" }]}
    isHistoryLoading={false} onClose={vi.fn()} onDelete={vi.fn()} onDeposit={vi.fn()}
  /></BrowserTodayProvider>);
  expect(screen.getByText("Histórico sintético")).toBeDefined();
  expect(screen.getByText(/Fuso desconhecido/)).toBeDefined();
});
