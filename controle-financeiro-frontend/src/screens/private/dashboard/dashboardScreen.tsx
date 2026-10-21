"use client";
import { monetaryAggregate } from "@/utils/monetaryAggregate";

import {
  DashboardCardConfig,
  DEFAULT_CONFIG,
} from "@/components/forms/configDashboardModal";
import { BalanceCard } from "@/components/screens/dashboard/balanceCard";
import { DataLoadError } from "@/components/screens/dashboard/dataLoadError";
import { GoalsCard } from "@/components/screens/dashboard/goalsCard";
import { InvoicesCard } from "@/components/screens/dashboard/invoicesCard";
import { MonthlyFlowCard } from "@/components/screens/dashboard/monthlyFlowCard";
import { WealthChart } from "@/components/screens/dashboard/wealthChart";
import { PrivacyBlur } from "@/components/ui/privacyBlur";
import { useGoalModals } from "@/contexts/modals/goalModalContext";
import { useTransactionModals } from "@/contexts/modals/transactionModalContext";
import { useCards } from "@/hooks/useCards";
import { useDashboard } from "@/hooks/useDashboard";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useGoals } from "@/hooks/useGoals";
import { useInvestments } from "@/hooks/useInvestments";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/utils/format";
import { formatCalendarDate } from "@/utils/date";
import { History, Landmark, Loader2, Plus } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";

const getCardColorClass = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("nubank")) return "text-purple-500";
  if (n.includes("mercado")) return "text-blue-500";
  if (n.includes("rico")) return "text-orange-500";
  if (n.includes("c6")) return "text-text-main";
  return "text-emerald-500";
};

type StoredDashboardCard = Partial<DashboardCardConfig> & { id: string };

export default function DashboardScreen() {
  const { user } = useUser();
  const {
    accounts,
    saldoTotal,
    isLoading: isLoadingFinance,
    error: financeError,
  } = useFinanceData();
  const { cards, isLoading: isLoadingCards, error: cardsError, refreshAll: refreshCards } = useCards();
  const { goals, isLoading: isLoadingGoals, error: goalsError, refreshGoals } = useGoals();
  const {
    totalInvestido,
    valuationComplete,
    isLoading: isLoadingInvestments,
    error: investmentsError,
    refreshInvestments,
  } = useInvestments();
  const { openNewTransaction } = useTransactionModals();
  const { openNewGoal } = useGoalModals();
  const {
    flowData,
    recentTransactions,
    isFlowLoading,
    isRecentLoading,
    flowError,
    recentTransactionsError,
    refreshDashboard,
  } = useDashboard();

  const isLoading =
    isLoadingFinance ||
    isLoadingCards ||
    isLoadingGoals ||
    isLoadingInvestments ||
    isFlowLoading ||
    isRecentLoading;
  const loadError =
    financeError ||
    cardsError ||
    goalsError ||
    investmentsError ||
    flowError ||
    recentTransactionsError;
  const patrimonioTotal = saldoTotal===null||totalInvestido===null?null:monetaryAggregate([saldoTotal,totalInvestido]);

  const resumoFaturas = useMemo(() => {
    const total = monetaryAggregate(cards.map(card => card.currentInvoiceValue));
    const lista = [...cards]
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

      const validIds = new Set<DashboardCardConfig["id"]>([
        "BALANCE",
        "FLOW",
        "INVOICES",
        "CHART",
        "GOALS",
        "RECENT_TX",
        "ACCOUNTS",
      ]);
      const result: DashboardCardConfig[] = parsed
        .filter((value): value is StoredDashboardCard => {
          return (
            typeof value === "object" &&
            value !== null &&
            "id" in value &&
            typeof value.id === "string" &&
            validIds.has(value.id as DashboardCardConfig["id"])
          );
        })
        .map((stored) => {
          const def = DEFAULT_CONFIG.find((item) => item.id === stored.id)!;
          return {
            ...def,
            visible:
              typeof stored.visible === "boolean" ? stored.visible : def.visible,
            span: stored.span === 2 || stored.span === 3 ? stored.span : 1,
          };
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
    if (span === 3) return "xl:col-span-3";
    if (span === 2) return "xl:col-span-2";
    return "xl:col-span-1";
  };

  const renderCard = (item: DashboardCardConfig) => {
    const spanClass = getColSpanClass(item.span);

    switch (item.id) {
      case "BALANCE":
        return (
          <div key={item.id} className={`min-w-0 ${spanClass}`}>
            <BalanceCard
              saldoTotal={patrimonioTotal}
              saldoContas={saldoTotal}
              saldoInvestimentos={totalInvestido}
              valuationComplete={valuationComplete}
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
              investmentResult={flowData.investmentResult}
              coverage={flowData.coverage} observed={flowData.observed}
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
                    className="flex flex-wrap gap-2 justify-between items-center text-sm border-b border-border-divider/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1 basis-36 text-text-main font-medium truncate pr-2">
                      {acc.name}
                    </span>
                    <PrivacyBlur className="max-w-full shrink-0 [overflow-wrap:anywhere] font-bold text-text-main">
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
                recentTransactions.slice(0, 4).map((tx) => {
                  const cash = tx.cashDelta === undefined ? (tx.type === "EXPENSE" ? -tx.amount : tx.amount) : tx.cashDelta;
                  const forecast = tx.status === "PENDING" || tx.status === "PARTIALLY_SETTLED" || tx.status === "FULFILLED" || tx.status === "CANCELLED";
                  return (
                  <div
                    key={tx.id}
                    className="flex flex-wrap gap-2 justify-between items-center text-sm border-b border-border-divider/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1 basis-36">
                      <p className="text-text-main font-medium truncate max-w-37.5 sm:max-w-50">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {formatCalendarDate(tx.date)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end max-w-full">
                    <PrivacyBlur
                      className={`max-w-full shrink-0 [overflow-wrap:anywhere] font-bold ${tx.type === "INCOME" ? "text-emerald-500" : "text-text-main"}`}
                    >
                      {forecast ? `Previsto: ${formatCurrency(tx.amount)}` : cash === null ? "Caixa indisponível" : `${cash < 0 ? "- " : cash > 0 ? "+ " : ""}${formatCurrency(Math.abs(cash))}`}
                    </PrivacyBlur>
                    {!forecast && tx.cashAmount !== undefined && tx.cashAmount !== tx.amount && <PrivacyBlur className="text-xs text-text-muted">Bruto: {formatCurrency(tx.amount)}</PrivacyBlur>}
                    </div>
                  </div>
                );})
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-bg-base font-sans text-text-main">
        <DataLoadError
          onRetry={() =>
            Promise.all([
              refreshCards(false),
              refreshGoals(),
              refreshInvestments(),
              refreshDashboard(true),
            ]).then(() => undefined).catch(() => undefined)
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base p-6 md:p-8 font-sans text-text-main space-y-6 pb-24">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <aside className="rounded-xl border border-border-divider bg-bg-surface p-4 text-sm">
        <p>Quer organizar seus saldos e compromissos iniciais? A entrevista é opcional e preserva os registros existentes.</p>
        <Link href="/onboarding" className="mt-2 inline-block text-emerald-500 underline focus-visible:outline-2 focus-visible:outline-offset-2">Abrir configuração inicial</Link>
      </aside>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 grid-flow-dense">
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
