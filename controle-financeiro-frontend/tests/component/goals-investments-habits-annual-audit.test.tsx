import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AnnualNotepad } from "@/components/screens/annual-summary/annualNotepad";
import { HabitItem } from "@/components/screens/habits/habitItem";
import { InvestmentDetails } from "@/components/screens/investments/investmentDetails";
import AnnualSummaryScreen from "@/screens/private/annual-summary/annualSummaryScreen";
import GoalsScreen from "@/screens/private/goals/goalsScreen";
import InvestmentsScreen from "@/screens/private/investments/investmentsScreen";
import type { AnnualSummaryResponse, Habit, Investment } from "@/types";

const fixture = vi.hoisted(() => ({
  goals: {} as Record<string, unknown>,
  investments: {} as Record<string, unknown>,
  annual: {} as Record<string, unknown>,
  retryGoals: vi.fn().mockResolvedValue(undefined),
  retryInvestments: vi.fn().mockResolvedValue(undefined),
  retryAnnual: vi.fn().mockResolvedValue(undefined),
  toggleHabit: vi.fn(),
}));

vi.mock("@/hooks/useSidebar", () => ({ useSidebar: () => ({ scrolled: false }) }));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));
vi.mock("@/contexts/browserTodayContext", () => ({
  useBrowserToday: () => "2026-09-08",
  useProductToday: () => "2026-09-08",
}));
vi.mock("@/hooks/useGoals", () => ({ useGoals: () => fixture.goals }));
vi.mock("@/hooks/useInvestments", () => ({ useInvestments: () => fixture.investments }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => ({ accounts: [], refresh: vi.fn() }) }));
vi.mock("@/hooks/useCards", () => ({ useCards: () => ({ cards: [] }) }));
vi.mock("@/contexts/modals/goalModalContext", () => ({
  useGoalModals: () => ({ openNewGoal: vi.fn(), openGoalDeposit: vi.fn(), openDeleteGoal: vi.fn() }),
}));
vi.mock("@/contexts/modals/investmentModalContext", () => ({
  useInvestmentModals: () => ({ openNewAsset: vi.fn(), openOperation: vi.fn() }),
}));
vi.mock("@/hooks/useAnnualSummary", () => ({ useAnnualSummary: () => fixture.annual }));
vi.mock("@/components/screens/goals/goalDetails", () => ({ GoalDetails: () => null }));
vi.mock("@/components/screens/goals/goalsSummary", () => ({ GoalsSummary: () => null }));

const summary = (year: number): AnnualSummaryResponse => ({
  year,
  balance: { totalIncome: 0, totalExpense: 0, annualBalance: 0 },
  creditCard: { totalSpent: 0, subscriptionsTotal: 0, monthlyAverage: 0 },
  investments: { totalValue: 1300, items: [{ name: "Reserva sintética", value: 1300, type: "ASSET", color: "BLUE" }] },
  comparison: { incomeGrowthPercentage: 0, expenseGrowthPercentage: 0, message: "" },
  note: "Nota persistida sintética",
});

