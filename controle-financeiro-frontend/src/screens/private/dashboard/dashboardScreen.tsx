"use client";

import React, { useMemo } from "react";
import { Plus, Loader2, Landmark, History } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCards } from "@/hooks/useCards";
import { useGoals } from "@/hooks/useGoals";
import { BalanceCard } from "@/components/screens/dashboard/balanceCard";
import { MonthlyFlowCard } from "@/components/screens/dashboard/monthlyFlowCard";
import { InvoicesCard } from "@/components/screens/dashboard/invoicesCard";
import { WealthChart } from "@/components/screens/dashboard/wealthChart";
import { GoalsCard } from "@/components/screens/dashboard/goalsCard";
import { useInvestments } from "@/hooks/useInvestments";
import { useUser } from "@/hooks/useUser";
import {
  DashboardCardConfig,
  DEFAULT_CONFIG,
} from "@/components/forms/configDashboardModal";
import { formatCurrency } from "@/utils/format";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { useDashboard } from "@/hooks/useDashboard";
import { useTransactionModals } from "@/contexts/modals/transactionModalContext";
import { useGoalModals } from "@/contexts/modals/goalModalContext";

const getCardColorClass = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("nubank")) return "text-purple-500";
  if (n.includes("mercado")) return "text-blue-500";
  if (n.includes("rico")) return "text-orange-500";
  if (n.includes("c6")) return "text-text-main";
  return "text-emerald-500";
};

export default function DashboardScreen() {
  const { user } = useUser();
  const {
    accounts,
    saldoTotal,
    isLoading: isLoadingFinance,
  } = useFinanceData();
  const { cards, isLoading: isLoadingCards } = useCards();
  const { goals, isLoading: isLoadingGoals } = useGoals();
  const { totalInvestido } = useInvestments();
  const { openNewTransaction } = useTransactionModals();
  const { openNewGoal } = useGoalModals();
  const { flowData, recentTransactions } = useDashboard();

  const isLoading = isLoadingFinance || isLoadingCards || isLoadingGoals;
  const patrimonioTotal = saldoTotal + totalInvestido;

  const resumoFaturas = useMemo(() => {
    const total = cards.reduce(
      (acc, card) => acc + card.currentInvoiceValue,
      0,
    );
    const lista = cards
      .sort((a, b) => b.currentInvoiceValue - a.currentInvoiceValue)
      .map((card) => ({
        id: card.id,
        nome: card.name,
        valor: card.currentInvoiceValue,
        vencimento: `Dia ${card.dueDay}`,
        cor: getCardColorClass(card.name),
      }));
    return { total, lista };
  }, [cards]);

  // Função limpa e segura
  const getConfig = (): DashboardCardConfig[] => {
    if (!user?.dashboardConfig) return DEFAULT_CONFIG;
    try {
      let clean = user.dashboardConfig;
      if (clean.startsWith('"')) clean = JSON.parse(clean);
      clean = clean.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      const parsed = JSON.parse(clean);

      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CONFIG;

      const validIds = [
        "BALANCE",
        "FLOW",
        "INVOICES",
        "CHART",
        "GOALS",
        "RECENT_TX",
        "ACCOUNTS",
      ];
      const result = parsed
        .filter((p: any) => validIds.includes(p.id))
        .map((p: any) => {
          const def = DEFAULT_CONFIG.find((d) => d.id === p.id);
          return { ...def, ...p, span: p.span || def?.span || 1 }; // Garante o span
        });

      DEFAULT_CONFIG.forEach((def) => {
        if (!result.find((r) => r.id === def.id)) result.push(def);
      });
      return result;
    } catch {
      return DEFAULT_CONFIG;
    }
  };

  const config = getConfig();

  // Helper para injetar a classe correta do Tailwind
  const getColSpanClass = (span: number) => {
    if (span === 3) return "md:col-span-3";
    if (span === 2) return "md:col-span-2";
    return "md:col-span-1";
  };

  const renderCard = (item: DashboardCardConfig) => {
    const spanClass = getColSpanClass(item.span);

    switch (item.id) {
      case "BALANCE":
        return (
          <div key={item.id} className={spanClass}>
            <BalanceCard
              saldoTotal={patrimonioTotal}
              saldoContas={saldoTotal}
              saldoInvestimentos={totalInvestido}
            />
          </div>
        );
      case "FLOW":
        return (
          <div key={item.id} className={spanClass}>
            <MonthlyFlowCard
              despesas={flowData.expense}
              receitas={flowData.income}
              percentual={flowData.percentage}
            />
          </div>
        );
      case "INVOICES":
        return (
          <div key={item.id} className={spanClass}>
            <InvoicesCard
              total={resumoFaturas.total}
              lista={resumoFaturas.lista}
            />
          </div>
        );
      case "CHART":
        return (
          <div key={item.id} className={spanClass}>
            <WealthChart />
          </div>
        );
      case "GOALS":
        return (
          <div key={item.id} className={spanClass}>
            <GoalsCard goals={goals} onNewGoal={openNewGoal} />
          </div>
        );

      case "ACCOUNTS":
        return (
          <div
            key={item.id}
            className={`${spanClass} bg-bg-surface border border-border-divider rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-50`}
          >
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Landmark size={16} /> Suas Contas
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scroll pr-1 max-h-40">
              {accounts.length > 0 ? (
                accounts.slice(0, 4).map((acc) => (
                  <div
                    key={acc.id}
                    className="flex justify-between items-center text-sm border-b border-border-divider/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-text-main font-medium truncate pr-2">
                      {acc.name}
                    </span>
                    <PrivacyBlur className="font-bold text-text-main">
                      {formatCurrency(acc.balance)}
                    </PrivacyBlur>
                  </div>
                ))
              ) : (
                <span className="text-xs text-text-muted">
                  Nenhuma conta cadastrada.
                </span>
              )}
            </div>
          </div>
        );

      case "RECENT_TX":
        return (
          <div
            key={item.id}
            className={`${spanClass} bg-bg-surface border border-border-divider rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-50`}
          >
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <History size={16} /> Extrato Recente
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scroll pr-1 max-h-40">
              {recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center text-sm border-b border-border-divider/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-text-main font-medium truncate max-w-37.5 sm:max-w-50">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(tx.date + "T12:00:00").toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                    <PrivacyBlur
                      className={`font-bold ${tx.type === "INCOME" ? "text-emerald-500" : "text-text-main"}`}
                    >
                      {tx.type === "EXPENSE" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </PrivacyBlur>
                  </div>
                ))
              ) : (
                <span className="text-xs text-text-muted">
                  Nenhuma transação recente.
                </span>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center text-text-muted">
        <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base p-6 md:p-8 font-sans text-text-main space-y-6 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-flow-dense">
        {config.filter((item) => item.visible).map((item) => renderCard(item))}
      </div>

      <button
        onClick={openNewTransaction}
        className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center transition-all hover:scale-110 z-30 cursor-pointer"
      >
        <Plus className="w-8 h-8" strokeWidth={3} />
      </button>
    </div>
  );
}
