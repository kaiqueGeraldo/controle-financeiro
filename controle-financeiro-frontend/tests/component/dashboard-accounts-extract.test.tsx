import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import AccountsScreen from "@/screens/private/accounts/accountsScreen";
import DashboardScreen from "@/screens/private/dashboard/dashboardScreen";
import ExtractScreen from "@/screens/private/extract/extractScreen";

const fixture = vi.hoisted(() => ({
  retryAccounts: vi.fn().mockResolvedValue(undefined),
  retryExtract: vi.fn().mockResolvedValue(undefined),
  retryDashboard: vi.fn().mockResolvedValue(undefined),
  retryCards: vi.fn().mockResolvedValue(undefined),
  retryGoals: vi.fn().mockResolvedValue(undefined),
  retryInvestments: vi.fn().mockResolvedValue(undefined),
  finance: {} as Record<string, unknown>,
  extract: {} as Record<string, unknown>,
  dashboard: {} as Record<string, unknown>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/useFinanceData", () => ({ useFinanceData: () => fixture.finance }));
vi.mock("@/hooks/useExtract", () => ({ useExtract: () => fixture.extract }));
vi.mock("@/hooks/useDashboard", () => ({ useDashboard: () => fixture.dashboard }));
vi.mock("@/hooks/useCards", () => ({
  useCards: () => ({ cards: [], isLoading: false, error: null, refreshAll: fixture.retryCards }),
}));
vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({ goals: [], isLoading: false, error: null, refreshGoals: fixture.retryGoals }),
}));
vi.mock("@/hooks/useInvestments", () => ({
  useInvestments: () => ({
    totalInvestido: 0,
    isLoading: false,
    error: null,
    refreshInvestments: fixture.retryInvestments,
  }),
}));
vi.mock("@/hooks/useSidebar", () => ({ useSidebar: () => ({ scrolled: false }) }));
vi.mock("@/hooks/useUser", () => ({ useUser: () => ({ user: { privacyMode: false } }) }));
vi.mock("@/contexts/modals/accountModalContext", () => ({
  useAccountModals: () => ({ openManageAccount: vi.fn() }),
}));
vi.mock("@/contexts/modals/transactionModalContext", () => ({
  useTransactionModals: () => ({ openNewTransaction: vi.fn(), openDeleteTransaction: vi.fn() }),
}));
vi.mock("@/contexts/modals/goalModalContext", () => ({
  useGoalModals: () => ({ openNewGoal: vi.fn() }),
}));
vi.mock("@/contexts/toastContext", () => ({ useToast: () => ({ error: vi.fn() }) }));

describe("CF-012: estados de leitura nas telas financeiras", () => {
  test("falha de contas não se passa por patrimônio zero e retry chama a fonte", () => {
    fixture.finance = {
      accounts: [],
      saldoTotal: 0,
      isLoading: false,
      error: new Error("503 sintético"),
      refresh: fixture.retryAccounts,
    };

    render(<AccountsScreen />);

    expect(screen.getByRole("heading", { name: "Não foi possível carregar os dados." })).toBeDefined();
    expect(screen.queryByText("Patrimônio Total")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(fixture.retryAccounts).toHaveBeenCalledTimes(1);
  });

  test("falha de extrato não se passa por saldo do período vazio e retry é acionável", () => {
    fixture.extract = {
      isInitialLoading: false,
      error: new Error("503 sintético"),
      retry: fixture.retryExtract,
    };

    render(<ExtractScreen />);

    expect(screen.getByRole("heading", { name: "Não foi possível carregar os dados." })).toBeDefined();
    expect(screen.queryByText("Saldo do Período")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(fixture.retryExtract).toHaveBeenCalledTimes(1);
  });

  test("dashboard aguarda e bloqueia cartões de saldo quando uma fonte falha", () => {
    fixture.finance = {
      accounts: [],
      saldoTotal: 0,
      isLoading: false,
      error: new Error("503 sintético"),
    };
    fixture.dashboard = {
      flowData: { income: 0, expense: 0, balance: 0, percentage: 0 },
      recentTransactions: [],
      isFlowLoading: false,
      isRecentLoading: false,
      flowError: null,
      recentTransactionsError: null,
      refreshDashboard: fixture.retryDashboard,
    };

    render(<DashboardScreen />);

    expect(screen.getByRole("heading", { name: "Não foi possível carregar os dados." })).toBeDefined();
    expect(screen.queryByText("Patrimônio Total")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(fixture.retryCards).toHaveBeenCalledTimes(1);
    expect(fixture.retryGoals).toHaveBeenCalledTimes(1);
    expect(fixture.retryInvestments).toHaveBeenCalledTimes(1);
    expect(fixture.retryDashboard).toHaveBeenCalledWith(true);
  });
});