describe("CF-014: metas, investimentos, hábitos e resumo anual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T12:00:00.000Z"));
    fixture.goals = {
      goals: [], isLoading: false, error: null, refreshGoals: fixture.retryGoals,
      selectedGoalId: null, setSelectedGoalId: vi.fn(), selectedGoal: undefined, history: [], isHistoryLoading: false,
    };
    fixture.investments = {
      investments: [], isLoading: false, error: null, refreshInvestments: fixture.retryInvestments,
      totalInvestido: 0, lucroTotal: 0, rentabilidadeGeral: 0,
      selectedInvestmentId: null, setSelectedInvestmentId: vi.fn(), selectedInvestment: undefined,
      history: [], isHistoryLoading: false, deleteInvestment: vi.fn(), deleteHistory: vi.fn(),
    };
    fixture.annual = {
      year: 2026, setYear: vi.fn(), summary: summary(2026), isLoading: false, error: null,
      noteContent: "Nota persistida sintética", setNoteContent: vi.fn(), saveNote: vi.fn().mockResolvedValue(true),
      isSavingNote: false, refresh: fixture.retryAnnual,
    };
  });

  afterEach(() => vi.useRealTimers());

  test("V-ERROR: metas e investimentos não apresentam coleções vazias como sucesso", () => {
    fixture.goals = { ...fixture.goals, error: new Error("503 sintético") };
    const goalsView = render(<GoalsScreen />);
    expect(screen.getByRole("heading", { name: "Não foi possível carregar os dados." })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(fixture.retryGoals).toHaveBeenCalledTimes(1);
    goalsView.unmount();

    fixture.investments = { ...fixture.investments, error: new Error("503 sintético") };
    render(<InvestmentsScreen />);
    expect(screen.getByRole("heading", { name: "Não foi possível carregar os dados." })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(fixture.retryInvestments).toHaveBeenCalledTimes(1);
  });

  test("V-ERROR: resumo anual conserva erro recuperável, sem alegar ano vazio", () => {
    fixture.annual = { ...fixture.annual, summary: null, error: new Error("503 sintético") };
    render(<AnnualSummaryScreen />);

    expect(screen.getByRole("heading", { name: "Não foi possível carregar os dados." })).toBeDefined();
    expect(screen.queryByText(/Nenhum dado encontrado/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(fixture.retryAnnual).toHaveBeenCalledTimes(1);
  });

  test("AC-UI-012: posição atual não é rotulada como fechamento de ano passado", () => {
    fixture.annual = { ...fixture.annual, year: 2025, summary: summary(2025) };
    render(<AnnualSummaryScreen />);

    expect(screen.getByRole("heading", { name: "Posição de metas e investimentos indisponível" })).toBeDefined();
    expect(screen.getByText(/A posição atual não é exibida como dado histórico/)).toBeDefined();
    expect(screen.queryByText("R$ 1.300,00")).toBeNull();
  });

  test("posição somente do ano corrente deixa explícito que não é fechamento anual", () => {
    render(<AnnualSummaryScreen />);

    expect(screen.getByText("Posição atual de metas e investimentos")).toBeDefined();
    expect(screen.getByText(/não representam fechamento anual/)).toBeDefined();
    expect(screen.getAllByText("R$ 1.300,00")).toHaveLength(2);
  });

  test("falha ao salvar nota conserva o editor e o texto para nova tentativa", async () => {
    render(
      <AnnualNotepad
        year={2026}
        content="Nota sintética longa que precisa permanecer editável"
        isSaving={false}
        onContentChange={vi.fn()}
        onSave={vi.fn().mockResolvedValue(false)}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("textbox")).toBeDefined();
    fireEvent.click(screen.getByRole("button"));
    await act(async () => Promise.resolve());
    expect(screen.getByRole("textbox")).toBeDefined();
  });

  test("AC-TIME-001: histórico de investimento mostra data civil sem deslocar o dia", () => {
    const asset: Investment = {
      id: "investment-synthetic", ticker: "SINT3", name: "Ativo sintético", type: "STOCK",
      quantity: 10, averagePrice: 100, currentPrice: 130,
    };
    render(
      <InvestmentDetails
        isOpen
        asset={asset}
        history={[{ id: "history-synthetic", type: "BUY", date: "2026-09-07", dateOrigin: "USER_INPUT", quantity: 10, price: 100, totalValue: 1000, fees: 0 }]}
        isHistoryLoading={false}
        onClose={vi.fn()}
        onOperation={vi.fn()}
        onDeleteAsset={vi.fn()}
        onDeleteHistory={vi.fn()}
      />,
    );

    expect(screen.getByText("07/09/2026")).toBeDefined();
  });

  test("hábitos diário e semanal usam o dia do produto e contam apenas logs da semana", () => {
    const onToggle = vi.fn();
    const habit: Habit = {
      id: "habit-synthetic", name: "Hábito semanal", icon: "Target", color: "EMERALD", frequency: "WEEKLY_GOAL",
      weeklyGoal: 3, currentStreak: 2, highestStreak: 4, orderIndex: 0, createdAt: "2026-01-01",
      logs: [
        { id: "monday", date: "2026-09-07", status: "COMPLETED" },
        { id: "today", date: "2026-09-08", status: "COMPLETED" },
        { id: "previous-week", date: "2026-08-31", status: "COMPLETED" },
      ],
    };
    render(<HabitItem habit={habit} onClick={vi.fn()} onToggle={onToggle} />);

    expect(screen.getByText("2/3")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /feito hoje/i }));
    expect(onToggle).toHaveBeenCalledWith("habit-synthetic", "2026-09-08");
  });
});
