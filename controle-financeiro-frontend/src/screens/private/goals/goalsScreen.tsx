"use client";

import { GoalDetails } from "@/components/screens/goals/goalDetails";
import { GoalItem } from "@/components/screens/goals/goalItem";
import { GoalsSummary } from "@/components/screens/goals/goalsSummary";
import { useGoalModals } from "@/contexts/modals/goalModalContext";
import { useCards } from "@/hooks/useCards";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useGoals } from "@/hooks/useGoals";
import { useSidebar } from "@/hooks/useSidebar";
import { Loader2, Plus } from "lucide-react";
import { useMemo } from "react";

export default function GoalsScreen() {
  const { scrolled } = useSidebar();
  const {
    goals,
    isLoading,
    selectedGoalId,
    setSelectedGoalId,
    selectedGoal,
    history,
    isHistoryLoading,
  } = useGoals();
  const { refresh, accounts } = useFinanceData();
  const { cards } = useCards();
  const { openNewGoal, openGoalDeposit, openDeleteGoal } = useGoalModals();

  const metasFinanceiras = useMemo(
    () => goals.filter((m) => m.type === "MONETARY"),
    [goals],
  );
  const totalFinanceiroAtual = metasFinanceiras.reduce(
    (acc, m) => acc + m.currentValue,
    0,
  );
  const totalFinanceiroAlvo = metasFinanceiras.reduce(
    (acc, m) => acc + m.targetValue,
    0,
  );

  const progressoGeral =
    goals.length > 0
      ? (goals.reduce(
          (acc, m) => acc + Math.min(m.currentValue / m.targetValue, 1),
          0,
        ) /
          goals.length) *
        100
      : 0;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-main pb-20">
      {/* HEADER FIXO */}
      <header
        className={`
          sticky top-0 z-30 transition-all duration-300 ease-in-out border-b border-border-divider
          ${scrolled ? "bg-bg-base/90 backdrop-blur-md py-3" : "bg-bg-base py-6"}
        `}
      >
        <div className="px-6 md:px-8 max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Metas & Objetivos
            </h1>
            <p className="text-text-muted text-sm hidden md:block mt-0.5">
              Financeiro, Leitura, Saúde e mais.
            </p>
          </div>
          <button
            onClick={openNewGoal}
            className="p-2.5 md:px-4 md:py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer shrink-0"
            title="Nova Meta"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Nova Meta</span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="px-6 md:px-8 max-w-5xl mx-auto mt-6">
        <GoalsSummary
          totalCurrent={totalFinanceiroAtual}
          totalTarget={totalFinanceiroAlvo}
          progress={progressoGeral}
        />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">
            Seus Objetivos
          </h2>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border-divider rounded-3xl bg-bg-base/50">
            <p className="text-text-muted font-medium">
              Nenhuma meta criada ainda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            {goals.map((meta) => (
              <GoalItem key={meta.id} goal={meta} onClick={setSelectedGoalId} />
            ))}
          </div>
        )}
      </main>

      <GoalDetails
        isOpen={!!selectedGoalId}
        goal={selectedGoal}
        accounts={accounts}
        cards={cards}
        history={history}
        isHistoryLoading={isHistoryLoading}
        onClose={() => setSelectedGoalId(null)}
        onDelete={openDeleteGoal}
        onDeposit={(g) => {
          openGoalDeposit(g);
          refresh();
        }}
      />
    </div>
  );
}
